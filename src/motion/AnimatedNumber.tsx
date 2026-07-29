import { useEffect, useRef, useState, type ReactElement } from 'react'
import { useMotionSettings } from './MotionProvider'
import { cn } from '../lib/cn'

type Props = {
  value: number
  /** Formatlayıcı — örn. formatCurrencyTR */
  format?: (n: number) => string
  durationMs?: number
  className?: string
}

/** Bakiye / tutar değişiminde canlı sayı geçişi. */
export function AnimatedNumber(props: Props): ReactElement {
  const { value, format = (n) => String(n), durationMs = 420, className } = props
  const { reducedMotion } = useMotionSettings()
  const [display, setDisplay] = useState(value)
  const fromRef = useRef(value)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    if (reducedMotion || !Number.isFinite(value)) {
      setDisplay(value)
      fromRef.current = value
      return
    }
    const from = fromRef.current
    const to = value
    if (from === to) return

    const start = performance.now()
    const tick = (now: number): void => {
      const t = Math.min(1, (now - start) / durationMs)
      const eased = 1 - Math.pow(1 - t, 3)
      const current = from + (to - from) * eased
      setDisplay(current)
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        fromRef.current = to
        setDisplay(to)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    }
  }, [value, durationMs, reducedMotion])

  return <span className={cn('tabular-nums', className)}>{format(display)}</span>
}
