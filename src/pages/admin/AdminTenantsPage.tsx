import { useQuery } from '@tanstack/react-query'
import type { FormEvent, ReactElement } from 'react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { adminTenantsListRequest } from '../../api/adminApi'
import type { TenantLicenseStatusDto } from '../../types/admin'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb'
import { AdminEmptyState } from '../../components/admin/AdminEmptyState'
import { Badge, Button, Card, CardBody, Input, Table, TBody, TD, TH, THead, TR } from '../../components/ui'
import { formatDateTR } from '../../utils/formatters'
import { lisansDurumuTr, tenantEffectiveLisansBitisTarihi } from '../../utils/tenantLicenseDisplay'

const PAGE_SIZES = [10, 20, 50] as const

function maskLicenseKey(key: string | null | undefined): string {
  if (!key?.trim()) return '—'
  const k = key.trim()
  if (k.length <= 8) return k
  return `${k.slice(0, 4)}••••${k.slice(-4)}`
}

export function AdminTenantsPage(): ReactElement {
  const { admin } = useAdminAuth()
  const isSuper = admin?.rol === 'SUPER_ADMIN'
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [qInput, setQInput] = useState(searchParams.get('q') ?? '')
  const [debouncedQ, setDebouncedQ] = useState(searchParams.get('q') ?? '')
  const [limit, setLimit] = useState(Number(searchParams.get('limit')) || 20)

  const lisansDurumu = (searchParams.get('lisansDurumu') as TenantLicenseStatusDto | '') || undefined
  const aktifMiParam = searchParams.get('aktifMi')
  const aktifMi = aktifMiParam === 'true' ? true : aktifMiParam === 'false' ? false : undefined
  const page = useMemo(() => Math.max(1, Number(searchParams.get('page')) || 1), [searchParams])

  const listQ = useQuery({
    queryKey: ['admin-tenants', debouncedQ, lisansDurumu, aktifMi, page, limit],
    queryFn: () =>
      adminTenantsListRequest({
        q: debouncedQ || undefined,
        lisansDurumu,
        aktifMi,
        page,
        limit
      })
  })

  function applyFilters(e: FormEvent): void {
    e.preventDefault()
    setDebouncedQ(qInput.trim())
    const sp = new URLSearchParams()
    if (qInput.trim()) sp.set('q', qInput.trim())
    if (lisansDurumu) sp.set('lisansDurumu', lisansDurumu)
    if (aktifMiParam) sp.set('aktifMi', aktifMiParam)
    sp.set('page', '1')
    sp.set('limit', String(limit))
    setSearchParams(sp)
  }

  const rows = listQ.data?.items ?? []
  const total = listQ.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="w-full max-w-none space-y-4">
      <AdminBreadcrumb
        items={[
          { label: 'Ana Sayfa', to: '/admin' },
          { label: 'Admin Paneli', to: '/admin' },
          { label: 'Kullanıcı Yönetimi' }
        ]}
      />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Kullanıcı Yönetimi</h1>
          <p className="mt-1 text-xs text-slate-500">Tüm büroları, lisansları ve sahip kullanıcıları görüntüleyin.</p>
        </div>
        {isSuper ? (
          <Button type="button" className="shrink-0" onClick={() => navigate('/admin/burolar/yeni')}>
            + Yeni Üyelik Aç
          </Button>
        ) : null}
      </div>

      <Card className="border-slate-200/80 shadow-sm">
        <CardBody className="py-4">
          <form onSubmit={applyFilters} className="flex w-full flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
            <Input
              label="Ara"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              className="min-w-0 flex-1 lg:max-w-md"
              placeholder="Büro, sahip, e-posta, müşteri no, lisans anahtarı…"
            />
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:w-auto">
              <div className="min-w-[10rem] flex-1 sm:flex-initial">
                <label className="mb-1 block text-xs font-semibold text-slate-500">Durum (lisans)</label>
                <select
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm shadow-sm"
                  value={lisansDurumu ?? ''}
                  onChange={(e) => {
                    const sp = new URLSearchParams(searchParams)
                    const v = e.target.value
                    if (v) sp.set('lisansDurumu', v)
                    else sp.delete('lisansDurumu')
                    sp.set('page', '1')
                    setSearchParams(sp)
                  }}
                >
                  <option value="">Tümü</option>
                  <option value="AKTIF">Aktif</option>
                  <option value="DEMO">Demo</option>
                  <option value="SURESI_DOLDU">Süresi doldu</option>
                  <option value="PASIF">Pasif</option>
                </select>
              </div>
              <div className="min-w-[10rem] flex-1 sm:flex-initial">
                <label className="mb-1 block text-xs font-semibold text-slate-500">Büro erişimi</label>
                <select
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm shadow-sm"
                  value={aktifMiParam ?? ''}
                  onChange={(e) => {
                    const sp = new URLSearchParams(searchParams)
                    const v = e.target.value
                    if (v === 'true' || v === 'false') sp.set('aktifMi', v)
                    else sp.delete('aktifMi')
                    sp.set('page', '1')
                    setSearchParams(sp)
                  }}
                >
                  <option value="">Tümü</option>
                  <option value="true">Aktif</option>
                  <option value="false">Pasif</option>
                </select>
              </div>
              <Button type="submit" variant="secondary" className="h-9 shrink-0 px-5">
                Filtrele
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {listQ.isError ? (
        <p className="text-sm text-danger">{listQ.error instanceof Error ? listQ.error.message : 'Liste alınamadı.'}</p>
      ) : null}

      <Card className="overflow-hidden border-slate-200/80 shadow-sm">
        <CardBody className="p-0">
          {listQ.isLoading ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">Yükleniyor…</p>
          ) : rows.length === 0 ? (
            <div className="p-6">
              <AdminEmptyState
                title="Büro bulunamadı"
                description="Arama veya filtre kriterlerinize uygun kayıt yok."
                action={
                  isSuper ? (
                    <Button type="button" onClick={() => navigate('/admin/burolar/yeni')}>
                      İlk üyeliği oluştur
                    </Button>
                  ) : undefined
                }
              />
            </div>
          ) : (
            <div className="w-full max-w-full overflow-x-auto">
              <Table className="min-w-[1280px]">
                <THead>
                  <TR className="bg-slate-50/80">
                    <TH>Büro adı</TH>
                    <TH>Müşteri No</TH>
                    <TH>Sahip kullanıcı</TH>
                    <TH>E-posta</TH>
                    <TH>Telefon</TH>
                    <TH>Lisans anahtarı</TH>
                    <TH>Lisans durumu</TH>
                    <TH>Demo</TH>
                    <TH>Bitiş tarihi</TH>
                    <TH className="text-right">Kalan gün</TH>
                    <TH>Durum</TH>
                    <TH className="w-[140px]">İşlem</TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.map((t) => {
                    const effBitis = tenantEffectiveLisansBitisTarihi(
                      t.lisansBitisTarihi,
                      t.lisansDurumu,
                      t.demoMu,
                      t.demoBitisTarihi
                    )
                    return (
                      <TR key={t.id} className="hover:bg-slate-50/60">
                        <TD>
                          <Link to={`/admin/burolar/${t.id}`} className="font-semibold text-indigo-600 hover:underline">
                            {t.buroAdi}
                          </Link>
                        </TD>
                        <TD className="whitespace-nowrap font-mono text-xs text-slate-700">{t.musteriNo ?? '—'}</TD>
                        <TD className="text-sm">
                          <div className="font-medium text-slate-900">{t.sahipAdSoyad ?? '—'}</div>
                          {t.sahipKullaniciAdi ? (
                            <div className="text-xs text-slate-500">{t.sahipKullaniciAdi}</div>
                          ) : null}
                        </TD>
                        <TD className="max-w-[180px] truncate text-sm text-slate-600">{t.eposta ?? '—'}</TD>
                        <TD className="whitespace-nowrap text-sm text-slate-600">{t.telefon ?? '—'}</TD>
                        <TD className="font-mono text-xs text-slate-700">{maskLicenseKey(t.lisansAnahtari)}</TD>
                        <TD>
                          <span className="text-sm font-medium text-slate-800">{lisansDurumuTr(t.lisansDurumu)}</span>
                        </TD>
                        <TD className="text-sm">{t.demoMu ? 'Evet' : 'Hayır'}</TD>
                        <TD className="whitespace-nowrap text-sm">{formatDateTR(effBitis)}</TD>
                        <TD className="text-right tabular-nums text-sm">
                          {t.kalanGun != null ? (
                            <span className={t.kalanGun <= 7 ? 'font-semibold text-amber-700' : ''}>{t.kalanGun}</span>
                          ) : (
                            '—'
                          )}
                        </TD>
                        <TD>
                          <Badge variant={t.aktifMi ? 'success' : 'warning'} className="!normal-case">
                            {t.aktifMi ? 'Aktif' : 'Pasif'}
                          </Badge>
                        </TD>
                        <TD>
                          <div className="flex flex-col gap-1">
                            <Link
                              to={`/admin/burolar/${t.id}`}
                              className="inline-flex h-7 items-center justify-center rounded border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Detay
                            </Link>
                            <Link
                              to={`/admin/burolar/${t.id}?tab=abonelikLisans`}
                              className="inline-flex h-7 items-center justify-center rounded border border-slate-200 bg-white px-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                            >
                              Düzenle
                            </Link>
                          </div>
                        </TD>
                      </TR>
                    )
                  })}
                </TBody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>

      {listQ.data ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Toplam {total} kayıt · Sayfa {page}/{totalPages}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5">
              Sayfa boyutu
              <select
                className="h-8 rounded border border-slate-200 bg-white px-2 text-xs"
                value={limit}
                onChange={(e) => {
                  const n = Number(e.target.value)
                  setLimit(n)
                  const sp = new URLSearchParams(searchParams)
                  sp.set('limit', String(n))
                  sp.set('page', '1')
                  setSearchParams(sp)
                }}
              >
                {PAGE_SIZES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={page <= 1}
              onClick={() => {
                const sp = new URLSearchParams(searchParams)
                sp.set('page', String(page - 1))
                setSearchParams(sp)
              }}
            >
              Önceki
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              disabled={page >= totalPages}
              onClick={() => {
                const sp = new URLSearchParams(searchParams)
                sp.set('page', String(page + 1))
                setSearchParams(sp)
              }}
            >
              Sonraki
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
