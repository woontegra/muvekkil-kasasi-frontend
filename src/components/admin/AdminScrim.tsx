import type { ReactElement, ReactNode } from 'react'

export function AdminScrim(props: { title: string; children: ReactNode; onClose: () => void }): ReactElement {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/55 p-4 backdrop-blur-[2px]" role="dialog" aria-modal="true">
      <div
        className="absolute inset-0"
        aria-hidden
        onClick={props.onClose}
        onKeyDown={(e) => e.key === 'Escape' && props.onClose()}
      />
      <div className="relative z-[1] w-full max-w-lg rounded-xl border border-slate-200 bg-white p-5 shadow-2xl">
        <div className="mb-4 flex items-start justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">{props.title}</h2>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-sm font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-800"
            onClick={props.onClose}
          >
            Kapat
          </button>
        </div>
        {props.children}
      </div>
    </div>
  )
}
