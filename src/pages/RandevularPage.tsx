import { useQuery } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { listRandevular, RANDEVULAR_QUERY_KEY } from '../api/randevular'
import { APP_BASE } from '../config/appPaths'
import { defaultEndTimeFromStart, formatTimeTR, getRangeForView, getTodayRangeIso, navigateAnchor, pad2, toDateInputValue } from '../lib/randevuCalendar'
import type { CalendarView, RandevuDto } from '../types/randevu'
import { cn } from '../lib/cn'
import { AlertBox, Button, PageLoading } from '../components/ui'
import { RandevuCalendarView } from '../components/randevu/RandevuCalendarView'
import { RandevuDetailModal } from '../components/randevu/RandevuDetailModal'
import { RandevuFormModal, type RandevuFormPrefill } from '../components/randevu/RandevuFormModal'

function headerLabel(view: CalendarView, anchor: Date): string {
  if (view === 'day') {
    return anchor.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })
  }
  if (view === 'week') {
    const { start, end } = getRangeForView('week', anchor)
    return `${start.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }
  return anchor.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
}

type Props = {
  initialMuvekkilId?: string
  initialView?: CalendarView
}

export function RandevularPageContent({ initialMuvekkilId, initialView }: Props): ReactElement {
  const [view, setView] = useState<CalendarView>(initialView ?? 'week')
  const [anchor, setAnchor] = useState(() => new Date())
  const [formOpen, setFormOpen] = useState(false)
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create')
  const [prefill, setPrefill] = useState<RandevuFormPrefill | undefined>()
  const [selected, setSelected] = useState<RandevuDto | null>(null)
  const [editing, setEditing] = useState<RandevuDto | null>(null)

  const range = useMemo(() => getRangeForView(view, anchor), [view, anchor])

  const randevuQuery = useQuery({
    queryKey: [...RANDEVULAR_QUERY_KEY, view, range.start.toISOString(), range.end.toISOString(), initialMuvekkilId ?? ''],
    queryFn: () =>
      listRandevular({
        baslangic: range.start.toISOString(),
        bitis: range.end.toISOString(),
        ...(initialMuvekkilId ? { muvekkilId: initialMuvekkilId } : {})
      })
  })

  function openCreate(pref?: RandevuFormPrefill): void {
    setFormMode('create')
    setEditing(null)
    setPrefill({
      ...pref,
      muvekkilId: pref?.muvekkilId ?? initialMuvekkilId
    })
    setFormOpen(true)
  }

  function onSlotClick(date: Date, hour: number): void {
    openCreate({
      date: toDateInputValue(date),
      startTime: `${pad2(hour)}:00`,
      endTime: defaultEndTimeFromStart(`${pad2(hour)}:00`)
    })
  }

  function onDayClick(date: Date): void {
    setAnchor(date)
    setView('day')
  }

  function refresh(): void {
    void randevuQuery.refetch()
  }

  const items = randevuQuery.data?.items ?? []

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink md:text-2xl">Randevular</h1>
          <p className="mt-1 text-sm text-ink-muted">{headerLabel(view, anchor)}</p>
        </div>
        <Button type="button" onClick={() => openCreate(initialMuvekkilId ? { muvekkilId: initialMuvekkilId } : undefined)}>
          + Yeni Randevu
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={() => setAnchor(new Date())}>
          Bugün
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setAnchor((a) => navigateAnchor(view, a, -1))}>
          Önceki
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setAnchor((a) => navigateAnchor(view, a, 1))}>
          Sonraki
        </Button>
        <div className="ml-auto flex flex-wrap gap-1 rounded-lg border border-border bg-panel p-1">
          {(['day', 'week', 'month'] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={cn(
                'rounded-md px-3 py-1.5 text-xs font-semibold transition-colors',
                view === v ? 'bg-primary text-white' : 'text-ink-muted hover:bg-primary/10 hover:text-ink'
              )}
              onClick={() => setView(v)}
            >
              {v === 'day' ? 'Gün' : v === 'week' ? 'Hafta' : 'Ay'}
            </button>
          ))}
        </div>
      </div>

      {randevuQuery.isLoading ? (
        <PageLoading label="Randevular yükleniyor…" />
      ) : randevuQuery.isError ? (
        <AlertBox variant="danger" title="Randevular">
          {randevuQuery.error instanceof Error ? randevuQuery.error.message : 'Yüklenemedi.'}
        </AlertBox>
      ) : (
        <RandevuCalendarView
          view={view}
          anchor={anchor}
          items={items}
          onSlotClick={onSlotClick}
          onDayClick={onDayClick}
          onAppointmentClick={setSelected}
        />
      )}

      {formOpen ? (
        <RandevuFormModal
          mode={formMode}
          randevu={editing ?? undefined}
          prefill={prefill}
          onClose={() => {
            setFormOpen(false)
            setEditing(null)
          }}
          onSaved={refresh}
        />
      ) : null}

      {selected && !formOpen ? (
        <RandevuDetailModal
          randevu={selected}
          onClose={() => setSelected(null)}
          onEdit={() => {
            setFormMode('edit')
            setEditing(selected)
            setSelected(null)
            setFormOpen(true)
          }}
          onDeleted={refresh}
        />
      ) : null}
    </div>
  )
}

export function RandevularPage(): ReactElement {
  return <RandevularPageContent />
}

export function BugunkuRandevularCard(): ReactElement {
  const today = getTodayRangeIso()
  const q = useQuery({
    queryKey: [...RANDEVULAR_QUERY_KEY, 'bugun', today.baslangic],
    queryFn: () => listRandevular(today),
    staleTime: 60_000
  })

  const items = (q.data?.items ?? []).slice(0, 5)

  return (
    <div className="rounded-lg border border-border bg-panel p-4 shadow-sm ring-1 ring-ink/[0.04]">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-ink">Bugünkü Randevular</h2>
        <Link to={`${APP_BASE}/randevular`} className="text-xs font-semibold text-primary hover:underline">
          Tümünü Gör
        </Link>
      </div>
      {q.isLoading ? (
        <p className="mt-3 text-sm text-ink-muted">Yükleniyor…</p>
      ) : items.length === 0 ? (
        <p className="mt-3 text-sm text-ink-muted">Bugün planlanmış randevu yok.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {items.map((r: RandevuDto) => (
            <li key={r.id} className="flex items-start gap-3 text-sm">
              <span className="shrink-0 tabular-nums font-semibold text-primary">{formatTimeTR(r.baslangicAt)}</span>
              <div className="min-w-0">
                <p className="truncate font-medium text-ink">{r.baslik}</p>
                {r.muvekkilAd ? <p className="truncate text-xs text-ink-muted">{r.muvekkilAd}</p> : null}
                {r.hatirlatmaOzet ? <p className="truncate text-[10px] text-ink-subtle">{r.hatirlatmaOzet}</p> : null}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function MuvekkilRandevularSection({ muvekkilId }: { muvekkilId: string }): ReactElement {
  const [formOpen, setFormOpen] = useState(false)
  const now = new Date()
  const futureQ = useQuery({
    queryKey: [...RANDEVULAR_QUERY_KEY, 'muvekkil', muvekkilId, 'future'],
    queryFn: () =>
      listRandevular({
        baslangic: now.toISOString(),
        bitis: new Date(now.getFullYear() + 2, 0, 1).toISOString(),
        muvekkilId
      })
  })
  const pastQ = useQuery({
    queryKey: [...RANDEVULAR_QUERY_KEY, 'muvekkil', muvekkilId, 'past'],
    queryFn: () =>
      listRandevular({
        baslangic: new Date(2000, 0, 1).toISOString(),
        bitis: now.toISOString(),
        muvekkilId
      })
  })

  const future = futureQ.data?.items ?? []
  const past = [...(pastQ.data?.items ?? [])].reverse().slice(0, 10)

  function renderList(items: RandevuDto[], empty: string): ReactElement {
    if (items.length === 0) return <p className="text-sm text-ink-muted">{empty}</p>
    return (
      <ul className="divide-y divide-border rounded-lg border border-border">
        {items.map((r) => (
          <li key={r.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
            <div>
              <p className="font-medium text-ink">{r.baslik}</p>
              <p className="text-xs text-ink-muted">
                {new Date(r.baslangicAt).toLocaleDateString('tr-TR')} · {formatTimeTR(r.baslangicAt)} – {formatTimeTR(r.bitisAt)}
              </p>
              {r.hatirlatmaOzet ? <p className="text-[10px] text-ink-subtle">{r.hatirlatmaOzet}</p> : null}
            </div>
            {r.dosyaBaslik ? <span className="text-xs text-ink-muted">{r.dosyaBaslik}</span> : null}
          </li>
        ))}
      </ul>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-base font-bold text-ink">Randevular</h3>
        <Button type="button" size="sm" variant="outline" onClick={() => setFormOpen(true)}>
          + Randevu Oluştur
        </Button>
      </div>
      <div className="space-y-3">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Gelecek randevular</p>
          {futureQ.isLoading ? <p className="text-sm text-ink-muted">Yükleniyor…</p> : renderList(future, 'Gelecek randevu yok.')}
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">Geçmiş randevular</p>
          {pastQ.isLoading ? <p className="text-sm text-ink-muted">Yükleniyor…</p> : renderList(past, 'Geçmiş randevu yok.')}
        </div>
      </div>
      {formOpen ? (
        <RandevuFormModal
          mode="create"
          prefill={{ muvekkilId }}
          onClose={() => setFormOpen(false)}
          onSaved={() => {
            void futureQ.refetch()
            void pastQ.refetch()
          }}
        />
      ) : null}
    </div>
  )
}
