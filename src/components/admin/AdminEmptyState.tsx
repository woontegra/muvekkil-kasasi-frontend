import type { ReactElement, ReactNode } from 'react'

export function AdminEmptyState(props: { title?: string; description?: string; action?: ReactNode }): ReactElement {
  return (
    <div className="rounded-lg border border-dashed border-slate-200 bg-white px-6 py-12 text-center">
      <p className="text-sm font-semibold text-slate-800">{props.title ?? 'Kayıt bulunamadı'}</p>
      <p className="mt-2 text-sm text-slate-500">
        {props.description ?? 'Bu alanda henüz kayıt bulunmuyor.'}
      </p>
      {props.action ? <div className="mt-4">{props.action}</div> : null}
    </div>
  )
}
