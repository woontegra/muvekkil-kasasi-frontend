import type { InputHTMLAttributes, ReactElement } from 'react'
import { forwardRef } from 'react'
import { cn } from '../../lib/cn'
import { formControlClass, formControlErrorClass, uiType } from '../../lib/uiDensity'

export type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label?: string
  hint?: string
  error?: string
  className?: string
}

/**
 * Tarih inputlarında özel placeholder katmanı kullanılmaz.
 * Chrome (tr) boş `type="date"` alanında zaten "gg.aa.yyyy" gösterir.
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, hint, error, className, id, placeholder, ...rest },
  ref
): ReactElement {
  const inputId = id ?? rest.name
  const isDate = rest.type === 'date'

  return (
    <div className={cn('w-full min-w-0 max-w-full', error && 'motion-field-error')}>
      {label ? (
        <label htmlFor={inputId} className={uiType.label}>
          {label}
        </label>
      ) : null}
      <input
        ref={ref}
        id={inputId}
        aria-invalid={error ? true : undefined}
        placeholder={isDate ? undefined : placeholder}
        className={cn(
          formControlClass,
          error && formControlErrorClass,
          isDate && 'appearance-auto',
          className
        )}
        {...rest}
      />
      {error ? <p className={cn(uiType.hint, 'text-danger')}>{error}</p> : null}
      {!error && hint ? <p className={uiType.hint}>{hint}</p> : null}
    </div>
  )
})
