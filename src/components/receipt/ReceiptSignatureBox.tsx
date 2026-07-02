import type { ReactElement } from 'react'

/** Kurumsal imza kutuları — Teslim eden / Teslim alan. */
export function ReceiptSignatureBox(): ReactElement {
  return (
    <div className="receipt-signatures">
      <div className="receipt-signature">
        <p className="receipt-signature__title">Teslim eden</p>
        <div className="receipt-signature__field">
          <span className="receipt-signature__field-label">Ad soyad</span>
          <span className="receipt-signature__field-line" />
        </div>
        <div className="receipt-signature__field">
          <span className="receipt-signature__field-label">İmza</span>
          <span className="receipt-signature__field-line receipt-signature__field-line--tall" />
        </div>
        <div className="receipt-signature__field">
          <span className="receipt-signature__field-label">Tarih</span>
          <span className="receipt-signature__field-line" />
        </div>
      </div>
      <div className="receipt-signature">
        <p className="receipt-signature__title">Teslim alan</p>
        <div className="receipt-signature__field">
          <span className="receipt-signature__field-label">Ad soyad</span>
          <span className="receipt-signature__field-line" />
        </div>
        <div className="receipt-signature__field">
          <span className="receipt-signature__field-label">İmza</span>
          <span className="receipt-signature__field-line receipt-signature__field-line--tall" />
        </div>
        <div className="receipt-signature__field">
          <span className="receipt-signature__field-label">Tarih</span>
          <span className="receipt-signature__field-line" />
        </div>
      </div>
    </div>
  )
}
