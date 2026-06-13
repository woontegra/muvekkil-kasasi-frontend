import type { ReactElement } from 'react'
import type { AuthTenantDto } from '../../types/auth'
import type { DosyaDto } from '../../types/dosya'
import type { KasaHareketiDto } from '../../types/kasa'
import type { MuvekkilDto } from '../../types/muvekkil'
import { formatCurrencyTR, formatDateTR } from '../../utils/formatters'
import { mahkemeIcraSatir } from '../../lib/dosyaLabels'

type AdvanceReceiptProps = {
  tenant: AuthTenantDto
  dosya: DosyaDto
  muvekkil: MuvekkilDto
  hareket: KasaHareketiDto
  printedAt: string
}

function line(label: string, value: string | null | undefined): ReactElement {
  return (
    <div className="mb-1.5 flex gap-2 border-b border-dotted border-neutral-400 pb-1 text-[13px] leading-snug">
      <span className="w-[38%] shrink-0 font-semibold text-neutral-800">{label}</span>
      <span className="min-w-0 flex-1 text-neutral-900">{value?.trim() ? value : '—'}</span>
    </div>
  )
}

/** Onaylı avans girişi tahsilat makbuzu (belge no = makbuz no). */
export function AdvanceReceipt(props: AdvanceReceiptProps): ReactElement {
  const { tenant, dosya, muvekkil, hareket, printedAt } = props
  const mahIcr = mahkemeIcraSatir(dosya)
  const aciklama = hareket.aciklama?.trim() || '—'
  const tutar = formatCurrencyTR(Number(hareket.tutar))

  return (
    <div className="font-serif">
      <div className="mb-4 border-b-2 border-neutral-800 pb-2 text-center">
        <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-700">Tahsilat Makbuzu (Avans)</p>
        <p className="mt-1 text-lg font-bold">{tenant.buroAdi}</p>
      </div>
      {line('Telefon', tenant.telefon)}
      {line('E-posta', tenant.eposta)}
      {line('Adres', tenant.adres)}
      {line('Vergi dairesi / no', [tenant.vergiDairesi, tenant.vergiNo].filter(Boolean).join(' · ') || null)}
      <div className="my-4 border-t border-neutral-300" />
      {line('Müvekkil', muvekkil.gorunenAd)}
      {line('Dosya konusu', dosya.konuBasligi)}
      {line('Mahkeme / icra', mahIcr || null)}
      {line('Dosya no', dosya.dosyaNo)}
      {line('Tahsilat tarihi', formatDateTR(hareket.tarih))}
      {line('Tutar', tutar)}
      {line('Açıklama', aciklama)}
      {line('Belge / makbuz no', hareket.belgeNo)}
      <div className="mt-6 border-t border-neutral-300 pt-3 text-[11px] text-neutral-600">
        Yazdırma tarihi: {formatDateTR(printedAt)}
      </div>
    </div>
  )
}
