import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactElement, ReactNode } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Navigate } from 'react-router-dom'
import {
  getPersonelPrimPanel,
  hesaplaPrimRapor,
  listPersonelPrimOzet,
  markPrimOdendi
} from '../api/prim'
import { getPrimPersonel, listPrimPersoneller } from '../api/primPersonel'
import { PersonnelCollectionCards } from '../components/prim/PersonnelCollectionCards'
import { PersonnelRuleCard } from '../components/prim/PersonnelRuleCard'
import { PersonnelSidebar } from '../components/prim/PersonnelSidebar'
import { PersonnelSummaryCards } from '../components/prim/PersonnelSummaryCards'
import { PrimKuralManageModal } from '../components/prim/PrimKuralManageModal'
import { PrimPersonelFormModal } from '../components/prim/PrimPersonelFormModal'
import { PRIM_AYLAR, primDonemLabel } from '../components/prim/primLabels'
import { AlertBox, Badge, Button, EmptyState, PageHeader } from '../components/ui'
import { APP_BASE } from '../config/appPaths'
import { useAuth } from '../contexts/AuthContext'
import { isBuroSahibiRole } from '../lib/isBuroSahibi'
import type { PersonelPanelDetayParams, PersonelPrimOzetDto } from '../types/prim'
import type { PrimPersonelDto } from '../types/primPersonel'

export function PrimlerPage(): ReactElement {
  const { session } = useAuth()
  const buroSahibi = isBuroSahibiRole(session?.user.role)
  const qc = useQueryClient()
  const now = new Date()

  const [yil, setYil] = useState(now.getFullYear())
  const [ay, setAy] = useState(now.getMonth() + 1)
  const [selectedPersonelId, setSelectedPersonelId] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [tahsilatTuru] = useState<PersonelPanelDetayParams['tahsilatTuru']>('TUMU')
  const [onayDurumu, setOnayDurumu] = useState<PersonelPanelDetayParams['onayDurumu']>('TUMU')
  const [includeNonPremium, setIncludeNonPremium] = useState(false)
  const [kuralModalOpen, setKuralModalOpen] = useState(false)
  const [personelModal, setPersonelModal] = useState<PrimPersonelDto | null | 'new'>(null)

  const ozetQ = useQuery({
    queryKey: ['prim-personel-ozet', yil, ay],
    queryFn: () => listPersonelPrimOzet(yil, ay)
  })

  const personelListeQ = useQuery({
    queryKey: ['prim-personel', 'liste'],
    queryFn: () => listPrimPersoneller({ limit: 500 })
  })

  const personelList = useMemo<PersonelPrimOzetDto[]>(() => {
    const ozetItems = ozetQ.data?.items ?? []
    if (ozetItems.length > 0) {
      return ozetItems.map((item) => ({
        ...item,
        primPersonelId: item.primPersonelId
      }))
    }
    return (personelListeQ.data?.items ?? []).map((p) => ({
      primPersonelId: p.id,
      adSoyad: p.adSoyad,
      unvan: p.unvan,
      aktifMi: p.aktifMi,
      toplamTahsilatBuAy: '0.00',
      tahminiPrim: '0.00',
      primDonemId: null,
      primDonemDurum: null
    }))
  }, [ozetQ.data?.items, personelListeQ.data?.items])

  const listLoading = ozetQ.isLoading || (personelList.length === 0 && personelListeQ.isLoading)

  const effectiveSelectedId = useMemo(() => {
    if (selectedPersonelId && personelList.some((p) => p.primPersonelId === selectedPersonelId)) {
      return selectedPersonelId
    }
    const firstActive = personelList.find((p) => p.aktifMi && p.primPersonelId)
    return firstActive?.primPersonelId ?? personelList[0]?.primPersonelId ?? null
  }, [selectedPersonelId, personelList])

  useEffect(() => {
    if (!effectiveSelectedId) return
    if (selectedPersonelId !== effectiveSelectedId) {
      setSelectedPersonelId(effectiveSelectedId)
    }
  }, [effectiveSelectedId, selectedPersonelId])

  const panelParams = useMemo<PersonelPanelDetayParams>(
    () => ({ yil, ay, tahsilatTuru, onayDurumu, includeNonPremium }),
    [yil, ay, tahsilatTuru, onayDurumu, includeNonPremium]
  )

  const panelQ = useQuery({
    queryKey: ['prim-personel-panel', effectiveSelectedId, panelParams],
    queryFn: () => getPersonelPrimPanel(effectiveSelectedId!, panelParams),
    enabled: Boolean(effectiveSelectedId)
  })

  const hesaplaMu = useMutation({
    mutationFn: () =>
      hesaplaPrimRapor({
        yil,
        ay,
        ...(effectiveSelectedId ? { primPersonelId: effectiveSelectedId } : {})
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['prim-personel-ozet'] })
      void qc.invalidateQueries({ queryKey: ['prim-personel-panel'] })
    }
  })

  const odendiMu = useMutation({
    mutationFn: (primDonemId: string) => markPrimOdendi(primDonemId),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['prim-personel-ozet'] })
      void qc.invalidateQueries({ queryKey: ['prim-personel-panel'] })
    }
  })

  const panel = panelQ.data?.panel
  const selectedOzet = personelList.find((p) => p.primPersonelId === effectiveSelectedId)
  const hasPersonel = personelList.length > 0
  const showEmptyPersonelState = !listLoading && !hasPersonel

  const openEditPersonel = async (item: PersonelPrimOzetDto): Promise<void> => {
    const res = await getPrimPersonel(item.primPersonelId)
    setPersonelModal(res.personel)
  }

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (!buroSahibi) {
    return <Navigate to={APP_BASE} replace />
  }

  return (
    <div className="space-y-3">
      <PageHeader
        title="Primler"
        description="Personel bazlı icra tahsilat ve prim takibi. Prim ödemesi ofis kasası hareketi oluşturmaz."
        actions={
          <Button type="button" variant="outline" size="sm" onClick={() => setKuralModalOpen(true)}>
            Prim kuralları
          </Button>
        }
      />

      <div className="flex min-h-[32rem] gap-3">
        <PersonnelSidebar
          items={personelList}
          selectedPersonelId={effectiveSelectedId}
          onSelect={setSelectedPersonelId}
          search={search}
          onSearchChange={setSearch}
          loading={listLoading}
          canManage
          onAddPersonel={() => setPersonelModal('new')}
          onEditPersonel={(item) => void openEditPersonel(item)}
        />

        <section className="min-w-0 flex-1 space-y-3">
          {showEmptyPersonelState ? (
            <EmptyState
              className="min-h-[28rem] w-full"
              title="Henüz personel eklenmedi"
              description="Prim takibi yapabilmek için önce tahsilat personellerinizi ekleyin."
              action={
                <Button type="button" onClick={() => setPersonelModal('new')}>
                  + İlk personeli ekle
                </Button>
              }
            />
          ) : effectiveSelectedId ? (
            <>
              <div className="rounded-lg border border-border bg-panel px-3 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h2 className="text-base font-bold text-ink">
                      {panel?.personel.adSoyad ?? selectedOzet?.adSoyad ?? '—'}
                    </h2>
                    <p className="text-xs text-ink-muted">
                      {panel?.personel.unvan ?? selectedOzet?.unvan ?? '—'} · {primDonemLabel(yil, ay)}
                      {!panel?.personel.aktifMi && panel ? ' · Pasif' : ''}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {panel?.ozet.primDonemDurum === 'ODENDI' ? (
                      <Badge variant="success">Prim ödendi</Badge>
                    ) : panel?.ozet.primDonemDurum === 'HESAPLANDI' ? (
                      <Badge variant="default">Prim hesaplandı</Badge>
                    ) : null}
                    <Button type="button" size="sm" onClick={() => hesaplaMu.mutate()} disabled={hesaplaMu.isPending}>
                      {hesaplaMu.isPending ? 'Hesaplanıyor…' : 'Hesapla / Yenile'}
                    </Button>
                    {panel?.ozet.primDonemId && panel.ozet.primDonemDurum === 'HESAPLANDI' ? (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={odendiMu.isPending}
                        onClick={() => odendiMu.mutate(panel.ozet.primDonemId!)}
                      >
                        Ödendi işaretle
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-surface-muted/30 px-3 py-2">
                <FilterSelect label="Yıl" value={String(yil)} onChange={(v) => setYil(Number(v))}>
                  {[yil - 1, yil, yil + 1].map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </FilterSelect>
                <FilterSelect label="Ay" value={String(ay)} onChange={(v) => setAy(Number(v))}>
                  {PRIM_AYLAR.map((label, i) => (
                    <option key={label} value={i + 1}>{label}</option>
                  ))}
                </FilterSelect>
                <FilterSelect label="Onay" value={onayDurumu ?? 'TUMU'} onChange={(v) => setOnayDurumu(v as PersonelPanelDetayParams['onayDurumu'])}>
                  <option value="TUMU">Tümü</option>
                  <option value="ONAYLI">Onaylı</option>
                  <option value="ONAYSIZ">Onay bekliyor</option>
                  <option value="REDDEDILDI">Reddedildi</option>
                </FilterSelect>
                <label className="flex items-center gap-1.5 pb-1 text-xs text-ink-muted">
                  <input
                    type="checkbox"
                    checked={includeNonPremium}
                    onChange={(e) => setIncludeNonPremium(e.target.checked)}
                  />
                  Prime dahil olmayanları da göster
                </label>
              </div>

              {panelQ.isError ? (
                <AlertBox variant="danger" title="Hata">{(panelQ.error as Error).message}</AlertBox>
              ) : null}
              {hesaplaMu.error ? (
                <AlertBox variant="danger" title="Hesaplama hatası">{(hesaplaMu.error as Error).message}</AlertBox>
              ) : null}

              <PersonnelSummaryCards ozet={panel?.ozet ?? emptyOzet(yil, ay)} loading={panelQ.isLoading} />

              <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px]">
                <div>
                  <h3 className="mb-2 text-xs font-bold uppercase tracking-wide text-ink-muted">
                    Personelin yaptığı tahsilatlar
                  </h3>
                  <PersonnelCollectionCards
                    items={panel?.tahsilatlar ?? []}
                    loading={panelQ.isLoading}
                    showPremiumBadges={includeNonPremium}
                  />
                </div>
                <PersonnelRuleCard kural={panel?.kural ?? null} />
              </div>
            </>
          ) : (
            <div className="rounded-lg border border-border bg-panel px-4 py-12 text-center text-sm text-ink-muted">
              Personel listesi yükleniyor…
            </div>
          )}
        </section>
      </div>

      {kuralModalOpen ? (
        <PrimKuralManageModal
          prefillPrimPersonelId={effectiveSelectedId}
          onClose={() => setKuralModalOpen(false)}
          onSaved={() => {
            void qc.invalidateQueries({ queryKey: ['prim-personel-panel'] })
            void qc.invalidateQueries({ queryKey: ['prim-personel-ozet'] })
          }}
        />
      ) : null}

      {personelModal ? (
        <PrimPersonelFormModal
          initial={personelModal === 'new' ? null : personelModal}
          onClose={() => setPersonelModal(null)}
          onSaved={(personelId) => {
            setPersonelModal(null)
            if (personelId) setSelectedPersonelId(personelId)
            void qc.invalidateQueries({ queryKey: ['prim-personel-ozet'] })
            void qc.invalidateQueries({ queryKey: ['prim-personel-panel'] })
            void qc.invalidateQueries({ queryKey: ['prim-personel'] })
          }}
        />
      ) : null}
    </div>
  )
}

function FilterSelect(props: {
  label: string
  value: string
  onChange: (v: string) => void
  children: ReactNode
}): ReactElement {
  return (
    <div>
      <label className="mb-0.5 block text-[10px] font-semibold uppercase text-ink-muted">{props.label}</label>
      <select
        className="h-8 rounded-md border border-border bg-white px-2 text-xs"
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
      >
        {props.children}
      </select>
    </div>
  )
}

function emptyOzet(yil: number, ay: number) {
  return {
    yil,
    ay,
    toplamTahsilatBuAy: '0.00',
    primDahilTahsilat: '0.00',
    tahminiPrim: '0.00',
    odenmisPrim: '0.00',
    tahsilatAdedi: 0,
    primDahilTahsilatAdedi: 0,
    uygulananKuralAd: null,
    primDonemId: null,
    primDonemDurum: null,
    kademeHesabi: []
  }
}
