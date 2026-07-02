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

/** Ödeme bazlı vekalet tahsilat makbuzu. */
export function VekaletOdemeReceipt(props: VekaletOdemeReceiptProps): ReactElement {
  const { makbuz, printedAt } = props
  const buro = makbuz.buro as {
    buroAdi?: string
    telefon?: string | null
    eposta?: string | null
    adres?: string | null
    vergiDairesi?: string | null
    vergiNo?: string | null
  }
  const muvekkil = makbuz.muvekkil as { gorunenAd?: string }
  const dosya = makbuz.dosya as { konuBasligi?: string }
  const odemeYontemi = ODEME_LABEL[makbuz.odemeYontemi] ?? makbuz.odemeYontemi
  const vergi = [buro.vergiDairesi, buro.vergiNo].filter(Boolean).join(' · ')

  return (
    <ReceiptPrintLayout
      title="Vekalet Tahsilat Makbuzu"
      buro={{
        buroAdi: buro.buroAdi ?? '—',
        telefon: buro.telefon,
        eposta: buro.eposta,
        adres: buro.adres
      }}
      belgeNo={makbuz.makbuzNo}
      duzenlemeTarihi={formatDateTR(makbuz.odemeTarihi)}
      printedAt={printedAt}
      showSignatures
    >
      <ReceiptSectionTable
        title="Büro bilgileri"
        rows={[
          { label: 'Telefon', value: buro.telefon },
          { label: 'E-posta', value: buro.eposta },
          { label: 'Adres', value: buro.adres },
          { label: 'Vergi dairesi / no', value: vergi || null }
        ]}
      />
      <ReceiptSectionTable
        title="Müvekkil / dosya bilgileri"
        rows={[
          { label: 'Müvekkil', value: muvekkil.gorunenAd },
          { label: 'Dosya konusu', value: dosya.konuBasligi },
          { label: 'Mahkeme / icra', value: makbuz.mahkemeIcra },
          { label: 'Dosya no', value: makbuz.dosyaNo, mono: true }
        ]}
      />
      <ReceiptSectionTable
        title="Tahsilat bilgileri"
        rows={[
          { label: 'Taksit no', value: String(makbuz.taksitNo) },
          { label: 'Taksit tutarı', value: formatCurrencyTR(Number(makbuz.taksitTutari)), amount: true },
          { label: 'Ödeme tarihi', value: formatDateTR(makbuz.odemeTarihi) },
          { label: 'Ödeme yöntemi', value: odemeYontemi },
          {
            label: 'Bu makbuzdaki tahsilat',
            value: formatCurrencyTR(Number(makbuz.tahsilatTutari)),
            amount: true,
            highlightAmount: true
          },
          { label: 'Makbuz no', value: makbuz.makbuzNo, mono: true },
          { label: 'SMM durumu', value: makbuz.smmKesildiMi ? 'Kesildi' : 'Bekliyor' }
        ]}
      />
      <ReceiptSectionTable
        title="Finansal özet"
        rows={[
          { label: 'Anlaşılan vekalet', value: formatCurrencyTR(Number(makbuz.anlasilanVekalet)), amount: true },
          { label: 'Ödenen toplam', value: formatCurrencyTR(Number(makbuz.odenenToplam)), amount: true },
          { label: 'Kalan vekalet', value: formatCurrencyTR(Number(makbuz.kalanVekalet)), amount: true }
        ]}
      />
    </ReceiptPrintLayout>
  )
}
