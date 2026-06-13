import type { ReactElement, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Button, Card, CardBody, CardHeader, CardTitle } from '../ui'

function ModalScrim({ children, onClose }: { children: ReactNode; onClose: () => void }): ReactElement {
  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex min-h-full items-center justify-center overflow-y-auto bg-black/35 p-4 backdrop-blur-[1px]"
      role="presentation"
      onClick={onClose}
    >
      <div className="my-auto flex w-full min-w-0 max-w-full justify-center px-0 py-4 sm:px-2" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    document.body
  )
}

export function AdminConfirmDialog(props: {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  danger?: boolean
  loading?: boolean
  onCancel: () => void
  onConfirm: () => void
}): ReactElement | null {
  if (!props.open) return null
  return (
    <ModalScrim onClose={props.onCancel}>
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="border-b border-border">
          <CardTitle>{props.title}</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4 px-4 py-4">
          <p className="text-sm text-ink-muted">{props.message}</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={props.onCancel} disabled={props.loading}>
              Vazgeç
            </Button>
            <Button
              type="button"
              variant={props.danger ? 'danger' : 'primary'}
              onClick={props.onConfirm}
              disabled={props.loading}
            >
              {props.loading ? '…' : props.confirmLabel}
            </Button>
          </div>
        </CardBody>
      </Card>
    </ModalScrim>
  )
}
