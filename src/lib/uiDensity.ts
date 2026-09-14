/**
 * SaaS ortak tipografi / yoğunluk token’ları.
 * Tailwind sınıflarını semantik olarak toplar; global text-sm override yok.
 */
export const uiType = {
  pageTitle: 'text-[19px] font-bold leading-snug tracking-tight text-ink',
  pageDesc: 'text-[11px] leading-snug text-ink-muted',
  sectionTitle: 'text-[13px] font-semibold tracking-tight text-ink',
  body: 'text-[11px] leading-snug text-ink',
  label: 'mb-1 block text-[10px] font-semibold text-ink-muted',
  hint: 'mt-1 text-[10px] text-ink-subtle',
  helper: 'text-[10px] leading-snug text-ink-muted',
  tableHead: 'text-[10px] font-semibold uppercase tracking-wide text-ink-muted',
  tableCell: 'text-[11px] leading-snug text-ink',
  badge: 'text-[10px] font-semibold',
  button: 'text-[11px] font-semibold',
  buttonTable: 'text-[10px] font-semibold',
  cardLabel: 'text-[10px] font-semibold uppercase tracking-wide text-ink-muted',
  cardValue: 'text-[17px] font-bold tabular-nums leading-tight tracking-tight text-ink',
  cardMeta: 'text-[10px] leading-snug text-ink-muted'
} as const

/** Form kontrolü (input/select) — masaüstü ~32px. */
export const formControlClass =
  'h-8 w-full min-w-0 max-w-full rounded-md border border-border bg-white px-2.5 text-[11px] text-ink shadow-inner outline-none transition ' +
  'placeholder:text-ink-subtle focus:border-primary focus:ring-2 focus:ring-primary/15 ' +
  'disabled:opacity-50 dark:bg-surface-elevated'

export const formControlErrorClass =
  'border-danger focus:border-danger focus:ring-danger/20'

/** Özet kartı kabuğu — kompakt, gereksiz min-height yok. */
export const summaryCardShellClass =
  'motion-card-in relative flex h-full min-h-[5.75rem] w-full flex-col overflow-hidden rounded-lg border bg-panel p-2.5 shadow-card ' +
  'text-left transition-[transform,box-shadow,border-color,background-color] duration-150 ' +
  'motion-reduce:hover:translate-y-0'
