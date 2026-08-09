import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react'
import { cn } from '../../lib/cn'

const chipBase =
  'relative inline-flex h-8 shrink-0 items-center justify-center rounded-md border px-3 text-xs font-semibold leading-none transition-colors'

export type TopbarActionChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'default' | 'muted' | 'danger'
  badge?: number
  children: ReactNode
  className?: string
}

export function TopbarActionChip({
  variant = 'default',
  badge,
  children,
  className,
  type = 'button',
  ...rest
}: TopbarActionChipProps): ReactElement {
  return (
    <button
      type={type}
      className={cn(
        chipBase,
        variant === 'default' && 'border-border bg-white text-ink hover:bg-surface-muted',
        variant === 'muted' && 'border-border bg-surface-muted text-ink-muted',
        variant === 'danger' && 'border-danger/30 bg-danger/5 text-danger hover:bg-danger/10',
        className
      )}
      {...rest}
    >
      {children}
      {badge != null && badge > 0 ? (
        <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
          {badge}
        </span>
      ) : null}
    </button>
  )
}

export type TopbarStatusChipProps = {
  children: ReactNode
  className?: string
}

/** Rol göstergesi — butonlarla aynı ölçü sistemi (yükseklik, radius, border). */
export function TopbarStatusChip({ children, className }: TopbarStatusChipProps): ReactElement {
  return (
    <span
      className={cn(
        chipBase,
        'cursor-default border-border bg-surface-muted text-ink-muted',
        className
      )}
    >
      {children}
    </span>
  )
}
