import type { ReactElement } from 'react'
import { cn } from '../../lib/cn'

type SkeletonProps = {
  className?: string
}

/** Yükleme iskeleti — pulse, reduced-motion'da statik. */
export function Skeleton({ className }: SkeletonProps): ReactElement {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-surface-muted motion-reduce:animate-none motion-reduce:bg-border/60',
        className
      )}
      aria-hidden
    />
  )
}

export function SkeletonLines(props: { lines?: number; className?: string }): ReactElement {
  const n = props.lines ?? 3
  return (
    <div className={cn('space-y-2', props.className)} aria-busy="true" aria-live="polite">
      {Array.from({ length: n }, (_, i) => (
        <Skeleton key={i} className={cn('h-3 w-full', i === n - 1 && 'w-2/3')} />
      ))}
    </div>
  )
}

export function SkeletonCard(props: { className?: string }): ReactElement {
  return (
    <div className={cn('rounded-xl border border-border bg-panel p-4 shadow-card', props.className)}>
      <Skeleton className="mb-3 h-3 w-24" />
      <Skeleton className="h-7 w-32" />
      <Skeleton className="mt-2 h-3 w-40" />
    </div>
  )
}

export function PageLoading(props: { label?: string }): ReactElement {
  return (
    <div className="motion-fade-in flex w-full flex-col gap-4 py-2" role="status" aria-live="polite">
      <p className="text-sm text-ink-muted">{props.label ?? 'Yükleniyor…'}</p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="rounded-xl border border-border bg-panel p-4">
        <SkeletonLines lines={5} />
      </div>
    </div>
  )
}
