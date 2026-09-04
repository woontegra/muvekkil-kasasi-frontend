import type { ReactElement } from 'react'
import { cn } from '../../lib/cn'
import type { AyarlarNavItem, AyarlarSectionId } from './ayarlarSections'

type Props = {
  items: AyarlarNavItem[]
  active: AyarlarSectionId
  onSelect: (id: AyarlarSectionId) => void
}

export function AyarlarNav(props: Props): ReactElement {
  return (
    <>
      <div className="lg:hidden">
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">Ayar kategorisi</p>
        <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
          {props.items.map((item) => {
            const active = props.active === item.id
            return (
              <button
                key={item.id}
                type="button"
                className={cn(
                  'h-11 shrink-0 whitespace-nowrap rounded-full border px-3.5 text-sm font-semibold transition',
                  active
                    ? 'border-primary bg-primary text-primary-fg shadow-sm'
                    : 'border-border bg-white text-ink-muted hover:bg-surface-muted hover:text-ink'
                )}
                onClick={() => props.onSelect(item.id)}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>

      <nav className="hidden w-[228px] shrink-0 lg:block" aria-label="Ayar kategorileri">
        <div className="sticky top-4 rounded-lg border border-border bg-white p-2 shadow-sm">
          <ul className="space-y-0.5">
            {props.items.map((item) => {
              const active = props.active === item.id
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className={cn(
                      'w-full rounded-md px-2.5 py-2 text-left text-[13px] font-semibold transition',
                      active
                        ? 'bg-primary text-primary-fg shadow-sm'
                        : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
                    )}
                    onClick={() => props.onSelect(item.id)}
                  >
                    {item.label}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      </nav>
    </>
  )
}
