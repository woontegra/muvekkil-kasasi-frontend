import type { ReactElement } from 'react'
import { cn } from '../../lib/cn'

type Props = {
  /** Örn. 121.076,25 ₺ — backend Decimal gosterim (TRY sağda) */
  value: string | null | undefined
  unavailable?: boolean
  className?: string
  align?: 'left' | 'right'
}

/**
 * Tablo hücresi: bugünkü TL karşılığı — ana rakamlarla aynı okunabilirlik.
 * Küçük soluk alt açıklama değil; ayrı sütun değeri.
 */
export function BugunkuTlKarsilikCell(props: Props): ReactElement {
  const { value, unavailable, className, align = 'right' } = props
  const text = unavailable ? 'Hesaplanamadı' : value?.trim() || '—'
  return (
    <span
      className={cn(
        'inline-block tabular-nums text-[13px] font-semibold leading-tight text-ink',
        align === 'right' && 'text-right',
        unavailable && 'text-amber-800 dark:text-amber-200',
        className
      )}
      data-testid="bugunku-tl-karsilik"
    >
      {text}
    </span>
  )
}

export const BUGUNKU_TL_KUR_HINT =
  'Ekranın açıldığı günün TCMB Döviz Alış kuruna göre hesaplanır.'
