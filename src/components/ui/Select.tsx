import type { ReactElement, SelectHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { cn } from '../../lib/cn'
import { formControlClass, formControlErrorClass, uiType } from '../../lib/uiDensity'

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
        <label htmlFor={sid} className={uiType.label}>
          {label}
        </label>
      ) : null}
      <select
        ref={ref}
        id={sid}
        className={cn(formControlClass, error && formControlErrorClass, className)}
        {...rest}
      >
        {children}
      </select>
      {error ? <p className={cn(uiType.hint, 'text-danger')}>{error}</p> : null}
      {!error && hint ? <p className={uiType.hint}>{hint}</p> : null}
    </div>
  )
})
