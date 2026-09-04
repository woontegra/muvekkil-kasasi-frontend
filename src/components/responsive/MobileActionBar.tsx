import { useEffect, useId, useRef, useState, type ReactElement, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Button, type ButtonProps } from '../ui/Button'

export type MobileActionItem = {
  key: string
  label: string
  onClick: () => void
  variant?: ButtonProps['variant']
  disabled?: boolean
  loading?: boolean
  /** Tehlikeli işlem — menüde vurgulanır */
  danger?: boolean
  /** Birincil görünür aksiyon (max 2 önerilir) */
  primary?: boolean
}

export type MobileActionBarProps = {
  items: MobileActionItem[]
  /** Masaüstü tablo hücresi için kompakt satır; mobil kart için dokunma dostu */
  density?: 'mobile' | 'desktop'
  className?: string
  emptyLabel?: ReactNode
}

/**
 * 1–2 birincil aksiyon görünür; fazlası «⋯» menüsünde.
 * Mobilde min 44px yükseklik, eşit genişlik.
 */
export function MobileActionBar({
  items,
  density = 'mobile',
  className,
  emptyLabel = null
}: MobileActionBarProps): ReactElement | null {
  const menuId = useId()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [open])

  if (items.length === 0) {
    return emptyLabel ? <span className="text-[11px] text-ink-muted">{emptyLabel}</span> : null
  }

  const primary = items.filter((i) => i.primary).slice(0, 2)
  const visible = primary.length > 0 ? primary : items.slice(0, Math.min(2, items.length))
  const overflow = items.filter((i) => !visible.includes(i))
  const isMobile = density === 'mobile'
  const btnH = isMobile ? 'min-h-11 h-11' : 'h-8'
  const btnText = isMobile ? 'text-sm' : 'text-[11px]'

  return (
    <div ref={rootRef} className={cn('relative flex w-full items-stretch gap-2', className)}>
      {visible.map((item) => (
        <Button
          key={item.key}
          type="button"
          size="sm"
          variant={item.variant ?? (item.danger ? 'outline' : 'secondary')}
          disabled={item.disabled}
          loading={item.loading}
          className={cn(
            'min-w-0 flex-1 px-2',
            btnH,
            btnText,
            item.danger && 'text-danger border-danger/40'
          )}
          onClick={item.onClick}
        >
          {item.label}
        </Button>
      ))}

      {overflow.length > 0 ? (
        <div className="relative shrink-0">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className={cn('w-11 px-0', btnH)}
            aria-expanded={open}
            aria-controls={menuId}
            aria-label="Diğer işlemler"
            onClick={() => setOpen((v) => !v)}
          >
            ⋯
          </Button>
          {open ? (
            <div
              id={menuId}
              role="menu"
              className="absolute right-0 z-20 mt-1 min-w-[160px] overflow-hidden rounded-lg border border-border bg-white py-1 shadow-card"
            >
              {overflow.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  role="menuitem"
                  disabled={item.disabled || item.loading}
                  className={cn(
                    'flex min-h-11 w-full items-center px-3 text-left text-sm font-semibold transition hover:bg-surface-muted disabled:opacity-50',
                    item.danger ? 'text-danger' : 'text-ink'
                  )}
                  onClick={() => {
                    setOpen(false)
                    item.onClick()
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
