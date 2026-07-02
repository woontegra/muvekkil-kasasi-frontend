import type { ReactElement, ReactNode } from 'react'
import { Button } from '../ui'

type ReportPrintShellProps = {
  title: string
  printRootId: string
  onClose: () => void
  children: ReactNode
}

/** Rapor önizleme — Yazdır butonuna basılana kadar print dialog açılmaz. */
export function ReportPrintShell(props: ReportPrintShellProps): ReactElement {
  const { title, printRootId, onClose, children } = props

  return (
    <div className="report-print-shell mt-4">
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #${printRootId}, #${printRootId} * { visibility: visible !important; }
          #${printRootId} {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 8mm !important;
            background: white !important;
            color: #111 !important;
            box-shadow: none !important;
          }
          .no-print { display: none !important; }
        }
        @page { size: A4 portrait; margin: 10mm; }
      `}</style>
      <div
        id={printRootId}
        className="mx-auto w-full max-w-[210mm] rounded-lg border border-border bg-white p-4 shadow-md print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none"
      >
        <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-border pb-3">
          <h3 className="text-sm font-bold text-ink">{title} — önizleme</h3>
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={() => window.print()}>
              Yazdır
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onClose}>
              Kapat
            </Button>
          </div>
        </div>
        <div className="report-print-body text-[11px] leading-snug text-neutral-900 print:text-black">{children}</div>
      </div>
    </div>
  )
}

function kvRow(label: string, value: string): ReactElement {
  return (
    <tr>
      <th className="border border-neutral-300 bg-neutral-50 px-2 py-1 text-left font-semibold">{label}</th>
      <td className="border border-neutral-300 px-2 py-1 text-right tabular-nums">{value}</td>
    </tr>
  )
}

export function ReportDocHeader(props: {
  title: string
  buroAdi: string
  metaLines: string[]
}): ReactElement {
  const { title, buroAdi, metaLines } = props
  return (
    <header className="mb-4 border-b-2 border-neutral-800 pb-2">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-bold text-neutral-900">{buroAdi}</p>
          {metaLines.map((line) => (
            <p key={line} className="text-[10px] text-neutral-600">
              {line}
            </p>
          ))}
        </div>
        <div className="text-right">
          <h1 className="text-base font-bold uppercase tracking-wide text-neutral-900">{title}</h1>
        </div>
      </div>
    </header>
  )
}

export function ReportSummaryTable(props: { rows: { label: string; value: string }[] }): ReactElement {
  return (
    <table className="mb-4 w-full border-collapse text-[11px]">
      <tbody>{props.rows.map((r) => kvRow(r.label, r.value))}</tbody>
    </table>
  )
}

export function ReportDataTable(props: {
  title: string
  headers: string[]
  rows: ReactNode[][]
  empty?: string
}): ReactElement {
  const { title, headers, rows, empty } = props
  return (
    <section className="mb-4">
      <h2 className="mb-1 border-b border-neutral-400 pb-0.5 text-xs font-bold uppercase">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-[10px] text-neutral-500">{empty ?? 'Kayıt yok.'}</p>
      ) : (
        <table className="w-full border-collapse text-[10px]">
          <thead>
            <tr className="bg-neutral-100">
              {headers.map((h) => (
                <th key={h} className="border border-neutral-300 px-1 py-1 text-left font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((cells, i) => (
              <tr key={i} className="even:bg-neutral-50/80">
                {cells.map((cell, j) => (
                  <td key={j} className="border border-neutral-200 px-1 py-0.5 align-top">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  )
}

export function reportFooterLine(text: string): ReactElement {
  return <p className="mt-4 border-t border-neutral-300 pt-2 text-[9px] text-neutral-500">{text}</p>
}
