import type { ReactElement } from 'react'
import { Badge, Button, Input } from '../ui'
import { cn } from '../../lib/cn'
import type { PersonelPrimOzetDto } from '../../types/prim'

type Props = {
  items: PersonelPrimOzetDto[]
  selectedPersonelId: string | null
  onSelect: (primPersonelId: string) => void
  search: string
  onSearchChange: (v: string) => void
  loading?: boolean
  canManage?: boolean
  onAddPersonel?: () => void
  onEditPersonel?: (item: PersonelPrimOzetDto) => void
}

export function PersonnelSidebar(props: Props): ReactElement {
  const {
    items,
    selectedPersonelId,
    onSelect,
    search,
    onSearchChange,
    loading,
    canManage,
    onAddPersonel,
    onEditPersonel
  } = props
  const q = search.trim().toLowerCase()
  const filtered = q
    ? items.filter(
        (p) =>
          p.adSoyad.toLowerCase().includes(q) ||
          (p.unvan?.toLowerCase().includes(q) ?? false)
      )
    : items

  return (
    <aside className="flex max-h-[calc(100dvh-12rem)] w-[260px] shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-panel">
      <div className="shrink-0 border-b border-border p-2.5">
        <h2 className="text-sm font-semibold text-ink">Personel</h2>
        <div className="mt-1.5">
          <Input
            placeholder="Ara…"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            aria-label="Personel ara"
            className="h-8 text-sm"
          />
        </div>
        {canManage && onAddPersonel ? (
          <Button type="button" size="sm" className="mt-1.5 h-8 w-full text-xs" onClick={onAddPersonel}>
            + Personel ekle
          </Button>
        ) : null}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto p-1.5">
        {loading ? (
          <p className="px-2 py-2 text-xs text-ink-muted">Yükleniyor…</p>
        ) : filtered.length === 0 ? (
          <p className="px-2 py-2 text-xs text-ink-muted">Personel bulunamadı.</p>
        ) : (
          <ul className="space-y-0.5">
            {filtered.map((p) => {
              const active = p.primPersonelId === selectedPersonelId
              return (
                <li key={p.primPersonelId}>
                  <button
                    type="button"
                    onClick={() => onSelect(p.primPersonelId)}
                    className={cn(
                      'w-full rounded-md border px-2 py-1.5 text-left transition',
                      active
                        ? 'border-primary/40 bg-primary-soft'
                        : 'border-transparent hover:border-border hover:bg-surface-muted/60'
                    )}
                  >
                    <div className="flex items-center justify-between gap-1.5">
                      <span className="min-w-0 truncate text-sm font-semibold leading-tight text-ink">
                        {p.adSoyad}
                      </span>
                      {!p.aktifMi ? (
                        <Badge variant="default" className="shrink-0 px-1.5 py-0 text-[10px] leading-4">
                          Pasif
                        </Badge>
                      ) : null}
                    </div>
                    <div className="mt-0.5 flex items-center justify-between gap-2">
                      <span className="min-w-0 truncate text-[11px] leading-tight text-ink-muted">
                        {p.unvan?.trim() || '—'}
                      </span>
                      {canManage && onEditPersonel ? (
                        <span
                          role="button"
                          tabIndex={0}
                          title="Düzenle"
                          aria-label={`${p.adSoyad} düzenle`}
                          className="shrink-0 text-[11px] text-primary hover:underline"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditPersonel(p)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.stopPropagation()
                              onEditPersonel(p)
                            }
                          }}
                        >
                          Düzenle
                        </span>
                      ) : null}
                    </div>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </aside>
  )
}
