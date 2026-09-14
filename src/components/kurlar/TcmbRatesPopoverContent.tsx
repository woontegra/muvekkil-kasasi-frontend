import type { ReactElement } from 'react'
import type { TcmbRatesAvailableResponse } from '../../types/kurlar'
import { formatDateTR, formatDateTimeTR, formatTcmbRateDisplay } from '../../utils/tcmbFormat'

type Props = {
  data: TcmbRatesAvailableResponse
  showStaleWarning?: boolean
}

export function TcmbRatesPopoverContent(props: Props): ReactElement {
  const { data, showStaleWarning = data.stale } = props

  return (
    <div className="space-y-3 text-xs">
      {showStaleWarning ? (
        <p className="rounded-md border border-amber-300/70 bg-amber-50 px-2.5 py-2 font-medium text-amber-950">
          Son alınan kur — TCMB referans kuru güncellenemedi; önbellekteki değerler gösteriliyor.
        </p>
      ) : null}
      <div className="space-y-2">
        <div className="rounded-md border border-border bg-surface-muted/30 px-2.5 py-2">
          <p className="font-semibold text-ink">USD/TRY</p>
          <p className="mt-1 text-ink-muted">
            Alış: <span className="tabular-nums font-medium text-ink">{formatTcmbRateDisplay(data.usdDovizAlis)}</span>
          </p>
          <p className="text-ink-muted">
            Satış: <span className="tabular-nums font-medium text-ink">{formatTcmbRateDisplay(data.usdDovizSatis)}</span>
          </p>
        </div>
        <div className="rounded-md border border-border bg-surface-muted/30 px-2.5 py-2">
          <p className="font-semibold text-ink">EUR/TRY</p>
          <p className="mt-1 text-ink-muted">
            Alış: <span className="tabular-nums font-medium text-ink">{formatTcmbRateDisplay(data.eurDovizAlis)}</span>
          </p>
          <p className="text-ink-muted">
            Satış: <span className="tabular-nums font-medium text-ink">{formatTcmbRateDisplay(data.eurDovizSatis)}</span>
          </p>
        </div>
      </div>
      <dl className="space-y-1.5 text-ink-muted">
        <div className="flex justify-between gap-3">
          <dt>Kur tarihi</dt>
          <dd className="font-medium text-ink">{formatDateTR(data.effectiveDate)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Son kontrol</dt>
          <dd className="font-medium text-ink">{formatDateTimeTR(data.fetchedAt)}</dd>
        </div>
        <div className="flex justify-between gap-3">
          <dt>Kaynak</dt>
          <dd className="max-w-[180px] text-right font-medium text-ink">{data.sourceLabel}</dd>
        </div>
      </dl>
      <p className="text-[10px] leading-snug text-ink-muted">TCMB referans kuru — bilgilendirme amaçlıdır.</p>
    </div>
  )
}
