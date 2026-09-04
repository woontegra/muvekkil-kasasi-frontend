import type { ReactElement, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export type ResponsiveDataViewProps = {
  /** Masaüstü tablo (≥ md) */
  table: ReactNode
  /** Mobil kart listesi (< md) */
  cards: ReactNode
  className?: string
  empty?: ReactNode
  loading?: ReactNode
  isEmpty?: boolean
  isLoading?: boolean
}

/**
 * Masaüstünde tablo, mobilde kart listesi.
 * Yatay sayfa kaydırması yerine kart görünümü kullanır.
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
      <div className="hidden md:block">{table}</div>
      <div className="space-y-3 md:hidden">{cards}</div>
    </div>
  )
}
