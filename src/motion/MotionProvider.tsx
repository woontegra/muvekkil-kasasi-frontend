import { createContext, useContext, type ReactElement, type ReactNode } from 'react'
import { usePrefersReducedMotion } from './usePrefersReducedMotion'

type MotionContextValue = {
  reducedMotion: boolean
}

const MotionContext = createContext<MotionContextValue>({ reducedMotion: false })

export function MotionProvider(props: { children: ReactNode }): ReactElement {
  const reducedMotion = usePrefersReducedMotion()
  return <MotionContext.Provider value={{ reducedMotion }}>{props.children}</MotionContext.Provider>
}

export function useMotionSettings(): MotionContextValue {
  return useContext(MotionContext)
}
