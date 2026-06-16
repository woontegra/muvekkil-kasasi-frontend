import type { ReactElement } from 'react'
import type { VekaletOdemeMakbuzDto } from '../../types/vekalet'
import { formatCurrencyTR, formatDateTR } from '../../utils/formatters'

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

function line(label: string, value: string | null | undefined, amount = false): ReactElement {
  return (
    <div className="mb-1 flex gap-3 border-b border-dotted border-neutral-400 pb-1 text-[12px] leading-snug">
      <span className="w-[44%] shrink-0 font-semibold text-neutral-800">{label}</span>
      <span className={amount ? 'ml-auto text-right font-medium tabular-nums text-neutral-900' : 'min-w-0 flex-1 text-neutral-900'}>
        {value?.trim() ? value : '—'}
      </span>
    </div>
  )
}

/** Ödeme bazlı vekalet tahsilat makbuzu — dikey sayfa, yatay blok. */
export function VekaletOdemeReceipt(props: VekaletOdemeReceiptProps): ReactElement {
  const { makbuz, printedAt } = props
  const buro = makbuz.buro as { buroAdi?: string; telefon?: string | null; eposta?: string | null; adres?: string | null }
  const muvekkil = makbuz.muvekkil as { gorunenAd?: string }
  const dosya = makbuz.dosya as { konuBasligi?: string }
  const odemeYontemi = ODEME_LABEL[makbuz.odemeYontemi] ?? makbuz.odemeYontemi

  return (
    <div className="mx-auto max-w-[190mm] font-serif text-left text-black">
      <style>{`
        @page { size: portrait; margin: 12mm; }
        @media print {
          .vekalet-makbuz-block { box-shadow: none !important; border: 1px solid #333 !important; }
        }
      `}</style>
      <div className="vekalet-makbuz-block rounded border border-neutral-400 bg-white p-5 shadow-sm">
        <div className="mb-3 border-b-2 border-neutral-800 pb-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-700">Vekalet Tahsilat Makbuzu</p>
          <p className="mt-0.5 text-base font-bold">{buro.buroAdi ?? '—'}</p>
        </div>

        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-neutral-600">Büro bilgileri</p>
        {line('Telefon', buro.telefon)}
        {line('E-posta', buro.eposta)}
        {line('Adres', buro.adres)}

        <div className="my-3 border-t border-neutral-300" />
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-neutral-600">Müvekkil ve dosya</p>
        {line('Müvekkil', muvekkil.gorunenAd)}
        {line('Dosya', dosya.konuBasligi)}
        {line('Mahkeme / icra', makbuz.mahkemeIcra)}
        {line('Dosya no', makbuz.dosyaNo)}

        <div className="my-3 border-t border-neutral-300" />
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-neutral-600">Taksit ve ödeme</p>
        {line('Taksit no', String(makbuz.taksitNo))}
        {line('Taksit tutarı', formatCurrencyTR(Number(makbuz.taksitTutari)), true)}
        {line('Ödeme tarihi', formatDateTR(makbuz.odemeTarihi))}
        {line('Ödeme yöntemi', odemeYontemi)}
        {line('Bu makbuzdaki tahsilat', formatCurrencyTR(Number(makbuz.tahsilatTutari)), true)}

        <div className="my-3 border-t border-neutral-300" />
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-neutral-600">Belge / makbuz</p>
        {line('Makbuz no', makbuz.makbuzNo)}
        {line('SMM durumu', makbuz.smmKesildiMi ? 'Kesildi' : 'Bekliyor')}

        <div className="my-3 border-t border-neutral-300" />
        <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-neutral-600">Finansal özet</p>
        {line('Anlaşılan vekalet', formatCurrencyTR(Number(makbuz.anlasilanVekalet)), true)}
        {line('Ödenen toplam', formatCurrencyTR(Number(makbuz.odenenToplam)), true)}
        {line('Kalan vekalet', formatCurrencyTR(Number(makbuz.kalanVekalet)), true)}

        <div className="mt-5 grid grid-cols-2 gap-6 border-t border-neutral-400 pt-4 text-[11px]">
          <div>
            <p className="mb-8 font-semibold">Teslim eden</p>
            <div className="border-t border-neutral-500 pt-1">İmza</div>
          </div>
          <div>
            <p className="mb-8 font-semibold">Teslim alan</p>
            <div className="border-t border-neutral-500 pt-1">İmza</div>
          </div>
        </div>

        <p className="mt-3 text-[10px] text-neutral-600">Yazdırma: {formatDateTR(printedAt)}</p>
      </div>
    </div>
  )
}
