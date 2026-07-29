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

/** Ödenmiş vekalet taksiti tahsilat makbuzu — A4 tek sayfa kompakt düzen. */
export function VekaletReceipt(props: VekaletReceiptProps): ReactElement {
  const { tenant, dosya, muvekkil, vekaletUcreti, vekaletOzet, taksit, printedAt } = props
  const mahIcr = mahkemeIcraSatir(dosya)
  const smmDurum = taksit.smmKesildiMi
    ? `Evet${taksit.smmNo?.trim() ? ` (No: ${taksit.smmNo.trim()})` : ''}${taksit.smmKesimTarihi ? ` — ${formatDateTR(taksit.smmKesimTarihi)}` : ''}`
    : 'Hayır (SMM bekleniyor)'

  return (
    <ReceiptPrintLayout
      title="Vekalet Tahsilat Makbuzu"
      compact
      hideTitleBand
      buro={{
        buroAdi: tenant.buroAdi,
        telefon: tenant.telefon,
        eposta: tenant.eposta,
        adres: tenant.adres
      }}
      belgeNo={taksit.makbuzNo}
      duzenlemeTarihi={taksit.odemeTarihi ? formatDateTR(taksit.odemeTarihi) : null}
      printedAt={printedAt}
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
            { label: 'Taksit no', value: String(taksit.taksitNo) },
            { label: 'Ödeme tarihi', value: taksit.odemeTarihi ? formatDateTR(taksit.odemeTarihi) : null },
            {
              label: 'Tahsil edilen',
              value: formatCurrencyTR(Number(taksit.tutar)),
              amount: true,
              highlightAmount: true
            },
            { label: 'Makbuz no', value: taksit.makbuzNo, mono: true },
            { label: 'SMM', value: smmDurum },
            ...(taksit.aciklama?.trim() ? [{ label: 'Açıklama', value: taksit.aciklama }] : [])
          ]}
        />
      </div>

      <ReceiptSectionTable
        title="Vekalet özeti"
        rows={[
          { label: 'Anlaşılan', value: formatCurrencyTR(Number(vekaletOzet.anlasilan)), amount: true },
          { label: 'Ödenen toplam', value: formatCurrencyTR(Number(vekaletOzet.odenenToplam)), amount: true },
          { label: 'Kalan vekalet', value: formatCurrencyTR(Number(vekaletOzet.kalanVekalet)), amount: true },
          ...(vekaletUcreti?.aciklama?.trim()
            ? [{ label: 'Vekalet açıklaması', value: vekaletUcreti.aciklama }]
            : [])
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
