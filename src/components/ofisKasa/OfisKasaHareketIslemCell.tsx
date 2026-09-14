import type { ReactElement } from 'react'
import type { AuthUserDto } from '../../types/auth'
import type { OfisKasaHareketiDto } from '../../types/ofisKasasi'
import {
  canShowOfisDuzeltme,
  canShowOfisGuvenliIslem,
  resolveOfisGuvenliIslemMode
} from '../../lib/ofisKasaGuvenliSil'
import { Button } from '../ui'
import { tableActionsFlexRow } from '../ui'
import { cn } from '../../lib/cn'

type Props = {
  hareket: OfisKasaHareketiDto
  role: AuthUserDto['role'] | undefined
  yonetici: boolean
  approvePending?: boolean
  deletePending?: boolean
  dovizDeletePending?: boolean
  guvenliSilPending?: boolean
  onApprove: () => void
  onReject: () => void
  onHardDelete: () => void
  onDuzeltme: () => void
  onDovizDelete: () => void
  onGuvenliSil: () => void
}

/** Görünmez yer tutucu — Düzeltme/Sil hizasını satırlar arası sabit tutar. */
function ActionSlotGhost(props: { label: string }): ReactElement {
  return (
    <span
      className="invisible pointer-events-none inline-flex h-[27px] items-center px-1.5 text-[10px] font-semibold"
      aria-hidden
    >
      {props.label}
    </span>
  )
}

/**
 * Ofis Kasası hareketleri tablosu — İşlem sütunu.
 * Güvenli silme/iptal yalnız BURO_SAHIBI; buton metni her zaman `Sil` (ayrıntı modalda).
 */
export function OfisKasaHareketIslemCell(props: Props): ReactElement {
  const {
    hareket: h,
    role,
    yonetici,
    approvePending,
    deletePending,
    dovizDeletePending,
    guvenliSilPending,
    onApprove,
    onReject,
    onHardDelete,
    onDuzeltme,
    onDovizDelete,
    onGuvenliSil
  } = props

  const onaysiz = h.onayDurumu === 'ONAYSIZ'
  const reddedildi = h.onayDurumu === 'REDDEDILDI'
  const guvenliMode = resolveOfisGuvenliIslemMode(h)
  const showGuvenliSil = canShowOfisGuvenliIslem({ role, hareket: h })
  const showDuzeltme = canShowOfisDuzeltme({
    onayDurumu: h.onayDurumu,
    islemTipi: h.islemTipi
  })
  const showDuzeltmeSilGrid = !onaysiz && (showDuzeltme || showGuvenliSil)

  return (
    <div className={cn(tableActionsFlexRow, 'gap-1')} data-testid="ofis-kasa-islem-cell">
      {onaysiz && yonetici ? (
        <>
          <Button type="button" size="table" variant="secondary" disabled={approvePending} onClick={onApprove}>
            Onayla
          </Button>
          <Button type="button" size="table" variant="outline" onClick={onReject}>
            Reddet
          </Button>
          {h.islemTipi !== 'GIDER' ? (
            <Button
              type="button"
              size="table"
              variant="outline"
              className="text-danger"
              disabled={deletePending}
              onClick={onHardDelete}
            >
              Sil
            </Button>
          ) : null}
        </>
      ) : null}

      {showDuzeltmeSilGrid ? (
        <div
          className="inline-grid grid-flow-col auto-cols-max items-center gap-1"
          data-testid="ofis-kasa-duzeltme-sil-grid"
        >
          {showDuzeltme ? (
            <Button
              type="button"
              size="table"
              variant="outline"
              onClick={onDuzeltme}
              data-testid="ofis-duzeltme-btn"
            >
              Düzeltme
            </Button>
          ) : (
            <ActionSlotGhost label="Düzeltme" />
          )}
          {showGuvenliSil && guvenliMode ? (
            <Button
              type="button"
              size="table"
              variant="outline"
              className="border-danger/40 text-danger"
              disabled={guvenliSilPending}
              onClick={onGuvenliSil}
              aria-label="Sil"
              data-testid={
                guvenliMode === 'GIDER_SIL'
                  ? 'ofis-masraf-sil-btn'
                  : guvenliMode === 'GELIR_SIL'
                    ? 'ofis-gelir-sil-btn'
                    : 'ofis-tahsilat-iptal-btn'
              }
            >
              Sil
            </Button>
          ) : (
            <ActionSlotGhost label="Sil" />
          )}
        </div>
      ) : null}

      {h.dovizDonusumId && yonetici && onaysiz ? (
        <Button
          type="button"
          size="table"
          variant="outline"
          className="text-danger"
          disabled={dovizDeletePending}
          onClick={onDovizDelete}
        >
          Dönüşüm sil
        </Button>
      ) : null}

      {reddedildi && !showDuzeltme && !showGuvenliSil && !(onaysiz && yonetici) ? (
        <span className="text-[10px] text-ink-muted">—</span>
      ) : null}
    </div>
  )
}
