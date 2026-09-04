import type { ReactElement, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type PageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps): ReactElement {
  return (
    <div className={cn('mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between', className)}>
      <div className="min-w-0 space-y-1">
        <h1 className="text-lg font-bold tracking-tight text-ink md:text-xl">{title}</h1>
        {description ? <p className="max-w-3xl text-sm text-ink-muted">{description}</p> : null}
      </div>
      {actions ? (
        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-shrink-0 sm:flex-row sm:flex-wrap sm:items-center">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
