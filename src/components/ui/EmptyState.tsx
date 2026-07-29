import type { ReactElement, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type EmptyStateProps = {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ title, description, action, className }: EmptyStateProps): ReactElement {
  return (
    <div
      className={cn(
        'motion-fade-in flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-surface-muted/50 px-6 py-10 text-center',
        className
      )}
    >
      <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-panel text-ink-subtle shadow-sm">
        <span className="text-lg leading-none" aria-hidden>
          ···
        </span>
      </div>
      <p className="text-sm font-bold text-ink">{title}</p>
      {description ? <p className="mt-1 max-w-md text-sm text-ink-muted">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}
