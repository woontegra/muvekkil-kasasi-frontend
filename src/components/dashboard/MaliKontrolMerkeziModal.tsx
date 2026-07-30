import type { ReactElement, PointerEvent as ReactPointerEvent } from 'react'
import { useState, useMemo, useRef, useCallback, useEffect, useLayoutEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { AnimatePresence, motion, useDragControls, useMotionValue } from 'framer-motion'
import { ModalScrim, Button, Badge, EmptyState } from '../ui'
import { Stagger, StaggerItem } from '../../motion'
import { useMotionSettings } from '../../motion/MotionProvider'
import { modalPanelVariants, transition } from '../../motion/variants'
import { cn } from '../../lib/cn'
import { formatCurrencyTR } from '../../utils/formatters'
import { buildMaliKontrolNavigateUrl } from '../../lib/maliKontrolNavigation'
import type { MaliKontrolUyari, MaliKontrolResponse, UyariSeviyesi, UyariTuru } from '../../types/maliKontrol'
import { UYARI_TUR_ETIKET } from '../../types/maliKontrol'

type ViewMode = 'bugun' | 'yaklasan' | 'tumAcik'

type Props = {
  open: boolean
  onClose: () => void
  data: MaliKontrolResponse | undefined
  loading: boolean
}

type DragConstraints = { top: number; left: number; right: number; bottom: number }

const DRAG_MIN_WIDTH_PX = 768
const VIEWPORT_PAD = 12

const SEVIYE_RENK: Record<UyariSeviyesi, string> = {
  KRITIK: 'text-danger bg-danger/10 border-danger/20',
  UYARI: 'text-warning-ink bg-warning-soft/60 border-warning/25',
  BILGI: 'text-ink-muted bg-surface-muted border-border'
}

const SEVIYE_DOT: Record<UyariSeviyesi, string> = {
  KRITIK: 'bg-danger',
  UYARI: 'bg-amber-500',
  BILGI: 'bg-ink-subtle'
}

const SEVIYE_BADGE: Record<UyariSeviyesi, 'danger' | 'warning' | 'default'> = {
  KRITIK: 'danger',
  UYARI: 'warning',
  BILGI: 'default'
}

function isoToday(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function isoNDaysLater(n: number): string {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function useDesktopDragEnabled(): boolean {
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(`(min-width: ${DRAG_MIN_WIDTH_PX}px)`).matches
  })

  useEffect(() => {
    const mq = window.matchMedia(`(min-width: ${DRAG_MIN_WIDTH_PX}px)`)
    const onChange = () => setEnabled(mq.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  return enabled
}

function UyariSatir({
  u,
  onNavigate
}: {
  u: MaliKontrolUyari
  onNavigate: (u: MaliKontrolUyari) => void
}): ReactElement {
  const canNavigate = Boolean(u.actionPayload)
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.18 }}
      className={cn(
        'rounded-lg border px-3 py-2.5',
        SEVIYE_RENK[u.seviye]
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className={cn('inline-block h-1.5 w-1.5 shrink-0 rounded-full', SEVIYE_DOT[u.seviye])} />
            <span className="text-[10px] font-bold uppercase tracking-wide opacity-70">
              {UYARI_TUR_ETIKET[u.tur]}
            </span>
            <Badge variant={SEVIYE_BADGE[u.seviye]} className="px-1.5 py-0 text-[9px]">
              {u.seviye === 'KRITIK' ? 'Kritik' : u.seviye === 'UYARI' ? 'Uyarı' : 'Bilgi'}
            </Badge>
          </div>
          <p className="mt-0.5 text-[11px] font-semibold leading-snug">{u.muvekkilAd}</p>
          <p className="text-[10px] opacity-75 leading-tight">{u.dosyaBaslik}</p>
          <p className="mt-1 text-xs leading-snug">{u.aciklama}</p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {u.tutar ? (
            <span className="text-sm font-bold tabular-nums">{formatCurrencyTR(Number(u.tutar))}</span>
          ) : null}
          {u.tarih ? (
            <span className="text-[10px] opacity-60">{u.tarih}</span>
          ) : null}
          {canNavigate ? (
            <button
              type="button"
              className="mt-0.5 rounded-md border border-current/20 px-2 py-0.5 text-[10px] font-semibold hover:bg-white/20 transition-colors"
              onClick={() => onNavigate(u)}
            >
              Git →
            </button>
          ) : null}
        </div>
      </div>
    </motion.div>
  )
}

const TUR_OPTIONS: { value: UyariTuru | 'TUMU'; label: string }[] = [
  { value: 'TUMU', label: 'Tüm türler' },
  { value: 'VADESI_GECMIS_TAKSIT', label: 'Vadesi geçmiş' },
  { value: 'VAKLAŞAN_VADE', label: 'Yaklaşan vade' },
  { value: 'KISMI_ODEME_KALAN', label: 'Kısmi ödeme' },
  { value: 'NEGATIF_AVANS', label: 'Negatif avans' },
  { value: 'KAPALI_DOSYA_AVANS', label: 'Kapalı dosya avansı' },
  { value: 'KAPALI_DOSYA_ALACAK', label: 'Kapalı dosya alacağı' },
  { value: 'SMM_KESILMEMIS', label: 'SMM eksik' },
  { value: 'ONAY_BEKLEYEN_KASA', label: 'Onay bekleyen' },
  { value: 'MAKBUZ_EKSIK', label: 'Makbuz eksik' },
  { value: 'HAREKETSIZ_DOSYA', label: 'Hareketsiz dosya' }
]

const SEV_OPTIONS: { value: UyariSeviyesi | 'TUMU'; label: string }[] = [
  { value: 'TUMU', label: 'Tüm seviyeler' },
  { value: 'KRITIK', label: 'Kritik' },
  { value: 'UYARI', label: 'Uyarı' },
  { value: 'BILGI', label: 'Bilgi' }
]

export function MaliKontrolMerkeziModal({ open, onClose, data, loading }: Props): ReactElement | null {
  const navigate = useNavigate()
  const [view, setView] = useState<ViewMode>('tumAcik')
  const [turFilter, setTurFilter] = useState<UyariTuru | 'TUMU'>('TUMU')
  const [sevFilter, setSevFilter] = useState<UyariSeviyesi | 'TUMU'>('TUMU')
  const [isDragging, setIsDragging] = useState(false)
  const [dragConstraints, setDragConstraints] = useState<DragConstraints>({ top: 0, left: 0, right: 0, bottom: 0 })

  const { reducedMotion } = useMotionSettings()
  const desktopDragEnabled = useDesktopDragEnabled()
  const canDrag = desktopDragEnabled && !reducedMotion

  const dragControls = useDragControls()
  const dragX = useMotionValue(0)
  const dragY = useMotionValue(0)
  const panelRef = useRef<HTMLDivElement>(null)
  const headerRef = useRef<HTMLDivElement>(null)

  const t = transition(reducedMotion, 'fast')

  const updateDragConstraints = useCallback(() => {
    const panel = panelRef.current
    const header = headerRef.current
    if (!panel || !header) return

    const rect = panel.getBoundingClientRect()
    const headerHeight = header.offsetHeight

    setDragConstraints({
      top: VIEWPORT_PAD - rect.top,
      left: VIEWPORT_PAD - rect.left,
      right: window.innerWidth - VIEWPORT_PAD - rect.width - rect.left,
      bottom: window.innerHeight - VIEWPORT_PAD - headerHeight - rect.top
    })
  }, [])

  useEffect(() => {
    if (open) {
      dragX.set(0)
      dragY.set(0)
    }
  }, [open, dragX, dragY])

  useLayoutEffect(() => {
    if (!open || !canDrag) return

    const frame = window.requestAnimationFrame(() => {
      updateDragConstraints()
    })

    const onResize = () => updateDragConstraints()
    window.addEventListener('resize', onResize)

    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener('resize', onResize)
    }
  }, [open, canDrag, updateDragConstraints, loading, data?.toplamUyari])

  useEffect(() => {
    if (!isDragging) return
    const prev = document.body.style.userSelect
    document.body.style.userSelect = 'none'
    return () => {
      document.body.style.userSelect = prev
    }
  }, [isDragging])

  const handleHeaderPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!canDrag) return
    if ((e.target as HTMLElement).closest('button')) return
    dragControls.start(e)
  }

  const handleUyariNavigate = useCallback(
    (u: MaliKontrolUyari) => {
      if (!u.actionPayload) return
      onClose()
      navigate(buildMaliKontrolNavigateUrl(u.actionPayload))
    },
    [navigate, onClose]
  )

  const today = isoToday()
  const plus3 = isoNDaysLater(3)

  const filteredUyarilar = useMemo(() => {
    if (!data) return []
    let list = data.uyarilar

    if (view === 'bugun') {
      list = list.filter(u => u.tarih === today)
    } else if (view === 'yaklasan') {
      list = list.filter(u => u.tarih && u.tarih >= today && u.tarih <= plus3)
    }

    if (turFilter !== 'TUMU') list = list.filter(u => u.tur === turFilter)
    if (sevFilter !== 'TUMU') list = list.filter(u => u.seviye === sevFilter)

    return list
  }, [data, view, turFilter, sevFilter, today, plus3])

  return (
    <AnimatePresence>
      {open ? (
        <ModalScrim onClose={onClose} innerAsDialog animatePanel={false} draggable={false}>
          {/* Dış katman: giriş/çıkış animasyonu (y/scale) — sürükleme transformundan ayrı */}
          <motion.div
            className="mx-auto w-full max-w-lg"
            variants={reducedMotion ? undefined : modalPanelVariants}
            initial={reducedMotion ? false : 'initial'}
            animate="animate"
            exit={reducedMotion ? undefined : 'exit'}
            transition={t}
          >
            {/* İç katman: yalnızca x/y sürükleme */}
            <motion.div
              ref={panelRef}
              drag={canDrag}
              dragControls={dragControls}
              dragListener={false}
              dragMomentum={false}
              dragElastic={0}
              dragConstraints={dragConstraints}
              onDragStart={() => setIsDragging(true)}
              onDragEnd={() => setIsDragging(false)}
              style={{
                maxHeight: '90vh',
                ...(canDrag ? { x: dragX, y: dragY } : {})
              }}
              className="flex w-full flex-col gap-0 overflow-hidden rounded-xl border border-border bg-white shadow-xl dark:bg-surface-elevated"
            >
              {/* Header — yalnızca buradan sürükleme başlar */}
              <div
                ref={headerRef}
                className={cn(
                  'flex items-center justify-between gap-2 border-b border-border px-5 py-3.5',
                  canDrag && 'touch-none select-none',
                  canDrag && (isDragging ? 'cursor-grabbing' : 'cursor-grab')
                )}
                onPointerDown={handleHeaderPointerDown}
              >
                <div className="flex min-w-0 flex-1 items-center gap-2">
                  <span className="text-base font-bold text-ink">Mali Kontrol Merkezi</span>
                  {data && data.kritikUyari > 0 ? (
                    <span className="rounded-full bg-danger/15 px-2 py-0.5 text-[11px] font-bold text-danger">
                      {data.kritikUyari} kritik
                    </span>
                  ) : null}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-8 shrink-0 cursor-pointer"
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={onClose}
                >
                  ✕
                </Button>
              </div>

              {/* View tabs */}
              <div className="flex gap-1 border-b border-border px-4 py-2">
                {([
                  { k: 'bugun', label: 'Bugün' },
                  { k: 'yaklasan', label: 'Yaklaşanlar' },
                  { k: 'tumAcik', label: 'Tüm açık' }
                ] as { k: ViewMode; label: string }[]).map(({ k, label }) => (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setView(k)}
                    className={cn(
                      'rounded-md px-3 py-1 text-xs font-semibold transition-colors',
                      view === k
                        ? 'bg-primary text-white'
                        : 'text-ink-muted hover:bg-surface-muted'
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Filters */}
              <div className="flex flex-wrap gap-2 border-b border-border/60 px-4 py-2">
                <select
                  value={turFilter}
                  onChange={e => setTurFilter(e.target.value as UyariTuru | 'TUMU')}
                  className="rounded-md border border-border bg-white px-2 py-1 text-[11px] text-ink focus:outline-none focus:ring-1 focus:ring-primary/40 dark:bg-surface-muted"
                >
                  {TUR_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <select
                  value={sevFilter}
                  onChange={e => setSevFilter(e.target.value as UyariSeviyesi | 'TUMU')}
                  className="rounded-md border border-border bg-white px-2 py-1 text-[11px] text-ink focus:outline-none focus:ring-1 focus:ring-primary/40 dark:bg-surface-muted"
                >
                  {SEV_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                {data ? (
                  <span className="ml-auto self-center text-[10px] text-ink-subtle">
                    {filteredUyarilar.length} kayıt
                  </span>
                ) : null}
              </div>

              {/* Content */}
              <div className="flex-1 overflow-y-auto px-4 py-3">
                {loading ? (
                  <p className="py-8 text-center text-sm text-ink-muted">Yükleniyor…</p>
                ) : !data || filteredUyarilar.length === 0 ? (
                  <EmptyState
                    title={view === 'bugun' ? 'Bugün uyarı yok' : view === 'yaklasan' ? 'Yaklaşan uyarı yok' : 'Açık kontrol yok'}
                    description="Tüm mali kontroller temiz görünüyor."
                  />
                ) : (
                  <Stagger className="space-y-2">
                    <AnimatePresence>
                      {filteredUyarilar.map(u => (
                        <StaggerItem key={u.id}>
                          <UyariSatir u={u} onNavigate={handleUyariNavigate} />
                        </StaggerItem>
                      ))}
                    </AnimatePresence>
                  </Stagger>
                )}
              </div>

              {/* Footer stats */}
              {data ? (
                <div className="flex gap-4 border-t border-border px-5 py-2.5 text-[11px]">
                  <span className="font-semibold text-ink-muted">Toplam: <span className="text-ink">{data.toplamUyari}</span></span>
                  <span className="font-semibold text-danger">Kritik: {data.kritikUyari}</span>
                  <span className="font-semibold text-amber-600">Uyarı: {data.uyariUyari}</span>
                  <span className="font-semibold text-ink-muted">Bilgi: {data.bilgiUyari}</span>
                </div>
              ) : null}
            </motion.div>
          </motion.div>
        </ModalScrim>
      ) : null}
    </AnimatePresence>
  )
}
