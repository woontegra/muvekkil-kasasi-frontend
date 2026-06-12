import type { ReactElement, SelectHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { cn } from '../../lib/cn'

export type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label?: string
  hint?: string
  error?: string
  className?: string
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, hint, error, className, id, children, ...rest },
  ref
): ReactElement {
  const sid = id ?? rest.name
  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={sid} className="mb-1 block text-xs font-semibold text-ink-muted">
          {label}
        </label>
      ) : null}
      <select
        ref={ref}
        id={sid}
        className={cn(
          'h-9 w-full rounded-md border bg-white px-2.5 text-sm text-ink shadow-inner outline-none transition',
          'border-border focus:border-primary focus:ring-2 focus:ring-primary/15',
          error && 'border-danger',
          className
        )}
        {...rest}
      >
        {children}
      </select>
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
      {!error && hint ? <p className="mt-1 text-xs text-ink-subtle">{hint}</p> : null}
    </div>
  )
})
