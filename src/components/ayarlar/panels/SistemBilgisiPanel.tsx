import type { ReactElement } from 'react'
import { AyarlarPanelShell } from '../shared'

export function SistemBilgisiPanel(): ReactElement {
  return (
    <AyarlarPanelShell title="Sistem Bilgisi" description="Ürün ve ortam bilgileri.">
      <div className="grid gap-3 rounded-lg border border-border bg-white p-4 shadow-sm sm:grid-cols-2 sm:p-5">
        <div className="rounded-md border border-border/70 bg-surface-muted/20 px-3 py-2.5">
          <p className="text-xs font-semibold uppercase text-ink-muted">Ürün</p>
          <p className="mt-1 text-sm font-medium text-ink">Müvekkil Kasa Defteri SaaS</p>
        </div>
        <div className="rounded-md border border-border/70 bg-surface-muted/20 px-3 py-2.5">
          <p className="text-xs font-semibold uppercase text-ink-muted">Firma</p>
          <p className="mt-1 text-sm font-medium text-ink">Woontegra Teknoloji Yazılım ve Dijital Hizmetler Ltd. Şti.</p>
        </div>
        <div className="rounded-md border border-border/70 bg-surface-muted/20 px-3 py-2.5">
          <p className="text-xs font-semibold uppercase text-ink-muted">Sürüm</p>
          <p className="mt-1 text-sm font-medium tabular-nums text-ink">1.0</p>
        </div>
        <div className="rounded-md border border-border/70 bg-surface-muted/20 px-3 py-2.5">
          <p className="text-xs font-semibold uppercase text-ink-muted">Ortam</p>
          <p className="mt-1 text-sm font-medium text-ink">Web SaaS</p>
        </div>
      </div>
    </AyarlarPanelShell>
  )
}
