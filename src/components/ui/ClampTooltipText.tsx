import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactElement
} from 'react'
import { cn } from '../../lib/cn'

type Lines = 1 | 2

type Props = {
  text: string | null | undefined
  /** Boş metinde gösterilecek yer tutucu */
  empty?: string
  lines?: Lines
  className?: string
  /** Ekstra tooltip içeriği (ör. kur satırı) — clamp dışında tutulabilir */
  tooltipExtra?: string | null
}

/**
 * Tablo hücresi için sabit satır sayılı metin.
 * Hover/focus’ta native title + odaklanabilir popover; tıklamada dokunmatik erişim.
 * Hücre yüksekliğini metne göre büyütmez.
 */
export function ClampTooltipText({
  text,
  empty = '—',
  lines = 2,
  className,
  tooltipExtra
}: Props): ReactElement {
  const trimmed = text?.trim() ?? ''
  const tipId = useId()
  const rootRef = useRef<HTMLSpanElement>(null)
  const [open, setOpen] = useState(false)

  const fullTip = [trimmed, tooltipExtra?.trim()].filter(Boolean).join('\n')

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent): void => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: globalThis.KeyboardEvent): void => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDoc)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const onKeyDown = useCallback((e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setOpen((v) => !v)
    }
  }, [])

  if (!trimmed) {
    return <span className={cn('text-ink-muted', className)}>{empty}</span>
  }

  return (
    <span ref={rootRef} className={cn('relative block min-w-0 max-w-full', className)}>
      <button
        type="button"
        className={cn(
          'block w-full min-w-0 max-w-full cursor-help rounded-sm text-left text-[11px] text-ink-muted',
          'outline-none focus-visible:ring-2 focus-visible:ring-primary/25'
        )}
        title={fullTip}
        aria-describedby={open ? tipId : undefined}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={onKeyDown}
        onBlur={(e) => {
          if (!rootRef.current?.contains(e.relatedTarget as Node)) setOpen(false)
        }}
      >
        <span
          className={cn(
            'block min-w-0 max-w-full text-left',
            lines === 1 ? 'ofis-clamp-1' : 'ofis-clamp-2'
          )}
        >
          {trimmed}
        </span>
      </button>
      {open ? (
        <span
          id={tipId}
          role="tooltip"
          className="absolute left-0 top-full z-40 mt-1 max-w-[min(22rem,70vw)] whitespace-pre-wrap break-words rounded-md border border-border bg-white px-2.5 py-2 text-xs leading-snug text-ink shadow-lg dark:bg-surface-elevated"
        >
          {fullTip}
        </span>
      ) : null}
    </span>
  )
}
