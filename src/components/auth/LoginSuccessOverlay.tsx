import { motion } from 'framer-motion'
import type { ReactElement } from 'react'
import { useMotionSettings } from '../../motion/MotionProvider'
import { transition } from '../../motion/variants'

export type LoginSuccessOverlayProps = {
  welcomeName?: string | null
}

function AnimatedSuccessIcon({ reducedMotion }: { reducedMotion: boolean }): ReactElement {
  if (reducedMotion) {
    return (
      <div
        className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success-soft"
        aria-hidden
      >
        <svg className="h-7 w-7 text-success" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    )
  }

  return (
    <div className="relative mx-auto h-14 w-14" aria-hidden>
      <svg className="h-14 w-14 -rotate-90" viewBox="0 0 56 56">
        <circle
          cx="28"
          cy="28"
          r="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-success/25"
        />
        <circle
          cx="28"
          cy="28"
          r="24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          className="text-success mk-login-success-circle"
        />
      </svg>
      <svg
        className="absolute inset-0 m-auto h-7 w-7 text-success"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
      >
        <path
          d="M20 6L9 17l-5-5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mk-login-success-check"
        />
      </svg>
    </div>
  )
}

export function LoginSuccessOverlay({ welcomeName }: LoginSuccessOverlayProps): ReactElement {
  const { reducedMotion } = useMotionSettings()
  const t = transition(reducedMotion, 'fast')

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="status"
      aria-live="polite"
      aria-label="Giriş başarılı"
    >
      <motion.div
        className="absolute inset-0 bg-[#0a1628]/25 backdrop-blur-[4px]"
        initial={reducedMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={t}
        aria-hidden
      />

      <motion.div
        className="relative w-full max-w-[400px] rounded-[20px] border border-[rgba(226,232,240,0.9)] bg-white px-6 py-7 text-center shadow-[0_16px_48px_rgba(15,23,42,0.08),0_0_0_1px_rgba(255,255,255,0.6)_inset]"
        initial={reducedMotion ? false : { opacity: 0, scale: 0.96, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={t}
      >
        <AnimatedSuccessIcon reducedMotion={reducedMotion} />

        <h2 className="mt-5 text-lg font-bold tracking-tight text-ink">Giriş başarılı</h2>
        <p className="mt-1.5 text-sm text-ink-muted">Müvekkil Kasası hazırlanıyor…</p>

        {welcomeName?.trim() ? (
          <p className="mt-3 text-xs font-medium text-primary">Hoş geldiniz, {welcomeName.trim()}</p>
        ) : null}
      </motion.div>
    </div>
  )
}
