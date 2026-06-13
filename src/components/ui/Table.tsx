import type { ComponentPropsWithoutRef, HTMLAttributes, ReactElement, ReactNode } from 'react'
import { cn } from '../../lib/cn'

export function Table({ className, ...rest }: HTMLAttributes<HTMLTableElement>): ReactElement {
  return (
    <div className="w-full overflow-x-auto rounded-lg border border-border">
      <table className={cn('w-full min-w-[520px] border-collapse text-left text-sm', className)} {...rest} />
    </div>
  )
}

export function THead({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>): ReactElement {
  return (
    <thead
      className={cn(
        'bg-gradient-to-b from-surface-muted to-white text-[11px] font-bold uppercase tracking-wide text-ink-muted',
        className
      )}
      {...rest}
    />
  )
}

export function TBody({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>): ReactElement {
  return <tbody className={cn('divide-y divide-border bg-panel', className)} {...rest} />
}

export type TRProps = HTMLAttributes<HTMLTableRowElement> & {
  /**
   * Tıklanabilir satır: pointer, mavi–turkuaz hover, sol accent çizgisi.
   * Klavye erişimi için satır içinde gerçek link/buton kullanın.
   */
  interactive?: boolean
}

export function TR({ className, interactive, ...rest }: TRProps): ReactElement {
  return (
    <tr
      className={cn(
        interactive
          ? 'group/row cursor-pointer border-l-[3px] border-l-transparent transition-[background-color,border-color,box-shadow] duration-150 hover:border-l-primary hover:bg-gradient-to-r hover:from-primary-soft/55 hover:to-accent-soft/40 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] focus-within:border-l-primary focus-within:bg-gradient-to-r focus-within:from-primary-soft/55 focus-within:to-accent-soft/40 focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]'
          : 'hover:bg-surface-muted/60',
        className
      )}
      {...rest}
    />
  )
}

export function TH({ className, ...rest }: HTMLAttributes<HTMLTableCellElement>): ReactElement {
  return <th className={cn('px-3 py-2.5', className)} {...rest} />
}

export function TD({ className, ...rest }: ComponentPropsWithoutRef<'td'>): ReactElement {
  return <td className={cn('px-3 py-2 text-ink', className)} {...rest} />
}

export function TableEmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }): ReactElement {
  return (
    <tr>
      <td colSpan={colSpan} className="px-3 py-8 text-center text-sm text-ink-muted">
        {children}
      </td>
    </tr>
  )
}
