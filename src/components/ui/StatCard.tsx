import type { ReactElement, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { DashboardSummaryCard, type DashboardSummaryTone } from '../dashboard/DashboardSummaryCard'

export type StatCardProps = {
  label: string
  value: ReactNode
  sub?: string
  icon?: ReactNode
  className?: string
  /** Tıklanabilir özet kartı (hover, odak halkası). */
  interactive?: boolean
  selected?: boolean
  disabled?: boolean
  onClick?: () => void
  /** Alt satır — örn. “Detayları gör”. */
  footerHint?: string
  tone?: DashboardSummaryTone
  trailing?: ReactNode
  titleBadge?: ReactNode
}

export function StatCard({
  label,
  value,
  sub,
  icon,
  className,
  interactive,
  selected,
  disabled,
  onClick,
  footerHint,
  tone = 'default',
  trailing,
  titleBadge
}: StatCardProps): ReactElement {
  const meta =
    footerHint && interactive ? (
      <p className="line-clamp-1 text-[10px] font-semibold text-primary">{footerHint}</p>
    ) : sub ? (
      <p className="line-clamp-2 text-[10px] leading-snug text-ink-muted">{sub}</p>
    ) : null

  const trailingNode =
    trailing ??
    (icon ? (
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-soft text-primary">{icon}</div>
    ) : null)

  return (
    <DashboardSummaryCard
      title={label}
      value={value}
      meta={meta}
      trailing={trailingNode}
      titleBadge={titleBadge}
      interactive={interactive}
      selected={selected}
      disabled={disabled}
      tone={tone}
      onClick={onClick}
      className={cn(className)}
    />
  )
}
