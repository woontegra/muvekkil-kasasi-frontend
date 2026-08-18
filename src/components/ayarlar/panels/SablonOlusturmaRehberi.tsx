import { useEffect, useLayoutEffect, useRef, useState, type ReactElement, type RefObject } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertBox, Badge, Button } from '../../ui'
import { useMotionSettings } from '../../../motion/MotionProvider'
import { fadeVariants, modalPanelVariants, transition } from '../../../motion/variants'
import { OzelSablonFormFields, type FormVisibleSection } from './OzelSablonFormFields'
import { GUIDE_SAMPLE_VALUES, GUIDE_STEP_COUNT } from './sablonFormShared'

type PageTargets = {
  newTemplate: RefObject<HTMLElement | null>
}

const STEPS: Array<{
  title: string
  body: string[]
  section: FormVisibleSection | 'intro' | 'draft' | 'meta'
}> = [
  {
    title: 'Hazır mı, özel mi?',
    body: [
      'Hazır şablonları doğrudan Meta onayına gönderebilir veya büronuzun diline uygun özel bir şablon hazırlayabilirsiniz.'
    ],
    section: 'intro'
  },
  {
    title: 'Şablonunuzu adlandırın',
    body: [
      'Görünen ad yalnızca Müvekkil Kasası içinde kullanılır. Meta adı küçük harf ve alt çizgi biçiminde otomatik oluşturulur. Meta’ya gönderildikten sonra Meta adı değiştirilemez.'
    ],
    section: 'identity'
  },
  {
    title: 'Kullanım alanı ve kategori',
    body: [
      'Kullanım alanı, şablonun hangi otomatik hatırlatmada gösterileceğini belirler. UTILITY bilgilendirme içindir; MARKETING ileti izni gerektirir. Dil varsayılan olarak Türkçe’dir.'
    ],
    section: 'classification'
  },
  {
    title: 'Mesaj metnini hazırlayın',
    body: ['Örnek metni inceleyin. Değişken kodlarını elle yazmak zorunda değilsiniz; sonraki adımda sistem alanlarından eklenir.'],
    section: 'message'
  },
  {
    title: 'Dinamik alanları ekleyin',
    body: ['Gönderim sırasında örnek değerler değil, ilgili müvekkil ve dosyanın gerçek bilgileri otomatik olarak kullanılır.'],
    section: 'variables'
  },
  {
    title: 'Örnek değerler ve önizleme',
    body: ['Meta, değişkenlerin nasıl kullanılacağını anlamak için örnek değer ister. Buraya gerçek müvekkil bilgisi yazmayın.'],
    section: 'examples'
  },
  {
    title: 'Taslak olarak kaydedin',
    body: ['Önce taslak kaydedilir. Bu aşamada Meta’ya hiçbir şey gönderilmez.'],
    section: 'draft'
  },
  {
    title: 'Meta onayı ve kullanım',
    body: ['Onaylanan şablon ilgili otomasyon alanında seçilebilir.'],
    section: 'meta'
  }
]

const FOCUSABLE =
  'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

function ProgressBar(props: { step: number; total: number }): ReactElement {
  const pct = Math.round((props.step / props.total) * 100)
  return (
    <div
      className="h-1.5 overflow-hidden rounded-full bg-border"
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

function DemoButton(props: { children: string; variant?: 'outline' | 'primary' }): ReactElement {
  return (
    <Button type="button" variant={props.variant === 'primary' ? 'primary' : 'outline'} size="sm" disabled className="pointer-events-none">
      {props.children}
    </Button>
  )
}

function IntroCards(): ReactElement {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="rounded-lg border border-border bg-white p-4">
        <p className="text-sm font-semibold text-ink">Hazır Şablon Kullan</p>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
          Woontegra’nın hazırladığı şablonları inceleyip doğrudan Meta onayına gönderebilirsiniz.
        </p>
      </div>
      <div className="rounded-lg border border-border bg-white p-4 ring-2 ring-primary">
        <p className="text-sm font-semibold text-ink">Büroma Özel Şablon Oluştur</p>
        <p className="mt-1.5 text-xs leading-relaxed text-ink-muted">
          Büronuzun diline uygun yeni bir şablon hazırlamak için + Yeni Şablon ile başlayın.
        </p>
      </div>
    </div>
  )
}

function DraftCard(): ReactElement {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-white px-4 py-3 ring-2 ring-primary">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="text-sm font-semibold text-ink">Vade Günü Hatırlatmam</p>
            <p className="text-xs text-ink-muted">vade_gunu_hatirlatmam</p>
          </div>
          <Badge variant="primary" className="normal-case tracking-normal">
            Taslak
          </Badge>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <DemoButton>İncele</DemoButton>
          <DemoButton>Düzenle</DemoButton>
          <DemoButton>Sil</DemoButton>
          <DemoButton variant="primary">Meta Onayına Gönder</DemoButton>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-ink-muted">
        Taslak Olarak Kaydet yalnızca Müvekkil Kasası’nda bir taslak oluşturur. İnceleyebilir, düzenleyebilir veya silebilirsiniz; Meta’ya henüz bir şey gitmez.
      </p>
    </div>
  )
}

function MetaFlow(): ReactElement {
  return (
    <div className="space-y-3">
      <div className="rounded-lg border border-border bg-white px-4 py-3 ring-2 ring-primary">
        <p className="text-sm font-semibold text-ink">Taslak → İnceleniyor → Onaylandı / Reddedildi</p>
        <ul className="mt-3 space-y-1.5 text-sm text-ink-muted">
          <li>Gönderilen şablon kilitlenir.</li>
          <li>Değişiklik için Kopyala ve Özelleştir kullanılır.</li>
          <li>Onaylanan şablon otomasyonda seçilir.</li>
          <li>Durum Şablonları Senkronize Et ile yenilenir.</li>
          <li>Ret nedeni İncele ekranında görülür.</li>
        </ul>
      </div>
    </div>
  )
}

export function SablonOlusturmaRehberi(props: {
  pageTargets: PageTargets
  canCreate: boolean
  onClose: () => void
  onCreateOwn: () => void
}): ReactElement | null {
  const { reducedMotion } = useMotionSettings()
  const t = transition(reducedMotion, 'fast')
  const [step, setStep] = useState(1)
  const [newBtnRect, setNewBtnRect] = useState<DOMRect | null>(null)
  const shellRef = useRef<HTMLDivElement>(null)
  const middleRef = useRef<HTMLDivElement>(null)
  const current = STEPS[step - 1]
  const isLast = step === GUIDE_STEP_COUNT
  const formSection =
    current.section === 'identity' ||
    current.section === 'classification' ||
    current.section === 'message' ||
    current.section === 'variables' ||
    current.section === 'examples'
      ? current.section
      : null

  useEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  useLayoutEffect(() => {
    if (middleRef.current) middleRef.current.scrollTop = 0
  }, [step])

  useLayoutEffect(() => {
    if (step !== 1) {
      setNewBtnRect(null)
      return
    }
    const el = props.pageTargets.newTemplate.current
    if (!el) return
    const update = (): void => setNewBtnRect(el.getBoundingClientRect())
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [step, props.pageTargets.newTemplate])

  useEffect(() => {
    const root = shellRef.current
    if (!root) return
    const focusable = (): HTMLElement[] =>
      [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
        (el) => el.offsetParent !== null && !el.hasAttribute('disabled') && !el.classList.contains('pointer-events-none')
      )
    window.setTimeout(() => {
      const items = focusable()
      const next = items.find((el) => el.getAttribute('aria-label') === 'Sonraki adıma git') ?? items[0]
      next?.focus()
    }, 20)

    function onKeyDown(e: KeyboardEvent): void {
      if (e.key === 'Escape') {
        e.preventDefault()
        props.onClose()
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        setStep((s) => Math.min(GUIDE_STEP_COUNT, s + 1))
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        setStep((s) => Math.max(1, s - 1))
        return
      }
      if (e.key !== 'Tab' || !root) return
      const items = focusable()
      if (items.length === 0) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [props.onClose, step])

  if (typeof document === 'undefined') return null

  return createPortal(
    <motion.div
      ref={shellRef}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-900/50 p-3 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="sablon-guide-title"
      variants={reducedMotion ? undefined : fadeVariants}
      initial={reducedMotion ? false : 'initial'}
      animate="animate"
      transition={t}
    >
      {step === 1 && newBtnRect && newBtnRect.width > 0 ? (
        <div
          aria-hidden
          className="pointer-events-none fixed rounded-md ring-2 ring-primary"
          style={{
            top: newBtnRect.top - 4,
            left: newBtnRect.left - 4,
            width: newBtnRect.width + 8,
            height: newBtnRect.height + 8
          }}
        />
      ) : null}

      <motion.div
        className="flex max-h-[min(90vh,720px)] w-full max-w-[640px] flex-col overflow-hidden rounded-xl border border-border bg-white shadow-xl dark:bg-surface-elevated"
        variants={reducedMotion ? undefined : modalPanelVariants}
        initial={reducedMotion ? false : 'initial'}
        animate="animate"
        transition={t}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="shrink-0 border-b border-border px-4 py-3 sm:px-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Şablon Oluşturma Rehberi · {step} / {GUIDE_STEP_COUNT}
          </p>
          <h2 id="sablon-guide-title" className="mt-1 text-base font-bold text-ink">
            {current.title}
          </h2>
          {current.body.map((line) => (
            <p key={line} className="mt-1.5 text-sm leading-relaxed text-ink-muted">
              {line}
            </p>
          ))}
          {step === 1 ? (
            <AlertBox className="mt-3" variant="info">
              Bu rehberdeki isimler, dosya numaraları ve tarihler örnektir. Gerçek müvekkil verisi kullanılmaz.
            </AlertBox>
          ) : (
            <p className="mt-2 text-xs text-ink-subtle">Örnek veriler gösterilir; gerçek müvekkil bilgisi kullanılmaz.</p>
          )}
        </div>

        <div ref={middleRef} className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain px-4 py-4 sm:px-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={reducedMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reducedMotion ? undefined : { opacity: 0, y: -6 }}
              transition={t}
            >
              {current.section === 'intro' ? <IntroCards /> : null}
              {formSection ? (
                <OzelSablonFormFields
                  values={GUIDE_SAMPLE_VALUES}
                  onChange={() => undefined}
                  readOnly
                  visibleSection={formSection}
                  metaNameTouched
                  onMetaNameTouched={() => undefined}
                  saveLabel="Taslak Olarak Kaydet"
                />
              ) : null}
              {current.section === 'draft' ? <DraftCard /> : null}
              {current.section === 'meta' ? <MetaFlow /> : null}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="shrink-0 space-y-3 border-t border-border px-4 py-3 sm:px-5">
          <ProgressBar step={step} total={GUIDE_STEP_COUNT} />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap gap-2">
              {isLast ? null : (
                <Button type="button" variant="ghost" size="sm" aria-label="Rehberi atla" onClick={props.onClose}>
                  Rehberi Atla
                </Button>
              )}
              <Button type="button" variant="outline" size="sm" aria-label="Rehberi kapat" onClick={props.onClose}>
                Kapat
              </Button>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                aria-label="Önceki adıma git"
                disabled={step === 1}
                onClick={() => setStep((s) => Math.max(1, s - 1))}
              >
                Geri
              </Button>
              {isLast ? (
                <>
                  <Button type="button" variant="outline" size="sm" aria-label="Rehberi bitir" onClick={props.onClose}>
                    Rehberi Bitir
                  </Button>
                  {props.canCreate ? (
                    <Button type="button" size="sm" aria-label="Kendi şablonunu oluştur" onClick={props.onCreateOwn}>
                      Şimdi Kendi Şablonumu Oluştur
                    </Button>
                  ) : null}
                </>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  aria-label="Sonraki adıma git"
                  onClick={() => setStep((s) => Math.min(GUIDE_STEP_COUNT, s + 1))}
                >
                  İleri
                </Button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  )
}
