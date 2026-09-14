import type { ReactElement, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { uiType } from '../../lib/uiDensity'

export type PageHeaderProps = {
  title: string
  description?: string
  actions?: ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps): ReactElement {
  return (
    <div className={cn('mb-4 flex flex-col gap-2.5 sm:flex-row sm:flex-wrap sm:items-start sm:justify-between', className)}>
      <div className="min-w-0 space-y-1">
        <h1 className={uiType.pageTitle}>{title}</h1>
        {description ? <p className={cn('max-w-3xl', uiType.pageDesc)}>{description}</p> : null}
      </div>
      {actions ? (
        <div className="flex w-full min-w-0 flex-col gap-2 sm:w-auto sm:flex-shrink-0 sm:flex-row sm:flex-wrap sm:items-center">
          {actions}
        </div>
      ) : null}
    </div>
  )
}
