import type { ComponentPropsWithoutRef, HTMLAttributes, ReactElement, ReactNode } from 'react'
import { cn } from '../../lib/cn'

/**
 * SaaS veri cetveli — ortak kompakt yoğunluk.
 * Başlık ~10–11px, hücre ~11–12px.
 * Yatay scrollbar yok; tablo container genişliğine sığar.
 * overflow-hidden KULLANILMAZ — işlem butonlarını kırpar / sahte PASS üretir.
 */
export function Table({ className, ...rest }: HTMLAttributes<HTMLTableElement>): ReactElement {
  return (
    <div className="mk-data-table-wrap w-full min-w-0 max-w-full rounded-lg border border-border">
      <table
        className={cn(
          'mk-data-table w-full max-w-full table-fixed border-collapse text-left text-[11px] leading-snug',
          className
        )}
        {...rest}
      />
    </div>
  )
}

export function THead({ className, ...rest }: HTMLAttributes<HTMLTableSectionElement>): ReactElement {
  return (
    <thead
      className={cn(
        'bg-gradient-to-b from-surface-muted to-white text-[10px] font-semibold uppercase tracking-wide text-ink-muted',
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
        'motion-row-in',
        interactive
          ? 'group/row cursor-pointer border-l-[3px] border-l-transparent transition-[background-color,border-color,box-shadow,transform] duration-150 hover:border-l-primary hover:bg-gradient-to-r hover:from-primary-soft/55 hover:to-accent-soft/40 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] focus-within:border-l-primary focus-within:bg-gradient-to-r focus-within:from-primary-soft/55 focus-within:to-accent-soft/40 focus-within:shadow-[inset_0_1px_0_rgba(255,255,255,0.65)]'
          : 'transition-colors duration-150 hover:bg-surface-muted/60',
        className
      )}
      {...rest}
    />
  )
}

export function TH({ className, ...rest }: HTMLAttributes<HTMLTableCellElement>): ReactElement {
  return <th className={cn('px-1.5 py-2 align-middle', className)} {...rest} />
}

export function TD({ className, ...rest }: ComponentPropsWithoutRef<'td'>): ReactElement {
  return <td className={cn('px-1.5 py-2 align-middle text-[11px] text-ink', className)} {...rest} />
}

export function TableEmptyRow({ colSpan, children }: { colSpan: number; children: ReactNode }): ReactElement {
  return (
    <tr>
      <td colSpan={colSpan} className="px-1.5 py-6 text-center text-[11px] text-ink-muted">
        {children}
      </td>
    </tr>
  )
}
