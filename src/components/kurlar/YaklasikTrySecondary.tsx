import type { ReactElement } from 'react'
import { cn } from '../../lib/cn'

type Props = {
  satirEtiket: string | null | undefined
  /** Özet satırında kur bilgisi (yalnızca bir kez, anlaşılan altında) */
  kurBilgiSatiri?: string | null
  className?: string
  compact?: boolean
}

/** İkincil yaklaşık TRY — backend Decimal; DB’ye yazılmaz. */
export function YaklasikTrySecondary(props: Props): ReactElement | null {
  const { satirEtiket, kurBilgiSatiri, className, compact } = props
  if (!satirEtiket && !kurBilgiSatiri) return null
  return (
    <div className={cn(compact ? 'mt-0.5' : 'mt-1', className)}>
      {satirEtiket ? (
        <p
          className={cn(
            'leading-snug text-ink-muted',
            compact ? 'text-[10px]' : 'text-[11px]'
          )}
          data-testid="yaklasik-try-line"
        >
          {satirEtiket}
        </p>
      ) : null}
      {kurBilgiSatiri ? (
        <p
          className={cn(
            'leading-snug text-ink-muted/90',
            compact ? 'text-[10px]' : 'text-[11px]'
          )}
          data-testid="yaklasik-try-kur"
        >
          {kurBilgiSatiri}
        </p>
      ) : null}
    </div>
  )
}
