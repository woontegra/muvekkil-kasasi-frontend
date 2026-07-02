import type { ReactElement } from 'react'
import { Badge } from '../ui'
import { kaynakLabel, onayDurumuLabel } from './primLabels'
import { formatCurrencyTR, formatDateTR } from '../../utils/formatters'
import type { PersonelTahsilatKartDto } from '../../types/prim'

type Props = {
  items: PersonelTahsilatKartDto[]
  loading?: boolean
  /** true ise prime dahil / dahil değil rozetleri gösterilir */
  showPremiumBadges?: boolean
}

function onayBadge(d: string): ReactElement {
  if (d === 'ONAYLI') return <Badge variant="success">{onayDurumuLabel(d)}</Badge>
  if (d === 'REDDEDILDI') return <Badge variant="danger">{onayDurumuLabel(d)}</Badge>
  return <Badge variant="warning">{onayDurumuLabel(d)}</Badge>
}

export function PersonnelCollectionCards(props: Props): ReactElement {
  const { items, loading, showPremiumBadges = false } = props

  if (loading) {
    return <p className="py-4 text-sm text-ink-muted">Tahsilatlar yükleniyor…</p>
  }

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-surface-muted/30 px-4 py-8 text-center">
        <p className="text-sm text-ink-muted">Seçilen filtrelere uygun tahsilat kaydı yok.</p>
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {items.map((t) => (
        <article
          key={t.id}
          className="rounded-lg border border-border bg-panel px-3 py-2.5 shadow-sm"
        >
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-semibold tabular-nums text-ink">
                  {formatCurrencyTR(Number(t.tutar))}
                </span>
                <span className="text-[11px] text-ink-muted">{formatDateTR(t.tarih)}</span>
                <Badge variant="default">{kaynakLabel(t.kaynak)}</Badge>
              </div>
              {(t.muvekkilAd || t.dosyaBaslik) && (
                <p className="mt-1 truncate text-xs text-ink">
                  {t.muvekkilAd ?? '—'}
                  {t.dosyaBaslik ? ` · ${t.dosyaBaslik}` : ''}
                </p>
              )}
              {t.aciklama ? (
                <p className="mt-1 line-clamp-2 text-[11px] text-ink-muted">{t.aciklama}</p>
              ) : null}
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1">
              {onayBadge(t.onayDurumu)}
              {showPremiumBadges ? (
                t.primHesabinaDahilMi ? (
                  <Badge variant="primary">Prime dahil</Badge>
                ) : (
                  <Badge variant="default">Prime dahil değil</Badge>
                )
              ) : null}
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 border-t border-border/60 pt-2 text-[10px] text-ink-muted">
            <span>Kasa: {t.kasaTuru}</span>
            <span>Tahsilatı yapan: {t.tahsilatiYapanAdSoyad}</span>
          </div>
        </article>
      ))}
    </div>
  )
}
