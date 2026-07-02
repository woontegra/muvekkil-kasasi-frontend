import type { ReactElement, ReactNode } from 'react'
import { formatDateTR } from '../../utils/formatters'
import { ReceiptSignatureBox } from './ReceiptSignatureBox'
import './receiptDocument.css'

export type ReceiptBuroInfo = {
  buroAdi: string
  logoUrl?: string | null
  telefon?: string | null
  eposta?: string | null
  adres?: string | null
}

type ReceiptPrintLayoutProps = {
  /** Makbuz türü — örn. TAHSİLAT MAKBUZU (AVANS) */
  title: string
  buro: ReceiptBuroInfo | string
  belgeNo?: string | null
  duzenlemeTarihi?: string | null
  printedAt: string
  showSignatures?: boolean
  footnote?: string | null
  children: ReactNode
}

function resolveBuro(buro: ReceiptBuroInfo | string): ReceiptBuroInfo {
  return typeof buro === 'string' ? { buroAdi: buro } : buro
}

function contactSummary(buro: ReceiptBuroInfo): string[] {
  return [buro.telefon, buro.eposta, buro.adres].map((v) => v?.trim()).filter(Boolean) as string[]
}

/** A4 kurumsal makbuz kabuğu — dış çerçeve, üst başlık, footer. */
export function ReceiptPrintLayout(props: ReceiptPrintLayoutProps): ReactElement {
  const {
    title,
    buro: buroProp,
    belgeNo,
    duzenlemeTarihi,
    printedAt,
    showSignatures,
    footnote,
    children
  } = props

  const buro = resolveBuro(buroProp)
  const contacts = contactSummary(buro)
  const titleUpper = title.toUpperCase()

  return (
    <div className="receipt-print">
      <div className="receipt-print__frame">
        <header className="receipt-print__header">
          <div className="receipt-print__header-left">
            {buro.logoUrl?.trim() ? (
              <img className="receipt-print__logo" src={buro.logoUrl.trim()} alt="" />
            ) : null}
            <h1 className="receipt-print__buro">{buro.buroAdi}</h1>
            {contacts.length > 0 ? (
              <div className="receipt-print__contact">
                {contacts.map((line) => (
                  <p key={line} className="receipt-print__contact-line">
                    {line}
                  </p>
                ))}
              </div>
            ) : null}
          </div>
          <div className="receipt-print__meta-box">
            <table className="receipt-print__meta-table">
              <tbody>
                <tr>
                  <td className="receipt-print__meta-label">Makbuz türü</td>
                  <td className="receipt-print__meta-value">{titleUpper}</td>
                </tr>
                <tr>
                  <td className="receipt-print__meta-label">Belge / makbuz no</td>
                  <td className="receipt-print__meta-value receipt-print__meta-value--mono">
                    {belgeNo?.trim() || '—'}
                  </td>
                </tr>
                <tr>
                  <td className="receipt-print__meta-label">Düzenleme tarihi</td>
                  <td className="receipt-print__meta-value">
                    {duzenlemeTarihi?.trim() || '—'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </header>

        <div className="receipt-print__title-band">
          <h2 className="receipt-print__title">{titleUpper}</h2>
        </div>

        <div className="receipt-print__body">{children}</div>

        {footnote?.trim() ? <p className="receipt-print__note">{footnote.trim()}</p> : null}

        {showSignatures ? <ReceiptSignatureBox /> : null}

        <footer className="receipt-print__footer">
          <div className="receipt-print__footer-main">
            <span>Yazdırma tarihi: {formatDateTR(printedAt)}</span>
            <span className="receipt-print__footer-brand">
              Bu belge Woontegra Müvekkil Kasa sistemi üzerinden oluşturulmuştur.
            </span>
          </div>
        </footer>
      </div>
    </div>
  )
}
