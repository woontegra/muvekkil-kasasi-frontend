import { useInfiniteQuery } from '@tanstack/react-query'
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
  type ReactElement
} from 'react'
import { createPortal } from 'react-dom'
import { listMuvekkilDosyalari } from '../../api/dosyalar'
import { cn } from '../../lib/cn'
import { mahkemeIcraSatir } from '../../lib/dosyaLabels'
import { formControlClass, uiType } from '../../lib/uiDensity'
import type { DosyaDto } from '../../types/dosya'

export type DosyaSearchSelectValue = {
  id: string
  konuBasligi: string
  detay: string | null
} | null

type Props = {
  muvekkilId: string
  value: DosyaSearchSelectValue
  onChange: (next: DosyaSearchSelectValue) => void
  label?: string
  disabled?: boolean
  className?: string
}

export const DOSYA_SEARCH_PAGE_SIZE = 30

export function dosyaDetayLine(d: DosyaDto): string | null {
  const parts = [d.dosyaNo?.trim(), mahkemeIcraSatir(d)].filter((x): x is string => Boolean(x) && x !== '—')
  return parts.length ? parts.join(' · ') : null
}

/**
 * Seçili müvekkilin dosyaları — sunucu taraflı arama (`q`) ve sayfalama (`page`/`limit`).
 * Seçim sonuç listesinden bağımsız tutulur; arama/sayfa değişse de kaybolmaz.
 */
export function DosyaSearchSelect({
  muvekkilId,
  value,
  onChange,
  label = 'Dosya',
  disabled,
  className
}: Props): ReactElement {
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const searchRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const [open, setOpen] = useState(false)
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [highlight, setHighlight] = useState(0)
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})
  const inactive = disabled || !muvekkilId

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 300)
    return () => window.clearTimeout(t)
  }, [q])

  const query = useInfiniteQuery({
    queryKey: ['dosyalar', muvekkilId, 'arama', debouncedQ],
    queryFn: ({ pageParam }) =>
      listMuvekkilDosyalari(muvekkilId, {
        q: debouncedQ || undefined,
        page: pageParam,
        limit: DOSYA_SEARCH_PAGE_SIZE
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.page * last.limit < last.total ? last.page + 1 : undefined),
    enabled: open && !inactive,
    staleTime: 30_000
  })

  const items = useMemo(() => {
    const seen = new Set<string>()
    const out: DosyaDto[] = []
    for (const page of query.data?.pages ?? []) {
      for (const item of page.items) {
        if (seen.has(item.id)) continue
        seen.add(item.id)
        out.push(item)
      }
    }
    return out
  }, [query.data])

  const total = query.data?.pages[0]?.total ?? 0

  const reposition = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const gap = 4
    const maxH = Math.min(360, window.innerHeight - 24)
    const spaceBelow = window.innerHeight - rect.bottom - gap - 8
    const spaceAbove = rect.top - gap - 8
    const openUp = spaceBelow < 200 && spaceAbove > spaceBelow
    const height = Math.min(maxH, openUp ? spaceAbove : spaceBelow)
    setPanelStyle({
      position: 'fixed',
      left: Math.max(8, Math.min(rect.left, window.innerWidth - Math.min(rect.width, 420) - 8)),
      width: Math.min(Math.max(rect.width, 280), window.innerWidth - 16),
      zIndex: 80,
      maxHeight: Math.max(180, height),
      ...(openUp ? { bottom: window.innerHeight - rect.top + gap } : { top: rect.bottom + gap })
    })
  }, [])

  useEffect(() => {
    if (!open) return
    reposition()
    const onResize = () => reposition()
    window.addEventListener('resize', onResize)
    window.addEventListener('scroll', onResize, true)
    return () => {
      window.removeEventListener('resize', onResize)
      window.removeEventListener('scroll', onResize, true)
    }
  }, [open, reposition, items.length])

  useEffect(() => {
    if (!open) return
    const t = window.setTimeout(() => searchRef.current?.focus(), 0)
    return () => window.clearTimeout(t)
  }, [open])

  const close = useCallback(() => {
    setOpen(false)
    setQ('')
  }, [])

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (rootRef.current?.contains(t)) return
      if (document.getElementById(listboxId)?.contains(t)) return
      close()
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, listboxId, close])

  useEffect(() => {
    if (inactive) close()
  }, [inactive, close])

  useEffect(() => {
    setHighlight(0)
  }, [open, debouncedQ])

  const selectItem = (d: DosyaDto) => {
    onChange({ id: d.id, konuBasligi: d.konuBasligi, detay: dosyaDetayLine(d) })
    close()
    triggerRef.current?.focus()
  }

  const loadMore = () => {
    if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage()
  }

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (inactive) return
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(true)
    }
  }

  const onPanelKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      close()
      triggerRef.current?.focus()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(items.length - 1, h + 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(0, h - 1))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      const d = items[highlight]
      if (d) selectItem(d)
    }
  }

  const onListScroll = () => {
    const el = listRef.current
    if (!el) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 48) loadMore()
  }

  const selectedInResults = value ? items.some((d) => d.id === value.id) : false
  const display = !muvekkilId
    ? 'Önce müvekkil seçin'
    : value
      ? value.detay
        ? `${value.konuBasligi} (${value.detay})`
        : value.konuBasligi
      : 'Dosya seçin'

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <label className={uiType.label}>{label}</label>
      <div className="flex gap-2">
        <button
          ref={triggerRef}
          type="button"
          disabled={inactive}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          aria-label={label}
          className={cn(
            formControlClass,
            'flex min-w-0 flex-1 items-center justify-between gap-2 text-left transition-colors',
            inactive && 'cursor-not-allowed opacity-60',
            !value && 'text-ink-muted'
          )}
          onClick={() => {
            if (inactive) return
            if (open) close()
            else setOpen(true)
          }}
          onKeyDown={onTriggerKeyDown}
        >
          <span className="min-w-0 truncate font-medium text-ink">{display}</span>
          <span className="shrink-0 text-ink-muted" aria-hidden>
            ▾
          </span>
        </button>
        {value ? (
          <button
            type="button"
            className="h-8 shrink-0 rounded-md border border-border px-2 text-[10px] font-semibold text-primary hover:bg-primary/5"
            disabled={inactive}
            onClick={() => onChange(null)}
          >
            Temizle
          </button>
        ) : null}
      </div>

      {open
        ? createPortal(
            <div
              id={listboxId}
              role="listbox"
              aria-label={label}
              style={panelStyle}
              className="flex flex-col overflow-hidden rounded-md border border-border bg-white shadow-xl dark:bg-surface-elevated"
              onKeyDown={onPanelKeyDown}
            >
              <div className="border-b border-border p-2">
                <input
                  ref={searchRef}
                  type="search"
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Dosya adı, esas/dosya no, mahkeme, icra dairesi…"
                  className={formControlClass}
                  aria-autocomplete="list"
                  aria-controls={listboxId}
                  aria-label="Dosya ara"
                />
              </div>
              {value && !selectedInResults ? (
                <div className="border-b border-border bg-primary/5 px-3 py-1.5 text-[11px] text-ink-muted">
                  Seçili: <span className="font-semibold text-ink">{value.konuBasligi}</span>
                  {value.detay ? ` (${value.detay})` : ''}
                </div>
              ) : null}
              <ul ref={listRef} className="min-h-0 flex-1 overflow-y-auto py-1 text-sm" onScroll={onListScroll}>
                {query.isLoading ? (
                  <li className="px-3 py-2 text-ink-muted">Yükleniyor…</li>
                ) : query.isError ? (
                  <li className="px-3 py-2 text-danger">Dosyalar yüklenemedi.</li>
                ) : items.length === 0 ? (
                  <li className="px-3 py-2 text-ink-muted">
                    {debouncedQ ? 'Aramaya uyan dosya bulunamadı.' : 'Bu müvekkile ait aktif dosya yok.'}
                  </li>
                ) : (
                  items.map((d, i) => {
                    const sub = dosyaDetayLine(d)
                    const selected = d.id === value?.id
                    return (
                      <li key={d.id} role="option" aria-selected={selected}>
                        <button
                          type="button"
                          className={cn(
                            'w-full px-3 py-2 text-left transition-colors hover:bg-primary/5',
                            (highlight === i || selected) && 'bg-primary/10'
                          )}
                          onMouseEnter={() => setHighlight(i)}
                          onClick={() => selectItem(d)}
                        >
                          <span className="block truncate font-semibold text-ink">{d.konuBasligi}</span>
                          {sub ? <span className="mt-0.5 block truncate text-[11px] text-ink-muted">{sub}</span> : null}
                        </button>
                      </li>
                    )
                  })
                )}
                {query.isFetchingNextPage ? (
                  <li className="px-3 py-2 text-center text-[11px] text-ink-muted">Daha fazla yükleniyor…</li>
                ) : query.hasNextPage ? (
                  <li className="px-2 py-1">
                    <button
                      type="button"
                      className="w-full rounded-md px-3 py-1.5 text-center text-[11px] font-semibold text-primary hover:bg-primary/5"
                      onClick={() => {
                        loadMore()
                        searchRef.current?.focus()
                      }}
                    >
                      Daha fazla göster ({items.length} / {total})
                    </button>
                  </li>
                ) : null}
              </ul>
            </div>,
            document.body
          )
        : null}
    </div>
  )
}
