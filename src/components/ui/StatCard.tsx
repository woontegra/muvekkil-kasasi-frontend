import type { ReactElement, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type StatCardProps = {
  label: string
  value: ReactNode
  sub?: string
  icon?: ReactNode
  className?: string
}

export function StatCard({ label, value, sub, icon, className }: StatCardProps): ReactElement {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-panel p-3.5 shadow-card',
        'flex gap-3',
        className
      )}
    >
      {icon ? (
        <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
          {icon}
        </div>
      ) : null}
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wide text-ink-muted">{label}</p>
        <p className="mt-0.5 truncate text-lg font-bold tabular-nums tracking-tight text-ink">{value}</p>
        {sub ? <p className="mt-0.5 text-xs text-ink-subtle">{sub}</p> : null}
      </div>
    </div>
  )
}
