import type { ReactElement } from 'react'
import type { IcraTahsilatReportResponse } from '../../types/reports'
import { formatCurrencyTR, formatDateTR, formatDateTimeTR } from '../../utils/formatters'
import {
  ReportDataTable,
  ReportDocHeader,
  ReportSummaryTable,
  reportFooterLine
} from './ReportPrintShell'

function rangeLabel(start: string | null, end: string | null): string {
  const a = start ? formatDateTR(start) : '—'
  const b = end ? formatDateTR(end) : '—'
  return `${a} — ${b}`
}

export function IcraTahsilatReportSheet(props: { data: IcraTahsilatReportResponse }): ReactElement {
  const { data } = props
  const now = formatDateTimeTR(new Date().toISOString())

  return (
    <>
      <ReportDocHeader
        title="İcra Tahsilat Raporu"
        buroAdi={data.tenant.buroAdi}
        metaLines={[
          `Rapor tarihi: ${now}`,
          `Tarih aralığı: ${rangeLabel(data.filters.startDate, data.filters.endDate)}`
        ]}
      />
      <ReportSummaryTable
        rows={[
          { label: 'Toplam alacak (liste)', value: formatCurrencyTR(Number(data.totals.toplamAlacak)) },
          { label: 'Tahsil edilen', value: formatCurrencyTR(Number(data.totals.tahsilEdilen)) },
          { label: 'Kalan alacak', value: formatCurrencyTR(Number(data.totals.kalanAlacak)) },
          { label: 'Vadesi geçmiş taksit', value: String(data.totals.vadesiGecmisTaksit) },
          { label: 'SMM bekleyen', value: String(data.totals.smmBekleyen) }
        ]}
      />
      <ReportDataTable
        title="Alacak listesi"
        empty="Bu filtrelerle alacak bulunamadı."
        headers={[
          'Borçlu',
          'Müvekkil',
          'Dosya',
          'Tür',
          'Toplam',
          'Ödenen',
          'Kalan',
          'Taksit',
          'Durum',
          'Personel'
        ]}
        rows={data.alacaklar.map((r) => [
          r.borcluAd,
          r.muvekkilAd ?? '—',
          r.dosyaBaslik ?? '—',
          r.alacakTuruLabel,
          formatCurrencyTR(Number(r.toplamTutar)),
          formatCurrencyTR(Number(r.odenenToplam)),
          formatCurrencyTR(Number(r.kalanTutar)),
          String(r.taksitSayisi),
          r.durumLabel,
          r.tahsilatiYapanPersonelAd ?? '—'
        ])}
      />
      <ReportDataTable
        title="Tahsilatlar"
        empty="Bu tarih aralığında tahsilat kaydı yok."
        headers={['Tarih', 'Borçlu', 'Tür', 'Tutar', 'Ödeme', 'Personel', 'SMM']}
        rows={data.tahsilatlar.map((r) => [
          formatDateTR(r.tarih),
          r.borcluAd,
          r.alacakTuruLabel,
          formatCurrencyTR(Number(r.tutar)),
          r.odemeYontemiLabel,
          r.tahsilatiYapanPersonelAd,
          r.smmDurumu
        ])}
      />
      {reportFooterLine('Müvekkil Kasa SaaS — İcra tahsilat raporu')}
    </>
  )
}
