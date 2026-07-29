export type ToastKind = 'success' | 'error' | 'warning' | 'info' | 'loading'

export type ToastInput = {
  title?: string
  description?: string
  /** Aynı mesajın üst üste yığılmasını önlemek için (yoksa title+description+kind) */
  id?: string
  durationMs?: number
}

export type ToastItem = {
  id: string
  kind: ToastKind
  title: string
  description?: string
  durationMs: number
  createdAt: number
  /** Dedup anahtarı */
  fingerprint: string
}
