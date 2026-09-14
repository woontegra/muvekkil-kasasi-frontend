import type { FormEvent, ReactElement, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { getDosyaVekalet } from '../../api/vekalet'
import { buildCrossPaymentPayload } from '../../lib/crossCurrencyPayment'
import { CrossCurrencyPaymentFields } from '../paraBirimi/CrossCurrencyPaymentFields'
import { TahsilatiYapanPersonelSelect } from '../prim/TahsilatiYapanPersonelSelect'
import { AlertBox, Button, Input, ModalScrim } from '../ui'
import { resolveTaksitRow } from '../../lib/vekaletTaksitOzet'
import type { CrossPaymentKurMeta } from '../../types/kurlar'
import type { CreateVekaletTaksitOdemePayload, VekaletTaksitiDto } from '../../types/vekalet'
import type { OdemeYontemiApi } from '../../types/kasa'
import {
  formatMoneyFixed2,
  moneyFixed2NonZero,
  resolveParaBirimi,
  type ParaBirimi
} from '../../utils/formatters'

const ODEME_OPTIONS: { value: OdemeYontemiApi; label: string }[] = [
  { value: 'NAKIT', label: 'Nakit' },
  { value: 'BANKA', label: 'Banka' },
  { value: 'KREDI_KARTI', label: 'Kredi kartı' },
  { value: 'DIGER', label: 'Diğer' }
]

function todayInputDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function selectClassName(): string {
  return 'w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 dark:bg-surface-elevated'
}

function moneyInputFromFixed2(fixed2: string): string {
  const s = String(fixed2 ?? '').trim()
  if (!/^-?\d+(\.\d+)?$/.test(s)) return ''
  const [intRaw, fracRaw = '00'] = s.replace(/^-/, '').split('.')
  const frac = `${fracRaw}00`.slice(0, 2)
  const intFormatted = intRaw.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${intFormatted},${frac}`
}

export type VekaletTaksitOdemeModalProps = {
  taksit: VekaletTaksitiDto
  dosyaId: string
  onClose: () => void
  loading: boolean
  error: string | null
  onSubmit: (body: CreateVekaletTaksitOdemePayload) => void
  onStaleSummary?: () => void
}

export function VekaletTaksitOdemeModal(props: VekaletTaksitOdemeModalProps): ReactElement {
  const { taksit, dosyaId, onClose, loading, error, onSubmit, onStaleSummary } = props
  const queryClient = useQueryClient()
  const alacakParaBirimi = resolveParaBirimi(taksit.paraBirimi)

  /** Modal açıkken kanonik özet — backend ile aynı kaynaktan. */
  const ozetQuery = useQuery({
    queryKey: ['vekalet', dosyaId, 'taksit-odeme-modal', taksit.id],
    queryFn: async () => {
      const pack = await getDosyaVekalet(dosyaId)
      const row = pack.taksitler.find((t) => t.id === taksit.id)
      if (!row) throw new Error('Taksit bulunamadı.')
      return resolveTaksitRow(row)
    },
    staleTime: 0,
    refetchOnMount: 'always'
  })

  const kalanStr = ozetQuery.data?.kalanTutar ?? resolveTaksitRow(taksit).kalanTutar
  const odenenStr = ozetQuery.data?.odenenToplam ?? resolveTaksitRow(taksit).odenenToplam
  const taksitStr = ozetQuery.data?.taksitTutari ?? resolveTaksitRow(taksit).taksitTutari
  const kalanActive = moneyFixed2NonZero(kalanStr)

  const [mahsupTutar, setMahsupTutar] = useState('')
  const [odemeParaBirimi, setOdemeParaBirimi] = useState<ParaBirimi>(alacakParaBirimi)
  const [kasaTutari, setKasaTutari] = useState('')
  const [odemeTarihi, setOdemeTarihi] = useState(todayInputDate())
  const [odeme, setOdeme] = useState<OdemeYontemiApi>('NAKIT')
  const [aciklama, setAciklama] = useState('')
  const [tahsilatiYapanPersonelId, setTahsilatiYapanPersonelId] = useState('')
  const [localErr, setLocalErr] = useState<string | null>(null)
  const [kurOnay, setKurOnay] = useState(false)
  const [kurMeta, setKurMeta] = useState<CrossPaymentKurMeta>({
    kurKaynagi: null,
    tcmbKurTarihi: null,
    tcmbReferansKur: null
  })

  useEffect(() => {
    if (ozetQuery.data && kalanActive) {
      setMahsupTutar(moneyInputFromFixed2(kalanStr))
    } else if (ozetQuery.data && !kalanActive) {
      setMahsupTutar('')
    }
    setOdemeParaBirimi(alacakParaBirimi)
    setKasaTutari('')
    setOdemeTarihi(todayInputDate())
    setOdeme('NAKIT')
    setAciklama('')
    setKurOnay(false)
    setLocalErr(null)
  }, [taksit.id, ozetQuery.dataUpdatedAt, alacakParaBirimi, kalanStr, kalanActive])

  useEffect(() => {
    if (error && /STALE_PAYMENT_SUMMARY|güncelliğini yitirdi/i.test(error)) {
      void queryClient.invalidateQueries({ queryKey: ['vekalet', dosyaId] })
      void ozetQuery.refetch()
      onStaleSummary?.()
    }
  }, [error, dosyaId, queryClient, ozetQuery, onStaleSummary])

  const crossPreview = buildCrossPaymentPayload(
    alacakParaBirimi,
    mahsupTutar,
    odemeParaBirimi,
    kasaTutari,
    kurMeta
  )
  const needsKurOnay = crossPreview.ok && crossPreview.kurOzeti != null

  const submit = (e?: FormEvent): void => {
    e?.preventDefault()
    setLocalErr(null)
    if (ozetQuery.isFetching || !ozetQuery.data) {
      setLocalErr('Güncel kalan tutar yükleniyor…')
      return
    }
    if (!crossPreview.ok) {
      setLocalErr(crossPreview.error)
      return
    }
    if (needsKurOnay && !kurOnay) {
      setLocalErr('Çapraz kur önizlemesini onaylayın.')
      return
    }
    onSubmit({
      ...crossPreview.payload,
      odemeTarihi: `${odemeTarihi}T12:00:00.000Z`,
      odemeYontemi: odeme,
      aciklama: aciklama.trim() || null,
      tahsilatiYapanPersonelId: tahsilatiYapanPersonelId || null,
      expectedKalanTutar: kalanStr
    })
  }

  return (
    <ModalScrim onClose={onClose} wide align="top" innerAsDialog>
      <ModalPanel title="Taksit ödemesi al" onClose={onClose}>
        <form className="space-y-3" onSubmit={submit}>
          {error ? (
            <AlertBox variant="danger" title="Hata">
              {error}
            </AlertBox>
          ) : null}
          {localErr ? <p className="text-xs text-danger">{localErr}</p> : null}
          <div className="rounded-md border border-border bg-surface-muted/40 px-3 py-2 text-xs text-ink-muted">
            <p className="font-medium text-ink">Taksit #{taksit.taksitNo}</p>
            {ozetQuery.isLoading ? (
              <p className="mt-1.5">Kanonik kalan tutar yükleniyor…</p>
            ) : (
              <div className="mt-1.5 grid gap-1 sm:grid-cols-3">
                <p>
                  Taksit tutarı:{' '}
                  <strong className="tabular-nums text-ink">
                    {formatMoneyFixed2(taksitStr, alacakParaBirimi)}
                  </strong>
                </p>
                <p>
                  Şimdiye kadar ödenen:{' '}
                  <strong className="tabular-nums text-ink">
                    {formatMoneyFixed2(odenenStr, alacakParaBirimi)}
                  </strong>
                </p>
                <p>
                  Kalan borç:{' '}
                  <strong className="tabular-nums text-ink">
                    {formatMoneyFixed2(kalanStr, alacakParaBirimi)}
                  </strong>
                </p>
              </div>
            )}
            <p className="mt-1.5">Kısmi ödeme girebilirsiniz; kalan borç kapanana kadar taksit açık kalır.</p>
          </div>
          <CrossCurrencyPaymentFields
            alacakParaBirimi={alacakParaBirimi}
            mahsupTutar={mahsupTutar}
            onMahsupTutarChange={(v) => {
              setMahsupTutar(v)
              setKurOnay(false)
            }}
            odemeParaBirimi={odemeParaBirimi}
            onOdemeParaBirimiChange={(v) => {
              setOdemeParaBirimi(v)
              setKurOnay(false)
            }}
            kasaTutari={kasaTutari}
            onKasaTutariChange={(v) => {
              setKasaTutari(v)
              setKurOnay(false)
            }}
            odemeTarihi={odemeTarihi}
            onKurMetaChange={setKurMeta}
            maxMahsup={kalanStr}
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!kalanActive || ozetQuery.isFetching}
            onClick={() => setMahsupTutar(moneyInputFromFixed2(kalanStr))}
          >
            Kalanın tamamını al
          </Button>
          {needsKurOnay ? (
            <label className="flex items-start gap-2 text-xs text-ink">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={kurOnay}
                onChange={(e) => setKurOnay(e.target.checked)}
              />
              <span>
                Uygulanacak kur: <strong>{crossPreview.kurOzeti}</strong> — kaydetmeden önce onaylıyorum.
              </span>
            </label>
          ) : null}
          <Input label="Tarih" type="date" value={odemeTarihi} onChange={(ev) => setOdemeTarihi(ev.target.value)} />
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">Ödeme yöntemi</label>
            <select className={selectClassName()} value={odeme} onChange={(e) => setOdeme(e.target.value as OdemeYontemiApi)}>
              {ODEME_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <TahsilatiYapanPersonelSelect value={tahsilatiYapanPersonelId} onChange={setTahsilatiYapanPersonelId} />
          <Input label="Açıklama / not" value={aciklama} onChange={(ev) => setAciklama(ev.target.value)} />
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={loading || ozetQuery.isFetching}>
              {loading ? 'Kaydediliyor…' : 'Ödemeyi Kaydet'}
            </Button>
          </div>
        </form>
      </ModalPanel>
    </ModalScrim>
  )
}

function ModalPanel(props: { title: string; onClose: () => void; children: ReactNode }): ReactElement {
  return (
    <div className="w-full max-w-xl rounded-xl border border-border bg-panel p-5 shadow-xl">
      <div className="mb-4 flex items-start justify-between gap-2">
        <h2 className="text-base font-bold text-ink">{props.title}</h2>
        <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0" onClick={props.onClose}>
          ✕
        </Button>
      </div>
      {props.children}
    </div>
  )
}
