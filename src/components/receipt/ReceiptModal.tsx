import type { ReactElement, ReactNode } from 'react'
import { Button } from '../ui'
import './receiptDocument.css'

type ReceiptModalProps = {
  title: string
  printRootId: string
  onClose: () => void
  children: ReactNode
  /** Modal üstünde no-print açıklama (yazdırmaya dahil edilmez). */
  hint?: string
  /** Yazdır butonu metni. */
  printButtonLabel?: string
  /** İçerik sarmalayıcı class (ör. baskıya özel ekstre stilleri). */
  contentClassName?: string
}

/**
 * Makbuz / hesap özeti: modal + @media print ile yalnızca içerik görünür.
 */
export function ReceiptModal(props: ReceiptModalProps): ReactElement {
  const { title, printRootId, onClose, children, hint, printButtonLabel = 'Yazdır', contentClassName } =
    props

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
            padding: 0 !important;
            background: white !important;
            color: #111 !important;
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            max-width: none !important;
            max-height: none !important;
            overflow: visible !important;
          }
          #${printRootId} .receipt-print {
            max-width: 100% !important;
            width: 100% !important;
            margin: 0 !important;
          }
          .no-print { display: none !important; }
        }
        @page { size: A4 portrait; margin: 10mm 12mm; }
      `}</style>
      <div
        id={printRootId}
        className="max-h-[90vh] w-full max-w-[860px] overflow-y-auto rounded-lg border border-border bg-white shadow-xl print:max-h-none print:max-w-none print:overflow-visible print:rounded-none print:border-0 print:p-0 print:shadow-none"
      >
        <div className="no-print border-b border-border bg-surface-muted/40 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-bold text-ink">{title}</h2>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={() => window.print()}>
                {printButtonLabel}
              </Button>
              <Button type="button" size="sm" variant="outline" onClick={onClose}>
                Kapat
              </Button>
            </div>
          </div>
          {hint ? <p className="mt-2 text-xs text-ink-muted">{hint}</p> : null}
        </div>
        <div className={contentClassName ? `p-4 print:p-0 ${contentClassName}` : 'p-4 print:p-0'}>
          {children}
        </div>
      </div>
    </div>
  )
}
