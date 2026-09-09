import type { ReactElement, ReactNode } from 'react'
import { Button, DraggablePanel } from '../ui'

export function SettingRow(props: { label: string; value: ReactNode; mono?: boolean }): ReactElement {
  const { label, value, mono } = props
  return (
    <div className="flex flex-col gap-0.5 border-b border-border py-2.5 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</span>
      <span className={`min-w-0 text-sm text-ink ${mono ? 'font-mono text-[13px]' : ''}`}>{value ?? '—'}</span>
    </div>
  )
}

export function ModalShell(props: {
  title: string
  onClose: () => void
  children: ReactNode
  /** Panel genişliği / yükseklik; varsayılan max-w-lg */
  panelClassName?: string
  /** İçerik alanı padding / spacing override */
  bodyClassName?: string
  /** Dış overlay (varsayılan z-50) */
  overlayClassName?: string
}): ReactElement {
  const { title, onClose, children, panelClassName, bodyClassName, overlayClassName } = props
  return (
    <div
      className={`fixed inset-0 flex items-end justify-center bg-black/45 p-0 backdrop-blur-[1px] sm:items-center sm:p-4 ${
        overlayClassName ?? 'z-50'
      }`}
    >
      <DraggablePanel
        role="dialog"
        aria-modal="true"
        className={`flex max-h-[min(92dvh,90vh)] w-full max-w-lg flex-col overflow-hidden rounded-t-xl border border-border bg-white shadow-xl dark:bg-surface-elevated sm:rounded-xl ${panelClassName ?? ''}`}
      >
        <div
          data-modal-drag-handle
          className="flex shrink-0 items-start justify-between gap-2 border-b border-border px-4 py-3 sm:px-6"
        >
          <h2 className="text-base font-bold text-ink">{title}</h2>
          <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0" onClick={onClose}>
            ✕
          </Button>
        </div>
        <div
          className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 ${bodyClassName ?? ''}`}
        >
          {children}
        </div>
      </DraggablePanel>
    </div>
  )
}

export function AyarlarPanelShell(props: {
  title: string
  description?: string
  children: ReactNode
}): ReactElement {
  return (
    <div className="min-w-0 space-y-4">
      <div className="border-b border-border pb-3">
        <h2 className="text-lg font-bold text-ink">{props.title}</h2>
        {props.description ? <p className="mt-1 text-sm text-ink-muted">{props.description}</p> : null}
      </div>
      {props.children}
    </div>
  )
}
