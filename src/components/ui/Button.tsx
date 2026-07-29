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
  /** true iken spinner + disabled */
  loading?: boolean
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  type = 'button',
  disabled,
  loading,
  children,
  ...rest
}: ButtonProps): ReactElement {
  const isDisabled = disabled || loading
  return (
    <button
      type={type}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      className={cn(
        'inline-flex items-center justify-center font-semibold select-none',
        'transition-[transform,background-color,box-shadow,opacity,filter] duration-150 ease-out',
        'hover:-translate-y-px active:translate-y-0 active:scale-[0.98]',
        'motion-reduce:transition-none motion-reduce:hover:translate-y-0 motion-reduce:active:scale-100',
        'disabled:opacity-50 disabled:pointer-events-none disabled:hover:translate-y-0',
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    >
      {loading ? (
        <>
          <span
            className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent"
            aria-hidden
          />
          <span>{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}
