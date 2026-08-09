import type { FormEvent, ReactElement } from 'react'
import { Button } from '../ui'
import { cn } from '../../lib/cn'

export type MuvekkilListToolbarProps = {
  q: string
  onQChange: (value: string) => void
  onSearch: (e: FormEvent) => void
  total: number
  listReady: boolean
  pageSize: number
  onNew: () => void
}

export function MuvekkilListToolbar({
  q,
  onQChange,
  onSearch,
  total,
  listReady,
  pageSize,
  onNew
}: MuvekkilListToolbarProps): ReactElement {
  return (
    <div className="border-b border-border bg-gradient-to-b from-slate-50/90 to-white px-4 py-3">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 shrink-0">
          <h2 className="text-base font-bold tracking-tight text-ink">Müvekkiller</h2>
          <p className="mt-0.5 text-xs text-ink-muted">
            {listReady ? (
              <>
                <span className="font-semibold tabular-nums text-ink">{total}</span> kayıt
                <span className="mx-1.5 text-border-strong">·</span>
                sayfa başı {pageSize}
              </>
            ) : (
              'Liste yükleniyor…'
            )}
          </p>
        </div>

        <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center lg:max-w-2xl lg:flex-1 lg:justify-end">
          <form onSubmit={onSearch} className="flex min-w-0 flex-1 items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <svg
                className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-subtle"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                aria-hidden
              >
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <input
                type="search"
                value={q}
                onChange={(e) => onQChange(e.target.value)}
                placeholder="Ad, telefon veya e-posta…"
                aria-label="Müvekkil ara"
                className={cn(
                  'h-9 w-full rounded-lg border border-border bg-white pl-9 pr-3 text-sm text-ink shadow-sm outline-none transition',
                  'placeholder:text-ink-subtle focus:border-primary focus:ring-2 focus:ring-primary/15'
                )}
              />
            </div>
            <Button type="submit" variant="secondary" size="sm" className="shrink-0 px-4">
              Ara
            </Button>
          </form>

          <div className="flex shrink-0 items-center gap-2">
            <Button type="button" size="sm" className="shrink-0 gap-1 px-3" onClick={onNew}>
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden>
                <path d="M12 5v14M5 12h14" />
              </svg>
              Yeni
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
