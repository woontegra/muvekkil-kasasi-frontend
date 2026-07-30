import type { ReactElement } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useLocation, useOutlet } from 'react-router-dom'
import { useMotionSettings } from './MotionProvider'
import { pageVariants, transition } from './variants'

/** Route değişiminde hızlı fade/slide — Outlet yerine kullanılır. */
export function PageTransition(): ReactElement {
  const outlet = useOutlet()
  const location = useLocation()
  const { reducedMotion } = useMotionSettings()
  const t = transition(reducedMotion, 'fast')

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        className="w-full min-w-0"
        variants={reducedMotion ? undefined : pageVariants}
        initial={reducedMotion ? false : 'initial'}
        animate="animate"
        exit={reducedMotion ? undefined : 'exit'}
        transition={t}
      >
        {outlet}
      </motion.div>
    </AnimatePresence>
  )
}
