import type { InputHTMLAttributes, ReactElement } from 'react'
import { forwardRef } from 'react'
import { cn } from '../../lib/cn'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
  error?: string
  className?: string
}

/**
 * Tarih inputlarında özel placeholder katmanı kullanılmaz.
 * Chrome (tr) boş `type="date"` alanında zaten "gg.aa.yyyy" gösterir;
 * üzerine "Tarih seçin" + text-transparent hack'i bazı cihazlarda
 * çift/bulanık metin (ghosting) üretir.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, id, placeholder, ...rest },
  ref
): ReactElement {
  const inputId = id ?? rest.name
  const isDate = rest.type === 'date'

  return (
    <div className={cn('w-full', error && 'motion-field-error')}>
      {label ? (
        <label htmlFor={inputId} className="mb-1 block text-xs font-semibold text-ink-muted">
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        placeholder={isDate ? undefined : placeholder}
        className={cn(
          'h-9 w-full rounded-md border bg-white px-3 text-sm text-ink shadow-inner outline-none transition',
          'border-border placeholder:text-ink-subtle focus:border-primary focus:ring-2 focus:ring-primary/15',
          error && 'border-danger focus:border-danger focus:ring-danger/20',
          isDate && 'min-w-0 appearance-auto',
          className
        )}
        {...rest}
      />
      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
      {!error && hint ? <p className="mt-1 text-xs text-ink-subtle">{hint}</p> : null}
    </div>
  )
})
