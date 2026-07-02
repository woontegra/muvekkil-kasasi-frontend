import type { ReactElement } from 'react'
import type { OfisKasaReportResponse } from '../../types/reports'
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
          { label: 'Toplam gelir', value: formatCurrencyTR(Number(data.totals.toplamGelir)) },
          { label: 'Toplam gider', value: formatCurrencyTR(Number(data.totals.toplamGider)) },
          { label: 'Düzeltme etkisi', value: formatCurrencyTR(Number(data.totals.duzeltmeEtkisi)) },
          { label: 'Net bakiye (dönem)', value: formatCurrencyTR(Number(data.totals.netBakiye)) },
          { label: 'Hareket sayısı', value: String(data.totals.hareketSayisi) }
        ]}
      />
      <ReportDataTable
        title="Hareket listesi"
        empty="Bu filtrelerle hareket bulunamadı."
        headers={['Tarih', 'Tip', 'Kategori', 'Tutar', 'Ödeme', 'Açıklama', 'Belge no', 'Onay']}
        rows={data.rows.map((r) => [
          formatDateTR(r.tarih),
          r.islemTipiLabel,
          r.kategoriLabel,
          <span key="t" className="block text-right tabular-nums">
            {formatCurrencyTR(Number(r.tutar))}
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
