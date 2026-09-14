import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useMemo, useState } from 'react'
import {
  activateFinansKalemi,
  archiveFinansKalemi,
  createFinansKalemi,
  finansKalemleriQueryKey,
  invalidateFinansKalemleri,
  listFinansKalemleri,
  reorderFinansKalemleri,
  updateFinansKalemi
} from '../../../api/finansKalemleri'
import { ApiError } from '../../../api/client'
import { cn } from '../../../lib/cn'
import { formControlClass, uiType } from '../../../lib/uiDensity'
import { useToast } from '../../../toast'
import type { FinansKalemArchivedDetails, FinansKalemTuruApi, FinansKalemiDto } from '../../../types/finansKalemi'
import { AlertBox, Button, Input, useConfirm } from '../../ui'
import { AyarlarPanelShell } from '../shared'

function sortManuel(items: FinansKalemiDto[]): FinansKalemiDto[] {
  return [...items].sort((a, b) => a.sira - b.sira || a.ad.localeCompare(b.ad, 'tr'))
}

function swapActiveOrder(
  allManuel: FinansKalemiDto[],
  activeManuel: FinansKalemiDto[],
  id: string,
  dir: 'up' | 'down'
): string[] | null {
  const activeIds = activeManuel.map((i) => i.id)
  const idx = activeIds.indexOf(id)
  if (idx < 0) return null
  const swapIdx = dir === 'up' ? idx - 1 : idx + 1
  if (swapIdx < 0 || swapIdx >= activeIds.length) return null
  const order = sortManuel(allManuel).map((i) => i.id)
  const idA = activeIds[idx]
  const idB = activeIds[swapIdx]
  const posA = order.indexOf(idA)
  const posB = order.indexOf(idB)
  if (posA < 0 || posB < 0) return null
  const next = [...order]
  next[posA] = idB
  next[posB] = idA
  return next
}

function KalemTurTab(props: {
  tur: FinansKalemTuruApi
  label: string
  active: boolean
  onSelect: () => void
}): ReactElement {
  const { label, active, onSelect } = props
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'rounded-md border px-2.5 py-1.5 text-[11px] font-semibold transition',
        active
          ? 'border-primary/45 bg-primary-soft/25 text-ink'
          : 'border-border bg-panel text-ink-muted hover:border-primary/30'
      )}
    >
      {label}
    </button>
  )
}

function TurPanel(props: { tur: FinansKalemTuruApi }): ReactElement {
  const { tur } = props
  const queryClient = useQueryClient()
  const toast = useToast()
  const { confirm } = useConfirm()
  const [yeniAd, setYeniAd] = useState('')
  const [editId, setEditId] = useState<string | null>(null)
  const [editAd, setEditAd] = useState('')

  const listQuery = useQuery({
    queryKey: finansKalemleriQueryKey({ tur, aktif: 'all', includeSistem: false }),
    queryFn: () => listFinansKalemleri({ tur, aktif: 'all', includeSistem: false })
  })

  const sistemQuery = useQuery({
    queryKey: finansKalemleriQueryKey({ aktif: 'all', includeSistem: true }),
    queryFn: () => listFinansKalemleri({ aktif: 'all', includeSistem: true })
  })

  const items = listQuery.data?.items ?? []

  const { aktifManuel, pasifManuel } = useMemo(() => {
    const manuel = items.filter((i) => !i.sistemMi)
    return {
      aktifManuel: sortManuel(manuel.filter((i) => i.aktif)),
      pasifManuel: sortManuel(manuel.filter((i) => !i.aktif))
    }
  }, [items])

  const sistemKalemleri = useMemo(
    () => sortManuel((sistemQuery.data?.items ?? []).filter((i) => i.sistemMi)),
    [sistemQuery.data?.items]
  )

  const allManuel = useMemo(() => sortManuel(items.filter((i) => !i.sistemMi)), [items])

  const afterMutation = (): void => {
    invalidateFinansKalemleri(queryClient)
  }

  const createMu = useMutation({
    mutationFn: (ad: string) => createFinansKalemi({ tur, ad }),
    onSuccess: () => {
      setYeniAd('')
      afterMutation()
      toast.success('Kalem eklendi.')
    },
    onError: async (err: unknown) => {
      if (err instanceof ApiError && err.status === 409 && err.code === 'FINANS_KALEM_ARCHIVED') {
        const d = err.details as FinansKalemArchivedDetails | undefined
        if (d?.id) {
          const ok = await confirm({
            title: 'Kalem yeniden etkinleştirilsin mi?',
            message: err.message,
            confirmLabel: 'Etkinleştir',
            cancelLabel: 'Vazgeç'
          })
          if (ok) {
            activateMu.mutate(d.id)
          }
          return
        }
      }
      toast.error(err instanceof ApiError ? err.message : 'Kalem eklenemedi.')
    }
  })

  const activateMu = useMutation({
    mutationFn: (id: string) => activateFinansKalemi(id),
    onSuccess: () => {
      setYeniAd('')
      afterMutation()
      toast.success('Kalem etkinleştirildi.')
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : 'Etkinleştirme başarısız.')
    }
  })

  const updateMu = useMutation({
    mutationFn: ({ id, ad }: { id: string; ad: string }) => updateFinansKalemi(id, { ad }),
    onSuccess: () => {
      setEditId(null)
      setEditAd('')
      afterMutation()
      toast.success('Kalem güncellendi.')
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : 'Güncelleme başarısız.')
    }
  })

  const archiveMu = useMutation({
    mutationFn: (id: string) => archiveFinansKalemi(id),
    onSuccess: () => {
      afterMutation()
      toast.success('Kalem kaldırıldı.')
    },
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : 'Kaldırma başarısız.')
    }
  })

  const reorderMu = useMutation({
    mutationFn: (orderedIds: string[]) => reorderFinansKalemleri({ tur, orderedIds }),
    onSuccess: () => afterMutation(),
    onError: (err: unknown) => {
      toast.error(err instanceof ApiError ? err.message : 'Sıra güncellenemedi.')
    }
  })

  const busy =
    createMu.isPending ||
    updateMu.isPending ||
    archiveMu.isPending ||
    activateMu.isPending ||
    reorderMu.isPending

  const addKalem = (): void => {
    const ad = yeniAd.trim().replace(/\s+/g, ' ')
    if (ad.length < 2) {
      toast.error('Kalem adı en az 2 karakter olmalıdır.')
      return
    }
    createMu.mutate(ad)
  }

  const startEdit = (row: FinansKalemiDto): void => {
    setEditId(row.id)
    setEditAd(row.ad)
  }

  const saveEdit = (): void => {
    if (!editId) return
    const ad = editAd.trim().replace(/\s+/g, ' ')
    if (ad.length < 2) {
      toast.error('Kalem adı en az 2 karakter olmalıdır.')
      return
    }
    updateMu.mutate({ id: editId, ad })
  }

  const askArchive = async (row: FinansKalemiDto): Promise<void> => {
    const ok = await confirm({
      title: 'Kalemi kaldır',
      message: `"${row.ad}" pasif hale getirilecek. Formlarda görünmez; geçmiş kayıtlar etkilenmez.`,
      confirmLabel: 'Kaldır',
      cancelLabel: 'Vazgeç',
      danger: true
    })
    if (ok) archiveMu.mutate(row.id)
  }

  const move = (id: string, dir: 'up' | 'down'): void => {
    const next = swapActiveOrder(allManuel, aktifManuel, id, dir)
    if (next) reorderMu.mutate(next)
  }

  return (
    <div className="space-y-4">
      {listQuery.isError || sistemQuery.isError ? (
        <AlertBox variant="danger" title="Liste yüklenemedi">
          {(listQuery.error ?? sistemQuery.error) instanceof Error
            ? ((listQuery.error ?? sistemQuery.error) as Error).message
            : 'Hata'}
        </AlertBox>
      ) : null}

      <div className="flex flex-wrap items-end gap-2 rounded-lg border border-border bg-panel p-3">
        <div className="min-w-[12rem] flex-1">
          <Input
            label="Yeni kalem adı"
            value={yeniAd}
            onChange={(e) => setYeniAd(e.target.value)}
            disabled={busy}
            className={formControlClass}
          />
        </div>
        <Button type="button" size="sm" disabled={busy} onClick={addKalem}>
          Ekle
        </Button>
      </div>

      <section className="space-y-2">
        <h3 className={uiType.sectionTitle}>Aktif kalemler</h3>
        {aktifManuel.length === 0 ? (
          <p className={uiType.helper}>Aktif manuel kalem yok.</p>
        ) : (
          <ul className="divide-y divide-border rounded-lg border border-border bg-white dark:bg-surface-elevated">
            {aktifManuel.map((row, idx) => (
              <li key={row.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                {editId === row.id ? (
                  <>
                    <input
                      className={cn(formControlClass, 'min-w-[10rem] flex-1')}
                      value={editAd}
                      onChange={(e) => setEditAd(e.target.value)}
                      disabled={busy}
                    />
                    <Button type="button" size="sm" disabled={busy} onClick={saveEdit}>
                      Kaydet
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={busy}
                      onClick={() => {
                        setEditId(null)
                        setEditAd('')
                      }}
                    >
                      Vazgeç
                    </Button>
                  </>
                ) : (
                  <>
                    <span className={cn(uiType.body, 'min-w-0 flex-1')}>{row.ad}</span>
                    <div className="flex flex-wrap gap-1">
                      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => startEdit(row)}>
                        Düzenle
                      </Button>
                      <Button type="button" size="sm" variant="outline" disabled={busy || idx === 0} onClick={() => move(row.id, 'up')}>
                        ↑
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={busy || idx === aktifManuel.length - 1}
                        onClick={() => move(row.id, 'down')}
                      >
                        ↓
                      </Button>
                      <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => void askArchive(row)}>
                        Kaldır
                      </Button>
                    </div>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {pasifManuel.length > 0 ? (
        <section className="space-y-2">
          <h3 className={uiType.sectionTitle}>Pasif kalemler</h3>
          <ul className="divide-y divide-border rounded-lg border border-dashed border-border bg-surface-muted/40">
            {pasifManuel.map((row) => (
              <li key={row.id} className="flex flex-wrap items-center gap-2 px-3 py-2">
                <span className={cn(uiType.body, 'min-w-0 flex-1 text-ink-muted')}>{row.ad}</span>
                <Button type="button" size="sm" variant="outline" disabled={busy} onClick={() => activateMu.mutate(row.id)}>
                  Etkinleştir
                </Button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {sistemKalemleri.length > 0 ? (
        <section className="space-y-2">
          <h3 className={uiType.sectionTitle}>Sistem kalemleri</h3>
          <p className={uiType.helper}>Sistem tarafından yönetilir — düzenlenemez veya kaldırılamaz.</p>
          <ul className="divide-y divide-border rounded-lg border border-border bg-surface-muted/30">
            {sistemKalemleri.map((row) => (
              <li key={row.id} className="flex items-center gap-2 px-3 py-2">
                <span
                  className="inline-flex h-5 w-5 shrink-0 items-center justify-center rounded border border-border text-[10px] font-bold text-ink-muted"
                  title="Kilitli"
                  aria-label="Kilitli"
                >
                  K
                </span>
                <span className={cn(uiType.body, 'text-ink-muted')}>{row.ad}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  )
}

export function GelirGiderKalemleriPanel(): ReactElement {
  const [tab, setTab] = useState<FinansKalemTuruApi>('GELIR')

  return (
    <AyarlarPanelShell
      title="Gelir ve Gider Kalemleri"
      description="Ofis kasası ve dosya masraf formlarında görünen kalemleri yönetin. Sıra, formlardaki listeleme düzenini belirler."
    >
      <div className="flex flex-wrap gap-2">
        <KalemTurTab tur="GELIR" label="Gelir Kalemleri" active={tab === 'GELIR'} onSelect={() => setTab('GELIR')} />
        <KalemTurTab tur="GIDER" label="Gider Kalemleri" active={tab === 'GIDER'} onSelect={() => setTab('GIDER')} />
      </div>
      {tab === 'GELIR' ? <TurPanel tur="GELIR" /> : <TurPanel tur="GIDER" />}
    </AyarlarPanelShell>
  )
}
