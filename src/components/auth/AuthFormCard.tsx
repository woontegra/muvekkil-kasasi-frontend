import type { ReactElement, ReactNode } from 'react'

export type AuthFormCardIcon = 'lock' | 'building' | 'mail' | 'key'

export type AuthFormCardProps = {
  title: string
  subtitle?: string
  icon?: AuthFormCardIcon
  children: ReactNode
  footer?: ReactNode
  className?: string
  wide?: boolean
}

export function AuthFormCard({ title, subtitle, children, footer, className, wide }: AuthFormCardProps): ReactElement {
  return (
    <div className={`pm-auth-card${wide ? ' max-w-none' : ''}${className ? ` ${className}` : ''}`}>
      <h2 className="pm-auth-card-title">{title}</h2>
      {subtitle ? <p className="pm-auth-card-sub">{subtitle}</p> : null}
      <div className="pm-auth-form">{children}</div>
      {footer ? <div className="pm-auth-card-footer">{footer}</div> : null}
    </div>
  )
}
