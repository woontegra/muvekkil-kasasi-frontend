import type { ReactElement, ReactNode } from 'react'
import { cn } from '../../../lib/cn'

type ChoiceRowProps = {
  title: string
  description?: string
  selected?: boolean
  onClick: () => void
  icon?: ReactNode
  'data-testid'?: string
}

/** Kompakt seçim satırı — kart grid değil. */
export function ChoiceRow(props: ChoiceRowProps): ReactElement {
  const { title, description, selected, onClick, icon } = props
  return (
    <button
      type="button"
      data-testid={props['data-testid']}
      onClick={onClick}
      className={cn(
        'flex w-full items-start gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors duration-200 ease-premium',
        selected
          ? 'border-primary/40 bg-primary/5 ring-1 ring-primary/20'
          : 'border-border bg-white hover:border-primary/30 hover:bg-slate-50/80'
      )}
    >
      {icon ? (
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-surface-muted text-sm text-ink-muted">
          {icon}
        </span>
      ) : null}
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-ink">{title}</span>
        {description ? <span className="mt-0.5 block text-xs text-ink-muted">{description}</span> : null}
      </span>
      <span
        className={cn(
          'mt-1 h-3.5 w-3.5 shrink-0 rounded-full border',
          selected ? 'border-primary bg-primary' : 'border-border bg-white'
        )}
        aria-hidden
      />
    </button>
  )
}

export function SafetyNotice(): ReactElement {
  return (
    <div
      className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2.5 text-xs leading-relaxed text-amber-950"
      role="note"
    >
      <p className="font-semibold text-amber-900">Önemli</p>
      <p className="mt-1">
        WhatsApp hesabınızı silmeyin ve telefon numaranızın mevcut bağlantısını kaldırmayın. Önce WhatsApp
        Business geçiş adımlarını tamamlayın.
      </p>
    </div>
  )
}
