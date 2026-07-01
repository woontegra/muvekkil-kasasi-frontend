import type { ReactElement } from 'react'
import { Link } from 'react-router-dom'

export type AdminBreadcrumbItem = {
  label: string
  to?: string
}

export function AdminBreadcrumb({ items }: { items: AdminBreadcrumbItem[] }): ReactElement {
  return (
    <nav className="mb-3 text-xs text-slate-500" aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => (
          <li key={`${item.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 ? <span className="text-slate-300">›</span> : null}
            {item.to ? (
              <Link to={item.to} className="font-medium text-indigo-600 hover:text-indigo-800 hover:underline">
                {item.label}
              </Link>
            ) : (
              <span className="font-semibold text-slate-700">{item.label}</span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  )
}
