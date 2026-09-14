import type { ReactElement } from 'react'
import type { IcraTahsilatReportResponse } from '../../types/reports'
import { formatCurrencyTR, formatDateTR, formatDateTimeTR, formatMoney, resolveParaBirimi, type ParaBirimi } from '../../utils/formatters'
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

function currencySummaryRows(data: IcraTahsilatReportResponse): { label: string; value: string }[] {
  const bc = data.totals.byCurrency
  if (bc) {
    return (['TRY', 'USD', 'EUR'] as ParaBirimi[]).flatMap((pb) => {
      const bucket = bc[pb]
      if (!bucket) return []
      return [
        { label: `${pb} — toplam alacak`, value: formatMoney(Number(bucket.toplamAlacak), pb) },
        { label: `${pb} — tahsil edilen`, value: formatMoney(Number(bucket.tahsilEdilen), pb) },
        { label: `${pb} — kalan`, value: formatMoney(Number(bucket.kalanAlacak), pb) }
      ]
    })
  }
  return [
    { label: 'Toplam alacak (TRY)', value: formatCurrencyTR(Number(data.totals.toplamAlacak)) },
    { label: 'Tahsil edilen (TRY)', value: formatCurrencyTR(Number(data.totals.tahsilEdilen)) },
    { label: 'Kalan alacak (TRY)', value: formatCurrencyTR(Number(data.totals.kalanAlacak)) }
  ]
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
          ...currencySummaryRows(data),
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
          'PB',
          'Toplam',
          'Ödenen',
          'Kalan',
          'Taksit',
          'Durum',
          'Personel'
        ]}
        rows={data.alacaklar.map((r) => {
          const pb = resolveParaBirimi(r.paraBirimi)
          return [
            r.borcluAd,
            r.muvekkilAd ?? '—',
            r.dosyaBaslik ?? '—',
            r.alacakTuruLabel,
            pb,
            formatMoney(Number(r.toplamTutar), pb),
            formatMoney(Number(r.odenenToplam), pb),
            formatMoney(Number(r.kalanTutar), pb),
            String(r.taksitSayisi),
            r.durumLabel,
            r.tahsilatiYapanPersonelAd ?? '—'
          ]
        })}
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
