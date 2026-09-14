import type { ReactElement } from 'react'
import type { OfisKasaReportResponse } from '../../types/reports'
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

function currencySummaryRows(data: OfisKasaReportResponse): { label: string; value: string }[] {
  const bc = data.totals.byCurrency
  if (bc) {
    return (['TRY', 'USD', 'EUR'] as ParaBirimi[]).flatMap((pb) => {
      const bucket = bc[pb]
      if (!bucket) return []
      return [
        { label: `${pb} — gelir`, value: formatMoney(Number(bucket.toplamGelir), pb) },
        { label: `${pb} — gider`, value: formatMoney(Number(bucket.toplamGider), pb) },
        { label: `${pb} — net`, value: formatMoney(Number(bucket.netBakiye), pb) }
      ]
    })
  }
  return [
    { label: 'Toplam gelir (TRY)', value: formatCurrencyTR(Number(data.totals.toplamGelir)) },
    { label: 'Toplam gider (TRY)', value: formatCurrencyTR(Number(data.totals.toplamGider)) },
    { label: 'Düzeltme etkisi (TRY)', value: formatCurrencyTR(Number(data.totals.duzeltmeEtkisi)) },
    { label: 'Net bakiye (TRY)', value: formatCurrencyTR(Number(data.totals.netBakiye)) }
  ]
}

export function OfisKasaReportSheet(props: { data: OfisKasaReportResponse }): ReactElement {
  const { data } = props
  const now = formatDateTimeTR(new Date().toISOString())

  return (
    <>
      <ReportDocHeader
        title="Ofis Kasa Raporu"
        buroAdi={data.tenant.buroAdi}
        metaLines={[
          `Rapor tarihi: ${now}`,
          `Tarih aralığı: ${rangeLabel(data.filters.startDate, data.filters.endDate)}`
        ]}
      />
      <ReportSummaryTable
        rows={[
          ...currencySummaryRows(data),
          { label: 'Hareket sayısı', value: String(data.totals.hareketSayisi) }
        ]}
      />
      <ReportDataTable
        title="Hareket listesi"
        empty="Bu filtrelerle hareket bulunamadı."
        headers={['Tarih', 'Tip', 'PB', 'Kategori', 'Tutar', 'Ödeme', 'Açıklama', 'Belge no', 'Onay']}
        rows={data.rows.map((r) => [
          formatDateTR(r.tarih),
          r.islemTipiLabel,
          resolveParaBirimi(r.paraBirimi),
          r.kategoriLabel,
          <span key="t" className="block text-right tabular-nums">
            {formatMoney(Number(r.tutar), resolveParaBirimi(r.paraBirimi))}
          </span>,
          r.odemeYontemiLabel,
          r.aciklama?.trim() || '—',
          r.belgeNo,
          r.onayDurumuLabel
        ])}
      />
      {reportFooterLine('Müvekkil Kasa SaaS — Ofis kasa raporu')}
    </>
  )
}
