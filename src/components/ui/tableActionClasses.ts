import { cn } from '../../lib/cn'
import { uiType } from '../../lib/uiDensity'

/** İşlem hücresi: kompakt butonlar aynı satırda, küçük gap. */
export const tableActionsFlexRow = 'flex flex-nowrap items-center justify-end gap-1.5'

/**
 * table-fixed altında w-[1%] işlem sütununu ezer / buton keser.
 * Sabit min genişlik ile işlem kolonunu koru.
 */
export const tableActionColClass = 'w-[6.5rem] min-w-[6.5rem] max-w-[9rem] whitespace-nowrap text-right'

/** Birden fazla satır içi buton (SMM / vekalet). */
export const tableActionColWideClass = 'w-[8.5rem] min-w-[8.5rem] max-w-[12rem] whitespace-nowrap text-right'

/**
 * Çoklu metin aksiyon butonu (Tahsilat Takibi: Ödeme / WhatsApp / Ekstre / Dosya).
 * ~4× table-size buton + gap; table-fixed altında ezilmemeli.
 */
export const tableActionColMultiClass =
  'w-[22.5rem] min-w-[22.5rem] max-w-[24rem] whitespace-nowrap align-middle text-right'

/** Tablo içi vurgulu link (ör. Dosyaya git). */
export const tableActionLinkAccentClass = cn(
  'inline-flex h-[27px] shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-accent bg-accent px-2 text-white shadow-sm outline-none transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-accent/35',
  uiType.buttonTable
)

/** `Button size="table"` ile birlikte veya className override. */
export const tableActionButtonShrinkClass = cn(
  'shrink-0 whitespace-nowrap',
  /* Button varsayılan hover:-translate-y-px komşu hücrelere taşmayı tetikler */
  'hover:translate-y-0 active:translate-y-0',
  uiType.buttonTable
)
