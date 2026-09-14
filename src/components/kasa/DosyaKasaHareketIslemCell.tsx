import type { ReactElement } from 'react'
import type { AuthUserDto } from '../../types/auth'
import type { KasaHareketiDto } from '../../types/kasa'
import {
  canShowDosyaKasaDuzeltme,
  canShowDosyaKasaGuvenliSil,
  resolveDosyaKasaGuvenliSilMode
} from '../../lib/dosyaKasaGuvenliSil'
import { Button } from '../ui'

type Props = {
  hareket: KasaHareketiDto
  role: AuthUserDto['role'] | undefined
  yonetici: boolean
  approvePending?: boolean
  deletePending?: boolean
  guvenliSilPending?: boolean
  onApprove: () => void
  onReject: () => void
  onHardDelete: () => void
  onDuzeltme: () => void
  onGuvenliSil: () => void
}

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
 * Dosya → Kasa Hareketleri işlem sütunu.
 * Onaylı AVANS/MASRAF: Düzeltme ekle | Sil (yalnız BURO_SAHIBI).
 */
export function DosyaKasaHareketIslemCell(props: Props): ReactElement {
  const {
    hareket: h,
    role,
    yonetici,
    approvePending,
    deletePending,
    guvenliSilPending,
    onApprove,
    onReject,
    onHardDelete,
    onDuzeltme,
    onGuvenliSil
  } = props

  const onaysiz = h.onayDurumu === 'ONAYSIZ'
  const showGuvenliSil = canShowDosyaKasaGuvenliSil({ role, tip: h.tip, deletedAt: h.deletedAt })
  const showDuzeltme = canShowDosyaKasaDuzeltme({ onayDurumu: h.onayDurumu, tip: h.tip })
  const guvenliMode = resolveDosyaKasaGuvenliSilMode(h.tip)
  const showDuzeltmeSilGrid = showDuzeltme || (showGuvenliSil && !onaysiz)

  return (
    <div
      className="flex flex-nowrap items-center justify-end gap-1"
      data-testid="dosya-kasa-islem-cell"
    >
      {onaysiz && yonetici ? (
        <>
          <Button type="button" size="table" variant="secondary" disabled={approvePending} onClick={onApprove}>
            Onayla
          </Button>
          <Button type="button" size="table" variant="outline" onClick={onReject}>
            Reddet
          </Button>
          {h.tip !== 'MASRAF' ? (
            <Button type="button" size="table" variant="danger" disabled={deletePending} onClick={onHardDelete}>
              Sil
            </Button>
          ) : null}
        </>
      ) : null}

      {onaysiz && showGuvenliSil && h.tip === 'MASRAF' ? (
        <Button
          type="button"
          size="table"
          variant="outline"
          className="border-danger/40 text-danger"
          disabled={guvenliSilPending}
          onClick={onGuvenliSil}
          aria-label="Sil"
          data-testid="dosya-kasa-guvenli-sil-btn"
        >
          Sil
        </Button>
      ) : null}

      {showDuzeltmeSilGrid ? (
        <div
          className="inline-grid grid-flow-col auto-cols-max items-center gap-1"
          data-testid="dosya-kasa-duzeltme-sil-grid"
        >
          {showDuzeltme ? (
            <Button
              type="button"
              size="table"
              variant="outline"
              onClick={onDuzeltme}
              data-testid="dosya-kasa-duzeltme-btn"
            >
              Düzeltme ekle
            </Button>
          ) : (
            <ActionSlotGhost label="Düzeltme ekle" />
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
              data-testid="dosya-kasa-guvenli-sil-btn"
            >
              Sil
            </Button>
          ) : (
            <ActionSlotGhost label="Sil" />
          )}
        </div>
      ) : null}
    </div>
  )
}
