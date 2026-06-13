import { cn } from '../../lib/cn'

/** İşlem hücresi: butonlar aynı hizada; mobilde sar, metin kırılmaz. */
export const tableActionsFlexRow = 'flex flex-wrap items-center justify-end gap-2 sm:flex-nowrap'

/** Tablo içi vurgulu link (ör. Dosyaya git). */
export const tableActionLinkAccentClass = cn(
  'inline-flex h-8 shrink-0 items-center justify-center whitespace-nowrap rounded-md border border-accent bg-accent px-3 text-xs font-semibold text-white shadow-sm outline-none transition hover:brightness-95 focus-visible:ring-2 focus-visible:ring-accent/35'
)

/** Küçük `Button` ile birlikte: tek satır, daralmaz. */
export const tableActionButtonShrinkClass = 'shrink-0 whitespace-nowrap'
