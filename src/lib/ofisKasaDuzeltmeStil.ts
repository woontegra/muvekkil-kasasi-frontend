import type { OfisKasaIslemTipiApi } from '../types/ofisKasasi'

/** Yalnız canonical `islemTipi === 'DUZELTME'` — metin/açıklama ile karar verilmez. */
export function isOfisDuzeltmeTipi(tip: OfisKasaIslemTipiApi | string | null | undefined): boolean {
  return tip === 'DUZELTME'
}

/**
 * Masaüstü tablo satırı: okunabilir açık kırmızı/pembe zemin + sol kenarlık.
 * TR varsayılan `hover:bg-surface-muted/60` üzerine yazılır; hover’da da düzeltme net kalır.
 */
export const OFIS_DUZELTME_ROW_CLASS =
  'border-l-4 border-l-rose-500 bg-rose-50 hover:bg-rose-100/95 dark:border-l-rose-400 dark:bg-rose-950/40 dark:hover:bg-rose-950/55'

/** Mobil kart: aynı kırmızı sistem. */
export const OFIS_DUZELTME_MOBILE_CARD_CLASS =
  'border-l-4 border-l-rose-500 border-rose-200/90 bg-rose-50 shadow-none hover:bg-rose-100/90 dark:border-rose-800/60 dark:bg-rose-950/40 dark:hover:bg-rose-950/55'

/** Tip sütunu badge — açık kırmızı zemin, koyu kırmızı yazı, semibold. */
export const OFIS_DUZELTME_TIP_BADGE_CLASS =
  'inline-flex items-center rounded-md border border-rose-300 bg-rose-100 px-2 py-0.5 text-[11px] font-semibold !normal-case tracking-normal text-rose-800 dark:border-rose-700 dark:bg-rose-900/55 dark:text-rose-100'

export const OFIS_DUZELTME_TUTAR_CLASS = 'text-rose-800 dark:text-rose-200'

export const OFIS_DUZELTME_VARIANT = 'duzeltme' as const
export const OFIS_NORMAL_VARIANT = 'normal' as const

export function ofisHareketRowVariant(
  tip: OfisKasaIslemTipiApi | string | null | undefined
): typeof OFIS_DUZELTME_VARIANT | typeof OFIS_NORMAL_VARIANT {
  return isOfisDuzeltmeTipi(tip) ? OFIS_DUZELTME_VARIANT : OFIS_NORMAL_VARIANT
}
