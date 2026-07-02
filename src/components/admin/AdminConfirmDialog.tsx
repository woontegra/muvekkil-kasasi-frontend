import type { ReactElement } from 'react'
import { Button, Card, CardBody, CardHeader, CardTitle, ModalScrim } from '../ui'

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
    <ModalScrim onClose={props.onCancel} disabled={props.loading}>
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
