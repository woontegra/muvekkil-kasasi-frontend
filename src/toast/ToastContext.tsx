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
import type { ToastInput, ToastItem, ToastKind } from './types'
import { ToastViewport } from './ToastViewport'

type ToastApi = {
  push: (kind: ToastKind, input: string | ToastInput) => string
  success: (input: string | ToastInput) => string
  error: (input: string | ToastInput) => string
  warning: (input: string | ToastInput) => string
  info: (input: string | ToastInput) => string
  loading: (input: string | ToastInput) => string
  dismiss: (id: string) => void
  update: (id: string, kind: ToastKind, input: string | ToastInput) => void
}

const ToastContext = createContext<ToastApi | null>(null)

const DEFAULT_DURATION: Record<ToastKind, number> = {
  success: 3200,
  error: 5200,
  warning: 4200,
  info: 3600,
  loading: 0
}

let seq = 0
function nextId(): string {
  seq += 1
  return `t-${Date.now()}-${seq}`
}

function normalize(kind: ToastKind, input: string | ToastInput): {
  title: string
  description?: string
  id?: string
  durationMs: number
  fingerprint: string
} {
  if (typeof input === 'string') {
    return {
      title: input,
      durationMs: DEFAULT_DURATION[kind],
      fingerprint: `${kind}::${input}`
    }
  }
  const title = input.title?.trim() || input.description?.trim() || 'Bildirim'
  const description = input.title?.trim() ? input.description?.trim() : undefined
  const fingerprint = input.id ?? `${kind}::${title}::${description ?? ''}`
  return {
    title,
    description,
    id: input.id,
    durationMs: input.durationMs ?? DEFAULT_DURATION[kind],
    fingerprint
  }
}

export function ToastProvider(props: { children: ReactNode }): ReactElement {
  const [items, setItems] = useState<ToastItem[]>([])
  const timers = useRef<Map<string, number>>(new Map())

  const clearTimer = useCallback((id: string) => {
    const t = timers.current.get(id)
    if (t != null) {
      window.clearTimeout(t)
      timers.current.delete(id)
    }
  }, [])

  const dismiss = useCallback(
    (id: string) => {
      clearTimer(id)
      setItems((prev) => prev.filter((x) => x.id !== id))
    },
    [clearTimer]
  )

  const schedule = useCallback(
    (item: ToastItem) => {
      clearTimer(item.id)
      if (item.durationMs <= 0) return
      const t = window.setTimeout(() => dismiss(item.id), item.durationMs)
      timers.current.set(item.id, t)
    },
    [clearTimer, dismiss]
  )

  const push = useCallback(
    (kind: ToastKind, input: string | ToastInput): string => {
      const n = normalize(kind, input)
      let resolvedId = n.id ?? nextId()

      setItems((prev) => {
        const existing = prev.find((x) => x.fingerprint === n.fingerprint && x.kind === kind)
        if (existing) {
          resolvedId = existing.id
          const refreshed: ToastItem = {
            ...existing,
            title: n.title,
            description: n.description,
            durationMs: n.durationMs,
            createdAt: Date.now()
          }
          schedule(refreshed)
          return prev.map((x) => (x.id === existing.id ? refreshed : x))
        }
        const item: ToastItem = {
          id: resolvedId,
          kind,
          title: n.title,
          description: n.description,
          durationMs: n.durationMs,
          createdAt: Date.now(),
          fingerprint: n.fingerprint
        }
        schedule(item)
        return [...prev, item].slice(-6)
      })

      return resolvedId
    },
    [schedule]
  )

  const update = useCallback(
    (id: string, kind: ToastKind, input: string | ToastInput) => {
      const n = normalize(kind, input)
      setItems((prev) => {
        const next = prev.map((x) => {
          if (x.id !== id) return x
          const item: ToastItem = {
            ...x,
            kind,
            title: n.title,
            description: n.description,
            durationMs: n.durationMs,
            fingerprint: n.fingerprint,
            createdAt: Date.now()
          }
          schedule(item)
          return item
        })
        return next
      })
    },
    [schedule]
  )

  const api = useMemo<ToastApi>(
    () => ({
      push,
      success: (i) => push('success', i),
      error: (i) => push('error', i),
      warning: (i) => push('warning', i),
      info: (i) => push('info', i),
      loading: (i) => push('loading', i),
      dismiss,
      update
    }),
    [push, dismiss, update]
  )

  return (
    <ToastContext.Provider value={api}>
      {props.children}
      <ToastViewport items={items} onDismiss={dismiss} />
    </ToastContext.Provider>
  )
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast: ToastProvider eksik')
  return ctx
}
