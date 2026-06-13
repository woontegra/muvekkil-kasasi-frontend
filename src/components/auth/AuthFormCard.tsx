import type { ReactElement, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type AuthFormCardIcon = 'lock' | 'building' | 'mail' | 'key'

const ICONS: Record<AuthFormCardIcon, ReactElement> = {
  lock: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  building: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M3 21h18" />
      <path d="M5 21V7l8-4v18" />
      <path d="M19 21V11l-6-4" />
      <path d="M9 9v0" />
      <path d="M9 12v0" />
      <path d="M9 15v0" />
      <path d="M9 18v0" />
    </svg>
  ),
  mail: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  key: (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
    </svg>
  )
}

export type AuthFormCardProps = {
  title: string
  subtitle?: string
  icon: AuthFormCardIcon
  children: ReactNode
  /** Alt bağlantılar / ek bilgi */
  footer?: ReactNode
  className?: string
  /** Uzun formlar (ör. büro kaydı) için daha geniş kart */
  wide?: boolean
}

export function AuthFormCard({ title, subtitle, icon, children, footer, className, wide }: AuthFormCardProps): ReactElement {
  return (
    <div
      className={cn(
        wide
          ? 'max-w-[40rem] sm:max-w-[42rem] xl:max-w-[44rem]'
          : 'max-w-[28rem] sm:max-w-[30rem] xl:max-w-[31rem]',
        'w-full rounded-2xl border border-slate-300/40 bg-white/80 px-7 py-7 shadow-auth-card backdrop-blur-xl sm:px-8 sm:py-8',
        'animate-authCardIn',
        className
      )}
    >
      <div
        className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl border border-primary/25 text-primary shadow-[0_2px_10px_rgba(37,99,235,0.12)]"
        style={{
          background: 'linear-gradient(180deg, rgba(219, 234, 254, 0.95) 0%, rgba(255, 255, 255, 0.92) 100%)'
        }}
      >
        {ICONS[icon]}
      </div>
      <h2 className="text-center text-xl font-extrabold tracking-tight text-ink sm:text-[1.35rem]">{title}</h2>
      {subtitle ? <p className="mt-2 text-center text-[0.95rem] leading-relaxed text-ink-muted">{subtitle}</p> : null}
      <div className="mt-6 space-y-4">{children}</div>
      {footer ? <div className="mt-6 border-t border-border pt-5">{footer}</div> : null}
    </div>
  )
}
