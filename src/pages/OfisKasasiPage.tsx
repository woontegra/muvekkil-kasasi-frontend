import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FormEvent, ReactElement, ReactNode } from 'react'
import { useMemo, useState } from 'react'
import { invalidateDashboardSummary } from '../api/dashboard'
import {
  approveOfisKasaHareketi,
  createOfisKasaDuzeltme,
  createOfisKasaHareketi,
  deleteOfisKasaHareketi,
  getOfisKasaOzet,
  listOfisKasaHareketleri,
  rejectOfisKasaHareketi
} from '../api/ofisKasasi'
import { useAuth } from '../contexts/AuthContext'
import {
  AlertBox,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Input,
  StatCard,
  Table,
  TableEmptyRow,
  TBody,
  TD,
  TH,
  THead,
  TR,
  tableActionsFlexRow,
  tableActionButtonShrinkClass
} from '../components/ui'
import { cn } from '../lib/cn'
import type {
  OfisKasaHareketiDto,
  OfisKasaIslemTipiApi,
  OfisKasaOdemeYontemiApi,
  OfisKasaOnayDurumuApi
} from '../types/ofisKasasi'
import {
  OFIS_KASA_GELIR_KATEGORILERI,
  OFIS_KASA_GIDER_KATEGORILERI,
  type CreateOfisKasaHareketiPayload
} from '../types/ofisKasasi'
import { formatCurrencyTR, formatDateTR } from '../utils/formatters'

const ODEME_OPTIONS: { value: OfisKasaOdemeYontemiApi; label: string }[] = [
  { value: 'NAKIT', label: 'Nakit' },
  { value: 'BANKA', label: 'Banka' },
  { value: 'KREDI_KARTI', label: 'Kredi kartı' },
  { value: 'DIGER', label: 'Diğer' }
]

function todayInputDate(): string {
  const d = new Date()
  const y = d.getFullYear()
  const mo = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${mo}-${day}`
}

function dateInputToIsoUtcNoon(dateStr: string): string {
  return `${dateStr}T12:00:00.000Z`
}

function tipLabel(t: OfisKasaIslemTipiApi): string {
  switch (t) {
    case 'GELIR':
      return 'Gelir'
    case 'GIDER':
      return 'Gider'
    case 'DUZELTME':
      return 'Düzeltme'
    default:
      return t
  }
}

function onayLabel(o: OfisKasaOnayDurumuApi): string {
  switch (o) {
    case 'ONAYSIZ':
      return 'Onaysız'
    case 'ONAYLI':
      return 'Onaylı'
    case 'REDDEDILDI':
      return 'Reddedildi'
    default:
      return o
  }
}

function odemeLabel(v: OfisKasaOdemeYontemiApi): string {
  return ODEME_OPTIONS.find((x) => x.value === v)?.label ?? v
}

function signedTutar(h: OfisKasaHareketiDto): number {
  const v = Number(h.tutar)
  if (h.islemTipi === 'GIDER') return -v
  return v
}

function isYonetici(role: string | undefined): boolean {
  return role === 'BURO_SAHIBI' || role === 'AVUKAT_YONETICI'
}

function canCreateHareket(role: string | undefined): boolean {
  return role === 'BURO_SAHIBI' || role === 'AVUKAT_YONETICI' || role === 'KATIP_PERSONEL'
}

export function OfisKasasiPage(): ReactElement {
  const { session } = useAuth()
  const role = session?.user.role
  const queryClient = useQueryClient()
  const yonetici = isYonetici(role)
  const olusturabilir = canCreateHareket(role)

  const [q, setQ] = useState('')
  const [islemTipi, setIslemTipi] = useState<'' | OfisKasaIslemTipiApi>('')
  const [onayDurumu, setOnayDurumu] = useState<'' | OfisKasaOnayDurumuApi>('')
  const [kategori, setKategori] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const limit = 50

  const listParams = useMemo(
    () => ({
      q: q.trim() || undefined,
      islemTipi: islemTipi || undefined,
      onayDurumu: onayDurumu || undefined,
      kategori: kategori.trim() || undefined,
      startDate: startDate ? dateInputToIsoUtcNoon(startDate) : undefined,
      endDate: endDate ? dateInputToIsoUtcNoon(endDate) : undefined,
      page,
      limit
    }),
    [q, islemTipi, onayDurumu, kategori, startDate, endDate, page, limit]
  )

  const ozetQuery = useQuery({
    queryKey: ['ofis-kasasi-ozet'],
    queryFn: getOfisKasaOzet
  })

  const listQuery = useQuery({
    queryKey: ['ofis-kasasi-hareketleri', listParams],
    queryFn: () => listOfisKasaHareketleri(listParams)
  })

  const invalidateAll = (): void => {
    void queryClient.invalidateQueries({ queryKey: ['ofis-kasasi-ozet'] })
    void queryClient.invalidateQueries({ queryKey: ['ofis-kasasi-hareketleri'] })
    invalidateDashboardSummary(queryClient)
  }

  const approveMu = useMutation({
    mutationFn: (id: string) => approveOfisKasaHareketi(id),
    onSuccess: invalidateAll
  })
  const rejectMu = useMutation({
    mutationFn: ({ id, redSebebi }: { id: string; redSebebi: string }) => rejectOfisKasaHareketi(id, redSebebi),
    onSuccess: invalidateAll
  })
  const deleteMu = useMutation({
    mutationFn: (id: string) => deleteOfisKasaHareketi(id),
    onSuccess: invalidateAll
  })
  const duzeltmeMu = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { tarih: string; tutar: number; aciklama: string; odemeYontemi: OfisKasaOdemeYontemiApi } }) =>
      createOfisKasaDuzeltme(id, body),
    onSuccess: invalidateAll
  })
  const createMu = useMutation({
    mutationFn: (body: CreateOfisKasaHareketiPayload) => createOfisKasaHareketi(body),
    onSuccess: invalidateAll
  })

  const [createOpen, setCreateOpen] = useState(false)
  const [rejectFor, setRejectFor] = useState<OfisKasaHareketiDto | null>(null)
  const [duzeltFor, setDuzeltFor] = useState<OfisKasaHareketiDto | null>(null)

  const ozet = ozetQuery.data?.ozet
  const items = listQuery.data?.items ?? []
  const total = listQuery.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  const kategoriFilterOptions = useMemo(() => {
    const s = new Set<string>([...OFIS_KASA_GELIR_KATEGORILERI, ...OFIS_KASA_GIDER_KATEGORILERI, 'Düzeltme'])
    return Array.from(s).sort((a, b) => a.localeCompare(b, 'tr'))
  }, [])

  function onFilterSubmit(e: FormEvent): void {
    e.preventDefault()
    setPage(1)
    void listQuery.refetch()
  }

  return (
    <div className="w-full space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink md:text-2xl">Ofis Kasası</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Büronun dosya dışı gelir ve giderleri. Müvekkil dosya kasasından tamamen ayrıdır; yalnızca onaylı kayıtlar bakiyeye
          yansır.
        </p>
      </div>

      {ozetQuery.isError ? (
        <AlertBox variant="danger" title="Özet yüklenemedi">
          {ozetQuery.error instanceof Error ? ozetQuery.error.message : 'Hata'}
        </AlertBox>
      ) : null}
      {listQuery.isError ? (
        <AlertBox variant="danger" title="Liste yüklenemedi">
          {listQuery.error instanceof Error ? listQuery.error.message : 'Hata'}
        </AlertBox>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard
          label="Toplam gelir (onaylı)"
          value={ozet ? formatCurrencyTR(Number(ozet.toplamGelir)) : '—'}
          sub="Ofis kasası"
          className="border border-emerald-300/60 bg-emerald-50/80 dark:border-emerald-900/50 dark:bg-emerald-950/25"
        />
        <StatCard
          label="Toplam gider (onaylı)"
          value={ozet ? formatCurrencyTR(Number(ozet.toplamGider)) : '—'}
          sub="Pozitif tutarlar toplamı"
          className="border border-orange-400/50 bg-orange-50/85 dark:border-orange-900/45 dark:bg-orange-950/25"
        />
        <StatCard
          label="Kasa bakiyesi"
          value={ozet ? formatCurrencyTR(Number(ozet.kasaBakiyesi)) : '—'}
          sub="Gelir − gider ± düzeltme"
          className="border border-sky-400/50 bg-sky-50/90 dark:border-sky-900/45 dark:bg-sky-950/25"
        />
        <StatCard
          label="Bu ay gelir"
          value={ozet ? formatCurrencyTR(Number(ozet.buAyGelir)) : '—'}
          sub="Onaylı, ay içi"
          className="border border-border bg-panel"
        />
        <StatCard
          label="Bu ay gider"
          value={ozet ? formatCurrencyTR(Number(ozet.buAyGider)) : '—'}
          sub="Onaylı, ay içi"
          className="border border-border bg-panel"
        />
        <StatCard
          label="Onaysız işlem"
          value={ozet ? String(ozet.onaysizIslemSayisi) : '—'}
          sub="Onay bekliyor"
          className="border border-amber-400/55 bg-amber-50/90 dark:border-amber-900/45 dark:bg-amber-950/25"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 border-b border-border sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Hareketler</CardTitle>
            <p className="mt-1 text-xs text-ink-muted">Filtreleyin; yeni kayıt varsayılan olarak onaysızdır.</p>
          </div>
          {olusturabilir ? (
            <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
              Yeni Ofis Kasa Hareketi
            </Button>
          ) : (
            <p className="text-xs text-ink-muted">Hareket eklemek için yetkiniz yok.</p>
          )}
        </CardHeader>
        <CardBody className="space-y-4 p-4">
          <form onSubmit={onFilterSubmit} className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Input label="Arama" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Belge, açıklama…" />
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">İşlem tipi</label>
              <select
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink shadow-inner outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-surface-elevated"
                value={islemTipi}
                onChange={(e) => setIslemTipi(e.target.value as '' | OfisKasaIslemTipiApi)}
              >
                <option value="">Tümü</option>
                <option value="GELIR">Gelir</option>
                <option value="GIDER">Gider</option>
                <option value="DUZELTME">Düzeltme</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">Kategori</label>
              <select
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink shadow-inner outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-surface-elevated"
                value={kategori}
                onChange={(e) => setKategori(e.target.value)}
              >
                <option value="">Tümü</option>
                {kategoriFilterOptions.map((k) => (
                  <option key={k} value={k}>
                    {k}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">Onay</label>
              <select
                className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink shadow-inner outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-surface-elevated"
                value={onayDurumu}
                onChange={(e) => setOnayDurumu(e.target.value as '' | OfisKasaOnayDurumuApi)}
              >
                <option value="">Tümü</option>
                <option value="ONAYSIZ">Onaysız</option>
                <option value="ONAYLI">Onaylı</option>
                <option value="REDDEDILDI">Reddedildi</option>
              </select>
            </div>
            <Input label="Başlangıç" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input label="Bitiş" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <div className="flex items-end gap-2 md:col-span-2 lg:col-span-3 xl:col-span-6">
              <Button type="submit" variant="secondary" size="sm">
                Uygula
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setQ('')
                  setIslemTipi('')
                  setOnayDurumu('')
                  setKategori('')
                  setStartDate('')
                  setEndDate('')
                  setPage(1)
                }}
              >
                Sıfırla
              </Button>
            </div>
          </form>

          <div className="overflow-x-auto rounded-lg border border-border">
            <Table>
              <THead>
                <TR>
                  <TH>Tarih</TH>
                  <TH>Tip</TH>
                  <TH>Kategori</TH>
                  <TH>Açıklama</TH>
                  <TH className="text-right">Tutar</TH>
                  <TH>Ödeme</TH>
                  <TH>Belge no</TH>
                  <TH>Onay</TH>
                  <TH className="min-w-[200px] text-right">İşlem</TH>
                </TR>
              </THead>
              <TBody>
                {listQuery.isLoading ? (
                  <TableEmptyRow colSpan={9}>Yükleniyor…</TableEmptyRow>
                ) : items.length === 0 ? (
                  <TableEmptyRow colSpan={9}>Kayıt yok.</TableEmptyRow>
                ) : (
                  items.map((h) => {
                    const onaysiz = h.onayDurumu === 'ONAYSIZ'
                    const onayli = h.onayDurumu === 'ONAYLI'
                    const reddedildi = h.onayDurumu === 'REDDEDILDI'
                    const signed = signedTutar(h)
                    return (
                      <TR key={h.id} className={cn(h.islemTipi === 'DUZELTME' && 'bg-amber-50/30 dark:bg-amber-950/15')}>
                        <TD className="whitespace-nowrap text-ink-muted">{formatDateTR(h.tarih)}</TD>
                        <TD className="text-sm font-medium">{tipLabel(h.islemTipi)}</TD>
                        <TD className="max-w-[160px] text-sm">
                          {h.kategori}
                          {h.ozelKategoriAdi?.trim() ? (
                            <span className="mt-0.5 block text-[11px] text-ink-muted">({h.ozelKategoriAdi})</span>
                          ) : null}
                        </TD>
                        <TD className="max-w-[200px] text-sm text-ink-muted">{h.aciklama?.trim() || '—'}</TD>
                        <TD
                          className={cn(
                            'text-right text-sm font-semibold tabular-nums',
                            signed < 0 ? 'text-danger' : 'text-ink'
                          )}
                        >
                          {formatCurrencyTR(signed)}
                        </TD>
                        <TD className="text-xs text-ink-muted">{odemeLabel(h.odemeYontemi)}</TD>
                        <TD className="font-mono text-xs">{h.belgeNo}</TD>
                        <TD>
                          <Badge
                            variant={onayli ? 'success' : reddedildi ? 'danger' : onaysiz ? 'warning' : 'default'}
                            className="!normal-case"
                          >
                            {onayLabel(h.onayDurumu)}
                          </Badge>
                          {reddedildi && h.redSebebi?.trim() ? (
                            <p className="mt-1 max-w-[140px] text-[11px] text-danger">{h.redSebebi}</p>
                          ) : null}
                        </TD>
                        <TD className="min-w-[200px] align-middle text-right">
                          <div className={cn(tableActionsFlexRow, 'gap-1.5')}>
                            {onaysiz && yonetici ? (
                              <>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="secondary"
                                  className={cn('h-7 px-2 text-[11px]', tableActionButtonShrinkClass)}
                                  disabled={approveMu.isPending}
                                  onClick={() => approveMu.mutate(h.id)}
                                >
                                  Onayla
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className={cn('h-7 px-2 text-[11px]', tableActionButtonShrinkClass)}
                                  onClick={() => setRejectFor(h)}
                                >
                                  Reddet
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="outline"
                                  className={cn('h-7 px-2 text-[11px] text-danger', tableActionButtonShrinkClass)}
                                  disabled={deleteMu.isPending}
                                  onClick={() => {
                                    if (window.confirm('Bu onaysız kaydı silmek istiyor musunuz?')) deleteMu.mutate(h.id)
                                  }}
                                >
                                  Sil
                                </Button>
                              </>
                            ) : null}
                            {onayli && h.islemTipi !== 'DUZELTME' ? (
                              <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                className={cn('h-7 px-2 text-[11px]', tableActionButtonShrinkClass)}
                                onClick={() => setDuzeltFor(h)}
                              >
                                Düzeltme
                              </Button>
                            ) : null}
                            {reddedildi ? <span className="text-[11px] text-ink-muted">—</span> : null}
                          </div>
                        </TD>
                      </TR>
                    )
                  })
                )}
              </TBody>
            </Table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-ink-muted">
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
        </CardBody>
      </Card>

      {createOpen ? (
        <CreateOfisHareketModal
          onClose={() => setCreateOpen(false)}
          loading={createMu.isPending}
          error={createMu.error instanceof Error ? createMu.error.message : null}
          onSubmit={(payload) => createMu.mutate(payload, { onSuccess: () => setCreateOpen(false) })}
        />
      ) : null}

      {rejectFor ? (
        <RejectOfisModal
          belgeNo={rejectFor.belgeNo}
          onClose={() => setRejectFor(null)}
          loading={rejectMu.isPending}
          error={rejectMu.error instanceof Error ? rejectMu.error.message : null}
          onSubmit={(red) => rejectMu.mutate({ id: rejectFor.id, redSebebi: red }, { onSuccess: () => setRejectFor(null) })}
        />
      ) : null}

      {duzeltFor ? (
        <DuzeltOfisModal
          belgeNo={duzeltFor.belgeNo}
          onClose={() => setDuzeltFor(null)}
          loading={duzeltmeMu.isPending}
          error={duzeltmeMu.error instanceof Error ? duzeltmeMu.error.message : null}
          onSubmit={(body) =>
            duzeltmeMu.mutate(
              { id: duzeltFor.id, body },
              {
                onSuccess: () => setDuzeltFor(null)
              }
            )
          }
        />
      ) : null}
    </div>
  )
}

function CreateOfisHareketModal(props: {
  onClose: () => void
  loading: boolean
  error: string | null
  onSubmit: (p: CreateOfisKasaHareketiPayload) => void
}): ReactElement {
  const { onClose, loading, error, onSubmit } = props
  const [islemTipi, setIslemTipi] = useState<'GELIR' | 'GIDER'>('GELIR')
  const [tarih, setTarih] = useState(todayInputDate())
  const [kategori, setKategori] = useState<string>(OFIS_KASA_GELIR_KATEGORILERI[0])
  const [ozel, setOzel] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [tutar, setTutar] = useState('')
  const [odeme, setOdeme] = useState<OfisKasaOdemeYontemiApi>('NAKIT')
  const [localErr, setLocalErr] = useState<string | null>(null)

  const kategoriList = islemTipi === 'GELIR' ? OFIS_KASA_GELIR_KATEGORILERI : OFIS_KASA_GIDER_KATEGORILERI

  const submit = (): void => {
    setLocalErr(null)
    const digerGelir = islemTipi === 'GELIR' && kategori === 'Diğer gelir'
    const digerGider = islemTipi === 'GIDER' && kategori === 'Diğer gider'
    if ((digerGelir || digerGider) && ozel.trim().length < 2) {
      setLocalErr('Diğer gelir/gider için özel kategori adı zorunludur.')
      return
    }
    const n = Number(tutar.replace(',', '.'))
    if (!Number.isFinite(n) || n <= 0) {
      setLocalErr('Tutar pozitif sayı olmalıdır.')
      return
    }
    onSubmit({
      islemTipi,
      tarih: dateInputToIsoUtcNoon(tarih),
      kategori,
      ozelKategoriAdi: digerGelir || digerGider ? ozel.trim() : null,
      aciklama: aciklama.trim() || null,
      tutar: n,
      odemeYontemi: odeme
    })
  }

  return (
    <ModalShell title="Yeni ofis kasa hareketi" onClose={onClose}>
      <div className="space-y-3">
        {error ? <AlertBox variant="danger" title="Hata">{error}</AlertBox> : null}
        {localErr ? <p className="text-xs text-danger">{localErr}</p> : null}
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-muted">İşlem tipi</label>
          <select
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm dark:bg-surface-elevated"
            value={islemTipi}
            onChange={(e) => {
              const t = e.target.value as 'GELIR' | 'GIDER'
              setIslemTipi(t)
              setKategori(t === 'GELIR' ? OFIS_KASA_GELIR_KATEGORILERI[0] : OFIS_KASA_GIDER_KATEGORILERI[0])
              setOzel('')
            }}
          >
            <option value="GELIR">Gelir</option>
            <option value="GIDER">Gider</option>
          </select>
        </div>
        <Input label="Tarih" type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-muted">Kategori</label>
          <select
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm dark:bg-surface-elevated"
            value={kategori}
            onChange={(e) => setKategori(e.target.value)}
          >
            {kategoriList.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </div>
        {(islemTipi === 'GELIR' && kategori === 'Diğer gelir') || (islemTipi === 'GIDER' && kategori === 'Diğer gider') ? (
          <Input label="Özel kategori adı" value={ozel} onChange={(e) => setOzel(e.target.value)} />
        ) : null}
        <Input label="Açıklama (isteğe bağlı)" value={aciklama} onChange={(e) => setAciklama(e.target.value)} />
        <Input label="Tutar (TL)" value={tutar} onChange={(e) => setTutar(e.target.value)} placeholder="0,00" inputMode="decimal" />
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-muted">Ödeme yöntemi</label>
          <select
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm dark:bg-surface-elevated"
            value={odeme}
            onChange={(e) => setOdeme(e.target.value as OfisKasaOdemeYontemiApi)}
          >
            {ODEME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Vazgeç
          </Button>
          <Button type="button" onClick={submit} disabled={loading}>
            {loading ? 'Kaydediliyor…' : 'Kaydet'}
          </Button>
        </div>
      </div>
    </ModalShell>
  )
}

function RejectOfisModal(props: {
  belgeNo: string
  onClose: () => void
  loading: boolean
  error: string | null
  onSubmit: (red: string) => void
}): ReactElement {
  const { belgeNo, onClose, loading, error, onSubmit } = props
  const [red, setRed] = useState('')
  return (
    <ModalShell title={`Red — ${belgeNo}`} onClose={onClose}>
      <div className="space-y-3">
        {error ? <AlertBox variant="danger" title="Hata">{error}</AlertBox> : null}
        <Input label="Red sebebi" value={red} onChange={(e) => setRed(e.target.value)} />
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Vazgeç
          </Button>
          <Button type="button" variant="secondary" onClick={() => onSubmit(red)} disabled={loading || red.trim().length < 3}>
            Reddet
          </Button>
        </div>
      </div>
    </ModalShell>
  )
}

function DuzeltOfisModal(props: {
  belgeNo: string
  onClose: () => void
  loading: boolean
  error: string | null
  onSubmit: (body: { tarih: string; tutar: number; aciklama: string; odemeYontemi: OfisKasaOdemeYontemiApi }) => void
}): ReactElement {
  const { belgeNo, onClose, loading, error, onSubmit } = props
  const [tarih, setTarih] = useState(todayInputDate())
  const [tutar, setTutar] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [odeme, setOdeme] = useState<OfisKasaOdemeYontemiApi>('NAKIT')
  const [localErr, setLocalErr] = useState<string | null>(null)

  const submit = (): void => {
    setLocalErr(null)
    const n = Number(tutar.replace(',', '.'))
    if (!Number.isFinite(n) || n === 0) {
      setLocalErr('Düzeltme tutarı sıfır olamaz; pozitif veya negatif girin.')
      return
    }
    if (aciklama.trim().length < 3) {
      setLocalErr('Açıklama en az 3 karakter olmalıdır.')
      return
    }
    onSubmit({
      tarih: dateInputToIsoUtcNoon(tarih),
      tutar: n,
      aciklama: aciklama.trim(),
      odemeYontemi: odeme
    })
  }

  return (
    <ModalShell title={`Düzeltme talebi — ${belgeNo}`} onClose={onClose}>
      <div className="space-y-3">
        {error ? <AlertBox variant="danger" title="Hata">{error}</AlertBox> : null}
        {localErr ? <p className="text-xs text-danger">{localErr}</p> : null}
        <p className="text-xs text-ink-muted">Orijinal kayıt değişmez; yeni düzeltme satırı onay bekler.</p>
        <Input label="Tarih" type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
        <Input
          label="Tutar (pozitif veya negatif)"
          value={tutar}
          onChange={(e) => setTutar(e.target.value)}
          placeholder="-100,00 veya 50"
          inputMode="decimal"
        />
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-muted">Açıklama</label>
          <textarea
            className="min-h-[88px] w-full rounded-md border border-border bg-white px-3 py-2 text-sm dark:bg-surface-elevated"
            value={aciklama}
            onChange={(e) => setAciklama(e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-muted">Ödeme yöntemi</label>
          <select
            className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm dark:bg-surface-elevated"
            value={odeme}
            onChange={(e) => setOdeme(e.target.value as OfisKasaOdemeYontemiApi)}
          >
            {ODEME_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Vazgeç
          </Button>
          <Button type="button" onClick={submit} disabled={loading}>
            {loading ? 'Gönderiliyor…' : 'Düzeltme aç'}
          </Button>
        </div>
      </div>
    </ModalShell>
  )
}

function ModalShell(props: { title: string; onClose: () => void; children: ReactNode }): ReactElement {
  const { title, onClose, children } = props
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-white p-5 shadow-xl dark:bg-surface-elevated"
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <h2 className="text-base font-bold text-ink">{title}</h2>
          <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0" onClick={onClose}>
            ✕
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}
