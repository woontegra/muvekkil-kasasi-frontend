import { useQuery } from '@tanstack/react-query'
import type { FormEvent, ReactElement } from 'react'
import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { adminTenantsListRequest } from '../../api/adminApi'
import type { TenantLicenseStatusDto } from '../../types/admin'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Input, Table, TBody, TD, TH, THead, TR } from '../../components/ui'
import { formatDateTR } from '../../utils/formatters'
import { lisansDurumuTr } from '../../utils/tenantLicenseDisplay'

export function AdminTenantsPage(): ReactElement {
  const { admin } = useAdminAuth()
  const isSuper = admin?.rol === 'SUPER_ADMIN'
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const [qInput, setQInput] = useState(searchParams.get('q') ?? '')
  const [debouncedQ, setDebouncedQ] = useState(searchParams.get('q') ?? '')

  const lisansDurumu = (searchParams.get('lisansDurumu') as TenantLicenseStatusDto | '') || undefined
  const aktifMiParam = searchParams.get('aktifMi')
  const aktifMi = aktifMiParam === 'true' ? true : aktifMiParam === 'false' ? false : undefined

  const page = useMemo(() => Math.max(1, Number(searchParams.get('page')) || 1), [searchParams])

  const listQ = useQuery({
    queryKey: ['admin-tenants', debouncedQ, lisansDurumu, aktifMi, page],
    queryFn: () =>
      adminTenantsListRequest({
        q: debouncedQ || undefined,
        lisansDurumu,
        aktifMi,
        page,
        limit: 50
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
    setSearchParams(sp)
  }

  const rows = listQ.data?.items ?? []

  return (
    <div className="w-full max-w-none space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Bürolar</h1>
          <p className="mt-1 text-sm text-slate-600">Tüm kiracılar; arama ve lisans filtreleri.</p>
        </div>
        {isSuper ? (
          <Button type="button" className="shrink-0" onClick={() => navigate('/admin/burolar/yeni')}>
            Yeni Büro Oluştur
          </Button>
        ) : null}
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/80 py-3">
          <CardTitle className="text-base">Filtreler</CardTitle>
        </CardHeader>
        <CardBody className="py-4">
          <form onSubmit={applyFilters} className="flex w-full flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-end">
            <Input label="Ara" value={qInput} onChange={(e) => setQInput(e.target.value)} className="min-w-0 flex-1 lg:max-w-md" placeholder="Büro adı, slug veya e-posta" />
            <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-end lg:w-auto">
              <div className="min-w-[10rem] flex-1 sm:flex-initial">
                <label className="mb-1 block text-xs font-semibold text-ink-muted">Lisans durumu</label>
                <select
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm"
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
                  <option value="AKTIF">AKTIF</option>
                  <option value="DEMO">DEMO</option>
                  <option value="SURESI_DOLDU">SURESI_DOLDU</option>
                  <option value="PASIF">PASIF</option>
                </select>
              </div>
              <div className="min-w-[10rem] flex-1 sm:flex-initial">
                <label className="mb-1 block text-xs font-semibold text-ink-muted">Büro erişimi</label>
                <select
                  className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm shadow-sm"
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
              <Button type="submit" variant="secondary" className="h-10 shrink-0 px-6">
                Uygula
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>

      {listQ.isError ? (
        <p className="text-sm text-danger">{listQ.error instanceof Error ? listQ.error.message : 'Liste alınamadı.'}</p>
      ) : null}

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardBody className="p-0">
          {listQ.isLoading ? (
            <p className="px-4 py-10 text-center text-sm text-ink-muted">Yükleniyor…</p>
          ) : (
            <div className="w-full max-w-full overflow-x-auto">
              <Table className="min-w-[960px]">
                <THead>
                  <TR>
                    <TH className="min-w-[180px]">Büro</TH>
                    <TH>E-posta</TH>
                    <TH>Telefon</TH>
                    <TH>Lisans</TH>
                    <TH>Bitiş</TH>
                    <TH>Büro erişimi</TH>
                    <TH className="text-right">Kul.</TH>
                    <TH className="text-right">Müv.</TH>
                    <TH className="text-right">Dosya</TH>
                    <TH className="w-[100px]">İşlem</TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.map((t) => (
                    <TR key={t.id}>
                      <TD>
                        <Link to={`/admin/burolar/${t.id}`} className="font-semibold text-primary hover:underline">
                          {t.buroAdi}
                        </Link>
                      </TD>
                      <TD className="max-w-[200px] truncate text-sm text-ink-muted">{t.eposta ?? '—'}</TD>
                      <TD className="whitespace-nowrap text-sm text-ink-muted">{t.telefon ?? '—'}</TD>
                      <TD>
                        <span className="font-semibold text-ink">{lisansDurumuTr(t.lisansDurumu)}</span>
                        <span className="ml-1 text-xs text-ink-muted">({t.lisansDurumu})</span>
                      </TD>
                      <TD className="whitespace-nowrap text-sm">{formatDateTR(t.lisansBitisTarihi)}</TD>
                        <TD>
                          <Badge variant={t.aktifMi ? 'success' : 'warning'} className="!normal-case">
                            {t.aktifMi ? 'Aktif' : 'Pasif'}
                          </Badge>
                        </TD>
                      <TD className="text-right tabular-nums">{t.toplamKullanici}</TD>
                      <TD className="text-right tabular-nums">{t.toplamMuvekkil}</TD>
                      <TD className="text-right tabular-nums">{t.toplamDosya}</TD>
                      <TD>
                        <Link
                          to={`/admin/burolar/${t.id}`}
                          className="inline-flex h-8 w-full items-center justify-center rounded-md border border-accent bg-accent px-3 text-xs font-semibold text-white shadow-sm hover:brightness-95"
                        >
                          Aç
                        </Link>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>

      {listQ.data && listQ.data.total > listQ.data.limit ? (
        <p className="text-xs text-ink-muted">
          Toplam {listQ.data.total} kayıt; bu sayfada {listQ.data.items.length} gösteriliyor (limit {listQ.data.limit}).
        </p>
      ) : null}
    </div>
  )
}
