import { useMutation } from '@tanstack/react-query'
import type { ChangeEvent, DragEvent, ReactElement } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { commitDesktopImport, previewDesktopImport } from '../../api/desktopImport'
import { ApiError } from '../../api/client'
import { APP_BASE, HOME_PAGE_LABEL } from '../../config/appPaths'
import { cn } from '../../lib/cn'
import { formatDesktopImportCountKey } from '../../lib/desktopImportLabels'
import { humanizeImportWarning } from '../../lib/importWarnings'
import type { DesktopImportCommitResponse, DesktopImportPreviewResponse } from '../../types/desktopImport'
import { Button, ModalScrim } from '../ui'

type ModalPhase =
  | { kind: 'checking'; fileName: string }
  | { kind: 'preview'; fileName: string; data: DesktopImportPreviewResponse }
  | { kind: 'importing'; fileName: string }
  | { kind: 'success'; fileName: string; data: DesktopImportCommitResponse }
  | { kind: 'error'; fileName: string; message: string; canRetry: boolean; batchId?: string }

function friendlyError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error && err.message.trim()) return err.message
  return fallback
}

function SummaryGrid(props: { counts: Record<string, number> }): ReactElement {
  const entries = Object.entries(props.counts)
  if (entries.length === 0) {
    return <p className="text-sm text-ink-muted">Aktarılan kayıt özeti alınamadı.</p>
  }
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-2.5 rounded-xl border border-border bg-surface-muted/20 px-4 py-3">
      {entries.map(([key, value]) => (
        <div key={key} className="flex items-baseline justify-between gap-3">
          <dt className="text-sm text-ink-muted">{formatDesktopImportCountKey(key)}</dt>
          <dd className="text-sm font-bold tabular-nums text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function WarningSection(props: { warnings: string[] }): ReactElement | null {
  const [open, setOpen] = useState(false)
  if (props.warnings.length === 0) return null

  return (
    <div className="rounded-lg border border-amber-200/80 bg-amber-50/40 px-3 py-2.5 dark:border-amber-900/50 dark:bg-amber-950/20">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-2 text-left text-sm font-medium text-amber-950 dark:text-amber-100"
        onClick={() => setOpen((v) => !v)}
      >
        <span className="flex items-center gap-2">
          <span aria-hidden className="text-base leading-none">
            ⚠
          </span>
          {props.warnings.length} uyarı
        </span>
        <span className="text-xs font-semibold text-amber-800/80 dark:text-amber-200/80">
          {open ? 'Gizle' : 'Detayları göster'}
        </span>
      </button>
      {open ? (
        <ul className="mt-2 space-y-1.5 border-t border-amber-200/60 pt-2 text-sm text-amber-950/90 dark:border-amber-900/40 dark:text-amber-100/90">
          {props.warnings.map((w, i) => (
            <li key={i} className="leading-snug">
              {humanizeImportWarning(w)}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  )
}

function TransactionDetails(props: { importBatchId: string }): ReactElement {
  const [open, setOpen] = useState(false)
  return (
    <div className="border-t border-border pt-3">
      <button
        type="button"
        className="text-xs font-semibold text-ink-muted hover:text-ink"
        onClick={() => setOpen((v) => !v)}
      >
        İşlem ayrıntıları {open ? '▲' : '▼'}
      </button>
      {open ? (
        <p className="mt-2 font-mono text-[11px] text-ink-subtle break-all">{props.importBatchId}</p>
      ) : null}
    </div>
  )
}

function ImportModal(props: {
  phase: ModalPhase
  modalLocked: boolean
  onClose: () => void
  onStartImport: () => void
  onRetry: () => void
  onPickDifferent: () => void
  commitPending: boolean
}): ReactElement {
  const navigate = useNavigate()
  const { phase, modalLocked, onClose, onStartImport, onRetry, onPickDifferent, commitPending } = props

  const title = (() => {
    switch (phase.kind) {
      case 'checking':
        return 'Yedek kontrol ediliyor'
      case 'preview':
        return 'Yedek kontrol edildi'
      case 'importing':
        return 'Veriler aktarılıyor'
      case 'success':
        return 'Aktarım tamamlandı'
      case 'error':
        return 'İçe aktarım tamamlanamadı'
      default:
        return ''
    }
  })()

  return (
    <ModalScrim
      onClose={onClose}
      disabled={modalLocked}
      align="center"
      draggable={false}
      innerAsDialog
      innerClassName="w-[min(720px,calc(100vw-2rem))] max-w-full"
    >
      <div className="w-full overflow-hidden rounded-2xl border border-border bg-panel shadow-xl">
        <div className="flex items-start justify-between gap-3 border-b border-border px-5 py-4">
          <h2 className="text-base font-bold text-ink">{title}</h2>
          {!modalLocked ? (
            <button
              type="button"
              className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-ink-muted hover:bg-surface-muted hover:text-ink"
              aria-label="Kapat"
              onClick={onClose}
            >
              ✕
            </button>
          ) : null}
        </div>

        <div className="space-y-4 px-5 py-5">
          {phase.kind === 'checking' ? (
            <div className="flex flex-col items-center gap-4 px-4 py-8 text-center sm:px-10">
              <div
                className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary border-r-transparent"
                aria-hidden
              />
              <div className="w-full max-w-md">
                <p className="text-sm font-medium text-ink">Yedek dosyanız kontrol ediliyor…</p>
                <p className="mt-2 break-all text-xs text-ink-muted">{phase.fileName}</p>
              </div>
            </div>
          ) : null}

          {phase.kind === 'importing' ? (
            <div className="flex flex-col items-center gap-4 px-4 py-8 text-center sm:px-10">
              <div
                className="h-10 w-10 animate-spin rounded-full border-[3px] border-primary border-r-transparent"
                aria-hidden
              />
              <div className="w-full max-w-md">
                <p className="text-base font-semibold text-ink">Verileriniz aktarılıyor</p>
                <p className="mt-2 text-sm text-ink-muted">Lütfen bu pencereyi kapatmayın.</p>
                <p className="mt-3 break-all text-xs text-ink-subtle">{phase.fileName}</p>
              </div>
            </div>
          ) : null}

          {phase.kind === 'preview' ? (
            <>
              <div className="space-y-1">
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Dosya</p>
                <p className="truncate text-sm font-medium text-ink">{phase.fileName}</p>
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    'inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold',
                    phase.data.canCommit
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200'
                      : 'bg-red-100 text-red-800 dark:bg-red-950/50 dark:text-red-200'
                  )}
                >
                  {phase.data.canCommit ? 'Aktarıma uygun' : 'Aktarılamaz'}
                </span>
              </div>
              <SummaryGrid counts={phase.data.counts} />
              <WarningSection warnings={phase.data.warnings} />
              {phase.data.errors.length > 0 ? (
                <div className="rounded-lg border border-red-200/80 bg-red-50/50 px-3 py-2.5 dark:border-red-900/50 dark:bg-red-950/20">
                  <p className="text-sm font-semibold text-red-900 dark:text-red-100">Düzeltilmesi gereken hatalar</p>
                  <ul className="mt-2 space-y-1 text-sm text-red-900/90 dark:text-red-100/90">
                    {phase.data.errors.map((e, i) => (
                      <li key={i}>{e}</li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : null}

          {phase.kind === 'success' ? (
            <>
              <div className="flex flex-col items-center gap-3 py-2 text-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-2xl text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300">
                  ✓
                </div>
                <p className="text-sm text-ink-muted">Yedek verileriniz başarıyla SaaS hesabınıza aktarıldı.</p>
              </div>
              <SummaryGrid counts={phase.data.inserted} />
              <WarningSection warnings={phase.data.warnings} />
              <TransactionDetails importBatchId={phase.data.importBatchId} />
            </>
          ) : null}

          {phase.kind === 'error' ? (
            <div className="space-y-3 py-2">
              <p className="text-sm leading-relaxed text-ink-muted">{phase.message}</p>
              <p className="text-xs text-ink-subtle">{phase.fileName}</p>
            </div>
          ) : null}
        </div>

        <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-surface-muted/20 px-5 py-4">
          {phase.kind === 'preview' ? (
            <>
              <Button type="button" variant="outline" onClick={onClose}>
                Vazgeç
              </Button>
              {phase.data.canCommit ? (
                <Button type="button" disabled={commitPending} onClick={onStartImport}>
                  Aktarımı Başlat
                </Button>
              ) : (
                <Button type="button" onClick={onPickDifferent}>
                  Farklı Yedek Seç
                </Button>
              )}
            </>
          ) : null}

          {phase.kind === 'success' ? (
            <>
              <Button type="button" variant="outline" onClick={() => navigate(APP_BASE)}>
                {HOME_PAGE_LABEL}&apos;na Git
              </Button>
              <Button type="button" onClick={() => navigate(APP_BASE)}>
                Müvekkilleri Görüntüle
              </Button>
            </>
          ) : null}

          {phase.kind === 'error' ? (
            <>
              <Button type="button" variant="outline" onClick={onPickDifferent}>
                Farklı Yedek Seç
              </Button>
              {phase.canRetry ? (
                <Button type="button" disabled={commitPending} onClick={onRetry}>
                  Tekrar Dene
                </Button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </ModalScrim>
  )
}

export function DesktopImportFlow(): ReactElement {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [detailsOpen, setDetailsOpen] = useState(false)
  const [modalPhase, setModalPhase] = useState<ModalPhase | null>(null)
  const [previewData, setPreviewData] = useState<DesktopImportPreviewResponse | null>(null)

  const modalLocked = modalPhase?.kind === 'checking' || modalPhase?.kind === 'importing'

  const resetFlow = useCallback((): void => {
    setModalPhase(null)
    setPreviewData(null)
  }, [])

  const pickFile = useCallback(
    (f: File | null): void => {
      setFile(f)
      setPreviewData(null)
      resetFlow()
    },
    [resetFlow]
  )

  const previewMu = useMutation({
    mutationFn: (f: File) => previewDesktopImport(f),
    onMutate: (f) => {
      setModalPhase({ kind: 'checking', fileName: f.name })
    },
    onSuccess: (data, f) => {
      setPreviewData(data)
      setModalPhase({ kind: 'preview', fileName: f.name, data })
    },
    onError: (err, f) => {
      setModalPhase({
        kind: 'error',
        fileName: f.name,
        message: friendlyError(err, 'Yedek kontrol edilemedi.'),
        canRetry: true
      })
    }
  })

  const commitMu = useMutation({
    mutationFn: ({ batchId, f }: { batchId: string; f: File }) => commitDesktopImport(batchId, f),
    onMutate: ({ f }) => {
      setModalPhase({ kind: 'importing', fileName: f.name })
    },
    onSuccess: (data, { f }) => {
      setModalPhase({ kind: 'success', fileName: f.name, data })
      setPreviewData(null)
      setFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    },
    onError: (err, { f, batchId }) => {
      setModalPhase({
        kind: 'error',
        fileName: f.name,
        message: friendlyError(err, 'İçe aktarım tamamlanamadı.'),
        canRetry: true,
        batchId
      })
    }
  })

  const handleCheck = (): void => {
    if (!file || previewMu.isPending || commitMu.isPending) return
    previewMu.mutate(file)
  }

  const handleStartImport = (): void => {
    if (!file || !previewData?.canCommit || commitMu.isPending) return
    commitMu.mutate({ batchId: previewData.importBatchId, f: file })
  }

  const handleRetry = (): void => {
    if (commitMu.isPending || previewMu.isPending) return
    if (modalPhase?.kind === 'error' && modalPhase.batchId && file) {
      commitMu.mutate({ batchId: modalPhase.batchId, f: file })
      return
    }
    if (file) previewMu.mutate(file)
  }

  const handlePickDifferent = (): void => {
    resetFlow()
    pickFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
      fileInputRef.current.click()
    }
  }

  const handleCloseModal = (): void => {
    if (modalLocked) return
    resetFlow()
  }

  const onFileChange = (e: ChangeEvent<HTMLInputElement>): void => {
    pickFile(e.target.files?.[0] ?? null)
  }

  const onDrop = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files?.[0]
    if (f) pickFile(f)
  }

  useEffect(() => {
    if (!modalPhase || modalLocked) return
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') handleCloseModal()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <>
      <div className="rounded-xl border border-border bg-white p-5 shadow-sm sm:p-6">
        <div className="space-y-1">
          <h3 className="text-base font-bold text-ink">Masaüstü yedeğinden içe aktar</h3>
          <p className="text-sm leading-relaxed text-ink-muted">
            Masaüstü Müvekkil Kasa Defteri yedeğinizi yükleyerek mevcut verilerinizi SaaS hesabınıza aktarabilirsiniz.
          </p>
        </div>

        <div
          className={cn(
            'mt-5 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-4 py-8 text-center transition-colors',
            dragOver ? 'border-primary bg-primary-soft/30' : 'border-border bg-surface-muted/15 hover:border-primary/40',
            (previewMu.isPending || commitMu.isPending) && 'pointer-events-none opacity-60'
          )}
          onDragOver={(e) => {
            e.preventDefault()
            setDragOver(true)
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') fileInputRef.current?.click()
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".sqlite,application/octet-stream"
            className="sr-only"
            onChange={onFileChange}
          />
          <p className="text-sm font-medium text-ink">
            {file ? file.name : 'Dosyayı sürükleyip bırakın veya seçmek için tıklayın'}
          </p>
          <p className="mt-1 text-xs text-ink-muted">Yalnızca .sqlite yedek dosyaları</p>
        </div>

        <div className="mt-4 rounded-lg border border-border/80 bg-surface-muted/25 px-3.5 py-3">
          <p className="text-sm text-ink-muted">
            Mevcut verileriniz silinmez. Aktarım yalnızca aktif büronuza uygulanır.
          </p>
          <button
            type="button"
            className="mt-1.5 text-xs font-semibold text-primary hover:underline"
            onClick={() => setDetailsOpen((v) => !v)}
          >
            {detailsOpen ? 'Detayları gizle' : 'Detaylar'}
          </button>
          {detailsOpen ? (
            <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-ink-subtle">
              <li>Yedekteki kayıtlar mevcut büronuza eklenir; mevcut kayıtlar silinmez.</li>
              <li>Aynı yedeğin tekrar aktarılması parmak izi ile engellenir.</li>
              <li>Aktarım yalnızca oturumunuzdaki büroya yazılır.</li>
            </ul>
          ) : null}
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Button
            type="button"
            disabled={!file || previewMu.isPending || commitMu.isPending}
            loading={previewMu.isPending}
            onClick={handleCheck}
          >
            Yedeği Kontrol Et
          </Button>
          {file ? (
            <Button
              type="button"
              variant="outline"
              disabled={previewMu.isPending || commitMu.isPending}
              onClick={() => {
                pickFile(null)
                if (fileInputRef.current) fileInputRef.current.value = ''
              }}
            >
              Dosyayı Kaldır
            </Button>
          ) : null}
        </div>
      </div>

      {modalPhase ? (
        <ImportModal
          phase={modalPhase}
          modalLocked={modalLocked}
          commitPending={commitMu.isPending}
          onClose={handleCloseModal}
          onStartImport={handleStartImport}
          onRetry={handleRetry}
          onPickDifferent={handlePickDifferent}
        />
      ) : null}
    </>
  )
}
