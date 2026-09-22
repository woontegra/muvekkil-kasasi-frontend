import type { ReactElement, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { formControlClass, uiType } from '../../lib/uiDensity'

export const RANDEVU_DETAIL_MODAL_WIDTH =
  '!w-[min(37.5rem,calc(100vw-2rem))] !max-w-[min(37.5rem,calc(100vw-2rem))] max-md:!w-full max-md:!max-w-none'

/**
 * ModalScrim varsayılanı `w-full max-w-2xl` + `max-w-full` çakışması ekranı dolduruyordu.
 * Form paneli `!` ile sabit kompakt genişlikte kilitlenir (≈56rem / 896px).
 */
export const RANDEVU_FORM_MODAL_WIDTH =
  '!w-[min(56rem,calc(100vw-2rem))] !max-w-[min(56rem,calc(100vw-2rem))] max-md:!w-full max-md:!max-w-none'

export function RandevuModalPanel({
  children,
  className,
  'data-testid': dataTestId
}: {
  children: ReactNode
  className?: string
  'data-testid'?: string
}): ReactElement {
  return (
    <div
      data-testid={dataTestId}
      className={cn(
        'w-full overflow-hidden rounded-xl border border-border/80 bg-panel shadow-xl ring-1 ring-ink/[0.03]',
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
  meta,
  compact
}: {
  title: string
  subtitle?: string
  meta?: ReactNode
  /** Form modalları için daha az dikey boşluk */
  compact?: boolean
}): ReactElement {
  return (
    <div
      className={cn(
        'border-b border-border/70 bg-gradient-to-br from-surface-muted/50 via-panel to-panel',
        compact ? 'px-4 py-3 md:px-5' : 'px-6 py-5'
      )}
    >
      <h2 className={cn(uiType.sectionTitle, !compact && 'md:text-[15px]')}>{title}</h2>
      {subtitle ? <p className={cn(uiType.helper, 'mt-0.5')}>{subtitle}</p> : null}
      {meta ? <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">{meta}</div> : null}
    </div>
  )
}

export function RandevuModalMetaItem({ icon, children }: { icon: ReactNode; children: ReactNode }): ReactElement {
  return (
    <span className={cn('inline-flex items-center gap-1.5 text-ink-muted', uiType.helper)}>
      <span className="text-primary/80" aria-hidden>
        {icon}
      </span>
      <span>{children}</span>
    </span>
  )
}

export function RandevuModalBody({
  children,
  className,
  compact
}: {
  children: ReactNode
  className?: string
  compact?: boolean
}): ReactElement {
  return (
    <div className={cn(compact ? 'px-4 py-3 md:px-5 md:py-3.5' : 'px-6 py-5', className)}>{children}</div>
  )
}

export function RandevuModalFooter({
  left,
  right,
  compact
}: {
  left?: ReactNode
  right: ReactNode
  compact?: boolean
}): ReactElement {
  return (
    <div
      className={cn(
        'flex flex-col-reverse gap-2 border-t border-border/70 bg-surface-muted/15 sm:flex-row sm:items-center',
        left ? 'sm:justify-between' : 'sm:justify-end',
        compact ? 'px-4 py-2.5 md:px-5' : 'px-6 py-4'
      )}
    >
      {left ? <div className="flex flex-col gap-2 sm:flex-row">{left}</div> : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">{right}</div>
    </div>
  )
}

export function RandevuDetailField({ label, children }: { label: string; children: ReactNode }): ReactElement {
  return (
    <div>
      <p className={uiType.cardLabel}>{label}</p>
      <div className={cn('mt-1 font-medium leading-snug text-ink', uiType.body)}>{children}</div>
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
    <div className="min-w-0">
      <label className={uiType.label}>
        {label}
        {required ? ' *' : ''}
      </label>
      {children}
    </div>
  )
}

/** Ortak form kontrol yüksekliği (Input ile aynı aile). */
export const randevuFormSelectClass = formControlClass

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
