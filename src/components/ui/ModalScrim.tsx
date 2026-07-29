import { createPortal } from 'react-dom'
import { useRef, type MouseEvent, type ReactElement, type ReactNode } from 'react'
import { motion } from 'framer-motion'
import { cn } from '../../lib/cn'
import { useMotionSettings } from '../../motion/MotionProvider'
import { modalBackdropVariants, modalPanelVariants, transition } from '../../motion/variants'

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
  /** Panel giriş animasyonu (çıkış için üstte AnimatePresence gerekir) */
  animatePanel?: boolean
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
    innerAsDialog,
    animatePanel = true
  } = props
  const pointerDownOnBackdrop = useRef(false)
  const { reducedMotion } = useMotionSettings()
  const t = transition(reducedMotion, 'fast')

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

  const panel = (
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
      {animatePanel && !reducedMotion ? (
        <motion.div
          className="w-full"
          variants={modalPanelVariants}
          initial="initial"
          animate="animate"
          transition={t}
        >
          {children}
        </motion.div>
      ) : (
        children
      )}
    </div>
  )

  return createPortal(
    <motion.div
      className={cn(
        'fixed inset-0 flex overflow-y-auto bg-black/35 p-4 backdrop-blur-[1px]',
        align === 'top' ? 'items-start justify-center pt-[5vh]' : 'min-h-full items-center justify-center',
        zIndexClass,
        className
      )}
      role="presentation"
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      variants={reducedMotion || !animatePanel ? undefined : modalBackdropVariants}
      initial={reducedMotion || !animatePanel ? false : 'initial'}
      animate="animate"
      transition={t}
    >
      {panel}
    </motion.div>,
    document.body
  )
}
