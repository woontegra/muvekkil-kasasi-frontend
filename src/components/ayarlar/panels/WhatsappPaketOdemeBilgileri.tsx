import type { ReactElement } from 'react'
import { useState } from 'react'
import {
  WHATSAPP_PAKET_ODEME_HESAPLARI,
  compactIban,
  formatIbanGrouped,
  type WhatsAppPaketOdemeHesabi
} from '../../../config/whatsappPaketOdemeHesaplari'
import { Button } from '../../ui'

async function copyText(value: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(value)
    return true
  } catch {
    try {
      const ta = document.createElement('textarea')
      ta.value = value
      ta.setAttribute('readonly', '')
      ta.style.position = 'fixed'
      ta.style.left = '-9999px'
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}

function OdemeHesabiKarti(props: {
  hesap: WhatsAppPaketOdemeHesabi
  onCopied: (label: string) => void
}): ReactElement {
  const [busy, setBusy] = useState(false)
  return (
    <div className="rounded-lg border border-border bg-white px-3.5 py-3.5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-ink">{props.hesap.bankaAdi}</p>
          <p className="mt-1 text-xs leading-snug text-ink-muted">{props.hesap.hesapSahibi}</p>
          <p className="mt-2 font-mono text-sm tracking-wide text-ink break-all">
            {formatIbanGrouped(props.hesap.iban)}
          </p>
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          className="shrink-0"
          disabled={busy}
          onClick={() => {
            setBusy(true)
            void copyText(compactIban(props.hesap.iban)).then((ok) => {
              setBusy(false)
              props.onCopied(ok ? 'IBAN kopyalandı.' : 'IBAN kopyalanamadı.')
            })
          }}
        >
          {busy ? 'Kopyalanıyor…' : "IBAN'ı Kopyala"}
        </Button>
      </div>
    </div>
  )
}

export function WhatsappPaketOdemeHesaplariListesi(props: {
  onCopied: (label: string) => void
  title?: string
}): ReactElement {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        {props.title ?? 'Ödeme Yapabileceğiniz Hesaplar'}
      </p>
      <ul className="mt-2.5 space-y-2.5">
        {WHATSAPP_PAKET_ODEME_HESAPLARI.map((h) => (
          <li key={h.id}>
            <OdemeHesabiKarti hesap={h} onCopied={props.onCopied} />
          </li>
        ))}
      </ul>
    </div>
  )
}

export function WhatsappPaketOdemeReferansiKutusu(props: {
  paymentReference: string
  onCopied: (label: string) => void
  bilgilendirme: string
}): ReactElement {
  const [busy, setBusy] = useState(false)
  return (
    <div className="rounded-lg border border-border bg-surface-muted/50 px-3 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
        Havale/EFT Açıklaması
      </p>
      <p className="mt-1 font-mono text-base font-semibold tracking-wide text-ink">
        {props.paymentReference}
      </p>
      <div className="mt-2.5">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => {
            setBusy(true)
            void copyText(props.paymentReference).then((ok) => {
              setBusy(false)
              props.onCopied(ok ? 'Açıklama kopyalandı.' : 'Açıklama kopyalanamadı.')
            })
          }}
        >
          {busy ? 'Kopyalanıyor…' : 'Açıklamayı Kopyala'}
        </Button>
      </div>
      <p className="mt-2 text-xs leading-relaxed text-ink-muted">{props.bilgilendirme}</p>
    </div>
  )
}
