import type { ReactElement } from 'react'
import { Badge, ClampTooltipText, TD, TR, tableActionColClass } from '../ui'
import { cn } from '../../lib/cn'
import {
  isOfisDuzeltmeTipi,
  OFIS_DUZELTME_ROW_CLASS,
  OFIS_DUZELTME_TUTAR_CLASS,
  ofisHareketRowVariant
} from '../../lib/ofisKasaDuzeltmeStil'
import {
  balanceImpactTone,
  formatBalanceImpact,
  formatDateTR,
  formatMoney
} from '../../utils/formatters'
import type { AuthUserDto } from '../../types/auth'
import type { OfisKasaHareketiDto, OfisKasaOdemeYontemiApi, OfisKasaOnayDurumuApi } from '../../types/ofisKasasi'
import type { ParaBirimi } from '../../utils/formatters'
import { OfisKasaIslemTipiCell } from './OfisKasaIslemTipiCell'
import { OfisKasaHareketIslemCell } from './OfisKasaHareketIslemCell'

/** @deprecated PB sütunu kaldırıldı — tutar sembolü yeterli. Dışa açık tutuluyor. */
export const OFIS_PB_COL_CLASS = 'hidden'

type Props = {
  hareket: OfisKasaHareketiDto
  role: AuthUserDto['role'] | undefined
  yonetici: boolean
  muvekkilAdi: string
  signed: number
  paraBirimi: ParaBirimi
  formatSignedMoney: (n: number, pb: ParaBirimi) => string
  odemeLabel: (v: OfisKasaOdemeYontemiApi) => string
  onayLabel: (o: OfisKasaOnayDurumuApi) => string
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

function kurTooltipExtra(h: OfisKasaHareketiDto): string | null {
  if (!h.kur || !h.kurBazParaBirimi || !h.kurKarsiParaBirimi) return null
  return `1 ${h.kurBazParaBirimi} = ${Number(h.kur).toLocaleString('tr-TR', {
    minimumFractionDigits: 8,
    maximumFractionDigits: 8
  })} ${h.kurKarsiParaBirimi}`
}

/** Ofis Kasası masaüstü tablo satırı — DUZELTME kırmızı varyantı burada. */
export function OfisKasaHareketTableRow(props: Props): ReactElement {
  const h = props.hareket
  const isDuz = isOfisDuzeltmeTipi(h.islemTipi)
  const onaysiz = h.onayDurumu === 'ONAYSIZ'
  const onayli = h.onayDurumu === 'ONAYLI'
  const reddedildi = h.onayDurumu === 'REDDEDILDI'
  const variant = ofisHareketRowVariant(h.islemTipi)
  const kurExtra = kurTooltipExtra(h)
  const kategoriText = h.ozelKategoriAdi?.trim()
    ? `${h.kategori} (${h.ozelKategoriAdi.trim()})`
    : h.kategori
  const impact = isDuz ? Number(h.bakiyeEtkisi ?? h.tutar) : props.signed
  const impactTone = isDuz ? balanceImpactTone(impact) : null

  return (
    <TR
      data-testid="ofis-hareket-row"
      data-ofis-row-variant={variant}
      data-orijinal-id={h.orijinalHareketId ?? undefined}
      data-duzeltildi={h.duzeltildi ? '1' : undefined}
      className={cn(
        isDuz && OFIS_DUZELTME_ROW_CLASS,
        h.duzeltildi && !isDuz && 'ring-1 ring-inset ring-rose-200/80'
      )}
    >
      <TD className="whitespace-nowrap text-ink-muted">
        {formatDateTR(isDuz ? h.economicTarih ?? h.tarih : h.tarih)}
        {isDuz ? <p className="mt-0.5 text-[10px] text-ink-muted">Düzeltme: {formatDateTR(h.tarih)}</p> : null}
      </TD>
      <TD className="whitespace-nowrap">
        <div className="flex flex-wrap items-center gap-1">
          <OfisKasaIslemTipiCell islemTipi={h.islemTipi} />
          {h.duzeltildi && !isDuz ? (
            <Badge variant="warning" className="!normal-case text-[10px]">
              Düzeltildi
            </Badge>
          ) : null}
        </div>
      </TD>
      <TD className="hidden max-w-0 text-ink-muted md:table-cell">
        <ClampTooltipText text={props.muvekkilAdi === '—' ? '' : props.muvekkilAdi} lines={1} empty="—" />
      </TD>
      <TD className="max-w-0">
        <ClampTooltipText text={kategoriText} lines={2} />
      </TD>
      <TD className="max-w-0" data-testid="ofis-aciklama-cell">
        {isDuz ? (
          <div className="space-y-0.5 text-[11px] leading-snug">
            <p className="font-semibold text-rose-800 dark:text-rose-100">Düzeltme</p>
            {h.duzeltenUserAd ? (
              <p className="text-ink-muted">
                Düzelten: <span className="font-medium text-ink">{h.duzeltenUserAd}</span>
              </p>
            ) : null}
            <ClampTooltipText text={h.aciklama ? `Neden: ${h.aciklama}` : ''} lines={2} tooltipExtra={kurExtra} />
            {h.eskiTutar && h.yeniTutar ? (
              <p className="tabular-nums text-ink-muted">
                {formatMoney(Number(h.eskiTutar), props.paraBirimi)} →{' '}
                {formatMoney(Number(h.yeniTutar), props.paraBirimi)}
              </p>
            ) : null}
            {h.bagliIslemUyari ? <p className="font-medium text-amber-700">{h.bagliIslemUyari}</p> : null}
          </div>
        ) : (
          <ClampTooltipText text={h.aciklama} lines={2} tooltipExtra={kurExtra} />
        )}
      </TD>
      <TD
        className={cn(
          'whitespace-nowrap text-right font-semibold tabular-nums',
          isDuz
            ? impactTone === 'positive'
              ? 'text-emerald-700'
              : impactTone === 'negative'
                ? 'text-danger'
                : OFIS_DUZELTME_TUTAR_CLASS
            : props.signed < 0
              ? 'text-danger'
              : 'text-ink'
        )}
        data-testid={isDuz ? 'ofis-bakiye-etkisi' : undefined}
      >
        {isDuz
          ? (h.bakiyeEtkisiDisplay ?? formatBalanceImpact(impact, props.paraBirimi))
          : props.formatSignedMoney(props.signed, props.paraBirimi)}
      </TD>
      <TD className="hidden whitespace-nowrap text-ink-muted xl:table-cell">{props.odemeLabel(h.odemeYontemi)}</TD>
      <TD className="hidden max-w-0 font-mono xl:table-cell">
        <ClampTooltipText text={h.belgeNo} lines={1} />
      </TD>
      <TD className="max-w-0 overflow-hidden">
        <Badge
          variant={onayli ? 'success' : reddedildi ? 'danger' : onaysiz ? 'warning' : 'default'}
          className="!normal-case max-w-full truncate"
        >
          {props.onayLabel(h.onayDurumu)}
        </Badge>
        {reddedildi && h.redSebebi?.trim() ? (
          <p className="mt-0.5 line-clamp-2 text-[10px] leading-tight text-danger" title={h.redSebebi}>
            {h.redSebebi}
          </p>
        ) : null}
      </TD>
      <TD className={cn(tableActionColClass)} data-testid="ofis-islem-cell-wrap">
        <OfisKasaHareketIslemCell
          hareket={h}
          role={props.role}
          yonetici={props.yonetici}
          approvePending={props.approvePending}
          deletePending={props.deletePending}
          dovizDeletePending={props.dovizDeletePending}
          guvenliSilPending={props.guvenliSilPending}
          onApprove={props.onApprove}
          onReject={props.onReject}
          onHardDelete={props.onHardDelete}
          onDuzeltme={props.onDuzeltme}
          onDovizDelete={props.onDovizDelete}
          onGuvenliSil={props.onGuvenliSil}
        />
      </TD>
    </TR>
  )
}
