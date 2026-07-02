import { useRef, type MouseEvent } from 'react'

/** Backdrop kapatma — mouseDown backdrop'ta başlamadıysa (ör. input seçimi) kapatmaz. */
export function useSafeBackdropClose(onClose: () => void, disabled?: boolean) {
  const pointerDownOnBackdrop = useRef(false)

  return {
    onMouseDown: (e: MouseEvent<HTMLElement>) => {
      pointerDownOnBackdrop.current = e.target === e.currentTarget
    },
    onMouseUp: (e: MouseEvent<HTMLElement>) => {
      if (!disabled && pointerDownOnBackdrop.current && e.target === e.currentTarget) {
        onClose()
      }
      pointerDownOnBackdrop.current = false
    }
  }
}
