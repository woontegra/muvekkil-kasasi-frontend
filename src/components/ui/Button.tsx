import type { ButtonHTMLAttributes, ReactElement } from 'react'
import { cn } from '../../lib/cn'

const variants = {
  primary:
    'bg-primary text-primary-fg border border-primary shadow-sm hover:bg-primary-hover focus-visible:ring-2 focus-visible:ring-primary/30',
  secondary:
    'bg-accent text-white border border-accent shadow-sm hover:brightness-95 focus-visible:ring-2 focus-visible:ring-accent/35',
  outline:
    'bg-white text-ink border border-border-strong hover:bg-surface-muted focus-visible:ring-2 focus-visible:ring-primary/25',
  ghost: 'bg-transparent text-ink-muted border border-transparent hover:bg-surface-muted',
  danger:
    'bg-danger text-white border border-danger shadow-sm hover:brightness-95 focus-visible:ring-2 focus-visible:ring-danger/35'
} as const

const sizes = {
  sm: 'h-8 px-3 text-xs rounded-md gap-1.5',
  md: 'h-9 px-3.5 text-sm rounded-md gap-2',
  lg: 'h-10 px-4 text-sm rounded-lg gap-2'
} as const

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
  className?: string
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  disabled,
  ...rest
}: ButtonProps): ReactElement {
  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        'inline-flex items-center justify-center font-semibold transition select-none disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    />
  )
}
