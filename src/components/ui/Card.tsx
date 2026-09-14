import type { HTMLAttributes, ReactElement, ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { uiType } from '../../lib/uiDensity'

export function Card({ className, ...rest }: HTMLAttributes<HTMLDivElement>): ReactElement {
  return (
    <div
      className={cn(
        'motion-card-in rounded-xl border border-border bg-panel shadow-card',
        className
      )}
      {...rest}
    />
  )
}

export function CardHeader({ className, ...rest }: HTMLAttributes<HTMLDivElement>): ReactElement {
  return <div className={cn('border-b border-border px-3.5 py-2.5', className)} {...rest} />
}

export function CardTitle({ children, className }: { children: ReactNode; className?: string }): ReactElement {
  return <h3 className={cn(uiType.sectionTitle, className)}>{children}</h3>
}

export function CardBody({ className, ...rest }: HTMLAttributes<HTMLDivElement>): ReactElement {
  return <div className={cn('p-3.5', className)} {...rest} />
}
