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

export function ModalShell(props: { title: string; onClose: () => void; children: ReactNode }): ReactElement {
  const { title, onClose, children } = props
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
      <DraggablePanel
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-white p-5 shadow-xl dark:bg-surface-elevated"
      >
        <div data-modal-drag-handle className="mb-4 flex items-start justify-between gap-2">
          <h2 className="text-base font-bold text-ink">{title}</h2>
          <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0" onClick={onClose}>
            ✕
          </Button>
        </div>
        {children}
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
