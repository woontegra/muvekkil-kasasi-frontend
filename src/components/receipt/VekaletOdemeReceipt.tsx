import type { ReactElement } from 'react'
import type { VekaletOdemeMakbuzDto } from '../../types/vekalet'
import { formatCurrencyTR, formatDateTR } from '../../utils/formatters'
import { ReceiptPrintLayout } from './ReceiptPrintLayout'
import { ReceiptSectionTable } from './ReceiptSectionTable'

const ODEME_LABEL: Record<string, string> = {
  NAKIT: 'Nakit',
  BANKA: 'Banka',
  KREDI_KARTI: 'Kredi kartı',
  DIGER: 'Diğer'
}

type VekaletOdemeReceiptProps = {
  makbuz: VekaletOdemeMakbuzDto
  printedAt: string
}

/** Ödeme bazlı vekalet tahsilat makbuzu — A4 tek sayfa kompakt düzen. */
export function VekaletOdemeReceipt(props: VekaletOdemeReceiptProps): ReactElement {
  const { makbuz, printedAt } = props
  const buro = makbuz.buro as {
    buroAdi?: string
    telefon?: string | null
    eposta?: string | null
    adres?: string | null
  }
  const muvekkil = makbuz.muvekkil as { gorunenAd?: string }
  const dosya = makbuz.dosya as { konuBasligi?: string }
  const odemeYontemi = ODEME_LABEL[makbuz.odemeYontemi] ?? makbuz.odemeYontemi

  return (
    <ReceiptPrintLayout
      title="Vekalet Tahsilat Makbuzu"
      compact
      hideTitleBand
      buro={{
        buroAdi: buro.buroAdi ?? '—',
        telefon: buro.telefon,
        eposta: buro.eposta,
        adres: buro.adres
      }}
      belgeNo={makbuz.makbuzNo}
      duzenlemeTarihi={formatDateTR(makbuz.odemeTarihi)}
      printedAt={printedAt}
    >
      <div className="receipt-print__grid-2">
        <ReceiptSectionTable
          title="Müvekkil / dosya"
          rows={[
            { label: 'Müvekkil', value: muvekkil.gorunenAd },
            { label: 'Dosya konusu', value: dosya.konuBasligi },
            { label: 'Mahkeme / icra', value: makbuz.mahkemeIcra },
            { label: 'Dosya no', value: makbuz.dosyaNo, mono: true }
          ]}
        />
        <ReceiptSectionTable
          title="Tahsilat"
          rows={[
            { label: 'Taksit no', value: String(makbuz.taksitNo) },
            { label: 'Taksit tutarı', value: formatCurrencyTR(Number(makbuz.taksitTutari)), amount: true },
            ...(makbuz.taksitOdenenToplam != null
              ? [{ label: 'Taksitte ödenen', value: formatCurrencyTR(Number(makbuz.taksitOdenenToplam)), amount: true }]
              : []),
            ...(makbuz.taksitKalanTutar != null
              ? [{ label: 'Taksit kalan', value: formatCurrencyTR(Number(makbuz.taksitKalanTutar)), amount: true }]
              : []),
            { label: 'Ödeme tarihi', value: formatDateTR(makbuz.odemeTarihi) },
            { label: 'Ödeme yöntemi', value: odemeYontemi },
            {
              label: 'Bu makbuz',
              value: formatCurrencyTR(Number(makbuz.tahsilatTutari)),
              amount: true,
              highlightAmount: true
            },
            { label: 'Makbuz no', value: makbuz.makbuzNo, mono: true },
            { label: 'SMM', value: makbuz.smmKesildiMi ? 'Kesildi' : 'Bekliyor' }
          ]}
        />
      </div>

      <ReceiptSectionTable
        title="Vekalet özeti"
        rows={[
          { label: 'Anlaşılan', value: formatCurrencyTR(Number(makbuz.anlasilanVekalet)), amount: true },
          { label: 'Ödenen toplam', value: formatCurrencyTR(Number(makbuz.odenenToplam)), amount: true },
          { label: 'Kalan vekalet', value: formatCurrencyTR(Number(makbuz.kalanVekalet)), amount: true }
        ]}
      />

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
