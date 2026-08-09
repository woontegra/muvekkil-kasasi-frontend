import type { ReactElement, ReactNode } from 'react'

type Props = {
  label: string
  htmlFor: string
  hint?: string
  error?: string | null
  children: ReactNode
}

export function PremiumFormField({ label, htmlFor, hint, error, children }: Props): ReactElement {
  return (
    <div className="pm-form-field">
      <label className="pm-form-label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
      {hint ? <p className="text-xs text-[var(--pm-text-muted)]">{hint}</p> : null}
      {error ? (
        <p className="text-xs text-[#b91c1c]" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
