import { Fragment, type ReactElement } from 'react'
import { cn } from '../../lib/cn'
import {
  appointmentLayoutPx,
  CALENDAR_SLOT_HEIGHT_PX,
  formatTimeTR,
  getMonthGridDays,
  getWeekDays,
  hourSlots,
  isPastAppointment,
  isSameDay,
  overlapColumns,
  pad2,
  toDateInputValue
} from '../../lib/randevuCalendar'
import type { RandevuDto } from '../../types/randevu'

type CalendarProps = {
  view: 'day' | 'week' | 'month'
  anchor: Date
  items: RandevuDto[]
  onSlotClick: (date: Date, hour: number) => void
  onDayClick: (date: Date) => void
  onAppointmentClick: (randevu: RandevuDto) => void
}

function appointmentCardShell(past: boolean, compact?: boolean): string {
  return cn(
    'group m-0 box-border cursor-pointer overflow-hidden border-0 p-0 text-left transition-colors duration-150 ease-out',
    compact ? 'relative min-h-[18px] w-full rounded-[3px]' : 'pointer-events-auto absolute inset-0 rounded-[3px]',
    past
      ? 'bg-panel ring-1 ring-inset ring-border/70 hover:ring-border'
      : 'bg-panel ring-1 ring-inset ring-danger/12 hover:ring-danger/20'
  )
}

function appointmentCardWash(past: boolean): string {
  return cn(
    'pointer-events-none absolute inset-0 bg-panel',
    past
      ? 'bg-gradient-to-r from-danger-soft/12 via-panel to-panel'
      : 'bg-gradient-to-r from-danger-soft/40 via-danger-soft/10 to-panel'
  )
}

function appointmentAccentBar(past: boolean): string {
  return cn(
    'shrink-0 rounded-full',
    past ? 'bg-danger/25' : 'bg-gradient-to-b from-danger/55 to-danger/35'
  )
}

function AppointmentCard({
  randevu,
  compact,
  onClick
}: {
  randevu: RandevuDto
  compact?: boolean
  onClick: () => void
}): ReactElement {
  const past = isPastAppointment(randevu.bitisAt)
  const muvekkil = randevu.muvekkilAd?.trim()

  if (compact) {
    return (
      <button type="button" className={appointmentCardShell(past, true)} onClick={onClick}>
        <span className={appointmentCardWash(past)} aria-hidden />
        <div className="relative flex min-w-0 gap-1.5">
          <span className={cn(appointmentAccentBar(past), 'mt-0.5 w-0.5 self-stretch')} aria-hidden />
          <div className="min-w-0 flex-1">
            <p className={cn('truncate text-[10px] font-semibold leading-tight', past ? 'text-ink-muted' : 'text-ink')}>
              {randevu.baslik}
            </p>
            <p className="truncate text-[9px] text-ink-subtle">
              {muvekkil ? muvekkil : formatTimeTR(randevu.baslangicAt)}
            </p>
          </div>
        </div>
      </button>
    )
  }

  return (
    <button type="button" className={appointmentCardShell(past)} onClick={onClick}>
      <span className={appointmentCardWash(past)} aria-hidden />
      <div className="relative flex h-full min-h-0 w-full">
        <span className={cn(appointmentAccentBar(past), 'w-[3px] shrink-0 self-stretch')} aria-hidden />
        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col justify-center overflow-hidden px-1.5 py-0.5">
          <p className={cn('truncate text-[11px] font-semibold leading-tight tracking-tight', past ? 'text-ink-muted' : 'text-ink')}>
            {randevu.baslik}
          </p>
          <p className="mt-0.5 truncate text-[10px] tabular-nums text-ink-subtle">
            {formatTimeTR(randevu.baslangicAt)} – {formatTimeTR(randevu.bitisAt)}
          </p>
          {muvekkil ? (
            <p className="mt-0.5 truncate text-[10px] font-medium text-primary">{muvekkil}</p>
          ) : null}
        </div>
      </div>
    </button>
  )
}

function MonthView({ anchor, items, onDayClick, onAppointmentClick }: Omit<CalendarProps, 'view' | 'onSlotClick'>): ReactElement {
  const days = getMonthGridDays(anchor)
  const month = anchor.getMonth()
  const today = new Date()

  return (
    <div className="overflow-hidden rounded-xl border border-border/80 bg-panel shadow-sm ring-1 ring-ink/[0.03]">
      <div className="grid grid-cols-7 border-b border-border/60 bg-surface-muted/35 text-center text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
        {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((d) => (
          <div key={d} className="px-1 py-2.5">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const dayItems = items.filter((r) => isSameDay(new Date(r.baslangicAt), day))
          const inMonth = day.getMonth() === month
          const isToday = isSameDay(day, today)
          const visible = dayItems.slice(0, 3)
          const more = dayItems.length - visible.length
          return (
            <button
              key={day.toISOString()}
              type="button"
              className={cn(
                'min-h-[92px] border-b border-r border-border/50 p-1.5 text-left transition-colors hover:bg-primary/[0.04]',
                !inMonth && 'bg-surface-muted/25 text-ink-muted',
                isToday && inMonth && 'bg-primary/[0.04]'
              )}
              onClick={() => onDayClick(day)}
            >
              <span
                className={cn(
                  'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                  isToday ? 'bg-primary text-white shadow-sm' : 'text-ink'
                )}
              >
                {day.getDate()}
              </span>
              <div className="mt-1 space-y-0.5">
                {visible.map((r) => (
                  <div
                    key={r.id}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') e.stopPropagation()
                    }}
                  >
                    <AppointmentCard randevu={r} compact onClick={() => onAppointmentClick(r)} />
                  </div>
                ))}
                {more > 0 ? <p className="px-0.5 text-[10px] font-medium text-ink-muted">+{more} daha</p> : null}
              </div>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function TimeGridView({
  days,
  items,
  onSlotClick,
  onAppointmentClick
}: {
  days: Date[]
  items: RandevuDto[]
  onSlotClick: (date: Date, hour: number) => void
  onAppointmentClick: (randevu: RandevuDto) => void
}): ReactElement {
  const slots = hourSlots()
  const gridTemplateColumns = `56px repeat(${days.length}, minmax(0, 1fr))`
  const gridTemplateRows = `auto repeat(${slots.length}, ${CALENDAR_SLOT_HEIGHT_PX}px)`
  const today = new Date()

  return (
    <div className="overflow-x-auto rounded-xl border border-border/80 bg-panel shadow-sm ring-1 ring-ink/[0.03]">
      <div className="min-w-[640px]">
        <div className="grid" style={{ gridTemplateColumns, gridTemplateRows }}>
          <div className="border-b border-border/60 bg-surface-muted/35" style={{ gridColumn: 1, gridRow: 1 }} />
          {days.map((d, colIdx) => {
            const isToday = isSameDay(d, today)
            return (
              <div
                key={`hdr-${d.toISOString()}`}
                className={cn(
                  'border-b border-l border-border/60 px-2 py-2.5 text-center',
                  isToday ? 'bg-primary/[0.06] ring-1 ring-inset ring-primary/10' : 'bg-surface-muted/35'
                )}
                style={{ gridColumn: colIdx + 2, gridRow: 1 }}
              >
                <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
                  {d.toLocaleDateString('tr-TR', { weekday: 'short' })}
                </p>
                <p
                  className={cn(
                    'mt-0.5 inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-full text-sm font-bold tabular-nums',
                    isToday ? 'bg-primary text-white shadow-sm' : 'text-ink'
                  )}
                >
                  {d.getDate()}
                </p>
              </div>
            )
          })}

          {slots.map((h, rowIdx) => {
            const gridRow = rowIdx + 2
            return (
              <Fragment key={`slot-${h}`}>
                <div
                  className="flex items-start justify-end border-b border-border/45 pr-2.5 pt-1 text-[10px] font-medium tabular-nums text-ink-subtle"
                  style={{ gridColumn: 1, gridRow, height: CALENDAR_SLOT_HEIGHT_PX }}
                >
                  {pad2(h)}:00
                </div>
                {days.map((day, colIdx) => {
                  const isToday = isSameDay(day, today)
                  return (
                    <button
                      key={`${day.toISOString()}-${h}`}
                      type="button"
                      className={cn(
                        'border-b border-l border-border/45 transition-colors hover:bg-primary/[0.04]',
                        isToday && 'bg-primary/[0.02]'
                      )}
                      style={{ gridColumn: colIdx + 2, gridRow, height: CALENDAR_SLOT_HEIGHT_PX }}
                      onClick={() => onSlotClick(day, h)}
                      aria-label={`${toDateInputValue(day)} ${pad2(h)}:00`}
                    />
                  )
                })}
              </Fragment>
            )
          })}

          {days.map((day, colIdx) => {
            const dayItems = items.filter((r) => isSameDay(new Date(r.baslangicAt), day))
            const laid = overlapColumns(dayItems)
            return (
              <div
                key={`overlay-${day.toISOString()}`}
                className="pointer-events-none relative"
                style={{
                  gridColumn: colIdx + 2,
                  gridRow: `2 / ${slots.length + 2}`,
                  height: slots.length * CALENDAR_SLOT_HEIGHT_PX
                }}
              >
                {laid.map((r) => {
                  const layout = appointmentLayoutPx(r.baslangicAt, r.bitisAt)
                  if (!layout) return null
                  const widthPct = 100 / r.columns
                  const leftPct = r.column * widthPct
                  const topPx = Math.round(layout.topPx)
                  const heightPx = Math.max(Math.round(layout.heightPx), 18)
                  const insetX = r.columns > 1 ? 2 : 1
                  return (
                    <div
                      key={r.id}
                      className="pointer-events-none absolute z-10 box-border"
                      style={{
                        top: topPx,
                        height: heightPx,
                        left: `calc(${leftPct}% + ${insetX}px)`,
                        width: `calc(${widthPct}% - ${insetX * 2}px)`
                      }}
                    >
                      <AppointmentCard randevu={r} onClick={() => onAppointmentClick(r)} />
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function RandevuCalendarView(props: CalendarProps): ReactElement {
  const { view, anchor, items, onSlotClick, onDayClick, onAppointmentClick } = props

  if (view === 'month') {
    return <MonthView anchor={anchor} items={items} onDayClick={onDayClick} onAppointmentClick={onAppointmentClick} />
  }

  const days = view === 'day' ? [anchor] : getWeekDays(anchor)
  return <TimeGridView days={days} items={items} onSlotClick={onSlotClick} onAppointmentClick={onAppointmentClick} />
}
