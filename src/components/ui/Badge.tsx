import type { ReactElement, ReactNode } from 'react'
import { cn } from '../../lib/cn'

const styles = {
  default: 'bg-surface-muted text-ink-muted border-border',
  primary: 'bg-primary-soft text-primary border-primary/20',
  accent: 'bg-accent-soft text-accent-ink border-accent/25',
  success: 'bg-success-soft text-success-ink border-success/25',
  warning: 'bg-warning-soft text-warning-ink border-warning/30',
  danger: 'bg-danger-soft text-danger border-danger/25'
} as const

export type BadgeProps = {
  children: ReactNode
  variant?: keyof typeof styles
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps): ReactElement {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide',
        styles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
