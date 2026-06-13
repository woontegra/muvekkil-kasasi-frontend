import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FormEvent, ReactElement } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  adminExtendLicenseRequest,
  adminResetUserPasswordRequest,
  adminTenantActivateRequest,
  adminTenantDeactivateRequest,
  adminTenantDetailRequest,
  adminTenantUpdateRequest,
  adminUserUpdateRequest,
  type AdminExtendLicenseRequestBody
} from '../../api/adminApi'
import type { AdminTenantDetailUserDto, TenantUserRoleDto } from '../../types/admin'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog'
import { AlertBox, Button, Card, CardBody, CardHeader, CardTitle, Input, Table, TBody, TD, TH, THead, TR } from '../../components/ui'
import { formatDateTimeTR, formatDateTR } from '../../utils/formatters'
import {
  dateInputToUtcEndOfDayIso,
  kalanGunFromIsoEnd,
  lisansDurumuTr,
  tenantEffectiveLisansBitisTarihi
} from '../../utils/tenantLicenseDisplay'

type TabId = 'genel' | 'lisans' | 'kullanicilar' | 'kullanim' | 'audit'

const USER_ROLES: TenantUserRoleDto[] = ['BURO_SAHIBI', 'AVUKAT_YONETICI', 'KATIP_PERSONEL']

export function AdminTenantDetailPage(): ReactElement {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const { admin } = useAdminAuth()
  const isSuper = admin?.rol === 'SUPER_ADMIN'
  const canManageTenantUsers = admin?.rol === 'SUPER_ADMIN' || admin?.rol === 'DESTEK' || admin?.rol === 'FINANS'
  const [tab, setTab] = useState<TabId>('genel')
  const [tenantActionConfirm, setTenantActionConfirm] = useState<'activate' | 'deactivate' | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  type ExtendTur = 'GUN' | 'AY' | 'YIL' | 'OZEL'
  const [extendTur, setExtendTur] = useState<ExtendTur>('AY')
  const [extendMiktar, setExtendMiktar] = useState('12')
  const [extendBitisDate, setExtendBitisDate] = useState('')
  const [extendDemo, setExtendDemo] = useState(false)
  const [extendAciklama, setExtendAciklama] = useState('')
  const [extendFormErr, setExtendFormErr] = useState<string | null>(null)
  const [resetResult, setResetResult] = useState<string | null>(null)
  const [editReady, setEditReady] = useState(false)
  const [editForm, setEditForm] = useState<Record<string, string>>({})

  const detailQ = useQuery({
    queryKey: ['admin-tenant', id],
    queryFn: () => adminTenantDetailRequest(id!),
    enabled: Boolean(id)
  })

  function invalidateTenantRelatedQueries(): void {
    void qc.invalidateQueries({ queryKey: ['admin-tenant'] })
    void qc.invalidateQueries({ queryKey: ['admin-tenants'] })
    void qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
  }

  useEffect(() => {
    if (!banner) return
    const t = window.setTimeout(() => setBanner(null), 5000)
    return () => window.clearTimeout(t)
  }, [banner])

  const extendM = useMutation({
    mutationFn: (body: AdminExtendLicenseRequestBody) => adminExtendLicenseRequest(id!, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-tenant', id] })
      void qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
      void qc.invalidateQueries({ queryKey: ['admin-tenants'] })
      setExtendFormErr(null)
    }
  })

  function buildExtendPayload(): AdminExtendLicenseRequestBody | null {
    setExtendFormErr(null)
    const aciklama = extendAciklama.trim() || undefined
    if (extendTur === 'OZEL') {
      if (!extendBitisDate.trim()) {
        setExtendFormErr('Özel tarih için bitiş tarihi zorunlu.')
        return null
      }
      const [y, m, d] = extendBitisDate.split('-').map(Number)
      const picked = new Date(y, m - 1, d)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      picked.setHours(0, 0, 0, 0)
      if (picked.getTime() < today.getTime()) {
        setExtendFormErr('Bitiş tarihi bugünden önce olamaz.')
        return null
      }
      return {
        bitisTarihi: dateInputToUtcEndOfDayIso(extendBitisDate.trim()),
        demoMu: extendDemo ? true : undefined,
        aciklama
      }
    }
    const n = Number(extendMiktar)
    if (!Number.isFinite(n) || n < 1 || !Number.isInteger(n)) {
      setExtendFormErr('Miktar pozitif tam sayı olmalı.')
      return null
    }
    return {
      miktar: n,
      birim: extendTur,
      demoMu: extendDemo ? true : undefined,
      aciklama
    }
  }

  const activateM = useMutation({
    mutationFn: () => adminTenantActivateRequest(id!),
    onSuccess: () => {
      invalidateTenantRelatedQueries()
      void qc.refetchQueries({ queryKey: ['admin-tenant', id] })
      setTenantActionConfirm(null)
      setBanner('Büro aktifleştirildi.')
    }
  })
  const deactivateM = useMutation({
    mutationFn: () => adminTenantDeactivateRequest(id!),
    onSuccess: () => {
      invalidateTenantRelatedQueries()
      void qc.refetchQueries({ queryKey: ['admin-tenant', id] })
      setTenantActionConfirm(null)
      setBanner('Büro pasifleştirildi.')
    }
  })

  const updateTenantM = useMutation({
    mutationFn: () => {
      const t = detailQ.data?.tenant
      if (!t) throw new Error('Veri yok')
      const yu = editForm.yillikUcret?.trim()
      return adminTenantUpdateRequest(id!, {
        buroAdi: editForm.buroAdi,
        telefon: editForm.telefon || null,
        eposta: editForm.eposta?.trim() ? editForm.eposta.trim() : null,
        adres: editForm.adres || null,
        vergiNo: editForm.vergiNo || null,
        vergiDairesi: editForm.vergiDairesi || null,
        lisansDurumu: editForm.lisansDurumu as 'DEMO' | 'AKTIF' | 'SURESI_DOLDU' | 'PASIF',
        lisansBaslangicTarihi: editForm.lisansBaslangicTarihi || null,
        lisansBitisTarihi: editForm.lisansBitisTarihi || null,
        demoMu: editForm.demoMu === 'true',
        demoBitisTarihi: editForm.demoBitisTarihi || null,
        sonOdemeTarihi: editForm.sonOdemeTarihi || null,
        yillikUcret: yu === '' ? null : yu != null ? Number(yu) : undefined,
        lisansNotlari: editForm.lisansNotlari || null
      })
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-tenant', id] })
      void qc.invalidateQueries({ queryKey: ['admin-tenants'] })
      void qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
    }
  })

  const recentLogins = useMemo(() => {
    const users = detailQ.data?.kullanicilar ?? []
    return [...users]
      .filter((u) => u.sonGirisTarihi)
      .sort((a, b) => String(b.sonGirisTarihi).localeCompare(String(a.sonGirisTarihi)))
      .slice(0, 15)
  }, [detailQ.data?.kullanicilar])

  if (!id) {
    return <p className="text-sm text-danger">Geçersiz büro.</p>
  }

  if (detailQ.isLoading) {
    return <p className="text-sm text-ink-muted">Yükleniyor…</p>
  }
  if (detailQ.isError || !detailQ.data) {
    return <p className="text-sm text-danger">{detailQ.error instanceof Error ? detailQ.error.message : 'Detay alınamadı.'}</p>
  }

  const d = detailQ.data
  const t = d.tenant
  const effBitis = tenantEffectiveLisansBitisTarihi(t.lisansBitisTarihi, t.lisansDurumu, t.demoMu, t.demoBitisTarihi)
  const kalanGunUst = kalanGunFromIsoEnd(effBitis)

  function initEdit(): void {
    setEditForm({
      buroAdi: t.buroAdi,
      telefon: t.telefon ?? '',
      eposta: t.eposta ?? '',
      adres: t.adres ?? '',
      vergiNo: t.vergiNo ?? '',
      vergiDairesi: t.vergiDairesi ?? '',
      lisansDurumu: t.lisansDurumu,
      lisansBaslangicTarihi: t.lisansBaslangicTarihi ? t.lisansBaslangicTarihi.slice(0, 10) : '',
      lisansBitisTarihi: t.lisansBitisTarihi ? t.lisansBitisTarihi.slice(0, 10) : '',
      demoMu: String(t.demoMu),
      demoBitisTarihi: t.demoBitisTarihi ? t.demoBitisTarihi.slice(0, 10) : '',
      sonOdemeTarihi: t.sonOdemeTarihi ? t.sonOdemeTarihi.slice(0, 10) : '',
      yillikUcret: t.yillikUcret != null ? String(t.yillikUcret) : '',
      lisansNotlari: t.lisansNotlari ?? ''
    })
    setEditReady(true)
  }

  return (
    <div className="w-full max-w-none space-y-5">
      <AdminConfirmDialog
        open={tenantActionConfirm === 'deactivate'}
        title="Büroyu pasifleştir"
        message="Bu büroyu pasifleştirmek istediğinize emin misiniz? Büro kullanıcıları programa erişemeyecek."
        confirmLabel="Pasifleştir"
        danger
        loading={deactivateM.isPending}
        onCancel={() => setTenantActionConfirm(null)}
        onConfirm={() => void deactivateM.mutateAsync()}
      />
      <AdminConfirmDialog
        open={tenantActionConfirm === 'activate'}
        title="Büroyu aktifleştir"
        message="Bu büroyu tekrar aktif etmek istiyor musunuz?"
        confirmLabel="Aktifleştir"
        loading={activateM.isPending}
        onCancel={() => setTenantActionConfirm(null)}
        onConfirm={() => void activateM.mutateAsync()}
      />

      {banner ? (
        <AlertBox variant="success" title="Tamamlandı">
          {banner}
        </AlertBox>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 pb-4">
        <div className="min-w-0 flex-1">
          <Link to="/admin/burolar" className="text-xs font-semibold text-primary hover:underline">
            ← Bürolar
          </Link>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">{t.buroAdi}</h1>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li>
              <span className="text-ink-muted">Büro erişimi:</span>{' '}
              <span className="font-semibold text-ink">{t.aktifMi ? 'Aktif' : 'Pasif'}</span>
            </li>
            <li>
              <span className="text-ink-muted">Lisans:</span>{' '}
              <span className="font-semibold text-ink">{lisansDurumuTr(t.lisansDurumu)}</span>
              <span className="text-ink-muted"> ({t.lisansDurumu})</span>
            </li>
            <li>
              <span className="text-ink-muted">Bitiş:</span>{' '}
              <span className="font-semibold text-ink">{effBitis ? formatDateTR(effBitis) : '—'}</span>
            </li>
            <li>
              <span className="text-ink-muted">Kalan:</span>{' '}
              <span className="font-semibold text-ink">{kalanGunUst != null ? `${kalanGunUst} gün` : '—'}</span>
            </li>
            <li>
              <span className="text-ink-muted">Demo:</span>{' '}
              <span className="font-semibold text-ink">{t.demoMu ? 'Evet' : 'Hayır'}</span>
            </li>
          </ul>
          {isSuper ? (
            <p className="mt-2 text-xs text-ink-muted">
              Büro erişimini (pasif / aktif) yalnızca buradaki düğmelerden değiştirin; lisans alanları ayrıdır.
            </p>
          ) : null}
        </div>
        {isSuper ? (
          <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
            {t.aktifMi ? (
              <Button
                type="button"
                variant="danger"
                size="sm"
                onClick={() => setTenantActionConfirm('deactivate')}
                disabled={deactivateM.isPending || activateM.isPending}
              >
                Pasifleştir
              </Button>
            ) : (
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setTenantActionConfirm('activate')}
                disabled={activateM.isPending || deactivateM.isPending}
              >
                Aktifleştir
              </Button>
            )}
          </div>
        ) : null}
      </div>

      {(activateM.isError || deactivateM.isError || extendM.isError || updateTenantM.isError) && (
        <AlertBox variant="danger" title="Hata">
          {(activateM.error as Error)?.message ??
            (deactivateM.error as Error)?.message ??
            (extendM.error as Error)?.message ??
            (updateTenantM.error as Error)?.message}
        </AlertBox>
      )}

      <div className="flex w-full flex-wrap gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
        {(
          [
            ['genel', 'Genel Bilgiler'],
            ['lisans', 'Lisans'],
            ['kullanicilar', 'Kullanıcılar'],
            ['kullanim', 'Kullanım Özeti'],
            ['audit', 'Audit Log']
          ] as const
        ).map(([tid, label]) => (
          <button
            key={tid}
            type="button"
            className={`min-w-[9rem] flex-1 rounded-lg px-3 py-2.5 text-sm font-semibold transition ${
              tab === tid ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => setTab(tid)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'genel' && (
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Genel bilgiler</CardTitle>
          </CardHeader>
          <CardBody className="space-y-2 text-sm">
            <p>
              <span className="text-ink-muted">Büro erişimi:</span>{' '}
              <span className="font-semibold text-ink">{t.aktifMi ? 'Aktif' : 'Pasif'}</span>
              <span className="text-ink-muted"> (programa giriş)</span>
            </p>
            <p>
              <span className="text-ink-muted">Lisans (abonelik):</span>{' '}
              <span className="font-semibold text-ink">{lisansDurumuTr(t.lisansDurumu)}</span>
            </p>
            <p>
              <span className="text-ink-muted">Slug:</span> {t.slug}
            </p>
            <p>
              <span className="text-ink-muted">Adres:</span> {t.adres ?? '—'}
            </p>
            <p>
              <span className="text-ink-muted">Vergi:</span> {t.vergiNo ?? '—'} / {t.vergiDairesi ?? '—'}
            </p>
            <p>
              <span className="text-ink-muted">Kayıt:</span> {formatDateTimeTR(t.createdAt)}
            </p>
          </CardBody>
        </Card>
      )}

      {tab === 'lisans' && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Lisans durumu', lisansDurumuTr(t.lisansDurumu)],
              ['Lisans bitiş', effBitis ? formatDateTR(effBitis) : '—'],
              ['Kalan gün', kalanGunUst != null ? `${kalanGunUst} gün` : '—'],
              ['Demo', t.demoMu ? 'Evet' : 'Hayır']
            ].map(([label, val]) => (
              <div key={String(label)} className="rounded-lg border border-slate-200 bg-slate-50/80 px-3 py-2 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{label}</p>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">{val}</p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle>Lisans uzat / demo süresi ver</CardTitle>
              </CardHeader>
              <CardBody className="space-y-3">
                {!isSuper ? (
                  <p className="text-sm text-ink-muted">Lisans uzatma yalnızca <strong>SUPER_ADMIN</strong> rolüyle yapılabilir.</p>
                ) : (
                  <>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-ink-muted">Hızlı seçim</label>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" size="sm" variant="secondary" onClick={() => { setExtendTur('GUN'); setExtendMiktar('3'); setExtendDemo(true); setExtendFormErr(null) }}>
                          3 gün demo
                        </Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => { setExtendTur('GUN'); setExtendMiktar('7'); setExtendDemo(true); setExtendFormErr(null) }}>
                          7 gün demo
                        </Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => { setExtendTur('GUN'); setExtendMiktar('14'); setExtendDemo(true); setExtendFormErr(null) }}>
                          14 gün demo
                        </Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => { setExtendTur('AY'); setExtendMiktar('1'); setExtendDemo(false); setExtendFormErr(null) }}>
                          1 ay
                        </Button>
                        <Button type="button" size="sm" variant="secondary" onClick={() => { setExtendTur('AY'); setExtendMiktar('12'); setExtendDemo(false); setExtendFormErr(null) }}>
                          12 ay
                        </Button>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-ink-muted">Uzatma türü</label>
                      <select
                        className="h-9 w-full rounded-md border border-border bg-white px-2 text-sm"
                        value={extendTur}
                        onChange={(e) => {
                          setExtendTur(e.target.value as ExtendTur)
                          setExtendFormErr(null)
                        }}
                      >
                        <option value="GUN">Gün</option>
                        <option value="AY">Ay</option>
                        <option value="YIL">Yıl</option>
                        <option value="OZEL">Özel tarih</option>
                      </select>
                    </div>
                    {extendTur === 'OZEL' ? (
                      <Input label="Bitiş tarihi" type="date" value={extendBitisDate} onChange={(e) => setExtendBitisDate(e.target.value)} />
                    ) : (
                      <Input label="Miktar" type="number" min={1} value={extendMiktar} onChange={(e) => setExtendMiktar(e.target.value)} />
                    )}
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input type="checkbox" checked={extendDemo} onChange={(e) => setExtendDemo(e.target.checked)} className="rounded border-border" />
                      Demo olarak işaretle
                    </label>
                    <Input label="Açıklama" value={extendAciklama} onChange={(e) => setExtendAciklama(e.target.value)} />
                    {extendFormErr ? <p className="text-sm text-danger">{extendFormErr}</p> : null}
                    <Button
                      type="button"
                      onClick={() => {
                        const body = buildExtendPayload()
                        if (body) void extendM.mutateAsync(body)
                      }}
                      disabled={extendM.isPending}
                    >
                      {extendM.isPending ? 'Kaydediliyor…' : 'Lisansı güncelle'}
                    </Button>
                  </>
                )}
              </CardBody>
            </Card>
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <CardTitle>Büro düzenle</CardTitle>
            </CardHeader>
            <CardBody>
              {!editReady ? (
                <Button type="button" variant="secondary" onClick={initEdit}>
                  Formu doldur
                </Button>
              ) : (
                <form
                  className="space-y-3"
                  onSubmit={(e: FormEvent) => {
                    e.preventDefault()
                    void updateTenantM.mutateAsync()
                  }}
                >
                  <Input label="Büro adı" value={editForm.buroAdi ?? ''} onChange={(e) => setEditForm((s) => ({ ...s, buroAdi: e.target.value }))} />
                  <Input label="E-posta" value={editForm.eposta ?? ''} onChange={(e) => setEditForm((s) => ({ ...s, eposta: e.target.value }))} />
                  <Input label="Telefon" value={editForm.telefon ?? ''} onChange={(e) => setEditForm((s) => ({ ...s, telefon: e.target.value }))} />
                  <Input label="Adres" value={editForm.adres ?? ''} onChange={(e) => setEditForm((s) => ({ ...s, adres: e.target.value }))} />
                  <Input label="Vergi no" value={editForm.vergiNo ?? ''} onChange={(e) => setEditForm((s) => ({ ...s, vergiNo: e.target.value }))} />
                  <Input label="Vergi dairesi" value={editForm.vergiDairesi ?? ''} onChange={(e) => setEditForm((s) => ({ ...s, vergiDairesi: e.target.value }))} />
                  <p className="rounded-md border border-slate-200 bg-slate-50 px-2 py-2 text-xs text-ink-muted">
                    <strong>Büro erişimi</strong> (programa giriş) yalnızca sayfa üstündeki <strong>Pasifleştir / Aktifleştir</strong> ile değişir;{' '}
                    <strong>SUPER_ADMIN</strong> gerekir. Lisans alanları ayrıdır.
                  </p>
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-ink-muted">Lisans durumu</label>
                    <select
                      className="h-9 w-full rounded-md border border-border bg-white px-2 text-sm"
                      value={editForm.lisansDurumu ?? 'AKTIF'}
                      onChange={(e) => setEditForm((s) => ({ ...s, lisansDurumu: e.target.value }))}
                    >
                      <option value="AKTIF">AKTIF</option>
                      <option value="DEMO">DEMO</option>
                      <option value="SURESI_DOLDU">SURESI_DOLDU</option>
                      <option value="PASIF">PASIF</option>
                    </select>
                  </div>
                  <Input
                    label="Lisans başlangıç"
                    type="date"
                    value={editForm.lisansBaslangicTarihi ?? ''}
                    onChange={(e) => setEditForm((s) => ({ ...s, lisansBaslangicTarihi: e.target.value }))}
                  />
                  <Input
                    label="Lisans bitiş"
                    type="date"
                    value={editForm.lisansBitisTarihi ?? ''}
                    onChange={(e) => setEditForm((s) => ({ ...s, lisansBitisTarihi: e.target.value }))}
                  />
                  <div>
                    <label className="mb-1 block text-xs font-semibold text-ink-muted">Demo</label>
                    <select
                      className="h-9 w-full rounded-md border border-border bg-white px-2 text-sm"
                      value={editForm.demoMu ?? 'false'}
                      onChange={(e) => setEditForm((s) => ({ ...s, demoMu: e.target.value }))}
                    >
                      <option value="true">Evet</option>
                      <option value="false">Hayır</option>
                    </select>
                  </div>
                  <Input
                    label="Demo bitiş"
                    type="date"
                    value={editForm.demoBitisTarihi ?? ''}
                    onChange={(e) => setEditForm((s) => ({ ...s, demoBitisTarihi: e.target.value }))}
                  />
                  <Input
                    label="Son ödeme"
                    type="date"
                    value={editForm.sonOdemeTarihi ?? ''}
                    onChange={(e) => setEditForm((s) => ({ ...s, sonOdemeTarihi: e.target.value }))}
                  />
                  <Input
                    label="Yıllık ücret"
                    type="number"
                    value={editForm.yillikUcret ?? ''}
                    onChange={(e) => setEditForm((s) => ({ ...s, yillikUcret: e.target.value }))}
                  />
                  <Input label="Lisans notları" value={editForm.lisansNotlari ?? ''} onChange={(e) => setEditForm((s) => ({ ...s, lisansNotlari: e.target.value }))} />
                  <Button type="submit" disabled={updateTenantM.isPending}>
                    Kaydet
                  </Button>
                </form>
              )}
            </CardBody>
          </Card>
          </div>
        </div>
      )}

      {tab === 'kullanicilar' && (
        <Card className="border-slate-200 shadow-sm">
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH>Ad Soyad</TH>
                    <TH>E-posta</TH>
                    <TH>Rol</TH>
                    <TH>Hesap</TH>
                    <TH>İşlem</TH>
                  </TR>
                </THead>
                <TBody>
                  {d.kullanicilar.map((u) => (
                    <UserRow key={u.id} tenantId={id} user={u} canManage={canManageTenantUsers} onResetDone={(pwd) => setResetResult(pwd)} />
                  ))}
                </TBody>
              </Table>
            </div>
            {resetResult ? (
              <div className="border-t border-border p-4">
                <AlertBox variant="warning" title="Yeni şifre (bir kez)">
                  {resetResult}
                </AlertBox>
              </div>
            ) : null}
          </CardBody>
        </Card>
      )}

      {tab === 'kullanim' && (
        <Card className="border-slate-200 shadow-sm">
          <CardBody className="space-y-2 text-sm">
            <p>
              Müvekkil: <strong>{d.ozet.toplamMuvekkil}</strong>
            </p>
            <p>
              Dosya: <strong>{d.ozet.toplamDosya}</strong>
            </p>
            <p>
              Kasa hareketi: <strong>{d.ozet.kasaHareketi}</strong>
            </p>
            <div className="mt-4">
              <p className="mb-2 font-semibold text-ink">Son girişler</p>
              <ul className="space-y-1 text-ink-muted">
                {recentLogins.length === 0 ? (
                  <li>Kayıt yok.</li>
                ) : (
                  recentLogins.map((l) => (
                    <li key={l.id}>
                      {l.adSoyad} — {formatDateTimeTR(l.sonGirisTarihi)}
                    </li>
                  ))
                )}
              </ul>
            </div>
          </CardBody>
        </Card>
      )}

      {tab === 'audit' && (
        <Card className="border-slate-200 shadow-sm">
          <CardBody className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH>Tarih</TH>
                    <TH>Aksiyon</TH>
                    <TH>Entity</TH>
                  </TR>
                </THead>
                <TBody>
                  {d.sonAuditLoglar.map((a) => (
                    <TR key={a.id}>
                      <TD className="whitespace-nowrap text-xs">{formatDateTimeTR(a.createdAt)}</TD>
                      <TD className="text-xs">{a.action}</TD>
                      <TD className="text-xs text-ink-muted">
                        {a.entityType ?? ''} {a.entityId ?? ''}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  )
}

function UserRow(props: {
  tenantId: string
  user: AdminTenantDetailUserDto
  canManage: boolean
  onResetDone: (pwd: string) => void
}): ReactElement {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [adSoyad, setAdSoyad] = useState(props.user.adSoyad)
  const [eposta, setEposta] = useState(props.user.eposta ?? '')
  const [telefon, setTelefon] = useState(props.user.telefon ?? '')
  const [rol, setRol] = useState<TenantUserRoleDto>(props.user.role)
  const [aktifMi, setAktifMi] = useState(props.user.aktifMi ? 'true' : 'false')
  const [newPwd, setNewPwd] = useState('')
  const [pwdErr, setPwdErr] = useState<string | null>(null)
  const [userPasifConfirm, setUserPasifConfirm] = useState(false)
  const [toggleErr, setToggleErr] = useState<string | null>(null)

  useEffect(() => {
    if (editing) return
    setAdSoyad(props.user.adSoyad)
    setEposta(props.user.eposta ?? '')
    setTelefon(props.user.telefon ?? '')
    setRol(props.user.role)
    setAktifMi(props.user.aktifMi ? 'true' : 'false')
    setToggleErr(null)
  }, [props.user, editing])

  const updateM = useMutation({
    mutationFn: () =>
      adminUserUpdateRequest(props.user.id, {
        tenantId: props.tenantId,
        adSoyad,
        eposta: eposta.trim() ? eposta.trim() : null,
        telefon: telefon.trim() || null,
        rol,
        aktifMi: aktifMi === 'true'
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-tenant', props.tenantId] })
      void qc.invalidateQueries({ queryKey: ['admin-tenants'] })
      setEditing(false)
    }
  })

  const quickToggleM = useMutation({
    mutationFn: (nextAktif: boolean) =>
      adminUserUpdateRequest(props.user.id, {
        tenantId: props.tenantId,
        adSoyad: props.user.adSoyad,
        eposta: props.user.eposta ?? null,
        telefon: props.user.telefon ?? null,
        rol: props.user.role,
        aktifMi: nextAktif
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-tenant', props.tenantId] })
      void qc.invalidateQueries({ queryKey: ['admin-tenants'] })
      setUserPasifConfirm(false)
      setToggleErr(null)
    },
    onError: (e: unknown) => {
      setToggleErr(e instanceof Error ? e.message : 'İşlem başarısız.')
    }
  })

  const resetM = useMutation({
    mutationFn: () => {
      const t = newPwd.trim()
      if (t && t.length < 8) {
        throw new Error('Özel şifre en az 8 karakter olmalı veya boş bırakın.')
      }
      return adminResetUserPasswordRequest(props.user.id, props.tenantId, t || undefined)
    },
    onSuccess: (data) => {
      props.onResetDone(data.geciciSifre)
      setPwdErr(null)
      void qc.invalidateQueries({ queryKey: ['admin-tenant', props.tenantId] })
      setNewPwd('')
    },
    onError: (e: unknown) => setPwdErr(e instanceof Error ? e.message : 'İşlem başarısız.')
  })

  if (editing) {
    return (
      <TR>
        <TD colSpan={5}>
          <div className="flex flex-col gap-2 p-2">
            <Input label="Ad Soyad" value={adSoyad} onChange={(e) => setAdSoyad(e.target.value)} />
            <Input label="E-posta" value={eposta} onChange={(e) => setEposta(e.target.value)} />
            <Input label="Telefon" value={telefon} onChange={(e) => setTelefon(e.target.value)} />
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">Rol</label>
              <select className="h-9 w-full rounded-md border border-border bg-white px-2 text-sm" value={rol} onChange={(e) => setRol(e.target.value as TenantUserRoleDto)}>
                {USER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">Hesap aktif</label>
              <select className="h-9 w-full rounded-md border border-border bg-white px-2 text-sm" value={aktifMi} onChange={(e) => setAktifMi(e.target.value)}>
                <option value="true">Evet</option>
                <option value="false">Hayır (pasifleştir, silinmez)</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={() => void updateM.mutateAsync()} disabled={updateM.isPending}>
                Kaydet
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(false)}>
                İptal
              </Button>
            </div>
          </div>
        </TD>
      </TR>
    )
  }

  return (
    <>
      <AdminConfirmDialog
        open={userPasifConfirm}
        title="Kullanıcıyı pasifleştir"
        message={`${props.user.adSoyad} hesabı pasifleştirilecek (kayıt silinmez; giriş kapanır). Devam edilsin mi?`}
        confirmLabel="Pasifleştir"
        danger
        loading={quickToggleM.isPending}
        onCancel={() => setUserPasifConfirm(false)}
        onConfirm={() => void quickToggleM.mutateAsync(false)}
      />
      <TR>
        <TD>{props.user.adSoyad}</TD>
        <TD className="text-sm">{props.user.eposta ?? '—'}</TD>
        <TD>{props.user.role}</TD>
        <TD className="whitespace-nowrap text-sm">{props.user.aktifMi ? 'Aktif' : 'Pasif'}</TD>
        <TD>
          <div className="flex flex-col gap-1.5">
            {props.canManage ? (
              <div className="flex flex-wrap gap-1">
                {props.user.aktifMi ? (
                  <Button type="button" size="sm" variant="danger" onClick={() => setUserPasifConfirm(true)} disabled={quickToggleM.isPending}>
                    Pasifleştir
                  </Button>
                ) : (
                  <Button type="button" size="sm" variant="secondary" onClick={() => void quickToggleM.mutateAsync(true)} disabled={quickToggleM.isPending}>
                    Aktifleştir
                  </Button>
                )}
              </div>
            ) : null}
            <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(true)} disabled={!props.canManage}>
              Düzenle
            </Button>
            {!props.canManage ? <p className="text-[10px] text-ink-muted">Kullanıcı yönetimi için yetki gerekir.</p> : null}
            {toggleErr ? <p className="text-xs text-danger">{toggleErr}</p> : null}
            <Input placeholder="Yeni şifre (boş=otomatik)" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className="text-xs" />
            {pwdErr ? <p className="text-xs text-danger">{pwdErr}</p> : null}
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setPwdErr(null)
                void resetM.mutateAsync()
              }}
              disabled={resetM.isPending || !props.canManage}
            >
              Şifre sıfırla
            </Button>
          </div>
        </TD>
      </TR>
    </>
  )
}
