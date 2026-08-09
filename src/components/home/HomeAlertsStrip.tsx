import type { ReactElement } from 'react'

export type HomeAlertItem = {
  key: string
  text: string
  onClick?: () => void
}

export type HomeAlertsStripProps = {
  items: HomeAlertItem[]
  loading?: boolean
}

/** Kritik uyarı yoksa gösterilmez — boş gri band yok. */
export function HomeAlertsStrip({ items, loading }: HomeAlertsStripProps): ReactElement | null {
  if (loading) return null
  if (items.length === 0) return null

  return (
    <div
      className="motion-fade-in flex flex-wrap items-center gap-2 rounded-lg border border-amber-300/60 bg-gradient-to-r from-amber-50 to-orange-50/80 px-3 py-2 shadow-sm"
      role="alert"
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-amber-500/15 text-amber-700">
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" aria-hidden>
          <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
          <path d="M12 9v4M12 17h.01" />
        </svg>
      </span>
      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
        {items.map((item) =>
          item.onClick ? (
            <button
              key={item.key}
              type="button"
              onClick={item.onClick}
              className="rounded-md border border-amber-400/40 bg-white/70 px-2 py-0.5 text-xs font-semibold text-amber-950 transition hover:border-amber-500 hover:bg-white"
            >
              {item.text}
            </button>
          ) : (
            <span
              key={item.key}
              className="rounded-md border border-amber-400/30 bg-white/50 px-2 py-0.5 text-xs font-medium text-amber-950"
            >
              {item.text}
            </span>
          )
        )}
      </div>
      <span className="shrink-0 rounded-full bg-amber-600/15 px-2 py-0.5 text-[10px] font-bold tabular-nums text-amber-900">
        {items.length}
      </span>
    </div>
  )
}
