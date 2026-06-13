import type { ReactElement, ReactNode } from 'react'
import { cn } from '../../lib/cn'

const box = {
  info: 'border-primary/25 bg-primary-soft text-ink',
  success: 'border-success/25 bg-success-soft text-success-ink',
  warning: 'border-warning/30 bg-warning-soft text-warning-ink',
  danger: 'border-danger/25 bg-danger-soft text-danger'
} as const

export type AlertBoxProps = {
  title?: string
  children: ReactNode
  variant?: keyof typeof box
  className?: string
}

export function AlertBox({ title, children, variant = 'info', className }: AlertBoxProps): ReactElement {
  return (
    <div
      role="status"
      className={cn('rounded-lg border px-3 py-2.5 text-sm shadow-inner', box[variant], className)}
    >
      {title ? <p className="font-bold">{title}</p> : null}
      <div className={cn(title && 'mt-1')}>{children}</div>
    </div>
  )
}
