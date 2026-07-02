import type { ReactElement, ReactNode } from 'react'

export type ReceiptSectionRow = {
  label: string
  value: string | null | undefined
  /** Para tutarı — kalın, sağ hizalı */
  amount?: boolean
  /** Ana tahsilat tutarı — ek vurgulu zemin */
  highlightAmount?: boolean
  mono?: boolean
}

function displayValue(value: string | null | undefined): string {
  const t = value?.trim()
  return t ? t : '—'
}

type ReceiptSectionTableProps = {
  title: string
  rows?: ReceiptSectionRow[]
  children?: ReactNode
}

/** Kutulu bölüm tablosu — etiket/değer satırları veya özel tablo içeriği. */
export function ReceiptSectionTable(props: ReceiptSectionTableProps): ReactElement {
  const { title, rows, children } = props
  if (!rows?.length && !children) return <></>

  return (
    <section className="receipt-section">
      <div className="receipt-section__head">{title}</div>
      {rows?.length ? (
        <table className="receipt-section__table">
          <tbody>
            {rows.map((row) => (
              <tr
                key={row.label}
                className={row.highlightAmount ? 'receipt-section__row--highlight' : undefined}
              >
                <td className="receipt-section__label">{row.label}</td>
                <td
                  className={[
                    'receipt-section__value',
                    row.amount ? 'receipt-section__value--amount' : '',
                    row.mono ? 'receipt-section__value--mono' : ''
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {displayValue(row.value)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
      {children}
    </section>
  )
}
