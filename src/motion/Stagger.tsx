import type { ReactElement, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { useMotionSettings } from './MotionProvider'
import { staggerContainer, staggerItem, transition } from './variants'
import { cn } from '../lib/cn'

export function Stagger(props: { children: ReactNode; className?: string }): ReactElement {
  const { reducedMotion } = useMotionSettings()
  if (reducedMotion) {
    return <div className={props.className}>{props.children}</div>
  }
  return (
    <motion.div
      className={props.className}
      variants={staggerContainer}
      initial="initial"
      animate="animate"
    >
      {props.children}
    </motion.div>
  )
}

export function StaggerItem(props: { children: ReactNode; className?: string }): ReactElement {
  const { reducedMotion } = useMotionSettings()
  if (reducedMotion) {
    return <div className={props.className}>{props.children}</div>
  }
  return (
    <motion.div className={props.className} variants={staggerItem} transition={transition(false, 'fast')}>
      {props.children}
    </motion.div>
  )
}

/** Kartlara varsayılan hafif giriş — mevcut Card API'sini bozmaz. */
export function MotionCardShell(props: { children: ReactNode; className?: string }): ReactElement {
  return <div className={cn('motion-card-in', props.className)}>{props.children}</div>
}
