import type { ReactElement, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export const RANDEVU_DETAIL_MODAL_WIDTH = 'w-[min(600px,calc(100vw-2rem))] max-w-full'
export const RANDEVU_FORM_MODAL_WIDTH = 'w-[min(680px,calc(100vw-1.5rem))] max-w-full'

export function RandevuModalPanel({
  children,
  className
}: {
  children: ReactNode
  className?: string
}): ReactElement {
  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-2xl border border-border/80 bg-panel shadow-xl ring-1 ring-ink/[0.03]',
        className
      )}
    >
      {children}
    </div>
  )
}

export function RandevuModalHeader({
  title,
  subtitle,
  meta
}: {
  title: string
  subtitle?: string
  meta?: ReactNode
}): ReactElement {
  return (
    <div className="border-b border-border/70 bg-gradient-to-br from-surface-muted/50 via-panel to-panel px-6 py-5">
      <h2 className="text-[1.05rem] font-bold tracking-tight text-ink md:text-lg">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm leading-snug text-ink-muted">{subtitle}</p> : null}
      {meta ? <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5">{meta}</div> : null}
    </div>
  )
}

export function RandevuModalMetaItem({ icon, children }: { icon: ReactNode; children: ReactNode }): ReactElement {
  return (
    <span className="inline-flex items-center gap-1.5 text-sm text-ink-muted">
      <span className="text-primary/80" aria-hidden>
        {icon}
      </span>
      <span>{children}</span>
    </span>
  )
}

export function RandevuModalBody({ children, className }: { children: ReactNode; className?: string }): ReactElement {
  return <div className={cn('px-6 py-5', className)}>{children}</div>
}

export function RandevuModalFooter({
  left,
  right
}: {
  left?: ReactNode
  right: ReactNode
}): ReactElement {
  return (
    <div className="flex flex-col-reverse gap-2 border-t border-border/70 bg-surface-muted/15 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex flex-col gap-2 sm:flex-row">{left}</div>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">{right}</div>
    </div>
  )
}

export function RandevuDetailField({ label, children }: { label: string; children: ReactNode }): ReactElement {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">{label}</p>
      <div className="mt-1.5 text-sm font-medium leading-snug text-ink">{children}</div>
    </div>
  )
}

export function RandevuFormField({
  label,
  required,
  children
}: {
  label: string
  required?: boolean
  children: ReactNode
}): ReactElement {
  return (
    <div>
      <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
        {label}
        {required ? ' *' : ''}
      </label>
      {children}
    </div>
  )
}

export const randevuFormSelectClass =
  'h-9 w-full rounded-md border border-border bg-white px-3 text-sm shadow-sm transition-colors focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:opacity-50'

export function IconCalendar(): ReactElement {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </svg>
  )
}

export function IconClock(): ReactElement {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  )
}
