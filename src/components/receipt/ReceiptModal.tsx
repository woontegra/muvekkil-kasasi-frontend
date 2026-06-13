import type { ReactElement, ReactNode } from 'react'
import { Button } from '../ui'

type ReceiptModalProps = {
  title: string
  printRootId: string
  onClose: () => void
  children: ReactNode
}

/**
 * Makbuz / hesap özeti: modal + @media print ile yalnızca içerik görünür.
 */
export function ReceiptModal(props: ReceiptModalProps): ReactElement {
  const { title, printRootId, onClose, children } = props

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 print:static print:inset-auto print:bg-white print:p-0">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #${printRootId}, #${printRootId} * { visibility: visible !important; }
          #${printRootId} {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 12mm !important;
            background: white !important;
            color: #111 !important;
            box-shadow: none !important;
          }
        }
      `}</style>
      <div
        id={printRootId}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-lg border border-border bg-white shadow-xl print:max-h-none print:overflow-visible print:rounded-none print:border-0 print:shadow-none"
      >
        <div className="no-print flex items-center justify-between gap-2 border-b border-border px-4 py-3">
          <h2 className="text-sm font-bold text-ink">{title}</h2>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={() => window.print()}>
              Yazdır
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onClose}>
              Kapat
            </Button>
          </div>
        </div>
        <div className="p-6 text-sm text-black">{children}</div>
      </div>
    </div>
  )
}
