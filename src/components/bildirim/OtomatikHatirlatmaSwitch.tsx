import type { ReactElement } from 'react'
import { cn } from '../../lib/cn'

type Props = {
  id: string
  label: string
  description?: string
  checked: boolean
  disabled?: boolean
  onChange: (next: boolean) => void
  warning?: string | null
  stateText?: { on: string; off: string }
}

/** Anlaşılır bildirim anahtarı — teknik alan adı göstermez. */
export function OtomatikHatirlatmaSwitch(props: Props): ReactElement {
  const { id, label, description, checked, disabled, onChange, warning, stateText } = props
  const statusText = checked ? (stateText?.on ?? 'Açık') : (stateText?.off ?? 'Kapalı')
  return (
    <div className="space-y-1.5">
      <div
        className={cn(
          'flex items-start justify-between gap-3 rounded-lg border border-border px-3 py-2.5',
          disabled && 'opacity-60'
        )}
      >
        <label htmlFor={id} className={cn('min-w-0 space-y-0.5', !disabled && 'cursor-pointer')}>
          <span className="block text-sm font-medium text-ink">
            {label}
            <span className={cn('ml-2 text-xs font-semibold', checked ? 'text-emerald-700' : 'text-ink-muted')}>
              {statusText}
            </span>
          </span>
          {description ? (
            <span className="block text-xs leading-relaxed text-ink-muted">{description}</span>
          ) : null}
        </label>
        <button
          type="button"
          id={id}
          role="switch"
          aria-checked={checked}
          aria-label={label}
          disabled={disabled}
          onClick={() => onChange(!checked)}
          className={cn(
            'relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full border transition',
            checked
              ? 'border-primary bg-primary'
              : 'border-border bg-surface-muted',
            disabled ? 'cursor-not-allowed' : 'cursor-pointer'
          )}
        >
          <span
            className={cn(
              'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition',
              checked ? 'translate-x-5' : 'translate-x-0.5'
            )}
          />
        </button>
      </div>
      {warning ? <p className="px-1 text-xs leading-relaxed text-amber-700 dark:text-amber-400">{warning}</p> : null}
    </div>
  )
}
