import type { FormEvent, ReactElement, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { TahsilatiYapanPersonelSelect } from '../prim/TahsilatiYapanPersonelSelect'
import { AlertBox, Button, Input, MoneyInput, ModalScrim } from '../ui'
import { resolveTaksitRow } from '../../lib/vekaletTaksitOzet'
import type { CreateVekaletTaksitOdemePayload, VekaletTaksitiDto } from '../../types/vekalet'
import type { OdemeYontemiApi } from '../../types/kasa'
import {
  formatCurrencyInputTR,
  formatCurrencyTR,
  moneyInputFromAmount,
  parsePosTutar
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

export type VekaletTaksitOdemeModalProps = {
  taksit: VekaletTaksitiDto
  onClose: () => void
  loading: boolean
  error: string | null
  onSubmit: (body: CreateVekaletTaksitOdemePayload) => void
}

export function VekaletTaksitOdemeModal(props: VekaletTaksitOdemeModalProps): ReactElement {
  const { taksit, onClose, loading, error, onSubmit } = props
  const resolved = resolveTaksitRow(taksit)
  const kalanNum = Number(resolved.kalanTutar)
  const odenenNum = Number(resolved.odenenToplam)
  const taksitNum = Number(resolved.taksitTutari)
  const [tutar, setTutar] = useState('')
  const [odemeTarihi, setOdemeTarihi] = useState(todayInputDate())
  const [odeme, setOdeme] = useState<OdemeYontemiApi>('NAKIT')
  const [aciklama, setAciklama] = useState('')
  const [tahsilatiYapanPersonelId, setTahsilatiYapanPersonelId] = useState('')
  const [localErr, setLocalErr] = useState<string | null>(null)

  useEffect(() => {
    // Yalnızca taksit değişince varsayılan tutarı doldur; kalan refetch yazmayı ezmesin.
    if (kalanNum > 0) {
      setTutar(moneyInputFromAmount(kalanNum))
    } else {
      setTutar('')
    }
    setOdemeTarihi(todayInputDate())
    setOdeme('NAKIT')
    setAciklama('')
    setLocalErr(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- kalanNum yalnızca açılışta
  }, [taksit.id])

  const submit = (e?: FormEvent): void => {
    e?.preventDefault()
    setLocalErr(null)
    const n = parsePosTutar(tutar)
    if (n == null) {
      setLocalErr("Tutar 0'dan büyük olmalıdır.")
      return
    }
    if (n > kalanNum + 0.0001) {
      setLocalErr('Tutar taksit kalanını aşamaz.')
      return
    }
    onSubmit({
      tutar: n,
      odemeTarihi: `${odemeTarihi}T12:00:00.000Z`,
      odemeYontemi: odeme,
      aciklama: aciklama.trim() || null,
      tahsilatiYapanPersonelId: tahsilatiYapanPersonelId || null
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
            <div className="mt-1.5 grid gap-1 sm:grid-cols-3">
              <p>
                Taksit tutarı: <strong className="tabular-nums text-ink">{formatCurrencyTR(taksitNum)}</strong>
              </p>
              <p>
                Şimdiye kadar ödenen: <strong className="tabular-nums text-ink">{formatCurrencyTR(odenenNum)}</strong>
              </p>
              <p>
                Kalan borç: <strong className="tabular-nums text-ink">{formatCurrencyTR(kalanNum)}</strong>
              </p>
            </div>
            <p className="mt-1.5">Kısmi ödeme girebilirsiniz; kalan borç kapanana kadar taksit açık kalır.</p>
          </div>
          <MoneyInput label="Tahsil edilecek tutar" value={tutar} onChange={setTutar} maxValue={kalanNum} />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={kalanNum <= 0}
            onClick={() => setTutar(formatCurrencyInputTR(kalanNum))}
          >
            Kalanın tamamını al
          </Button>
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
            <Button type="submit" disabled={loading}>
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
