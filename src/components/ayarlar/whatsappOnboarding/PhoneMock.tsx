import type { ReactElement, ReactNode } from 'react'
import { cn } from '../../../lib/cn'

type PhoneMockProps = {
  title?: string
  children: ReactNode
  className?: string
}

/** Sade CSS telefon çerçevesi — gerçek WhatsApp ekran görüntüsü yok. */
export function PhoneMock(props: PhoneMockProps): ReactElement {
  const { title = 'Telefon', children, className } = props
  return (
    <div
      className={cn(
        'mx-auto w-full max-w-[220px] rounded-[1.35rem] border border-border bg-gradient-to-b from-slate-100 to-slate-50 p-2 shadow-sm',
        className
      )}
      aria-hidden
    >
      <div className="mb-1.5 flex justify-center">
        <div className="h-1 w-10 rounded-full bg-slate-300/80" />
      </div>
      <div className="overflow-hidden rounded-[1rem] border border-border/80 bg-white">
        <div className="border-b border-border/70 bg-slate-50 px-2.5 py-1.5 text-center text-[10px] font-semibold tracking-wide text-ink-muted">
          {title}
        </div>
        <div className="space-y-1.5 px-2.5 py-2.5 text-[11px] leading-snug text-ink">{children}</div>
      </div>
    </div>
  )
}

export function PhoneMenuPath(props: { items: string[] }): ReactElement {
  return (
    <ol className="space-y-1">
      {props.items.map((item, i) => (
        <li key={item} className="flex items-center gap-1.5">
          {i > 0 ? <span className="text-ink-subtle">→</span> : null}
          <span
            className={cn(
              'rounded-md px-1.5 py-0.5',
              i === props.items.length - 1
                ? 'bg-primary/10 font-semibold text-primary'
                : 'bg-surface-muted text-ink-muted'
            )}
          >
            {item}
          </span>
        </li>
      ))}
    </ol>
  )
}
