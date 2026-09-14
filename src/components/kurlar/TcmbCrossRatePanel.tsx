import type { ReactElement } from 'react'
import type { CrossCurrencyTcmbState } from '../../hooks/useCrossCurrencyTcmb'
import { formatKurOzeti, type ParaBirimi } from '../../utils/paraBirimi'
import { formatDateTR, formatTcmbRateDisplay } from '../../utils/tcmbFormat'
import { Button, Input } from '../ui'

type Props = {
  bazParaBirimi: ParaBirimi
  karsiParaBirimi: ParaBirimi
  state: CrossCurrencyTcmbState
  onTcmbKullanChange: (value: boolean) => void
  onUygulanacakKurChange: (value: string) => void
  onUseTcmbClick?: () => void
  disabled?: boolean
}

export function TcmbCrossRatePanel(props: Props): ReactElement {
  const {
    bazParaBirimi,
    karsiParaBirimi,
    state,
    onTcmbKullanChange,
    onUygulanacakKurChange,
    onUseTcmbClick,
    disabled
  } = props

  if (state.tcmbLoading) {
    return <p className="text-xs text-ink-muted">TCMB referans kuru yükleniyor…</p>
  }

  return (
    <div className="space-y-2 rounded-md border border-sky-300/60 bg-sky-50/80 px-2.5 py-2.5 dark:border-sky-900/50 dark:bg-sky-950/30">
      {state.tcmbUnavailable ? (
        <p className="text-xs font-medium text-amber-900 dark:text-amber-100">{state.tcmbMessage}</p>
      ) : null}
      {!state.tcmbUnavailable && state.tcmbReferansKur ? (
        <p className="text-xs text-sky-950 dark:text-sky-100">
          TCMB referans kuru:{' '}
          <strong className="tabular-nums">
            {formatKurOzeti(bazParaBirimi, karsiParaBirimi, state.tcmbReferansKur)}
          </strong>
          {state.tcmbStale ? (
            <span className="ml-1 font-medium text-amber-800">(son alınan kur)</span>
          ) : null}
        </p>
      ) : null}
      {state.tcmbKurTarihi ? (
        <p className="text-xs text-sky-900/80 dark:text-sky-200/80">
          Kur tarihi: <strong>{formatDateTR(state.tcmbKurTarihi)}</strong>
        </p>
      ) : null}
      <Input
        label="Uygulanacak kur"
        value={state.uygulanacakKur}
        onChange={(e) => onUygulanacakKurChange(e.target.value)}
        disabled={disabled}
        hint={`1 ${bazParaBirimi} = … ${karsiParaBirimi}`}
      />
      {!state.tcmbUnavailable && state.tcmbReferansKur ? (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            disabled={disabled}
            onClick={() => {
              onTcmbKullanChange(true)
              onUseTcmbClick?.()
            }}
          >
            TCMB kurunu kullan
            <span className="ml-1 tabular-nums text-ink-muted">
              ({formatTcmbRateDisplay(state.tcmbReferansKur)})
            </span>
          </Button>
          <label className="flex items-center gap-1.5 text-[11px] text-ink-muted">
            <input
              type="checkbox"
              checked={state.tcmbKullan}
              disabled={disabled}
              onChange={(e) => onTcmbKullanChange(e.target.checked)}
            />
            Otomatik uygula
          </label>
        </div>
      ) : null}
    </div>
  )
}
