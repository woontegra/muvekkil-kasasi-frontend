import { useId, useState, type FormEvent, type ReactElement, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { Button } from '../ui/Button'

export type MobileFilterPanelProps = {
  /** Her zaman üstte görünen alan (arama vb.) — stack modunda ayrı satır */
  primary?: ReactNode
  /** Açılır paneldeki / masaüstü satırdaki ek filtreler */
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
  /**
   * Masaüstü filtre grid / flex sınıfları.
   * Varsayılan: 2 / 3 / 6 sütun (sayfa özel düzen için override).
   */
  desktopFiltersClassName?: string
  /** Mobil (akordeon içi) filtre grid sınıfları. */
  mobileFiltersClassName?: string
  /**
   * true: masaüstünde primary + filtreler + Uygula/Sıfırla tek flex satırda
   * (kompakt araç çubuğu). Mobil davranışı değişmez.
   */
  desktopInlineToolbar?: boolean
  /** Masaüstü aksiyon buton sınıfları (toolbar hizası için). */
  desktopActionClassName?: string
}

const DEFAULT_DESKTOP_FILTERS =
  'grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'
const DEFAULT_MOBILE_FILTERS = 'grid grid-cols-1 gap-3 sm:grid-cols-2'

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
  defaultOpen = false,
  desktopFiltersClassName = DEFAULT_DESKTOP_FILTERS,
  mobileFiltersClassName = DEFAULT_MOBILE_FILTERS,
  desktopInlineToolbar = false,
  desktopActionClassName
}: MobileFilterPanelProps): ReactElement {
  const panelId = useId()
  const [open, setOpen] = useState(defaultOpen)

  const mobileActions = (
    <div className="flex w-full min-w-0 max-w-full flex-wrap gap-2">
      {onApply ? (
        <Button
          type={asForm ? 'submit' : 'button'}
          variant="secondary"
          size="sm"
          className="min-w-0 flex-1"
          onClick={asForm ? undefined : onApply}
        >
          {applyLabel}
        </Button>
      ) : null}
      {onReset ? (
        <Button type="button" variant="outline" size="sm" className="min-w-0 flex-1" onClick={onReset}>
          {resetLabel}
        </Button>
      ) : null}
    </div>
  )

  const desktopActions = (
    <div
      className={cn(
        'flex shrink-0 items-end gap-2',
        desktopInlineToolbar ? 'pb-0' : 'w-full flex-wrap md:justify-start'
      )}
    >
      {onApply ? (
        <Button
          type={asForm ? 'submit' : 'button'}
          variant="secondary"
          size="sm"
          className={cn(
            desktopInlineToolbar ? 'w-[90px] shrink-0 px-2' : 'min-w-0 flex-1 md:min-w-[5.5rem] md:flex-none',
            desktopActionClassName
          )}
          onClick={asForm ? undefined : onApply}
        >
          {applyLabel}
        </Button>
      ) : null}
      {onReset ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={cn(
            desktopInlineToolbar ? 'w-[90px] shrink-0 px-2' : 'min-w-0 flex-1 md:min-w-[5.5rem] md:flex-none',
            desktopActionClassName
          )}
          onClick={onReset}
        >
          {resetLabel}
        </Button>
      ) : null}
    </div>
  )

  const body = (
    <>
      {/* Mobil: arama üstte; diğer filtreler akordeonda */}
      <div className="md:hidden">
        {primary ? <div className="space-y-3">{primary}</div> : null}
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
          <div className={mobileFiltersClassName}>{children}</div>
          {mobileActions}
        </div>
      </div>

      {/* Masaüstü */}
      {desktopInlineToolbar ? (
        <div
          className={cn(
            'mt-0 hidden min-w-0 max-w-full md:flex md:flex-wrap md:items-end md:gap-2',
            desktopFiltersClassName
          )}
        >
          {primary}
          {children}
          {desktopActions}
        </div>
      ) : (
        <div className="mt-3 hidden min-w-0 max-w-full space-y-3 md:block">
          {primary ? <div className="space-y-3">{primary}</div> : null}
          <div className={cn('min-w-0 max-w-full', desktopFiltersClassName)}>{children}</div>
          {desktopActions}
        </div>
      )}
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
