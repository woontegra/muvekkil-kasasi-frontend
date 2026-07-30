import type { Transition, Variants } from 'framer-motion'

/** Kurumsal, hızlı easing — oyuncak hissi yok. */
export const easeOut = [0.22, 1, 0.36, 1] as const

export const duration = {
  instant: 0.12,
  fast: 0.18,
  base: 0.28,
  slow: 0.4
} as const

export function transition(reduced: boolean, ms: keyof typeof duration = 'base'): Transition {
  if (reduced) return { duration: 0.01 }
  return { duration: duration[ms], ease: easeOut }
}

export const pageVariants: Variants = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 }
}

export const fadeVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
}

export const modalBackdropVariants: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
}

export const modalPanelVariants: Variants = {
  initial: { opacity: 0, y: 10, scale: 0.98 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: 6, scale: 0.99 }
}

export const staggerContainer: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.045, delayChildren: 0.02 }
  }
}

export const staggerItem: Variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 }
}

export const toastVariants: Variants = {
  initial: { opacity: 0, y: -16, scale: 0.94, x: 12 },
  animate: { opacity: 1, y: 0, scale: 1, x: 0 },
  exit: { opacity: 0, y: -10, scale: 0.96, x: 8 }
}

/** Login / public auth — daha belirgin giriş animasyonu. */
export const authHeroContainer: Variants = {
  initial: {},
  animate: {
    transition: { staggerChildren: 0.09, delayChildren: 0.12 }
  }
}

export const authHeroItem: Variants = {
  initial: { opacity: 0, y: 22 },
  animate: { opacity: 1, y: 0 }
}

export const authCardVariants: Variants = {
  initial: { opacity: 0, y: 32, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 }
}

export const rowVariants: Variants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0 },
  // Layout yüksekliğini değiştirme — yalnızca opacity/transform (odak/ölçü bozulmasın)
  exit: { opacity: 0, y: -2 }
}
