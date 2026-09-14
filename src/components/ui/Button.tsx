import type { ButtonHTMLAttributes, ReactElement } from 'react'
import { cn } from '../../lib/cn'
import { uiType } from '../../lib/uiDensity'

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

/**
 * sm ≈ 31px — sayfa aksiyonları / filtre Uygula-Sıfırla
 * md ≈ 32px — form birincil (input ile aynı yükseklik ailesi)
 * lg ≈ 36px — nadir vurgulu CTA
 * table ≈ 27px — satır içi Düzeltme/Sil
 */
const sizes = {
  sm: cn('h-[31px] min-h-[31px] gap-1.5 rounded-md px-2.5', uiType.button),
  md: cn('h-8 min-h-8 gap-1.5 rounded-md px-3', uiType.button),
  lg: cn('h-9 min-h-9 gap-2 rounded-md px-3.5 text-[12px] font-semibold'),
  table: cn('h-[27px] min-h-[27px] gap-1 rounded-md px-1.5', uiType.buttonTable)
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
        'inline-flex items-center justify-center select-none',
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
            className="h-3 w-3 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent"
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
