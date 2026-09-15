import type { ReactElement } from 'react'
import { cn } from '../../lib/cn'
import { formControlClass, uiType } from '../../lib/uiDensity'
import {
  PARA_BIRIMLERI,
  PARA_BIRIMI_SEMBOL,
  type ParaBirimi
} from '../../utils/paraBirimi'

type Props = {
  value: ParaBirimi
  onChange: (value: ParaBirimi) => void
  label?: string
  disabled?: boolean
  /** Yalnızca TRY seçenekleri (nadir kısıt) */
  tryOnly?: boolean
  className?: string
  size?: 'sm' | 'md'
}

const selectClass = formControlClass

export function ParaBirimiSelect(props: Props): ReactElement {
  const { value, onChange, label, disabled, tryOnly, className, size = 'md' } = props
  const options = tryOnly ? (['TRY'] as const) : PARA_BIRIMLERI

  if (tryOnly) {
    return (
      <div className={className}>
        {label ? <label className={uiType.label}>{label}</label> : null}
        <div
          className={cn(
            selectClass,
            size === 'sm' ? 'inline-flex h-8 items-center' : 'flex h-8 items-center',
            'bg-surface-muted/40 text-ink-muted'
          )}
        >
          TRY {PARA_BIRIMI_SEMBOL.TRY}
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      {label ? <label className={uiType.label}>{label}</label> : null}
      <div
        className={cn(
          'inline-flex rounded-md border border-border bg-surface-muted/30 p-0.5',
          disabled && 'pointer-events-none opacity-60'
        )}
        role="group"
        aria-label={label ?? 'Para birimi'}
      >
        {options.map((pb) => (
          <button
            key={pb}
            type="button"
            disabled={disabled}
            className={cn(
              'rounded px-2 py-1 text-[11px] font-semibold tabular-nums transition',
              size === 'md' && 'min-h-8 min-w-[3rem]',
              value === pb
                ? 'bg-primary text-primary-fg shadow-sm ring-1 ring-primary/40'
                : 'text-ink-muted hover:text-ink'
            )}
            onClick={() => onChange(pb)}
          >
            {pb} {PARA_BIRIMI_SEMBOL[pb]}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Filtre / form select — boş = tümü. */
export function ParaBirimiFilterSelect(props: {
  value: '' | ParaBirimi
  onChange: (value: '' | ParaBirimi) => void
  label?: string
  className?: string
}): ReactElement {
  const { value, onChange, label, className } = props
  return (
    <div className={className}>
      {label ? <label className={uiType.label}>{label}</label> : null}
      <select
        className={cn(formControlClass, 'w-full')}
        value={value}
        onChange={(e) => onChange((e.target.value || '') as '' | ParaBirimi)}
      >
        <option value="">Tüm para birimleri</option>
        {PARA_BIRIMLERI.map((pb) => (
          <option key={pb} value={pb}>
            {pb} {PARA_BIRIMI_SEMBOL[pb]}
          </option>
        ))}
      </select>
    </div>
  )
}
