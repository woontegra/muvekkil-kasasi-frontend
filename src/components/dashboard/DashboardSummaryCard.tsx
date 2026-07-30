import type { ButtonHTMLAttributes, HTMLAttributes, KeyboardEvent, ReactElement, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type DashboardSummaryTone = 'default' | 'danger' | 'warning'

export type DashboardSummaryCardProps = {
  title: string
  /** Ana sayı / birincil içerik. */
  value?: ReactNode
  /** Alt açıklama / meta — her kartta aynı baseline’da. */
  meta?: ReactNode
  /** Sağ üst sabit aksiyon/ikon alanı (yüksekliği bozmaz). */
  trailing?: ReactNode
  /** Başlık yanına sığacak küçük rozet (tek satır, taşmaz). */
  titleBadge?: ReactNode
  /** value yerine özel gövde (Hesap Dönemi gibi). */
  children?: ReactNode
  interactive?: boolean
  selected?: boolean
  disabled?: boolean
  tone?: DashboardSummaryTone
  onClick?: () => void
  className?: string
  /** Varsayılan: interactive ise button. Nested kontroller için div kullan. */
  as?: 'button' | 'div'
  'aria-label'?: string
}

const SHELL =
  'motion-card-in relative flex h-full min-h-[9.25rem] w-full flex-col overflow-hidden rounded-xl border bg-panel p-3.5 shadow-card ' +
  'text-left transition-[transform,box-shadow,border-color,background-color] duration-150 ' +
  'motion-reduce:hover:translate-y-0'

function toneBorder(tone: DashboardSummaryTone, selected?: boolean): string {
  if (selected) return 'border-primary/50 bg-primary-soft/25 ring-2 ring-primary/20'
  if (tone === 'danger') return 'border-danger/35'
  if (tone === 'warning') return 'border-warning/35'
  return 'border-border'
}

function toneHover(tone: DashboardSummaryTone, interactive?: boolean, disabled?: boolean): string {
  if (!interactive || disabled) return ''
  if (tone === 'danger') {
    return 'cursor-pointer hover:-translate-y-0.5 hover:border-danger/55 hover:bg-danger/5 hover:shadow-md'
  }
  return 'cursor-pointer hover:-translate-y-0.5 hover:border-primary/35 hover:bg-primary-soft/20 hover:shadow-md'
}

/**
 * Ana sayfa özet kartları için ortak dış iskelet.
 * Grid satırında eşit yükseklik: parent `h-full` + bu kart `h-full min-h-[…]`.
 */
export function DashboardSummaryCard({
  title,
  value,
  meta,
  trailing,
  titleBadge,
  children,
  interactive,
  selected,
  disabled,
  tone = 'default',
  onClick,
  className,
  as,
  'aria-label': ariaLabel
}: DashboardSummaryCardProps): ReactElement {
  const shellClass = cn(
    SHELL,
    toneBorder(tone, selected),
    toneHover(tone, interactive, disabled),
    disabled && interactive && 'cursor-not-allowed opacity-60 hover:translate-y-0 hover:border-border hover:bg-panel hover:shadow-card',
    interactive && 'outline-none focus-visible:ring-2 focus-visible:ring-primary/30',
    className
  )

  const body = (
    <>
      <div className="flex min-h-0 flex-1 gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex h-5 items-center gap-1.5">
            <p className="min-w-0 truncate text-[11px] font-bold uppercase tracking-wide text-ink-muted">{title}</p>
            {titleBadge ? <span className="shrink-0">{titleBadge}</span> : null}
          </div>

          <div className="mt-1.5 flex min-h-[2.75rem] flex-1 flex-col justify-center overflow-hidden">
            {children != null ? (
              children
            ) : typeof value === 'string' || typeof value === 'number' ? (
              <p className="line-clamp-2 text-lg font-bold tabular-nums leading-tight tracking-tight text-ink">{value}</p>
            ) : (
              <div className="line-clamp-2 text-lg font-bold tabular-nums leading-tight tracking-tight text-ink">{value}</div>
            )}
          </div>

          <div className="mt-auto min-h-[2.5rem] overflow-hidden pt-1">
            {meta != null ? (
              typeof meta === 'string' ? (
                <p className="line-clamp-2 text-[10px] leading-snug text-ink-muted">{meta}</p>
              ) : (
                meta
              )
            ) : null}
          </div>
        </div>

        {trailing != null ? (
          <div className="flex h-8 w-8 shrink-0 items-center justify-center self-start">{trailing}</div>
        ) : null}
      </div>
    </>
  )

  const useButton = interactive && onClick && as !== 'div'

  if (useButton) {
    const buttonProps: ButtonHTMLAttributes<HTMLButtonElement> = {
      type: 'button',
      className: shellClass,
      onClick,
      disabled,
      'aria-pressed': selected,
      'aria-label': ariaLabel
    }
    return <button {...buttonProps}>{body}</button>
  }

  if (interactive && as === 'div' && onClick) {
    const divProps: HTMLAttributes<HTMLDivElement> = {
      className: shellClass,
      role: 'button',
      tabIndex: disabled ? -1 : 0,
      'aria-label': ariaLabel,
      'aria-disabled': disabled || undefined,
      onClick: disabled ? undefined : onClick,
      onKeyDown: disabled
        ? undefined
        : (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault()
              onClick()
            }
          }
    }
    return <div {...divProps}>{body}</div>
  }

  return <div className={shellClass}>{body}</div>
}

export function dashboardSummaryIconBubble(
  content: ReactNode,
  tone: DashboardSummaryTone = 'default'
): ReactElement {
  return (
    <span
      className={cn(
        'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
        tone === 'danger' ? 'bg-danger/15 text-danger' : 'bg-surface-muted text-ink-muted'
      )}
    >
      {content}
    </span>
  )
}

/** Kart tıklanabilir div için Enter/Space. */
export function handleSummaryCardKeyDown(onClick: () => void) {
  return (e: KeyboardEvent<HTMLDivElement>): void => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      onClick()
    }
  }
}
