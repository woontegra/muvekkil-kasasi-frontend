import type { HTMLAttributes, ReactElement, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>): ReactElement {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-panel shadow-card',
        className
      )}
      {...rest}
    />
  )
}

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>): ReactElement {
  return <div className={cn('border-b border-border px-4 py-3', className)} {...rest} />
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }): ReactElement {
  return <h3 className={cn('text-sm font-bold tracking-tight text-ink', className)}>{children}</h3>
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>): ReactElement {
  return <div className={cn('p-4', className)} {...rest} />
}
