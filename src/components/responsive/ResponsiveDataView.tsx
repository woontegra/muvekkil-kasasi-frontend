import type { ReactElement, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type ResponsiveDataViewProps = {
  /** Masaüstü tablo (≥ lg) */
  table: ReactNode
  /** Tablet/mobil kart listesi (< lg) */
  cards: ReactNode
  className?: string
  empty?: ReactNode
  loading?: ReactNode
  isEmpty?: boolean
  isLoading?: boolean
}

/**
 * Masaüstünde tablo (≥ lg), tablette/mobilde kart listesi.
 * Dar viewport’ta sıkışık tablo yerine kart görünümü kullanır.
 */
export function ResponsiveDataView({
  table,
  cards,
  className,
  empty,
  loading,
  isEmpty,
  isLoading
}: ResponsiveDataViewProps): ReactElement {
  if (isLoading && loading) return <>{loading}</>
  if (isEmpty && empty) return <>{empty}</>

  return (
    <div className={cn('w-full min-w-0', className)}>
      <div className="hidden lg:block">{table}</div>
      <div className="space-y-3 lg:hidden">{cards}</div>
    </div>
  )
}
