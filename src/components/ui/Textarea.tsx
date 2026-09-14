import type { ReactElement, TextareaHTMLAttributes } from 'react'
import { forwardRef } from 'react'
import { cn } from '../../lib/cn'
import { formControlErrorClass, uiType } from '../../lib/uiDensity'

export type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label?: string
  hint?: string
  error?: string
  className?: string
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { label, hint, error, className, id, rows = 2, ...rest },
  ref
): ReactElement {
  const inputId = id ?? rest.name
  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={inputId} className={uiType.label}>
          {label}
        </label>
      ) : null}
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={cn(
          'w-full rounded-md border border-border bg-white px-2.5 py-2 text-[11px] text-ink shadow-inner outline-none transition',
          'placeholder:text-ink-subtle focus:border-primary focus:ring-2 focus:ring-primary/15',
          'dark:bg-surface-elevated',
          error && formControlErrorClass,
          className
        )}
        {...rest}
      />
      {error ? <p className={cn(uiType.hint, 'text-danger')}>{error}</p> : null}
      {!error && hint ? <p className={uiType.hint}>{hint}</p> : null}
    </div>
  )
})
