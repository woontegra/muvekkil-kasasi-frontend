import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FormEvent, ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { getDashboardSummary, invalidateDashboardSummary } from '../api/dashboard'
import { apiFetch } from '../api/client'
import { listMuvekkiller } from '../api/muvekkiller'
import { listSmmBekleyenler, SMM_BEKLEYEN_QUERY_KEY } from '../api/smm'
import { markTaksitSmmKesildi } from '../api/vekalet'
import { SmmBekleyenHomePanel } from '../components/dashboard/SmmBekleyenHomePanel'
import { APP_BASE } from '../config/appPaths'
import { cn } from '../lib/cn'
import { AlertBox, Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Input, StatCard, Table, TBody, TD, TH, THead, TR } from '../components/ui'
import type { MuvekkilDto } from '../types/muvekkil'
import type { MarkTaksitSmmPayload } from '../types/vekalet'
import type { SmmBekleyenDto } from '../types/smm'
import { formatCurrencyTR } from '../utils/formatters'

type HealthResponse = { ok: boolean; db?: string }

function todayInputDate(): string {
  const d = new Date()
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

export function HomePage(): ReactElement {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [smmPanelOpen, setSmmPanelOpen] = useState(false)
  const [smmModalRow, setSmmModalRow] = useState<SmmBekleyenDto | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 350)
    return () => window.clearTimeout(t)
  }, [q])

  const health = useQuery({
    queryKey: ['health'],
    queryFn: () => apiFetch<HealthResponse>('/health')
  })

  const muvekkilQuery = useQuery({
    queryKey: ['muvekkiller', debouncedQ],
    queryFn: () => listMuvekkiller({ q: debouncedQ || undefined, page: 1, limit: 100 })
  })

  const dashboardQuery = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
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
    mutationFn: ({ id, body }: { id: string; body: MarkTaksitSmmPayload }) => markTaksitSmmKesildi(id, body),
    onSuccess: () => {
      invalidateDashboardSummary(queryClient)
      setSmmModalRow(null)
    }
  })

  function onSearch(e: FormEvent): void {
    e.preventDefault()
  }

  const dash = dashboardQuery.data

  const vadesiGecmis = dash?.vadesiGecmisTaksit
  const smmCountFallback = dash?.smmBekleyen
  const smmBekleyenForUyari = smmQuery.data?.total ?? smmCountFallback
  const onayBekleyen = dash?.onayBekleyenToplam
  const uyariParcalari: string[] = []
  if (vadesiGecmis != null && vadesiGecmis > 0) uyariParcalari.push(`${vadesiGecmis} vadesi geçmiş taksit`)
  if (smmBekleyenForUyari != null && smmBekleyenForUyari > 0) uyariParcalari.push('SMM bekleyen tahsilat var')
  if (onayBekleyen != null && onayBekleyen > 0) uyariParcalari.push('Onay bekleyen kasa kaydı var')
  const rows: MuvekkilDto[] = muvekkilQuery.data?.items ?? []
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

  const ofisBakiyeVal =
    dashboardQuery.isSuccess && dash
      ? formatCurrencyTR(Number(dash.ofisKasaBakiyesi))
      : dashboardQuery.isLoading
        ? '…'
        : '—'

  return (
    <div className="w-full space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink md:text-2xl">Ana Sayfa</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Programın giriş kapısı: müvekkil arayın veya listeden seçin. Dosya kasası ve taksit işlemleri dosya detayındadır.
        </p>
      </div>

      {health.isError || health.data?.ok === false ? (
        <AlertBox variant="warning" title="API / sağlık">
          Sunucu yanıt vermiyor veya sağlık kontrolü başarısız. Müvekkil listesi yüklenemeyebilir.
        </AlertBox>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <StatCard
          label="Vadesi geçmiş taksit"
          value={statVal(dash?.vadesiGecmisTaksit, dashboardQuery.isLoading)}
          sub="Ödenmemiş, vade geçmiş"
        />
        <StatCard
          label="SMM bekleyen"
          value={smmStatValue}
          sub="Ödenmiş, SMM kesilmemiş"
          interactive
          selected={smmPanelOpen}
          onClick={openSmmPanel}
          footerHint="Detayları gör"
        />
        <StatCard
          label="Onay bekleyen"
          value={statVal(dash?.onayBekleyenToplam, dashboardQuery.isLoading)}
          sub="Dosya + ofis kasası (onaysız)"
        />
        <StatCard label="Ofis kasa bakiyesi" value={ofisBakiyeVal} sub="Onaylı hareketler (özet API)" />
        <StatCard
          label="Aktif müvekkil"
          value={statVal(dash?.toplamMuvekkil, dashboardQuery.isLoading)}
          sub="aktifMi=true"
        />
        <StatCard label="Aktif dosya" value={statVal(dash?.aktifDosya, dashboardQuery.isLoading)} sub="aktifMi=true" />
      </div>

      {dashboardQuery.isError ? (
        <AlertBox variant="warning" title="Dashboard özeti">
          Özet yüklenemedi; kartlarda &quot;—&quot; görünebilir.{' '}
          {dashboardQuery.error instanceof Error ? dashboardQuery.error.message : ''}
        </AlertBox>
      ) : null}

      <div
        className={cn(
          'flex flex-wrap gap-2 rounded-lg border px-3 py-2.5 text-sm',
          uyariParcalari.length > 0
            ? 'border-warning/30 bg-warning-soft/40 text-warning-ink'
            : 'border-border bg-surface-muted/50 text-ink-muted'
        )}
      >
        <span className="font-semibold">Uyarılar</span>
        <span>
          {uyariParcalari.length > 0 ? (
            <>
              {uyariParcalari.map((fragment, i) => {
                const isSmm = fragment.includes('SMM bekleyen')
                const sep = i > 0 ? '. ' : ''
                if (isSmm) {
                  return (
                    <span key={`u-${i}`}>
                      {sep}
                      <button
                        type="button"
                        className="cursor-pointer font-semibold underline decoration-warning-ink/60 underline-offset-2 hover:decoration-warning-ink"
                        onClick={openSmmPanel}
                      >
                        {fragment}
                      </button>
                    </span>
                  )
                }
                return (
                  <span key={`u-${i}`}>
                    {sep}
                    {fragment}
                  </span>
                )
              })}
              .
            </>
          ) : dashboardQuery.isLoading || smmQuery.isPending ? (
            'Özet yükleniyor…'
          ) : (
            'Şu an kritik uyarı yok (vadesi geçmiş taksit, SMM bekleyen veya onay bekleyen yok).'
          )}
        </span>
      </div>

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
          onSubmit={(body) => markSmmMu.mutate({ id: smmModalRow.id, body })}
        />
      ) : null}

      <Card>
        <CardHeader className="flex flex-col gap-3 border-b border-border sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Müvekkiller</CardTitle>
            <p className="mt-1 text-xs text-ink-muted">
              {muvekkilQuery.isSuccess ? (
                <>
                  Kayıtlı <strong>{muvekkilQuery.data.total}</strong> müvekkil (sayfa başına {muvekkilQuery.data.limit}). Satıra veya
                  &quot;Detay&quot;a tıklayınca içeri girilir.
                </>
              ) : (
                'Liste yükleniyor…'
              )}
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 lg:max-w-2xl lg:flex-row lg:items-center">
            <form onSubmit={onSearch} className="flex min-w-0 flex-1 gap-2">
              <Input
                placeholder="Ad, şirket, telefon veya e-posta ara…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="min-w-0 flex-1"
                aria-label="Müvekkil ara"
              />
              <Button type="submit" variant="secondary">
                Ara
              </Button>
            </form>
            <Button type="button" variant="outline" className="shrink-0" onClick={() => navigate(`${APP_BASE}/muvekkiller/yeni`)}>
              Yeni Müvekkil
            </Button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {muvekkilQuery.isLoading ? (
            <p className="px-4 py-10 text-center text-sm text-ink-muted">Yükleniyor…</p>
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
                            className="inline-flex rounded-md px-2 py-1 text-xs font-semibold text-primary underline-offset-2 outline-none ring-primary/25 hover:bg-primary-soft/50 hover:underline focus-visible:ring-2"
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

      {health.isSuccess && health.data?.ok ? (
        <p className="text-center text-[11px] text-ink-subtle">
          API bağlı{health.data.db ? ` (${health.data.db})` : ''}.
        </p>
      ) : null}
    </div>
  )
}

function HomeSmmKesildiModal(props: {
  row: SmmBekleyenDto
  loading: boolean
  error: string | null
  onClose: () => void
  onSubmit: (body: MarkTaksitSmmPayload) => void
}): ReactElement {
  const { row, loading, error, onClose, onSubmit } = props
  const [smmNo, setSmmNo] = useState('')
  const [kesim, setKesim] = useState(todayInputDate())
  const [aciklama, setAciklama] = useState('')
  const [localErr, setLocalErr] = useState<string | null>(null)

  const submit = (): void => {
    setLocalErr(null)
    if (!smmNo.trim()) {
      setLocalErr('SMM numarası zorunludur.')
      return
    }
    onSubmit({
      smmNo: smmNo.trim(),
      smmKesimTarihi: `${kesim}T12:00:00.000Z`,
      smmAciklama: aciklama.trim() || null
    })
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-white p-5 shadow-xl dark:bg-surface-elevated"
      >
        <div className="mb-4 flex items-start justify-between gap-2">
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
          {localErr ? <p className="text-xs text-danger">{localErr}</p> : null}
          {row.belgeNo?.trim() ? (
            <p className="text-xs text-ink-muted">
              Makbuz / belge no: <span className="font-mono font-semibold">{row.belgeNo}</span>
            </p>
          ) : null}
          <p className="text-xs text-ink-muted">
            Bu alan yalnızca takip içindir; muhasebe / resmi SMM düzenini değiştirmez.
          </p>
          <Input label="SMM no" value={smmNo} onChange={(e) => setSmmNo(e.target.value)} required />
          <Input label="SMM kesim tarihi" type="date" value={kesim} onChange={(e) => setKesim(e.target.value)} />
          <Input label="Açıklama (isteğe bağlı)" value={aciklama} onChange={(e) => setAciklama(e.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Vazgeç
            </Button>
            <Button type="button" onClick={submit} disabled={loading}>
              {loading ? 'Kaydediliyor…' : 'Kaydet'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
