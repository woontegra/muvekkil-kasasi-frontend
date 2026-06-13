import type { ReactElement } from 'react'
import type { AuthTenantDto } from '../../types/auth'
import type { DosyaDto } from '../../types/dosya'
import type { MuvekkilDto } from '../../types/muvekkil'
import type { DosyaVekaletOzetDto, VekaletTaksitiDto, VekaletUcretiDto } from '../../types/vekalet'
import { formatCurrencyTR, formatDateTR } from '../../utils/formatters'
import { mahkemeIcraSatir } from '../../lib/dosyaLabels'

type VekaletReceiptProps = {
  tenant: AuthTenantDto
  dosya: DosyaDto
  muvekkil: MuvekkilDto
  vekaletUcreti: VekaletUcretiDto | null
  vekaletOzet: DosyaVekaletOzetDto
  taksit: VekaletTaksitiDto
  printedAt: string
}

function line(label: string, value: string | null | undefined): ReactElement {
  return (
    <div className="mb-1.5 flex gap-2 border-b border-dotted border-neutral-400 pb-1 text-[13px] leading-snug">
      <span className="w-[42%] shrink-0 font-semibold text-neutral-800">{label}</span>
      <span className="min-w-0 flex-1 text-neutral-900">{value?.trim() ? value : '—'}</span>
    </div>
  )
}

/** Ödenmiş vekalet taksiti tahsilat makbuzu. */
export function VekaletReceipt(props: VekaletReceiptProps): ReactElement {
  const { tenant, dosya, muvekkil, vekaletUcreti, vekaletOzet, taksit, printedAt } = props
  const mahIcr = mahkemeIcraSatir(dosya)
  const makbuz = taksit.makbuzNo?.trim() || '—'
  const smmDurum = taksit.smmKesildiMi
    ? `Evet${taksit.smmNo?.trim() ? ` (No: ${taksit.smmNo.trim()})` : ''}${taksit.smmKesimTarihi ? ` — ${formatDateTR(taksit.smmKesimTarihi)}` : ''}`
    : 'Hayır (SMM bekleniyor)'

  return (
    <div className="font-serif">
      <div className="mb-4 border-b-2 border-neutral-800 pb-2 text-center">
        <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-700">Vekalet Tahsilat Makbuzu</p>
        <p className="mt-1 text-lg font-bold">{tenant.buroAdi}</p>
      </div>
      {line('Telefon', tenant.telefon)}
      {line('E-posta', tenant.eposta)}
      {line('Adres', tenant.adres)}
      <div className="my-4 border-t border-neutral-300" />
      {line('Müvekkil', muvekkil.gorunenAd)}
      {line('Dosya', dosya.konuBasligi)}
      {line('Mahkeme / icra', mahIcr || null)}
      {line('Dosya no', dosya.dosyaNo)}
      <div className="my-4 border-t border-neutral-300" />
      {line('Taksit no', String(taksit.taksitNo))}
      {line('Ödeme tarihi', taksit.odemeTarihi ? formatDateTR(taksit.odemeTarihi) : '—')}
      {line('Tahsil edilen tutar', formatCurrencyTR(Number(taksit.tutar)))}
      {line('Anlaşılan vekalet ücreti', formatCurrencyTR(Number(vekaletOzet.anlasilan)))}
      {line('Ödenen toplam (tüm taksitler)', formatCurrencyTR(Number(vekaletOzet.odenenToplam)))}
      {line('Kalan vekalet', formatCurrencyTR(Number(vekaletOzet.kalanVekalet)))}
      {line('Makbuz no', makbuz)}
      {line('SMM kesildi mi', smmDurum)}
      {vekaletUcreti?.aciklama?.trim() ? line('Vekalet açıklaması', vekaletUcreti.aciklama) : null}
      {taksit.aciklama?.trim() ? line('Taksit açıklaması', taksit.aciklama) : null}
      <div className="mt-6 border-t border-neutral-300 pt-3 text-[11px] text-neutral-600">
        Yazdırma tarihi: {formatDateTR(printedAt)}
      </div>
    </div>
  )
}
