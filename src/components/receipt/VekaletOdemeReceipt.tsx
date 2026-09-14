import type { ReactElement } from 'react'
import type { VekaletOdemeMakbuzDto } from '../../types/vekalet'
import { formatDateTR, formatKurOzeti, formatMoney, resolveParaBirimi } from '../../utils/formatters'
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
  const alacakPb = resolveParaBirimi(makbuz.odeme?.alacakParaBirimi)
  const odemePb = resolveParaBirimi(makbuz.odeme?.odemeParaBirimi ?? alacakPb)
  const cross = odemePb !== alacakPb
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
            { label: 'Taksit tutarı', value: formatMoney(Number(makbuz.taksitTutari), alacakPb), amount: true },
            ...(makbuz.taksitOdenenToplam != null
              ? [{ label: 'Taksitte ödenen', value: formatMoney(Number(makbuz.taksitOdenenToplam), alacakPb), amount: true }]
              : []),
            ...(makbuz.taksitKalanTutar != null
              ? [{ label: 'Taksit kalan', value: formatMoney(Number(makbuz.taksitKalanTutar), alacakPb), amount: true }]
              : []),
            { label: 'Ödeme tarihi', value: formatDateTR(makbuz.odemeTarihi) },
            { label: 'Ödeme yöntemi', value: odemeYontemi },
            {
              label: 'Bu makbuz (mahsup)',
              value: formatMoney(Number(makbuz.tahsilatTutari), alacakPb),
              amount: true,
              highlightAmount: true
            },
            ...(cross && makbuz.odeme?.kasaTutari
              ? [
                  {
                    label: 'Kasa tahsilatı',
                    value: formatMoney(Number(makbuz.odeme.kasaTutari), odemePb),
                    amount: true
                  }
                ]
              : []),
            ...(cross && makbuz.odeme?.kur && makbuz.odeme.kurBazParaBirimi && makbuz.odeme.kurKarsiParaBirimi
              ? [
                  {
                    label: 'Kur',
                    value: formatKurOzeti(
                      resolveParaBirimi(makbuz.odeme.kurBazParaBirimi),
                      resolveParaBirimi(makbuz.odeme.kurKarsiParaBirimi),
                      Number(makbuz.odeme.kur)
                    )
                  }
                ]
              : []),
            { label: 'Makbuz no', value: makbuz.makbuzNo, mono: true },
            { label: 'SMM', value: makbuz.smmKesildiMi ? 'Kesildi' : 'Bekliyor' }
          ]}
        />
      </div>

      <ReceiptSectionTable
        title="Vekalet özeti"
        rows={[
          { label: 'Anlaşılan', value: formatMoney(Number(makbuz.anlasilanVekalet), alacakPb), amount: true },
          { label: 'Ödenen toplam', value: formatMoney(Number(makbuz.odenenToplam), alacakPb), amount: true },
          { label: 'Kalan vekalet', value: formatMoney(Number(makbuz.kalanVekalet), alacakPb), amount: true }
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
