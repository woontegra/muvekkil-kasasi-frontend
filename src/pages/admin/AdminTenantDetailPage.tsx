import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FormEvent, ReactElement } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useParams, useSearchParams, useLocation, useNavigate } from 'react-router-dom'
import {
  adminExtendLicenseRequest,
  adminResendWelcomeMailRequest,
  adminTenantActivateRequest,
  adminTenantDeactivateRequest,
  adminTenantDetailRequest,
  adminTenantUpdateRequest,
  type AdminExtendLicenseRequestBody
} from '../../api/adminApi'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog'
import { AdminTenantDetailBody } from './adminTenantDetailBody'
import {
  dateInputToUtcEndOfDayIso,
  kalanGunFromIsoEnd,
  tenantEffectiveLisansBitisTarihi
} from '../../utils/tenantLicenseDisplay'

type TabId =
  | 'genel'
  | 'abonelikLisans'
  | 'kullanim'
  | 'girisCihaz'
  | 'demoTakibi'
  | 'islemGecmisi'
  | 'destek'

export function AdminTenantDetailPage(): ReactElement {
  const { id } = useParams<{ id: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const location = useLocation()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { admin } = useAdminAuth()
  const isSuper = admin?.rol === 'SUPER_ADMIN'
  const canManageTenantUsers = admin?.rol === 'SUPER_ADMIN' || admin?.rol === 'DESTEK' || admin?.rol === 'FINANS'
  const initialTab = (searchParams.get('tab') as TabId | null) ?? 'genel'
  const [tab, setTab] = useState<TabId>(initialTab)
  const [tenantActionConfirm, setTenantActionConfirm] = useState<'activate' | 'deactivate' | null>(null)
  const [noteModalOpen, setNoteModalOpen] = useState(false)
  const [noteDraft, setNoteDraft] = useState('')
  const [copyOk, setCopyOk] = useState(false)
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

  useEffect(() => {
    const state = location.state as { toast?: string } | null
    if (!state?.toast) return
    setBanner(state.toast)
    navigate(`${location.pathname}${location.search}`, { replace: true, state: {} })
  }, [location.pathname, location.search, location.state, navigate])

  const extendM = useMutation({
    mutationFn: (body: AdminExtendLicenseRequestBody) => adminExtendLicenseRequest(id!, body),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-tenant', id] })
      void qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
      void qc.invalidateQueries({ queryKey: ['admin-tenants'] })
      setExtendFormErr(null)
      setBanner('Lisans güncellendi.')
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

  const mailM = useMutation({
    mutationFn: () => adminResendWelcomeMailRequest(id!),
    onSuccess: (data) => {
      if (data.mailSent) setBanner('Aktivasyon e-postası gönderildi.')
      else setBanner(data.mailError ?? 'E-posta gönderilemedi.')
    }
  })

  const noteM = useMutation({
    mutationFn: (note: string) => adminTenantUpdateRequest(id!, { lisansNotlari: note }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-tenant', id] })
      setNoteModalOpen(false)
      setBanner('Admin notu kaydedildi.')
    }
  })

  function selectTab(next: TabId): void {
    setTab(next)
    const sp = new URLSearchParams(searchParams)
    sp.set('tab', next)
    setSearchParams(sp, { replace: true })
  }

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
      setBanner('Büro bilgileri kaydedildi.')
    }
  })

  const lastLoginIso = useMemo(() => {
    const users = detailQ.data?.kullanicilar ?? []
    const sorted = [...users].filter((u) => u.sonGirisTarihi).sort((a, b) => String(b.sonGirisTarihi).localeCompare(String(a.sonGirisTarihi)))
    return sorted[0]?.sonGirisTarihi ?? null
  }, [detailQ.data?.kullanicilar])

  useEffect(() => {
    const urlTab = searchParams.get('tab') as TabId | null
    if (urlTab && urlTab !== tab) setTab(urlTab)
  }, [searchParams, tab])

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
  const owner = d.kullanicilar.find((u) => u.role === 'BURO_SAHIBI') ?? d.kullanicilar[0] ?? null
  const effBitis = tenantEffectiveLisansBitisTarihi(t.lisansBitisTarihi, t.lisansDurumu, t.demoMu, t.demoBitisTarihi)
  const kalanGunUst = kalanGunFromIsoEnd(effBitis)
  const mudahaleGerekli =
    !t.aktifMi ||
    t.lisansDurumu === 'SURESI_DOLDU' ||
    t.lisansDurumu === 'PASIF' ||
    (kalanGunUst != null && kalanGunUst <= 7)
  const demoKalanGun = t.demoMu && t.demoBitisTarihi ? kalanGunFromIsoEnd(t.demoBitisTarihi) : null
  const sonIslemTarihi = d.sonAuditLoglar[0]?.createdAt ?? t.updatedAt

  async function copyLicenseKey(): Promise<void> {
    if (!t.lisansAnahtari) return
    try {
      await navigator.clipboard.writeText(t.lisansAnahtari)
      setCopyOk(true)
      window.setTimeout(() => setCopyOk(false), 2000)
    } catch {
      setCopyOk(false)
    }
  }

  function openNoteModal(): void {
    setNoteDraft(t.lisansNotlari ?? '')
    setNoteModalOpen(true)
  }

  function presetDemoExtend(days: number): void {
    setExtendTur('GUN')
    setExtendMiktar(String(days))
    setExtendDemo(true)
    setExtendFormErr(null)
    selectTab('abonelikLisans')
  }

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
    <>
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
      <AdminTenantDetailBody
        id={id}
        d={d}
        ownerName={owner?.adSoyad ?? '—'}
        ownerEmail={owner?.eposta ?? t.eposta ?? ''}
        effBitis={effBitis}
        kalanGunUst={kalanGunUst}
        demoKalanGun={demoKalanGun}
        mudahaleGerekli={mudahaleGerekli}
        sonIslemTarihi={sonIslemTarihi}
        lastLoginIso={lastLoginIso}
        tab={tab}
        selectTab={(next) => selectTab(next as TabId)}
        isSuper={isSuper}
        canManageTenantUsers={canManageTenantUsers}
        banner={banner}
        copyOk={copyOk}
        copyLicenseKey={() => void copyLicenseKey()}
        noteModalOpen={noteModalOpen}
        noteDraft={noteDraft}
        setNoteDraft={setNoteDraft}
        setNoteModalOpen={setNoteModalOpen}
        notePending={noteM.isPending}
        onSaveNote={() => void noteM.mutateAsync(noteDraft)}
        mailPending={mailM.isPending}
        onResendMail={() => void mailM.mutateAsync()}
        onOpenNote={openNoteModal}
        onPresetDemo={presetDemoExtend}
        onTenantToggle={() => setTenantActionConfirm(t.aktifMi ? 'deactivate' : 'activate')}
        tenantAktif={t.aktifMi}
        extendTur={extendTur}
        setExtendTur={setExtendTur}
        extendMiktar={extendMiktar}
        setExtendMiktar={setExtendMiktar}
        extendBitisDate={extendBitisDate}
        setExtendBitisDate={setExtendBitisDate}
        extendDemo={extendDemo}
        setExtendDemo={setExtendDemo}
        extendAciklama={extendAciklama}
        setExtendAciklama={setExtendAciklama}
        extendFormErr={extendFormErr}
        extendPending={extendM.isPending}
        onExtend={() => {
          const body = buildExtendPayload()
          if (body) void extendM.mutateAsync(body)
        }}
        editReady={editReady}
        initEdit={initEdit}
        editForm={editForm}
        setEditForm={setEditForm}
        updatePending={updateTenantM.isPending}
        onUpdateTenant={(e: FormEvent) => {
          e.preventDefault()
          void updateTenantM.mutateAsync()
        }}
        resetResult={resetResult}
        onResetDone={(pwd) => setResetResult(pwd)}
        errorMessage={
          activateM.isError || deactivateM.isError || extendM.isError || updateTenantM.isError || mailM.isError
            ? ((activateM.error as Error)?.message ??
              (deactivateM.error as Error)?.message ??
              (extendM.error as Error)?.message ??
              (updateTenantM.error as Error)?.message ??
              (mailM.error as Error)?.message)
            : undefined
        }
      />
    </>
  )
}
