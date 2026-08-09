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
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-ink-muted">Ayar kategorisi</label>
        <select
          className="h-10 w-full rounded-md border border-border bg-white px-3 text-sm font-medium text-ink shadow-sm"
          value={props.active}
          onChange={(e) => props.onSelect(e.target.value as AyarlarSectionId)}
        >
          {props.items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
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
