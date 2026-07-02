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

/** Onaylı avans girişi tahsilat makbuzu (belge no = makbuz no). */
export function AdvanceReceipt(props: AdvanceReceiptProps): ReactElement {
  const { tenant, dosya, muvekkil, hareket, printedAt } = props
  const mahIcr = mahkemeIcraSatir(dosya)
  const vergi = [tenant.vergiDairesi, tenant.vergiNo].filter(Boolean).join(' · ')

  return (
    <ReceiptPrintLayout
      title="Tahsilat Makbuzu (Avans)"
      buro={{
        buroAdi: tenant.buroAdi,
        telefon: tenant.telefon,
        eposta: tenant.eposta,
        adres: tenant.adres
      }}
      belgeNo={hareket.belgeNo}
      duzenlemeTarihi={formatDateTR(hareket.tarih)}
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
          { label: 'Tahsilat tarihi', value: formatDateTR(hareket.tarih) },
          {
            label: 'Tutar',
            value: formatCurrencyTR(Number(hareket.tutar)),
            amount: true,
            highlightAmount: true
          },
          { label: 'Açıklama', value: hareket.aciklama?.trim() || null },
          { label: 'Belge / makbuz no', value: hareket.belgeNo, mono: true }
        ]}
      />
    </ReceiptPrintLayout>
  )
}
