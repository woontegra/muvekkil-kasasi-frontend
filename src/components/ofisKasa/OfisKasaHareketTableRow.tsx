import type { ReactElement } from 'react'
import { Badge, ClampTooltipText, TD, TR, tableActionColClass } from '../ui'
import { cn } from '../../lib/cn'
import {
  isOfisDuzeltmeTipi,
  OFIS_DUZELTME_ROW_CLASS,
  OFIS_DUZELTME_TUTAR_CLASS,
  ofisHareketRowVariant
} from '../../lib/ofisKasaDuzeltmeStil'
import { formatDateTR } from '../../utils/formatters'
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

  return (
    <TR
      data-testid="ofis-hareket-row"
      data-ofis-row-variant={variant}
      className={cn(isDuz && OFIS_DUZELTME_ROW_CLASS)}
    >
      <TD className="whitespace-nowrap text-ink-muted">{formatDateTR(h.tarih)}</TD>
      <TD className="whitespace-nowrap">
        <OfisKasaIslemTipiCell islemTipi={h.islemTipi} />
      </TD>
      <TD className="hidden max-w-0 text-ink-muted md:table-cell">
        <ClampTooltipText text={props.muvekkilAdi === '—' ? '' : props.muvekkilAdi} lines={1} empty="—" />
      </TD>
      <TD className="max-w-0">
        <ClampTooltipText text={kategoriText} lines={2} />
      </TD>
      <TD className="max-w-0" data-testid="ofis-aciklama-cell">
        <ClampTooltipText text={h.aciklama} lines={2} tooltipExtra={kurExtra} />
      </TD>
      <TD
        className={cn(
          'whitespace-nowrap text-right font-semibold tabular-nums',
          isDuz ? OFIS_DUZELTME_TUTAR_CLASS : props.signed < 0 ? 'text-danger' : 'text-ink'
        )}
      >
        {props.formatSignedMoney(props.signed, props.paraBirimi)}
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
