import type { InputHTMLAttributes, ReactElement } from 'react'
import { forwardRef } from 'react'
import { cn } from '../../lib/cn'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
  error?: string
  className?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, id, placeholder, ...rest },
  ref
): ReactElement {
  const inputId = id ?? rest.name
  const isEmptyDate = rest.type === 'date' && !rest.value
  const datePlaceholder = placeholder || 'Tarih seçin'

  return (
    <div className={cn('w-full', error && 'motion-field-error')}>
      {label ? (
        <label htmlFor={inputId} className="mb-1 block text-xs font-semibold text-ink-muted">
          {label}
        </label>
      ) : null}
      <div className="group relative">
        <input
          ref={ref}
          id={inputId}
          aria-invalid={error ? true : undefined}
          placeholder={rest.type === 'date' ? undefined : placeholder}
          className={cn(
            'h-9 w-full rounded-md border bg-white px-3 text-sm text-ink shadow-inner outline-none transition',
            'border-border placeholder:text-ink-subtle focus:border-primary focus:ring-2 focus:ring-primary/15',
            error && 'border-danger focus:border-danger focus:ring-danger/20',
            isEmptyDate && '[&:not(:focus)::-webkit-datetime-edit]:text-transparent',
            className
          )}
          {...rest}
        />
        {isEmptyDate ? (
          <span
            aria-hidden
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-subtle group-focus-within:hidden"
          >
            {datePlaceholder}
          </span>
        ) : null}
      </div>
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
      {!error && hint ? <p className="mt-1 text-xs text-ink-subtle">{hint}</p> : null}
    </div>
  )
})
