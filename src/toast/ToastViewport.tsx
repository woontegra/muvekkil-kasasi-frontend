import { createPortal } from 'react-dom'
import type { ReactElement } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useMotionSettings } from '../motion/MotionProvider'
import { toastVariants, transition } from '../motion/variants'
import { cn } from '../lib/cn'
import type { ToastItem, ToastKind } from './types'

const KIND_STYLES: Record<ToastKind, string> = {
  success: 'border-success/40 bg-success-soft text-success-ink',
  error: 'border-danger/40 bg-danger-soft text-danger',
  warning: 'border-warning/45 bg-warning-soft text-warning-ink',
  info: 'border-primary/30 bg-primary-soft text-primary',
  loading: 'border-border bg-panel text-ink'
}

const KIND_DOT: Record<ToastKind, string> = {
  success: 'bg-success',
  error: 'bg-danger',
  warning: 'bg-warning',
  info: 'bg-primary',
  loading: 'bg-accent animate-pulse'
}

const KIND_LABEL: Record<ToastKind, string> = {
  success: 'Başarılı',
  error: 'Hata',
  warning: 'Uyarı',
  info: 'Bilgi',
  loading: 'İşleniyor'
}

type Props = {
  items: ToastItem[]
  onDismiss: (id: string) => void
}

export function ToastViewport(props: Props): ReactElement | null {
  const { items, onDismiss } = props
  const { reducedMotion } = useMotionSettings()
  const t = transition(reducedMotion, 'base')

  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 top-0 z-[400] flex flex-col items-end gap-2 p-3 sm:p-4"
      aria-live="polite"
      aria-relevant="additions"
    >
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.div
            key={item.id}
            layout={!reducedMotion}
            variants={reducedMotion ? undefined : toastVariants}
            initial={reducedMotion ? false : 'initial'}
            animate="animate"
            exit={reducedMotion ? undefined : 'exit'}
            transition={t}
            className={cn(
              'pointer-events-auto w-full max-w-[min(100%,22rem)] overflow-hidden rounded-lg border px-3 py-2.5 shadow-lg',
              KIND_STYLES[item.kind]
            )}
            role={item.kind === 'error' ? 'alert' : 'status'}
          >
            <div className="flex items-start gap-2.5">
              <span className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', KIND_DOT[item.kind])} aria-hidden />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wide opacity-70">{KIND_LABEL[item.kind]}</p>
                <p className="text-sm font-semibold leading-snug">{item.title}</p>
                {item.description ? <p className="mt-0.5 text-xs leading-snug opacity-90">{item.description}</p> : null}
              </div>
              {item.kind !== 'loading' ? (
                <button
                  type="button"
                  className="shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold opacity-60 transition hover:opacity-100"
                  onClick={() => onDismiss(item.id)}
                  aria-label="Kapat"
                >
                  ✕
                </button>
              ) : null}
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>,
    document.body
  )
}
