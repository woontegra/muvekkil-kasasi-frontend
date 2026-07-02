import type { ReactElement } from 'react'
import type { AuthTenantDto } from '../../types/auth'
import type { DosyaDto } from '../../types/dosya'
import type { MuvekkilDto } from '../../types/muvekkil'
import type { DosyaVekaletOzetDto, VekaletTaksitiDto, VekaletUcretiDto } from '../../types/vekalet'
import { formatCurrencyTR, formatDateTR } from '../../utils/formatters'
import { mahkemeIcraSatir } from '../../lib/dosyaLabels'
import { ReceiptPrintLayout } from './ReceiptPrintLayout'
import { ReceiptSectionTable } from './ReceiptSectionTable'

type VekaletReceiptProps = {
  tenant: AuthTenantDto
  dosya: DosyaDto
  muvekkil: MuvekkilDto
  vekaletUcreti: VekaletUcretiDto | null
  vekaletOzet: DosyaVekaletOzetDto
  taksit: VekaletTaksitiDto
  printedAt: string
}

/** Ödenmiş vekalet taksiti tahsilat makbuzu. */
export function VekaletReceipt(props: VekaletReceiptProps): ReactElement {
  const { tenant, dosya, muvekkil, vekaletUcreti, vekaletOzet, taksit, printedAt } = props
  const mahIcr = mahkemeIcraSatir(dosya)
  const vergi = [tenant.vergiDairesi, tenant.vergiNo].filter(Boolean).join(' · ')
  const smmDurum = taksit.smmKesildiMi
    ? `Evet${taksit.smmNo?.trim() ? ` (No: ${taksit.smmNo.trim()})` : ''}${taksit.smmKesimTarihi ? ` — ${formatDateTR(taksit.smmKesimTarihi)}` : ''}`
    : 'Hayır (SMM bekleniyor)'

  return (
    <ReceiptPrintLayout
      title="Vekalet Tahsilat Makbuzu"
      buro={{
        buroAdi: tenant.buroAdi,
        telefon: tenant.telefon,
        eposta: tenant.eposta,
        adres: tenant.adres
      }}
      belgeNo={taksit.makbuzNo}
      duzenlemeTarihi={taksit.odemeTarihi ? formatDateTR(taksit.odemeTarihi) : null}
      printedAt={printedAt}
      showSignatures
    >
      <ReceiptSectionTable
        title="Büro bilgileri"
        rows={[
          { label: 'Telefon', value: tenant.telefon },
          { label: 'E-posta', value: tenant.eposta },
          { label: 'Adres', value: tenant.adres },
          { label: 'Vergi dairesi / no', value: vergi || null }
        ]}
      />
      <ReceiptSectionTable
        title="Müvekkil / dosya bilgileri"
        rows={[
          { label: 'Müvekkil', value: muvekkil.gorunenAd },
          { label: 'Dosya konusu', value: dosya.konuBasligi },
          { label: 'Mahkeme / icra', value: mahIcr || null },
          { label: 'Dosya no', value: dosya.dosyaNo, mono: true }
        ]}
      />
      <ReceiptSectionTable
        title="Tahsilat bilgileri"
        rows={[
          { label: 'Taksit no', value: String(taksit.taksitNo) },
          { label: 'Ödeme tarihi', value: taksit.odemeTarihi ? formatDateTR(taksit.odemeTarihi) : null },
          {
            label: 'Tahsil edilen tutar',
            value: formatCurrencyTR(Number(taksit.tutar)),
            amount: true,
            highlightAmount: true
          },
          { label: 'Makbuz no', value: taksit.makbuzNo, mono: true },
          { label: 'SMM durumu', value: smmDurum },
          ...(taksit.aciklama?.trim() ? [{ label: 'Açıklama', value: taksit.aciklama }] : [])
        ]}
      />
      <ReceiptSectionTable
        title="Finansal özet"
        rows={[
          { label: 'Anlaşılan vekalet ücreti', value: formatCurrencyTR(Number(vekaletOzet.anlasilan)), amount: true },
          { label: 'Ödenen toplam (tüm taksitler)', value: formatCurrencyTR(Number(vekaletOzet.odenenToplam)), amount: true },
          { label: 'Kalan vekalet', value: formatCurrencyTR(Number(vekaletOzet.kalanVekalet)), amount: true },
          ...(vekaletUcreti?.aciklama?.trim()
            ? [{ label: 'Vekalet açıklaması', value: vekaletUcreti.aciklama }]
            : [])
        ]}
      />
    </ReceiptPrintLayout>
  )
}
