import { createPortal } from 'react-dom'
import { useRef, type MouseEvent, type ReactElement, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

type Props = {
  children: ReactNode
  onClose: () => void
  /** true ise backdrop tıklaması modalı kapatmaz */
  disabled?: boolean
  className?: string
  innerClassName?: string
  zIndexClass?: string
  /** 'top' — icra vb. üstten hizalı modallar */
  align?: 'center' | 'top'
  wide?: boolean
  innerAsDialog?: boolean
}

/**
 * Modal arka planı — input seçimi sırasında mouse modal dışına taşınsa bile kapanmaz.
 * Kapatma yalnızca backdrop üzerinde başlayıp backdrop üzerinde biten tıklamada çalışır.
 */
export function ModalScrim(props: Props): ReactElement | null {
  const {
    children,
    onClose,
    disabled,
    className,
    innerClassName,
    zIndexClass = 'z-[100]',
    align = 'center',
    wide,
    innerAsDialog
  } = props
  const pointerDownOnBackdrop = useRef(false)

  const handleMouseDown = (e: MouseEvent<HTMLDivElement>) => {
    pointerDownOnBackdrop.current = e.target === e.currentTarget
  }

  const handleMouseUp = (e: MouseEvent<HTMLDivElement>) => {
    if (!disabled && pointerDownOnBackdrop.current && e.target === e.currentTarget) {
      onClose()
    }
    pointerDownOnBackdrop.current = false
  }

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className={cn(
        'fixed inset-0 flex overflow-y-auto bg-black/35 p-4 backdrop-blur-[1px]',
        align === 'top' ? 'items-start justify-center pt-[5vh]' : 'min-h-full items-center justify-center',
        zIndexClass,
        className
      )}
      role="presentation"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
    >
      <div
        className={cn(
          align === 'top'
            ? wide
              ? 'w-full max-w-4xl'
              : 'w-full max-w-2xl'
            : 'my-auto flex w-full min-w-0 max-w-full justify-center px-0 py-4 sm:px-2',
          innerClassName
        )}
        role={innerAsDialog ? 'dialog' : undefined}
        aria-modal={innerAsDialog ? true : undefined}
        onMouseDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>,
    document.body
  )
}
