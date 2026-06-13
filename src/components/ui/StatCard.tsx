import type { ReactElement, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type StatCardProps = {
  label: string
  value: ReactNode
  sub?: string
  icon?: ReactNode
  className?: string
  /** Tıklanabilir özet kartı (hover, odak halkası). */
  interactive?: boolean
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  /** Alt satır — örn. “Detayları gör”. */
  footerHint?: string
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  className,
  interactive,
  selected,
  disabled,
  onClick,
  footerHint
}: StatCardProps): ReactElement {
  const shellClass = cn(
    'rounded-xl border border-border bg-panel p-3.5 shadow-card',
    'flex gap-3 text-left transition',
    interactive && !disabled && 'cursor-pointer hover:border-primary/35 hover:bg-primary-soft/20 hover:shadow-md',
    selected && 'border-primary/50 bg-primary-soft/25 ring-2 ring-primary/20',
    disabled && interactive && 'cursor-not-allowed opacity-60 hover:border-border hover:bg-panel hover:shadow-card'
  )

  const body = (
    <>
      {icon ? (
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
          {icon}
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">{label}</p>
        <p className="mt-0.5 truncate text-lg font-bold tabular-nums tracking-tight text-ink">{value}</p>
        {sub ? <p className="mt-0.5 text-xs text-ink-subtle">{sub}</p> : null}
        {footerHint && interactive ? (
          <p className="mt-1 text-[11px] font-semibold text-primary underline-offset-2">{footerHint}</p>
        ) : null}
      </div>
    </>
  )

  if (interactive && onClick) {
    return (
      <button
        type="button"
        className={cn(shellClass, 'w-full outline-none focus-visible:ring-2 focus-visible:ring-primary/30', className)}
        onClick={onClick}
        disabled={disabled}
        aria-pressed={selected}
      >
        {body}
      </button>
    )
  }

  return <div className={cn(shellClass, className)}>{body}</div>
}
