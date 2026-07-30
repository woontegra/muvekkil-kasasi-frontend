import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  type ReactElement,
  type ReactNode
} from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { createPortal } from 'react-dom'
import { Button } from './Button'
import { useMotionSettings } from '../../motion/MotionProvider'
import { modalBackdropVariants, modalPanelVariants, transition } from '../../motion/variants'
import { cn } from '../../lib/cn'
import { useSafeBackdropClose } from './useSafeBackdropClose'
import { DraggablePanel } from './DraggablePanel'

export type ConfirmOptions = {
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
}

type ConfirmApi = {
  confirm: (options: ConfirmOptions) => Promise<boolean>
}

const ConfirmContext = createContext<ConfirmApi | null>(null)

type Pending = ConfirmOptions & {
  resolve: (v: boolean) => void
}

export function ConfirmProvider(props: { children: ReactNode }): ReactElement {
  const [pending, setPending] = useState<Pending | null>(null)
  const { reducedMotion } = useMotionSettings()
  const t = transition(reducedMotion, 'fast')
  const closing = useRef(false)

  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setPending({ ...options, resolve })
    })
  }, [])

  const finish = useCallback((value: boolean) => {
    if (closing.current) return
    closing.current = true
    setPending((p) => {
      p?.resolve(value)
      return null
    })
    window.setTimeout(() => {
      closing.current = false
    }, 80)
  }, [])

  const backdrop = useSafeBackdropClose(() => finish(false))
  const api = useMemo(() => ({ confirm }), [confirm])

  return (
    <ConfirmContext.Provider value={api}>
      {props.children}
      {typeof document !== 'undefined'
        ? createPortal(
            <AnimatePresence>
              {pending ? (
                <motion.div
                  key="confirm-scrim"
                  className="fixed inset-0 z-[180] flex items-center justify-center overflow-y-auto bg-black/40 p-4 backdrop-blur-[1px]"
                  role="presentation"
                  variants={reducedMotion ? undefined : modalBackdropVariants}
                  initial={reducedMotion ? false : 'initial'}
                  animate="animate"
                  exit={reducedMotion ? undefined : 'exit'}
                  transition={t}
                  onMouseDown={backdrop.onMouseDown}
                  onMouseUp={backdrop.onMouseUp}
                >
                  <DraggablePanel
                    className="w-full max-w-md"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <motion.div
                      role="alertdialog"
                      aria-modal="true"
                      aria-labelledby="confirm-title"
                      variants={reducedMotion ? undefined : modalPanelVariants}
                      initial={reducedMotion ? false : 'initial'}
                      animate="animate"
                      exit={reducedMotion ? undefined : 'exit'}
                      transition={t}
                      className={cn(
                        'w-full overflow-hidden rounded-xl border border-border bg-white shadow-xl dark:bg-surface-elevated'
                      )}
                    >
                      <div data-modal-drag-handle className="border-b border-border px-5 py-4">
                        <h2 id="confirm-title" className="text-base font-bold text-ink">
                          {pending.title}
                        </h2>
                      </div>
                      <div className="space-y-4 px-5 py-4">
                        <p className="text-sm text-ink-muted">{pending.message}</p>
                        <div className="flex justify-end gap-2">
                          <Button type="button" variant="outline" onClick={() => finish(false)}>
                            {pending.cancelLabel ?? 'Vazgeç'}
                          </Button>
                          <Button
                            type="button"
                            variant={pending.danger ? 'danger' : 'primary'}
                            onClick={() => finish(true)}
                          >
                            {pending.confirmLabel ?? 'Onayla'}
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  </DraggablePanel>
                </motion.div>
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}
    </ConfirmContext.Provider>
  )
}

export function useConfirm(): ConfirmApi {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm: ConfirmProvider eksik')
  return ctx
}
