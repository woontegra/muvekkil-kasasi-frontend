import type { ReactElement } from 'react'
import { cn } from '../../lib/cn'
import { formControlClass, uiType } from '../../lib/uiDensity'
import {
  FINANCE_PERIOD_OPTIONS,
  formatPeriodRangeLabel,
  resolveFinancePeriodRange,
  type FinancePeriodPreset,
  type FinancePeriodRange
} from '../../lib/financePeriodRange'

type Props = {
  value: FinancePeriodRange
  onChange: (next: FinancePeriodRange) => void
  className?: string
  compact?: boolean
}

/** Ortak dönem seçici — kartlar ve tablo aynı aralığı kullanır. */
export function FinancePeriodSelector(props: Props): ReactElement {
  const { value, onChange, className, compact } = props

  return (
    <div
      className={cn('flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end', className)}
      data-testid="finance-period-selector"
    >
      <label className="min-w-0 flex-1 sm:max-w-[14rem]">
        <span className={uiType.label}>Dönem</span>
        <select
          className={formControlClass}
          value={value.preset}
          onChange={(e) => {
            const preset = e.target.value as FinancePeriodPreset
            if (preset === 'CUSTOM') {
              onChange({
                preset: 'CUSTOM',
                bas: value.bas,
                bit: value.bit,
                etiket: 'Özel Tarih'
              })
              return
            }
            onChange(resolveFinancePeriodRange(preset))
          }}
          aria-label="Finansal dönem"
        >
          {FINANCE_PERIOD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
      <label className="min-w-0 sm:w-[9.5rem]">
        <span className={uiType.label}>Başlangıç</span>
        <input
          type="date"
          className={formControlClass}
          value={value.bas ?? ''}
          disabled={value.preset === 'ALL_TIME'}
          onChange={(e) => {
            onChange({
              preset: 'CUSTOM',
              bas: e.target.value || null,
              bit: value.bit,
              etiket: 'Özel Tarih'
            })
          }}
        />
      </label>
      <label className="min-w-0 sm:w-[9.5rem]">
        <span className={uiType.label}>Bitiş</span>
        <input
          type="date"
          className={formControlClass}
          value={value.bit ?? ''}
          disabled={value.preset === 'ALL_TIME'}
          onChange={(e) => {
            onChange({
              preset: 'CUSTOM',
              bas: value.bas,
              bit: e.target.value || null,
              etiket: 'Özel Tarih'
            })
          }}
        />
      </label>
      {!compact ? (
        <p className={cn(uiType.helper, 'sm:pb-2')} data-testid="finance-period-range-label">
          {formatPeriodRangeLabel(value)}
        </p>
      ) : null}
    </div>
  )
}
