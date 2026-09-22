import type { ReactElement } from 'react'
import { Badge, ClampTooltipText, TD, TR, tableActionColWideClass } from '../ui'
import { cn } from '../../lib/cn'
import {
  balanceImpactTone,
  formatBalanceImpact,
  formatCurrencyTR,
  formatDateTR
} from '../../utils/formatters'
import type { AuthUserDto } from '../../types/auth'
import type { KasaHareketiDto, KasaOnayDurumuApi, OdemeYontemiApi } from '../../types/kasa'
import { DosyaKasaHareketIslemCell } from './DosyaKasaHareketIslemCell'

type Props = {
  hareket: KasaHareketiDto
  role: AuthUserDto['role'] | undefined
  yonetici: boolean
  rowId?: string
  highlighted?: boolean
  highlightClassName?: string
  odemeLabel: (v: OdemeYontemiApi | null) => string
  onayLabel: (o: KasaOnayDurumuApi) => string
  aciklamaText: string
  tipLabel: string
  signedAmount: number
  approvePending?: boolean
  deletePending?: boolean
  guvenliSilPending?: boolean
  onApprove: () => void
  onReject: () => void
  onHardDelete: () => void
  onDuzeltme: () => void
  onGuvenliSil: () => void
}

/** Dosya kasa satırı — Ofis ile aynı düzeltme grup / bakiye etkisi sözleşmesi. */
export function DosyaKasaHareketTableRow(props: Props): ReactElement {
  const h = props.hareket
  const isDuz = h.tip === 'DUZELTME'
  const onaysiz = h.onayDurumu === 'ONAYSIZ'
  const onayli = h.onayDurumu === 'ONAYLI'
  const reddedildi = h.onayDurumu === 'REDDEDILDI'
  const impact = isDuz ? Number(h.bakiyeEtkisi ?? h.tutar) : props.signedAmount
  const tone = isDuz ? balanceImpactTone(impact) : null

  return (
    <TR
      id={props.rowId}
      data-testid="dosya-kasa-hareket-row"
      data-kasa-tip={h.tip}
      data-orijinal-id={h.orijinalHareketId ?? undefined}
      data-duzeltildi={h.duzeltildi ? '1' : undefined}
      className={cn(
        isDuz && 'border-l-4 border-l-rose-500 bg-rose-50/50 dark:bg-rose-950/25',
        h.duzeltildi && !isDuz && 'ring-1 ring-inset ring-rose-200/80',
        onaysiz && !isDuz && 'bg-warning-soft/30',
        props.highlighted && props.highlightClassName
      )}
    >
      <TD className="whitespace-nowrap text-ink-muted">
        {formatDateTR(isDuz ? h.economicTarih ?? h.tarih : h.tarih)}
        {isDuz ? <p className="mt-0.5 text-[10px] text-ink-muted">Düzeltme: {formatDateTR(h.tarih)}</p> : null}
      </TD>
      <TD className="font-mono text-xs tabular-nums text-ink">{h.belgeNo}</TD>
      <TD>
        <div className="flex flex-wrap items-center gap-1">
          <span className="font-medium">{props.tipLabel}</span>
          {isDuz ? (
            <Badge variant="warning" className="!normal-case">
              Düzeltme
            </Badge>
          ) : null}
          {h.duzeltildi && !isDuz ? (
            <Badge variant="warning" className="!normal-case text-[10px]">
              Düzeltildi
            </Badge>
          ) : null}
        </div>
        {isDuz && h.orijinalBelgeNo ? (
          <p className="mt-0.5 text-[11px] text-ink-muted">Orijinal: {h.orijinalBelgeNo}</p>
        ) : null}
      </TD>
      <TD className="max-w-[220px] text-ink-muted">
        {isDuz ? (
          <div className="space-y-0.5 text-[11px] leading-snug">
            {h.duzeltenUserAd ? (
              <p>
                Düzelten: <span className="font-medium text-ink">{h.duzeltenUserAd}</span>
              </p>
            ) : null}
            <ClampTooltipText text={h.aciklama ? `Neden: ${h.aciklama}` : props.aciklamaText} lines={2} />
            {h.eskiTutar && h.yeniTutar ? (
              <p className="tabular-nums">
                {formatCurrencyTR(Number(h.eskiTutar))} → {formatCurrencyTR(Number(h.yeniTutar))}
              </p>
            ) : null}
            {h.bagliIslemUyari ? <p className="font-medium text-amber-700">{h.bagliIslemUyari}</p> : null}
          </div>
        ) : (
          props.aciklamaText
        )}
      </TD>
      <TD className="text-xs text-ink-muted">{props.odemeLabel(h.odemeYontemi)}</TD>
      <TD>
        <Badge
          variant={onayli ? 'success' : reddedildi ? 'danger' : onaysiz ? 'warning' : 'default'}
          className="!normal-case"
        >
          {props.onayLabel(h.onayDurumu)}
        </Badge>
        {reddedildi && h.redSebebi?.trim() ? (
          <p className="mt-1 max-w-[180px] text-[11px] text-danger">{h.redSebebi}</p>
        ) : null}
      </TD>
      <TD
        className={cn(
          'text-right font-semibold tabular-nums',
          isDuz
            ? tone === 'positive'
              ? 'text-emerald-700'
              : tone === 'negative'
                ? 'text-danger'
                : 'text-rose-800'
            : props.signedAmount < 0
              ? 'text-danger'
              : 'text-ink'
        )}
        data-testid={isDuz ? 'dosya-kasa-bakiye-etkisi' : undefined}
      >
        {isDuz
          ? (h.bakiyeEtkisiDisplay ?? formatBalanceImpact(impact, 'TRY'))
          : formatCurrencyTR(props.signedAmount)}
      </TD>
      <TD className={cn(tableActionColWideClass, 'align-middle')}>
        <DosyaKasaHareketIslemCell
          hareket={h}
          role={props.role}
          yonetici={props.yonetici}
          approvePending={props.approvePending}
          deletePending={props.deletePending}
          guvenliSilPending={props.guvenliSilPending}
          onApprove={props.onApprove}
          onReject={props.onReject}
          onHardDelete={props.onHardDelete}
          onDuzeltme={props.onDuzeltme}
          onGuvenliSil={props.onGuvenliSil}
        />
      </TD>
    </TR>
  )
}
