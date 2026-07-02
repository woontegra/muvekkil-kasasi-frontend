/**
 * Geriye dönük uyumluluk — yeni bileşenler ReceiptPrintLayout / ReceiptSectionTable.
 */
import type { ReactElement, ReactNode } from 'react'
import { ReceiptPrintLayout, type ReceiptBuroInfo } from './ReceiptPrintLayout'
import { ReceiptSectionTable, type ReceiptSectionRow } from './ReceiptSectionTable'

export type ReceiptInfoRow = ReceiptSectionRow

export type { ReceiptBuroInfo }

type ReceiptDocumentShellProps = {
  title: string
  buroAdi: string
  buro?: ReceiptBuroInfo
  belgeNo?: string | null
  duzenlemeTarihi?: string | null
  printedAt: string
  showSignatures?: boolean
  footnote?: string | null
  children: ReactNode
}

export function ReceiptInfoSection(props: { title: string; rows: ReceiptInfoRow[] }): ReactElement {
  return <ReceiptSectionTable title={props.title} rows={props.rows} />
}

export function ReceiptDocumentShell(props: ReceiptDocumentShellProps): ReactElement {
  const buro: ReceiptBuroInfo = props.buro ?? { buroAdi: props.buroAdi }

  return (
    <ReceiptPrintLayout
      title={props.title}
      buro={buro}
      belgeNo={props.belgeNo}
      duzenlemeTarihi={props.duzenlemeTarihi}
      printedAt={props.printedAt}
      showSignatures={props.showSignatures}
      footnote={props.footnote}
    >
      {props.children}
    </ReceiptPrintLayout>
  )
}
