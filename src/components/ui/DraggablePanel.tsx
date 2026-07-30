import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type HTMLAttributes,
  type PointerEvent as ReactPointerEvent,
  type ReactElement,
  type ReactNode
} from 'react'
import { cn } from '../../lib/cn'

const NO_DRAG_SELECTOR =
  'button, a, input, textarea, select, label, option, [data-no-drag], [role="button"], [contenteditable="true"]'

function canStartDrag(target: EventTarget | null, panel: HTMLElement, clientY: number): boolean {
  if (!(target instanceof Element)) return false
  if (target.closest(NO_DRAG_SELECTOR)) return false
  if (target.closest('[data-modal-drag-handle], header')) return true
  const rect = panel.getBoundingClientRect()
  return clientY - rect.top <= 56
}

type Props = {
  children: ReactNode
  className?: string
  style?: CSSProperties
  /** false ise sürükleme kapalı (ör. yazdırma). */
  enabled?: boolean
} & Omit<HTMLAttributes<HTMLDivElement>, 'children' | 'className' | 'style'>

/**
 * Modal paneli için tut-sürükle.
 * Başlık (`header` / `[data-modal-drag-handle]`) veya üst ~56px chrome alanından sürüklenir.
 */
export function DraggablePanel({
  children,
  className,
  style,
  enabled = true,
  onPointerDown,
  ...rest
}: Props): ReactElement {
  const panelRef = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const drag = useRef<{ pointerX: number; pointerY: number; offsetX: number; offsetY: number } | null>(null)

  useEffect(() => {
    if (!enabled) return

    const onMove = (e: PointerEvent) => {
      if (!drag.current) return
      setOffset({
        x: drag.current.offsetX + (e.clientX - drag.current.pointerX),
        y: drag.current.offsetY + (e.clientY - drag.current.pointerY)
      })
    }

    const onUp = () => {
      if (!drag.current) return
      drag.current = null
      setDragging(false)
      document.body.style.removeProperty('user-select')
      document.body.style.removeProperty('cursor')
    }

    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [enabled])

  const handlePointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    onPointerDown?.(e)
    if (!enabled || e.defaultPrevented || e.button !== 0) return
    const panel = panelRef.current
    if (!panel || !canStartDrag(e.target, panel, e.clientY)) return

    drag.current = {
      pointerX: e.clientX,
      pointerY: e.clientY,
      offsetX: offset.x,
      offsetY: offset.y
    }
    setDragging(true)
    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'grabbing'
    e.preventDefault()
  }

  const mergedStyle: CSSProperties = {
    ...style,
    transform: `translate(${offset.x}px, ${offset.y}px)`
  }

  return (
    <div
      ref={panelRef}
      {...rest}
      className={cn(
        enabled && '[&_header]:cursor-grab [&_[data-modal-drag-handle]]:cursor-grab',
        dragging && 'cursor-grabbing [&_header]:cursor-grabbing [&_[data-modal-drag-handle]]:cursor-grabbing',
        className
      )}
      style={mergedStyle}
      onPointerDown={handlePointerDown}
    >
      {children}
    </div>
  )
}
