import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FormEvent, ReactElement } from 'react'
import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getDashboardSummary, getTaksitUyarilari, invalidateDashboardSummary, TAKSIT_UYARILARI_QUERY_KEY } from '../api/dashboard'
import { getHesapDonemiOzet, HESAP_DONEMI_OZET_QUERY_KEY } from '../api/hesapDonemi'
import { apiFetch } from '../api/client'
import { listMuvekkiller } from '../api/muvekkiller'
import { listSmmBekleyenler, SMM_BEKLEYEN_QUERY_KEY } from '../api/smm'
import { markOdemeSmmKesildi } from '../api/vekalet'
import { SmmBekleyenHomePanel } from '../components/dashboard/SmmBekleyenHomePanel'
import { HomeAlertsStrip } from '../components/home/HomeAlertsStrip'
import { MuvekkilListToolbar } from '../components/home/MuvekkilListToolbar'
import { TaksitUyarilariSection } from '../components/dashboard/TaksitUyarilariSection'
import { HesapDonemiCard } from '../components/dashboard/HesapDonemiCard'
import { HesapDonemiModal } from '../components/dashboard/HesapDonemiModal'
import { MaliKontrolKart } from '../components/dashboard/MaliKontrolKart'
import { TahsilatBekleyenlerCard } from '../components/dashboard/TahsilatBekleyenlerCard'
import { MaliKontrolMerkeziModal } from '../components/dashboard/MaliKontrolMerkeziModal'
import { BugunkuRandevularCard } from '../pages/RandevularPage'
import { getPreviousAccountingPeriod, getNextAccountingPeriod } from '../lib/accountingPeriod'
import { getMaliKontrolUyarilari, MALI_KONTROL_QUERY_KEY } from '../api/maliKontrol'
import { getTahsilatMerkeziOzet, TAKSILAT_MERKEZI_QUERY_KEY } from '../api/tahsilatMerkezi'
import { useAuth } from '../contexts/AuthContext'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import { APP_BASE, HOME_PAGE_LABEL } from '../config/appPaths'
import { AlertBox, Badge, Button, Card, CardBody, CardHeader, CardTitle, DraggablePanel, EmptyState, PageLoading, StatCard, Table, TBody, TD, TH, THead, TR, tableActionLinkAccentClass } from '../components/ui'
import { AnimatedNumber, Stagger, StaggerItem } from '../motion'
import { useToast } from '../toast'
import type { MuvekkilDto } from '../types/muvekkil'
import type { SmmBekleyenDto } from '../types/smm'
import { formatCurrencyTR } from '../utils/formatters'

type HealthResponse = { ok: boolean; db?: string }

const MUVEKKIL_PAGE_SIZE = 10

export function HomePage(): ReactElement {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [page, setPage] = useState(1)
  const [smmPanelOpen, setSmmPanelOpen] = useState(false)
  const [smmModalRow, setSmmModalRow] = useState<SmmBekleyenDto | null>(null)
  const [donemRefDate, setDonemRefDate] = useState<string | null>(null)
  const [donemModalOpen, setDonemModalOpen] = useState(false)
  const [maliKontrolOpen, setMaliKontrolOpen] = useState(false)
  const { session } = useAuth()
  const { admin: platformAdmin, loading: platformAdminLoading, isAuthenticated: platformAdminOk } =
    useAdminAuth()
  const showAdminPanelCard =
    !platformAdminLoading &&
    platformAdminOk &&
    platformAdmin?.rol === 'SUPER_ADMIN' &&
    platformAdmin.aktifMi === true
  const isMaliKontrolYetkili = session?.user.role === 'BURO_SAHIBI' || session?.user.role === 'AVUKAT_YONETICI'

  const maliKontrolQuery = useQuery({
    queryKey: MALI_KONTROL_QUERY_KEY,
    queryFn: getMaliKontrolUyarilari,
    staleTime: 60_000,
    retry: 1,
    enabled: isMaliKontrolYetkili
  })

  const tahsilatMerkeziOzetQuery = useQuery({
    queryKey: [...TAKSILAT_MERKEZI_QUERY_KEY, 'ozet'],
    queryFn: () => getTahsilatMerkeziOzet(),
    staleTime: 60_000,
    retry: 1
  })

  const donemQuery = useQuery({
    queryKey: [...HESAP_DONEMI_OZET_QUERY_KEY, donemRefDate],
    queryFn: () => getHesapDonemiOzet(donemRefDate),
    staleTime: 30_000,
    retry: 1
  })
  const donemData = donemQuery.data

  const handleDonemNavigate = useCallback((ref: string | null) => {
    setDonemRefDate(ref)
  }, [])

  const handleDonemPrev = useCallback(() => {
    if (!donemData) return
    const prev = getPreviousAccountingPeriod({
      mode: donemData.mode,
      bas: donemData.period.bas,
      bit: donemData.period.bit,
      etiket: donemData.period.etiket
    })
    setDonemRefDate(prev.bas)
  }, [donemData])

  const handleDonemNext = useCallback(() => {
    if (!donemData?.canGoNext) return
    const next = getNextAccountingPeriod({
      mode: donemData.mode,
      bas: donemData.period.bas,
      bit: donemData.period.bit,
      etiket: donemData.period.etiket
    })
    if (next) setDonemRefDate(next.bas)
  }, [donemData])

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedQ(q.trim())
      setPage(1)
    }, 350)
    return () => window.clearTimeout(t)
  }, [q])

  const health = useQuery({
    queryKey: ['health'],
    queryFn: () => apiFetch<HealthResponse>('/health')
  })

  const muvekkilQuery = useQuery({
    queryKey: ['muvekkiller', debouncedQ, page],
    queryFn: () =>
      listMuvekkiller({
        q: debouncedQ || undefined,
        page,
        limit: MUVEKKIL_PAGE_SIZE
      })
  })

  const dashboardQuery = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
    staleTime: 30_000,
    retry: 1
  })

  const taksitUyariQuery = useQuery({
    queryKey: TAKSIT_UYARILARI_QUERY_KEY,
    queryFn: getTaksitUyarilari,
    staleTime: 30_000,
    retry: 1
  })

  const smmQuery = useQuery({
    queryKey: SMM_BEKLEYEN_QUERY_KEY,
    queryFn: listSmmBekleyenler,
    staleTime: 30_000,
    retry: 1
  })

  const markSmmMu = useMutation({
    mutationFn: (odemeId: string) => markOdemeSmmKesildi(odemeId),
    onSuccess: () => {
      invalidateDashboardSummary(queryClient)
      void queryClient.invalidateQueries({ queryKey: SMM_BEKLEYEN_QUERY_KEY })
      setSmmModalRow(null)
      toast.success('SMM kesildi olarak işaretlendi.')
    },
    onError: () => {
      toast.error('SMM durumu güncellenemedi.')
    }
  })

  function onSearch(e: FormEvent): void {
    e.preventDefault()
    const next = q.trim()
    setQ(next)
    setDebouncedQ(next)
    setPage(1)
  }

  const dash = dashboardQuery.data

  const vadesiGecmis = dash?.vadesiGecmisTaksit
  const smmCountFallback = dash?.smmBekleyen
  const smmBekleyenForUyari = smmQuery.data?.total ?? smmCountFallback
  const onayBekleyen = dash?.onayBekleyenToplam
  const uyariParcalari: { key: string; text: string; smmLink?: boolean }[] = []
  if (vadesiGecmis != null && vadesiGecmis > 0) {
    uyariParcalari.push({ key: 'vade', text: `${vadesiGecmis} vadesi geçmiş taksit` })
  }
  if (smmBekleyenForUyari != null && smmBekleyenForUyari > 0) {
    uyariParcalari.push({
      key: 'smm',
      text: 'Serbest meslek makbuzu kesilmemiş tahsilat var',
      smmLink: true
    })
  }
  if (onayBekleyen != null && onayBekleyen > 0) {
    uyariParcalari.push({ key: 'onay', text: 'Onay bekleyen kasa kaydı var' })
  }
  const rows: MuvekkilDto[] = muvekkilQuery.data?.items ?? []
  const total = muvekkilQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / MUVEKKIL_PAGE_SIZE))
  const sonBakilan: MuvekkilDto[] = rows.slice(0, 2)

  const statVal = (n: number | undefined, loading: boolean): string => {
    if (loading) return '…'
    if (n == null) return '—'
    return String(n)
  }

  const smmStatLoading = smmQuery.isPending && !smmQuery.isFetched
  const smmStatValue = smmStatLoading
    ? '…'
    : smmQuery.isError
      ? statVal(smmCountFallback, dashboardQuery.isLoading)
      : String(smmQuery.data?.total ?? 0)

  function openSmmPanel(): void {
    setSmmPanelOpen(true)
  }

  const ofisBakiyeNum =
    dashboardQuery.isSuccess && dash && Number.isFinite(Number(dash.ofisKasaBakiyesi))
      ? Number(dash.ofisKasaBakiyesi)
      : null
  const ofisBakiyeVal =
    ofisBakiyeNum != null ? (
      <AnimatedNumber value={ofisBakiyeNum} format={formatCurrencyTR} />
    ) : dashboardQuery.isLoading ? (
      '…'
    ) : (
      '—'
    )

  return (
    <div className="w-full space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink md:text-2xl">{HOME_PAGE_LABEL}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Programın giriş kapısı: müvekkil arayın veya listeden seçin. Dosya kasası ve taksit işlemleri dosya detayındadır.
        </p>
      </div>

      {health.isError || health.data?.ok === false ? (
        <AlertBox variant="warning" title="Bağlantı uyarısı">
          Sunucuya ulaşılamıyor. Müvekkil listesi ve özet kartları yüklenemeyebilir.
        </AlertBox>
      ) : null}

      <Stagger className="grid items-stretch gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StaggerItem className="h-full min-h-0">
          <StatCard
            label="Vadesi geçmiş taksit"
            value={statVal(dash?.vadesiGecmisTaksit, dashboardQuery.isLoading)}
            sub="Ödenmemiş, vadesi geçmiş taksitler"
          />
        </StaggerItem>
        <StaggerItem className="h-full min-h-0">
          <TahsilatBekleyenlerCard
            ozet={tahsilatMerkeziOzetQuery.data?.ozet}
            loading={tahsilatMerkeziOzetQuery.isLoading}
          />
        </StaggerItem>
        <StaggerItem className="h-full min-h-0">
          <StatCard
            label="SMM bekleyen"
            value={smmStatValue}
            sub="SMM kesilmemiş tahsilatlar"
            interactive
            selected={smmPanelOpen}
            onClick={openSmmPanel}
          />
        </StaggerItem>
        <StaggerItem className="h-full min-h-0">
          <StatCard
            label="Onay bekleyen"
            value={statVal(dash?.onayBekleyenToplam, dashboardQuery.isLoading)}
            sub="Onay bekleyen kasa hareketleri"
          />
        </StaggerItem>
        <StaggerItem className="h-full min-h-0">
          <StatCard label="Ofis kasa bakiyesi" value={ofisBakiyeVal} sub="Onaylanmış kasa hareketlerine göre" />
        </StaggerItem>
        <StaggerItem className="h-full min-h-0">
          <StatCard
            label="Aktif müvekkil"
            value={statVal(dash?.toplamMuvekkil, dashboardQuery.isLoading)}
            sub="Kayıtlı aktif müvekkiller"
          />
        </StaggerItem>
        <StaggerItem className="h-full min-h-0">
          <StatCard label="Aktif dosya" value={statVal(dash?.aktifDosya, dashboardQuery.isLoading)} sub="Takibi devam eden dosyalar" />
        </StaggerItem>
        <StaggerItem className="h-full min-h-0">
          <HesapDonemiCard
            data={donemData}
            loading={donemQuery.isLoading}
            onPrev={handleDonemPrev}
            onNext={handleDonemNext}
            onClick={() => setDonemModalOpen(true)}
          />
        </StaggerItem>
        {isMaliKontrolYetkili ? (
          <StaggerItem className="h-full min-h-0">
            <MaliKontrolKart
              data={maliKontrolQuery.data}
              loading={maliKontrolQuery.isLoading}
              onClick={() => setMaliKontrolOpen(true)}
            />
          </StaggerItem>
        ) : null}
        {showAdminPanelCard ? (
          <StaggerItem className="h-full min-h-0">
            <StatCard
              label="Admin Paneli"
              value="Yönetim"
              sub="Müşteri, kullanıcı ve lisans işlemlerini yönetin."
              interactive
              footerHint="Panele git"
              onClick={() => navigate('/admin')}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              }
            />
          </StaggerItem>
        ) : null}
      </Stagger>

      {dashboardQuery.isError ? (
        <AlertBox variant="warning" title="Özet yüklenemedi">
          Özet bilgiler alınamadı; kartlarda &quot;—&quot; görünebilir.{' '}
          {dashboardQuery.error instanceof Error ? dashboardQuery.error.message : ''}
        </AlertBox>
      ) : null}

      <HomeAlertsStrip
        items={uyariParcalari.map((item) => ({
          key: item.key,
          text: item.text,
          onClick: item.smmLink ? openSmmPanel : undefined
        }))}
        loading={dashboardQuery.isLoading || smmQuery.isPending}
      />

      <BugunkuRandevularCard />

      <SmmBekleyenHomePanel
        open={smmPanelOpen}
        onClose={() => setSmmPanelOpen(false)}
        loading={smmPanelOpen && smmQuery.isFetching && !smmQuery.data}
        error={smmPanelOpen && smmQuery.isError}
        items={smmQuery.data?.items ?? []}
        dosyaHref={(muvekkilId, dosyaId) => `${APP_BASE}/muvekkil/${muvekkilId}/dosya/${dosyaId}`}
        onMarkSmm={(row) => setSmmModalRow(row)}
      />

      {smmModalRow ? (
        <HomeSmmKesildiModal
          row={smmModalRow}
          loading={markSmmMu.isPending}
          error={markSmmMu.error instanceof Error ? markSmmMu.error.message : null}
          onClose={() => setSmmModalRow(null)}
          onConfirm={() => markSmmMu.mutate(smmModalRow.id)}
        />
      ) : null}

      <Card className="overflow-hidden shadow-card">
        <MuvekkilListToolbar
          q={q}
          onQChange={setQ}
          onSearch={onSearch}
          total={total}
          listReady={muvekkilQuery.isSuccess}
          pageSize={MUVEKKIL_PAGE_SIZE}
          onNew={() => navigate(`${APP_BASE}/muvekkiller/yeni`)}
        />
        <CardBody className="p-0">
          {muvekkilQuery.isLoading || muvekkilQuery.isFetching ? (
            <div className="px-4 py-6">
              <PageLoading label="Müvekkiller yükleniyor…" />
            </div>
          ) : muvekkilQuery.isError ? (
            <div className="px-4 py-6">
              <AlertBox variant="danger" title="Liste alınamadı">
                {muvekkilQuery.error instanceof Error ? muvekkilQuery.error.message : 'Bilinmeyen hata.'}
              </AlertBox>
            </div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-6">
              <EmptyState title="Müvekkil yok" description="Arama kriterinize uygun kayıt bulunamadı veya henüz müvekkil eklenmedi." />
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <TR>
                      <TH>Görünen ad</TH>
                      <TH>Tür</TH>
                      <TH>Telefon</TH>
                      <TH>E-posta</TH>
                      <TH className="w-[1%] whitespace-nowrap text-right">İşlem</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {rows.map((m) => {
                      const detailTo = `${APP_BASE}/muvekkil/${m.id}`
                      return (
                        <TR
                          key={m.id}
                          interactive
                          onClick={() => navigate(detailTo)}
                        >
                          <TD>
                            <span className="font-semibold text-primary decoration-primary/35 underline-offset-2 transition group-hover/row:text-primary group-hover/row:underline">
                              {m.gorunenAd}
                            </span>
                          </TD>
                          <TD>
                            {m.tur === 'TUZEL' ? (
                              <Badge variant="accent" className="!normal-case">
                                Tüzel
                              </Badge>
                            ) : (
                              <Badge variant="primary" className="!normal-case">
                                Gerçek
                              </Badge>
                            )}
                          </TD>
                          <TD className="text-ink-muted">{m.telefon ?? '—'}</TD>
                          <TD className="text-ink-muted">{m.eposta ?? '—'}</TD>
                          <TD className="text-right">
                            <Link
                              to={detailTo}
                              onClick={(e) => e.stopPropagation()}
                              className={tableActionLinkAccentClass}
                              aria-label={`${m.gorunenAd}: müvekkil detayı`}
                            >
                              Detay
                            </Link>
                          </TD>
                        </TR>
                      )
                    })}
                  </TBody>
                </Table>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-sm text-ink-muted">
                <span>
                  Toplam <strong>{total}</strong> kayıt · sayfa {page}/{totalPages}
                </span>
                <div className="flex gap-2">
                  <Button type="button" size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
                    Önceki
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    disabled={page >= totalPages}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardBody>
      </Card>

      {sonBakilan.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Son listeden</CardTitle>
            <p className="mt-1 text-xs text-ink-muted">Listenin ilk kayıtları (hızlı erişim).</p>
          </CardHeader>
          <CardBody className="flex flex-wrap gap-2">
            {sonBakilan.map((m) => (
              <Link
                key={m.id}
                to={`${APP_BASE}/muvekkil/${m.id}`}
                className="rounded-lg border border-border bg-panel px-3 py-2 text-sm font-semibold text-primary shadow-sm hover:bg-primary-soft"
              >
                {m.gorunenAd}
              </Link>
            ))}
          </CardBody>
        </Card>
      ) : null}

      <TaksitUyarilariSection
        loading={taksitUyariQuery.isPending && !taksitUyariQuery.data}
        error={taksitUyariQuery.isError}
        data={taksitUyariQuery.data}
        onOpenSmm={openSmmPanel}
      />

      <HesapDonemiModal
        open={donemModalOpen}
        onClose={() => setDonemModalOpen(false)}
        data={donemData ?? null}
        onNavigate={handleDonemNavigate}
      />

      <MaliKontrolMerkeziModal
        open={maliKontrolOpen}
        onClose={() => setMaliKontrolOpen(false)}
        data={maliKontrolQuery.data}
        loading={maliKontrolQuery.isLoading}
      />
    </div>
  )
}

function HomeSmmKesildiModal(props: {
  row: SmmBekleyenDto
  loading: boolean
  error: string | null
  onClose: () => void
  onConfirm: () => void
}): ReactElement {
  const { row, loading, error, onClose, onConfirm } = props

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
      <DraggablePanel
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-white p-5 shadow-xl dark:bg-surface-elevated"
      >
        <div data-modal-drag-handle className="mb-4 flex items-start justify-between gap-2">
          <h2 className="text-base font-bold text-ink">SMM kesildi</h2>
          <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0" onClick={onClose} disabled={loading}>
            ✕
          </Button>
        </div>
        <div className="space-y-3">
          <p className="text-xs text-ink-muted">
            <span className="font-semibold text-ink">{row.muvekkilAd}</span> — {row.dosyaBaslik}
          </p>
          {error ? (
            <AlertBox variant="danger" title="Hata">
              {error}
            </AlertBox>
          ) : null}
          {row.belgeNo?.trim() ? (
            <p className="text-xs text-ink-muted">
              Makbuz / belge no: <span className="font-mono font-semibold">{row.belgeNo}</span>
            </p>
          ) : null}
          <p className="text-xs text-ink-muted">Bu tahsilat için serbest meslek makbuzu kesildi olarak işaretlenecek.</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Vazgeç
            </Button>
            <Button type="button" onClick={onConfirm} disabled={loading}>
              {loading ? 'Kaydediliyor…' : 'SMM kesildi'}
            </Button>
          </div>
        </div>
      </DraggablePanel>
    </div>
  )
}
