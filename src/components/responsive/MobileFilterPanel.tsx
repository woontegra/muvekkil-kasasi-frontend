import { useId, useState, type FormEvent, type ReactElement, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Button } from '../ui/Button'

export type MobileFilterPanelProps = {
  /** Her zaman üstte görünen alan (arama vb.) */
  primary?: ReactNode
  /** Açılır paneldeki ek filtreler */
  children: ReactNode
  activeCount?: number
  onApply?: () => void
  onReset?: () => void
  applyLabel?: string
  resetLabel?: string
  /** true: form submit ile uygula */
  asForm?: boolean
  className?: string
  /** Varsayılan kapalı (mobil); masaüstünde açık bırakmak için defaultOpenMd */
  defaultOpen?: boolean
}

/**
 * Mobilde filtreleri «Filtreler» akordeonunda tutar; masaüstünde içerik her zaman görünür.
 */
export function MobileFilterPanel({
  primary,
  children,
  activeCount = 0,
  onApply,
  onReset,
  applyLabel = 'Uygula',
  resetLabel = 'Sıfırla',
  asForm = true,
  className,
  defaultOpen = false
}: MobileFilterPanelProps): ReactElement {
  const panelId = useId()
  const [open, setOpen] = useState(defaultOpen)

  const actions = (
    <div className="flex gap-2">
      {onApply ? (
        <Button type={asForm ? 'submit' : 'button'} variant="secondary" className="min-h-11 flex-1" onClick={asForm ? undefined : onApply}>
          {applyLabel}
        </Button>
      ) : null}
      {onReset ? (
        <Button type="button" variant="outline" className="min-h-11 flex-1" onClick={onReset}>
          {resetLabel}
        </Button>
      ) : null}
    </div>
  )

  const body = (
    <>
      {primary ? <div className="space-y-3">{primary}</div> : null}

      <div className="md:hidden">
        <button
          type="button"
          className="mt-3 flex min-h-11 w-full items-center justify-between rounded-lg border border-border bg-surface-muted/40 px-3 text-sm font-semibold text-ink"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => setOpen((v) => !v)}
        >
          <span className="inline-flex items-center gap-2">
            Filtreler
            {activeCount > 0 ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                {activeCount}
              </span>
            ) : null}
          </span>
          <span className="text-ink-muted" aria-hidden>
            {open ? '▲' : '▼'}
          </span>
        </button>
        <div id={panelId} hidden={!open} className={cn('mt-3 space-y-3', !open && 'hidden')}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
          {actions}
        </div>
      </div>

      <div className="mt-3 hidden space-y-3 md:block">
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">{children}</div>
        {actions}
      </div>
    </>
  )

  if (asForm) {
    return (
      <form
        className={cn('space-y-1', className)}
        onSubmit={(e: FormEvent) => {
          e.preventDefault()
          onApply?.()
        }}
      >
        {body}
      </form>
    )
  }

  return <div className={cn('space-y-1', className)}>{body}</div>
}
