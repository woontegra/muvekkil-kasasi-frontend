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
import { listMuvekkiller } from '../../api/muvekkiller'
import { cn } from '../../lib/cn'
import type { MuvekkilDto } from '../../types/muvekkil'

export type MuvekkilOptionalSelectValue = {
  id: string
  gorunenAd: string
  telefon: string | null
} | null

type Props = {
  label?: string
  valueId: string
  /** Seçili müvekkil görünen adı (liste dışında da kalması için). */
  valueLabel?: string
  onChange: (next: MuvekkilOptionalSelectValue) => void
  disabled?: boolean
  placeholder?: string
  clearOptionLabel?: string
  className?: string
}

const PAGE_SIZE = 30

function secondaryLine(m: MuvekkilDto): string | null {
  const tel = m.telefon?.trim()
  if (tel) return tel
  const unvan = m.sirketUnvani?.trim()
  if (unvan && unvan !== m.gorunenAd) return unvan
  return null
}

/**
 * İsteğe bağlı müvekkil seçici — tıklanınca liste açılır; arama zorunlu değildir.
 * Dropdown portal ile modal overflow’dan kaçar.
 */
export function MuvekkilOptionalSelect({
  label = 'İlgili müvekkil (isteğe bağlı)',
  valueId,
  valueLabel = '',
  onChange,
  disabled,
  placeholder = 'Müvekkil seçin',
  clearOptionLabel = 'Müvekkil seçilmedi',
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

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 250)
    return () => window.clearTimeout(t)
  }, [q])

  const query = useInfiniteQuery({
    queryKey: ['muvekkiller', 'optional-select', debouncedQ],
    queryFn: ({ pageParam }) =>
      listMuvekkiller({
        q: debouncedQ || undefined,
        page: pageParam,
        limit: PAGE_SIZE
      }),
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const loaded = last.page * last.limit
      return loaded < last.total ? last.page + 1 : undefined
    },
    enabled: open && !disabled,
    staleTime: 30_000
  })

  const items = useMemo(() => {
    const seen = new Set<string>()
    const out: MuvekkilDto[] = []
    for (const page of query.data?.pages ?? []) {
      for (const item of page.items) {
        if (seen.has(item.id)) continue
        seen.add(item.id)
        out.push(item)
      }
    }
    return out
  }, [query.data])

  /** 0 = clear option, 1..n = items */
  const optionCount = items.length + 1

  const reposition = useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    const gap = 4
    const maxH = Math.min(320, window.innerHeight - 24)
    const spaceBelow = window.innerHeight - rect.bottom - gap - 8
    const spaceAbove = rect.top - gap - 8
    const openUp = spaceBelow < 180 && spaceAbove > spaceBelow
    const height = Math.min(maxH, openUp ? spaceAbove : spaceBelow)
    setPanelStyle({
      position: 'fixed',
      left: Math.max(8, Math.min(rect.left, window.innerWidth - Math.min(rect.width, 360) - 8)),
      width: Math.min(Math.max(rect.width, 260), window.innerWidth - 16),
      zIndex: 80,
      maxHeight: Math.max(160, height),
      ...(openUp
        ? { bottom: window.innerHeight - rect.top + gap }
        : { top: rect.bottom + gap })
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

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node
      if (rootRef.current?.contains(t)) return
      const portal = document.getElementById(listboxId)
      if (portal?.contains(t)) return
      setOpen(false)
      setQ('')
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open, listboxId])

  useEffect(() => {
    setHighlight(valueId ? 0 : 0)
  }, [open, debouncedQ, valueId])

  const selectClear = () => {
    onChange(null)
    setOpen(false)
    setQ('')
    triggerRef.current?.focus()
  }

  const selectItem = (m: MuvekkilDto) => {
    onChange({ id: m.id, gorunenAd: m.gorunenAd, telefon: m.telefon })
    setOpen(false)
    setQ('')
    triggerRef.current?.focus()
  }

  const onTriggerKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (disabled) return
    if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen(true)
    }
  }

  const onPanelKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault()
      setOpen(false)
      setQ('')
      triggerRef.current?.focus()
      return
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlight((h) => Math.min(optionCount - 1, h + 1))
      return
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlight((h) => Math.max(0, h - 1))
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (highlight === 0) selectClear()
      else {
        const m = items[highlight - 1]
        if (m) selectItem(m)
      }
    }
  }

  const onListScroll = () => {
    const el = listRef.current
    if (!el || !query.hasNextPage || query.isFetchingNextPage) return
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 48) {
      void query.fetchNextPage()
    }
  }

  const display = valueId ? valueLabel || 'Seçili müvekkil' : placeholder

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <label className="mb-1 block text-xs font-semibold text-ink-muted">{label}</label>
      <div className="flex gap-2">
        <button
          ref={triggerRef}
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={open ? listboxId : undefined}
          className={cn(
            'flex h-11 min-w-0 flex-1 items-center justify-between gap-2 rounded-md border border-border bg-white px-3 text-left text-sm shadow-inner outline-none transition-colors',
            'focus:border-primary focus:ring-2 focus:ring-primary/15 md:h-9 dark:bg-surface-elevated',
            disabled && 'cursor-not-allowed opacity-60',
            !valueId && 'text-ink-muted'
          )}
          onClick={() => {
            if (disabled) return
            setOpen((o) => !o)
          }}
          onKeyDown={onTriggerKeyDown}
        >
          <span className="min-w-0 truncate font-medium text-ink">{display}</span>
          <span className="shrink-0 text-ink-muted" aria-hidden>
            ▾
          </span>
        </button>
        {valueId ? (
          <button
            type="button"
            className="h-11 shrink-0 rounded-md border border-border px-2 text-xs font-semibold text-primary hover:bg-primary/5 md:h-9"
            disabled={disabled}
            onClick={selectClear}
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
                  placeholder="Ara (isteğe bağlı)"
                  className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/15 dark:bg-surface-elevated"
                  aria-autocomplete="list"
                  aria-controls={listboxId}
                />
              </div>
              <ul
                ref={listRef}
                className="min-h-0 flex-1 overflow-y-auto py-1 text-sm"
                onScroll={onListScroll}
              >
                <li role="option" aria-selected={!valueId}>
                  <button
                    type="button"
                    className={cn(
                      'w-full px-3 py-2 text-left text-ink-muted transition-colors hover:bg-primary/5',
                      highlight === 0 && 'bg-primary/10'
                    )}
                    onMouseEnter={() => setHighlight(0)}
                    onClick={selectClear}
                  >
                    {clearOptionLabel}
                  </button>
                </li>
                {query.isLoading ? (
                  <li className="px-3 py-2 text-ink-muted">Yükleniyor…</li>
                ) : query.isError ? (
                  <li className="px-3 py-2 text-danger">Müvekkiller yüklenemedi.</li>
                ) : items.length === 0 ? (
                  <li className="px-3 py-2 text-ink-muted">Aktif müvekkil bulunamadı.</li>
                ) : (
                  items.map((m, i) => {
                    const idx = i + 1
                    const sub = secondaryLine(m)
                    const selected = m.id === valueId
                    return (
                      <li key={m.id} role="option" aria-selected={selected}>
                        <button
                          type="button"
                          className={cn(
                            'w-full px-3 py-2 text-left transition-colors hover:bg-primary/5',
                            (highlight === idx || selected) && 'bg-primary/10'
                          )}
                          onMouseEnter={() => setHighlight(idx)}
                          onClick={() => selectItem(m)}
                        >
                          <span className="block truncate font-semibold text-ink">{m.gorunenAd}</span>
                          {sub ? (
                            <span className="mt-0.5 block truncate text-[11px] text-ink-muted">{sub}</span>
                          ) : null}
                        </button>
                      </li>
                    )
                  })
                )}
                {query.isFetchingNextPage ? (
                  <li className="px-3 py-2 text-center text-[11px] text-ink-muted">Daha fazla yükleniyor…</li>
                ) : null}
              </ul>
            </div>,
            document.body
          )
        : null}
    </div>
  )
}
