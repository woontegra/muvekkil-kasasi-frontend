import type { ReactElement, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type MobileRecordField = {
  label: string
  value: ReactNode
  /** Sağ hizalı sayısal değer */
  numeric?: boolean
  /** Tam genişlik (açıklama vb.) */
  full?: boolean
}

export type MobileRecordCardProps = {
  title: ReactNode
  subtitle?: ReactNode
  badge?: ReactNode
  fields?: MobileRecordField[]
  footer?: ReactNode
  actions?: ReactNode
  onClick?: () => void
  className?: string
}

/** Mobil liste kaydı — masaüstü tablo satırının kart karşılığı. */
export function MobileRecordCard({
  title,
  subtitle,
  badge,
  fields,
  footer,
  actions,
  onClick,
  className
}: MobileRecordCardProps): ReactElement {
  const interactive = typeof onClick === 'function'
  const Wrapper = interactive ? 'button' : 'div'

  return (
    <Wrapper
      type={interactive ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'w-full rounded-xl border border-border bg-panel p-3.5 text-left shadow-sm',
        interactive &&
          'transition hover:border-primary/40 hover:bg-primary-soft/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="break-words text-sm font-bold leading-snug text-ink [overflow-wrap:anywhere]">{title}</div>
          {subtitle ? (
            <div className="mt-0.5 break-words text-xs text-ink-muted [overflow-wrap:anywhere]">{subtitle}</div>
          ) : null}
        </div>
        {badge ? <div className="shrink-0">{badge}</div> : null}
      </div>

      {fields && fields.length > 0 ? (
        <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2">
          {fields.map((f, i) => (
            <div key={`${f.label}-${i}`} className={cn(f.full && 'col-span-2')}>
              <dt className="text-[10px] font-semibold uppercase tracking-wide text-ink-subtle">{f.label}</dt>
              <dd
                className={cn(
                  'mt-0.5 break-words text-sm text-ink [overflow-wrap:anywhere]',
                  f.numeric && 'tabular-nums font-semibold'
                )}
              >
                {f.value}
              </dd>
            </div>
          ))}
        </dl>
      ) : null}

      {footer ? <div className="mt-3 border-t border-border/70 pt-2.5 text-xs text-ink-muted">{footer}</div> : null}

      {actions ? <div className="mt-3 border-t border-border/70 pt-3">{actions}</div> : null}
    </Wrapper>
  )
}
