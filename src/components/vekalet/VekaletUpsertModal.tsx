import { useState, type ReactElement } from 'react'
import { AlertBox, Button, MoneyInput, useConfirm } from '../ui'
import { ParaBirimiSelect } from '../paraBirimi/ParaBirimiSelect'
import {
  buildVekaletParaBirimiDegisimOnayMesaji,
  seedVekaletUpsertForm,
  shouldConfirmVekaletParaBirimiDegisimi,
  VEKALET_CURRENCY_CHANGE_FORBIDDEN_MESSAGE,
  type VekaletUpsertMode
} from '../../lib/vekaletParaBirimi'
import {
  formatCurrencyInputTR,
  moneyInputFromAmount,
  parsePosTutar,
  type ParaBirimi
} from '../../utils/formatters'
import type { UpsertVekaletPayload } from '../../types/vekalet'
import { cn } from '../../lib/cn'
import { DraggablePanel } from '../ui/DraggablePanel'

export type VekaletUpsertModalProps = {
  mode: VekaletUpsertMode
  persistedVekaletUcretiId: string | null
  initialParaBirimi: ParaBirimi
  /** Backend snapshot tutarı — onay metnindeki “Eski” değeri */
  snapshotToplam: number
  initialToplam: string
  initialAciklama: string
  hasTahsilat: boolean
  loading: boolean
  error: string | null
  onClose: () => void
  onSubmit: (body: UpsertVekaletPayload) => void
}

function initialMoneyField(mode: VekaletUpsertMode, raw: string): string {
  if (mode === 'create' || mode === 'initialize') return moneyInputFromAmount(raw)
  const normalized = String(raw).trim()
  if (normalized === '' || normalized === '0' || normalized === '0.00' || normalized === '0,00') {
    return formatCurrencyInputTR(0)
  }
  return moneyInputFromAmount(normalized) || formatCurrencyInputTR(0)
}

export function VekaletUpsertModal(props: VekaletUpsertModalProps): ReactElement {
  const {
    mode,
    persistedVekaletUcretiId,
    initialParaBirimi,
    snapshotToplam,
    initialToplam,
    initialAciklama,
    hasTahsilat,
    loading,
    error,
    onClose,
    onSubmit
  } = props
  const { confirm } = useConfirm()
  const [toplam, setToplam] = useState(() => initialMoneyField(mode, initialToplam))
  const [paraBirimi, setParaBirimi] = useState<ParaBirimi>(initialParaBirimi)
  const [aciklama, setAciklama] = useState(initialAciklama ?? '')
  const [localErr, setLocalErr] = useState<string | null>(null)
  const isFirstTimeSetup = mode === 'create' || mode === 'initialize'
  const currencyLocked = mode === 'edit' && Boolean(persistedVekaletUcretiId) && hasTahsilat

  const submit = (): void => {
    void (async () => {
      setLocalErr(null)
      const n = parsePosTutar(toplam)
      if (n == null) {
        setLocalErr('Geçerli pozitif toplam tutar girin.')
        return
      }
      if (
        shouldConfirmVekaletParaBirimiDegisimi({
          mode,
          persistedVekaletUcretiId,
          persistedParaBirimi: initialParaBirimi,
          selectedParaBirimi: paraBirimi
        })
      ) {
        if (currencyLocked) {
          setLocalErr(VEKALET_CURRENCY_CHANGE_FORBIDDEN_MESSAGE)
          return
        }
        const ok = await confirm({
          title: 'Para birimi değişikliği',
          message: buildVekaletParaBirimiDegisimOnayMesaji({
            eskiTutar: snapshotToplam,
            eskiParaBirimi: initialParaBirimi,
            yeniTutar: n,
            yeniParaBirimi: paraBirimi
          }),
          confirmLabel: 'Değiştir'
        })
        if (!ok) return
      }
      onSubmit({ toplamTutar: n, paraBirimi, aciklama: aciklama.trim() || null })
    })()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]"
      data-testid="vekalet-upsert-modal"
      data-mode={mode}
    >
      <DraggablePanel
        role="dialog"
        aria-modal="true"
        aria-label="Vekalet ücreti"
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-white p-5 shadow-xl dark:bg-surface-elevated"
      >
        <div data-modal-drag-handle className="mb-4 flex items-start justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-ink">Vekalet ücreti</h2>
            <p className="mt-0.5 text-[11px] text-ink-muted">
              {isFirstTimeSetup
                ? 'Vekalet ücreti ekle — para birimi seçimi onay gerektirmez.'
                : `Kayıtlı vekalet düzenleniyor (${initialParaBirimi})`}
            </p>
          </div>
          <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0" onClick={onClose}>
            ✕
          </Button>
        </div>
        <div className="space-y-3">
          {error ? <AlertBox variant="danger" title="Hata">{error}</AlertBox> : null}
          {localErr ? <p className="text-xs text-danger">{localErr}</p> : null}
          <ParaBirimiSelect
            label="Para birimi"
            value={paraBirimi}
            onChange={setParaBirimi}
            disabled={loading || currencyLocked}
          />
          {currencyLocked ? (
            <p className="text-[11px] text-ink-muted">{VEKALET_CURRENCY_CHANGE_FORBIDDEN_MESSAGE}</p>
          ) : null}
          <MoneyInput
            label={`Toplam tutar (${paraBirimi})`}
            aria-label={`Toplam tutar (${paraBirimi})`}
            value={toplam}
            onChange={setToplam}
          />
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">Açıklama</label>
            <textarea
              className="min-h-[88px] w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink shadow-inner outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-surface-elevated"
              value={aciklama}
              onChange={(e) => setAciklama(e.target.value)}
              placeholder="İsteğe bağlı"
            />
          </div>
          <div className={cn('flex justify-end gap-2 pt-2')}>
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Vazgeç
            </Button>
            <Button type="button" onClick={submit} disabled={loading}>
              {loading ? 'Kaydediliyor…' : 'Kaydet'}
            </Button>
          </div>
        </div>
      </DraggablePanel>
    </div>
  )
}

/** Parent (DosyaDetailPage) ile aynı açılış sözleşmesi — integration test için. */
export function buildVekaletUpsertModalPropsFromDosya(input: {
  mode: VekaletUpsertMode
  persistedVekaletUcretiId: string | null
  vekaletUcreti:
    | {
        paraBirimi?: string | null
        toplamTutar?: string | number | null
        aciklama?: string | null
      }
    | null
    | undefined
  hasTahsilat: boolean
  loading?: boolean
  error?: string | null
  onClose: () => void
  onSubmit: (body: UpsertVekaletPayload) => void
}): VekaletUpsertModalProps {
  const seed = seedVekaletUpsertForm({ mode: input.mode, record: input.vekaletUcreti })
  return {
    mode: input.mode,
    persistedVekaletUcretiId:
      input.mode === 'create' ? null : input.persistedVekaletUcretiId,
    initialParaBirimi: seed.paraBirimi,
    snapshotToplam: seed.snapshotToplam,
    initialToplam: seed.toplamTutar,
    initialAciklama: seed.aciklama,
    hasTahsilat: input.hasTahsilat,
    loading: input.loading ?? false,
    error: input.error ?? null,
    onClose: input.onClose,
    onSubmit: input.onSubmit
  }
}
