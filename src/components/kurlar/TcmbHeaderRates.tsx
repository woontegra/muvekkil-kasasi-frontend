import type { ReactElement } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useTcmbHeaderRates } from '../../hooks/useTcmbKurlar'
import { refreshTcmbRatesManually } from '../../lib/tcmbRefresh'
import { useToast } from '../../toast'
import type { TcmbRatesAvailableResponse } from '../../types/kurlar'
import { formatDateTimeTR, formatDateTR, formatTcmbRateDisplay } from '../../utils/tcmbFormat'
import { RefreshCwIcon } from '../icons/RefreshCwIcon'
import { TcmbRatesPopoverContent } from './TcmbRatesPopoverContent'
import { cn } from '../../lib/cn'

function RateChip(props: { label: string; value: string }): ReactElement {
  return (
    <span className="whitespace-nowrap tabular-nums text-[11px] font-semibold text-ink sm:text-xs">
      {props.label} <span className="font-bold">{props.value}</span>
    </span>
  )
}

function useTcmbManualRefresh(): {
  refreshing: boolean
  lastCheckedAt: string | null
  refresh: () => void
} {
  const queryClient = useQueryClient()
  const toast = useToast()
  const [refreshing, setRefreshing] = useState(false)
  const [lastCheckedAt, setLastCheckedAt] = useState<string | null>(null)
  const inFlight = useRef(false)

  const refresh = useCallback((): void => {
    if (inFlight.current) return
    inFlight.current = true
    setRefreshing(true)
    void (async () => {
      try {
        const outcome = await refreshTcmbRatesManually(queryClient)
        setLastCheckedAt(new Date().toISOString())
        if (outcome.status === 'updated') toast.success(outcome.message)
        else if (outcome.status === 'unchanged') toast.success(outcome.message)
        else toast.warning(outcome.message)
      } finally {
        inFlight.current = false
        setRefreshing(false)
      }
    })()
  }, [queryClient, toast])

  return { refreshing, lastCheckedAt, refresh }
}

function RefreshRatesButton(props: {
  refreshing: boolean
  lastCheckedAt: string | null
  onRefresh: () => void
  compact?: boolean
}): ReactElement {
  const { refreshing, lastCheckedAt, onRefresh, compact } = props
  const tip = lastCheckedAt
    ? `TCMB kurlarını yenile · Son kontrol: ${formatDateTimeTR(lastCheckedAt)}`
    : 'TCMB kurlarını yenile'
  return (
    <button
      type="button"
      title={tip}
      aria-label="TCMB kurlarını yenile"
      disabled={refreshing}
      onClick={(e) => {
        e.stopPropagation()
        onRefresh()
      }}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md border border-border bg-white text-ink shadow-sm transition-colors',
        'hover:border-primary/40 hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/25',
        'disabled:cursor-not-allowed disabled:opacity-60',
        compact ? 'h-8 w-8' : 'h-[30px] w-[30px] sm:h-8 sm:w-8'
      )}
    >
      <RefreshCwIcon className="h-4 w-4" spin={refreshing} />
    </button>
  )
}

export function TcmbHeaderRates(): ReactElement {
  const query = useTcmbHeaderRates()
  const { refreshing, lastCheckedAt, refresh } = useTcmbManualRefresh()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent): void => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const data = query.data
  const available = data?.available === true
  const snap = available ? (data as TcmbRatesAvailableResponse) : null

  if (query.isLoading && !snap) {
    return (
      <div className="hidden shrink-0 items-center gap-1.5 md:flex">
        <RefreshRatesButton
          refreshing={refreshing}
          lastCheckedAt={lastCheckedAt}
          onRefresh={refresh}
        />
        <span className="text-[10px] text-ink-muted">Kurlar yükleniyor…</span>
      </div>
    )
  }

  if (!available || !snap) {
    return (
      <div className="hidden shrink-0 items-center gap-1.5 md:flex">
        <RefreshRatesButton
          refreshing={refreshing}
          lastCheckedAt={lastCheckedAt}
          onRefresh={refresh}
        />
        <span className="text-[10px] text-ink-muted">Kur bilgisi alınamadı</span>
      </div>
    )
  }

  const usdLabel = formatTcmbRateDisplay(snap.usdDovizAlis)
  const eurLabel = formatTcmbRateDisplay(snap.eurDovizAlis)
  const dateLabel = formatDateTR(snap.effectiveDate)

  return (
    <div ref={rootRef} className="relative hidden shrink-0 md:block">
      <div className="flex items-center gap-1.5">
        <RefreshRatesButton
          refreshing={refreshing}
          lastCheckedAt={lastCheckedAt}
          onRefresh={refresh}
        />
        <button
          type="button"
          className="flex max-w-full flex-col items-end gap-0.5 rounded-md border border-transparent px-1.5 py-1 text-right transition-colors hover:border-border hover:bg-surface-muted/60 focus-visible:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/20 lg:items-center lg:gap-x-3 lg:py-0.5 xl:flex-row"
          aria-expanded={open}
          aria-haspopup="dialog"
          onClick={() => setOpen((v) => !v)}
        >
          <span className="inline sm:hidden">Kurlar</span>
          <span className="hidden items-center gap-2 sm:inline-flex lg:gap-3">
            <RateChip label="USD/TRY" value={usdLabel} />
            <RateChip label="EUR/TRY" value={eurLabel} />
          </span>
          <span className="hidden text-[10px] leading-tight text-ink-muted lg:inline xl:whitespace-nowrap">
            TCMB Döviz Alış · {dateLabel}
          </span>
          {snap.stale ? (
            <span className="hidden text-[10px] font-medium text-amber-800 lg:inline">
              Son alınan kur
            </span>
          ) : null}
        </button>
      </div>

      {open ? (
        <div
          role="dialog"
          aria-label="TCMB referans kurları"
          className="absolute right-0 top-full z-40 mt-1 w-[min(100vw-1.5rem,280px)] rounded-lg border border-border bg-panel p-3 shadow-lg"
        >
          <TcmbRatesPopoverContent data={snap} />
        </div>
      ) : null}
    </div>
  )
}

/** Mobil üst bar — dar ekranda tek düğme + yenile. */
export function TcmbHeaderRatesMobile(): ReactElement {
  const query = useTcmbHeaderRates()
  const { refreshing, lastCheckedAt, refresh } = useTcmbManualRefresh()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent): void => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  const data = query.data
  const available = data?.available === true
  const snap = available ? (data as TcmbRatesAvailableResponse) : null

  if (query.isLoading && !snap) {
    return (
      <div className="flex items-center gap-1 md:hidden">
        <RefreshRatesButton
          compact
          refreshing={refreshing}
          lastCheckedAt={lastCheckedAt}
          onRefresh={refresh}
        />
        <span className="text-[10px] text-ink-muted">…</span>
      </div>
    )
  }

  if (!available || !snap) {
    return (
      <div className="flex items-center gap-1 md:hidden">
        <RefreshRatesButton
          compact
          refreshing={refreshing}
          lastCheckedAt={lastCheckedAt}
          onRefresh={refresh}
        />
        <span className="text-[10px] text-ink-muted">Kur bilgisi alınamadı</span>
      </div>
    )
  }

  return (
    <div ref={rootRef} className="relative flex items-center gap-1 md:hidden">
      <RefreshRatesButton
        compact
        refreshing={refreshing}
        lastCheckedAt={lastCheckedAt}
        onRefresh={refresh}
      />
      <button
        type="button"
        className="inline-flex h-9 items-center rounded-md border border-border bg-white px-2 text-[11px] font-semibold text-ink"
        onClick={() => setOpen((v) => !v)}
      >
        Kurlar
      </button>
      {open ? (
        <div className="absolute right-0 top-full z-40 mt-1 w-[min(100vw-1.5rem,280px)] rounded-lg border border-border bg-panel p-3 shadow-lg">
          <TcmbRatesPopoverContent data={snap} />
        </div>
      ) : null}
    </div>
  )
}
