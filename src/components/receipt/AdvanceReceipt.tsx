import type { ReactElement } from 'react'
import type { AuthTenantDto } from '../../types/auth'
import type { DosyaDto } from '../../types/dosya'
import type { KasaHareketiDto } from '../../types/kasa'
import type { MuvekkilDto } from '../../types/muvekkil'
import { formatCurrencyTR, formatDateTR } from '../../utils/formatters'
import { mahkemeIcraSatir } from '../../lib/dosyaLabels'
import { ReceiptPrintLayout } from './ReceiptPrintLayout'
import { ReceiptSectionTable } from './ReceiptSectionTable'

type AdvanceReceiptProps = {
  tenant: AuthTenantDto
  dosya: DosyaDto
  muvekkil: MuvekkilDto
  hareket: KasaHareketiDto
  printedAt: string
}

/** Onaylı avans girişi tahsilat makbuzu — A4 tek sayfa kompakt düzen. */
export function AdvanceReceipt(props: AdvanceReceiptProps): ReactElement {
  const { tenant, dosya, muvekkil, hareket, printedAt } = props
  const mahIcr = mahkemeIcraSatir(dosya)

  return (
    <ReceiptPrintLayout
      title="Tahsilat Makbuzu (Avans)"
      compact
      hideTitleBand
      buro={{
        buroAdi: tenant.buroAdi,
        telefon: tenant.telefon,
        eposta: tenant.eposta,
        adres: tenant.adres
      }}
      belgeNo={hareket.belgeNo}
      duzenlemeTarihi={formatDateTR(hareket.tarih)}
      printedAt={printedAt}
      footnote="Bu makbuz, dosya kasasına yapılan avans tahsilatını belgeler. Orijinal satır kasa hareketleri kaydına aittir."
    >
      <div className="receipt-print__grid-2">
        <ReceiptSectionTable
          title="Müvekkil / dosya"
          rows={[
            { label: 'Müvekkil', value: muvekkil.gorunenAd },
            { label: 'Dosya konusu', value: dosya.konuBasligi },
            { label: 'Mahkeme / icra', value: mahIcr || null },
            { label: 'Dosya no', value: dosya.dosyaNo, mono: true }
          ]}
        />
        <ReceiptSectionTable
          title="Tahsilat"
          rows={[
            { label: 'Tahsilat tarihi', value: formatDateTR(hareket.tarih) },
            {
              label: 'Tutar',
              value: formatCurrencyTR(Number(hareket.tutar)),
              amount: true,
              highlightAmount: true
            },
            { label: 'Belge / makbuz no', value: hareket.belgeNo, mono: true },
            ...(hareket.aciklama?.trim()
              ? [{ label: 'Açıklama', value: hareket.aciklama.trim() }]
              : [])
          ]}
        />
      </div>

      <div className="receipt-print__sign-row">
        <div className="receipt-print__sign-box">
          <div className="receipt-print__sign-lbl">Teslim eden</div>
          <div className="receipt-print__sign-line" />
          <div className="receipt-print__sign-sub">Ad soyad · imza · tarih</div>
        </div>
        <div className="receipt-print__sign-box">
          <div className="receipt-print__sign-lbl">Teslim alan</div>
          <div className="receipt-print__sign-line" />
          <div className="receipt-print__sign-sub">Ad soyad · imza · tarih</div>
        </div>
      </div>
    </ReceiptPrintLayout>
  )
}
