import { useMutation } from '@tanstack/react-query'
import type { ChangeEvent, ReactElement } from 'react'
import { useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { commitDesktopImport, previewDesktopImport } from '../api/desktopImport'
import { ApiError } from '../api/client'
import { APP_BASE } from '../config/appPaths'
import { useAuth } from '../contexts/AuthContext'
import { humanizeImportWarning } from '../lib/importWarnings'
import {
  AlertBox,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  PageHeader,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR
} from '../components/ui'

const COUNT_LABELS: Record<string, string> = {
  muvekkil: 'Müvekkil',
  dosya: 'Dosya',
  dosya_kasa_hareket: 'Dosya kasa hareketi',
  anlasilan_vekalet_ucreti: 'Vekalet ücreti',
  vekalet_ucreti_taksit: 'Vekalet taksiti',
  ofis_kasa_hareketleri: 'Ofis kasası',
  office_settings: 'Ofis ayarları (satır)'
}

function formatCountKey(k: string): string {
  return COUNT_LABELS[k] ?? k
}

export function MasaustuIceAktarPage(): ReactElement {
  const { session } = useAuth()
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<Awaited<ReturnType<typeof previewDesktopImport>> | null>(null)
  const [done, setDone] = useState<Awaited<ReturnType<typeof commitDesktopImport>> | null>(null)

  const previewMu = useMutation({
    mutationFn: (f: File) => previewDesktopImport(f),
    onSuccess: (data) => {
      setPreview(data)
      setDone(null)
    }
  })

  const commitMu = useMutation({
    mutationFn: ({ batchId, f }: { batchId: string; f: File }) => commitDesktopImport(batchId, f),
    onSuccess: (data) => {
      setDone(data)
    }
  })

  if (!session) {
    return <Navigate to="/login" replace />
  }
  if (session.user.role !== 'BURO_SAHIBI') {
    return (
      <div className="w-full max-w-none space-y-4">
        <PageHeader title="Masaüstü yedeğinden içe aktar" description="Bu işlem yalnızca büro sahibi rolüne açıktır." />
        <AlertBox variant="warning" title="Yetki">
          Bu sayfayı kullanmak için büro sahibi hesabıyla giriş yapmalısınız.
        </AlertBox>
        <Link to={`${APP_BASE}/ayarlar`} className="text-sm font-semibold text-primary hover:underline">
          Ayarlara dön
        </Link>
      </div>
    )
  }

  const onPickFile = (e: ChangeEvent<HTMLInputElement>): void => {
    const f = e.target.files?.[0] ?? null
    setFile(f)
    setPreview(null)
    setDone(null)
  }

  const errMsg =
    previewMu.error instanceof ApiError
      ? previewMu.error.message
      : previewMu.error instanceof Error
        ? previewMu.error.message
        : null
  const commitErr =
    commitMu.error instanceof ApiError
      ? commitMu.error.message
      : commitMu.error instanceof Error
        ? commitMu.error.message
        : null

  return (
    <div className="w-full max-w-none space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <PageHeader
          className="mb-0 flex-1"
          title="Masaüstü yedeğinden içe aktar"
          description="Masaüstü sürümden aldığınız .sqlite yedeğini yükleyerek verilerinizi SaaS sürüme aktarabilirsiniz. Önce ön kontrol, ardından aynı dosya ile aktarım yapılır."
        />
        <Link
          to={`${APP_BASE}/ayarlar`}
          className="inline-flex h-9 shrink-0 items-center justify-center rounded-md border border-border bg-panel px-3 text-xs font-semibold text-ink hover:bg-surface-muted"
        >
          Ayarlara dön
        </Link>
      </div>

      <AlertBox variant="warning" title="Güvenlik ve veri">
        <ul className="list-inside list-disc space-y-1 text-sm">
          <li>Aktarım mevcut verilerinizi silmez; yedekteki kayıtları mevcut büronuza ekler.</li>
          <li>Aynı yedeği daha önce başarıyla aktardıysanız sistem tekrarını engeller (parmak izi).</li>
          <li>Yalnızca bu oturumdaki büronuza yazılır; tenant bilgisi sunucuda oturumdan alınır.</li>
        </ul>
      </AlertBox>

      {done ? (
        <Card className="overflow-hidden">
          <CardHeader className="border-b border-border bg-emerald-50/80 dark:bg-emerald-950/30">
            <CardTitle className="text-lg text-emerald-900 dark:text-emerald-100">Aktarım tamamlandı</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4 px-4 py-5 sm:px-6">
            <p className="text-sm text-ink-muted">
              İşlem no:{' '}
              <span className="font-mono text-xs font-semibold text-ink">{done.importBatchId}</span>
            </p>

            <div className="overflow-x-auto rounded-lg border border-border">
              <Table>
                <THead>
                  <TR>
                    <TH>Kayıt türü</TH>
                    <TH className="text-right">Aktarılan adet</TH>
                  </TR>
                </THead>
                <TBody>
                  {Object.entries(done.inserted).map(([k, v]) => (
                    <TR key={k}>
                      <TD className="font-medium text-ink">{formatCountKey(k)}</TD>
                      <TD className="text-right text-base font-bold tabular-nums text-ink">{v}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>

            {done.warnings.length ? (
              <AlertBox variant="warning" title="Uyarılar (aktarım sırasında)">
                <ul className="list-inside list-disc space-y-1 text-sm">
                  {done.warnings.map((w, i) => (
                    <li key={i}>{humanizeImportWarning(w)}</li>
                  ))}
                </ul>
              </AlertBox>
            ) : null}

            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <Link
                to={APP_BASE}
                className="inline-flex h-9 items-center justify-center rounded-md border border-border-strong bg-white px-4 text-sm font-semibold text-ink shadow-sm hover:bg-surface-muted dark:bg-surface-elevated"
              >
                Ana sayfaya git
              </Link>
              <Link
                to={APP_BASE}
                className="inline-flex h-9 items-center justify-center rounded-md border border-primary bg-primary px-4 text-sm font-semibold text-primary-fg shadow-sm hover:bg-primary-hover"
              >
                Müvekkilleri görüntüle
              </Link>
            </div>
          </CardBody>
        </Card>
      ) : null}

      {!done ? (
        <>
          <Card>
            <CardHeader className="border-b border-border">
              <CardTitle className="text-base">1. Dosya seçin</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4 px-4 py-5 sm:px-6">
              <input
                type="file"
                accept=".sqlite,application/octet-stream"
                className="block w-full max-w-xl text-sm text-ink file:mr-3 file:rounded-md file:border file:border-border file:bg-panel file:px-3 file:py-2 file:text-sm file:font-semibold"
                onChange={onPickFile}
              />
              <Button
                type="button"
                disabled={!file || previewMu.isPending}
                onClick={() => {
                  if (file) previewMu.mutate(file)
                }}
              >
                Ön kontrol yap
              </Button>
              {errMsg ? (
                <AlertBox variant="danger" title="Ön kontrol">
                  {errMsg}
                </AlertBox>
              ) : null}
            </CardBody>
          </Card>

          {preview ? (
            <Card>
              <CardHeader className="border-b border-border">
                <CardTitle className="text-base">2. Ön kontrol sonucu</CardTitle>
              </CardHeader>
              <CardBody className="space-y-5 px-4 py-5 sm:px-6">
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {Object.entries(preview.counts).map(([k, v]) => (
                    <div
                      key={k}
                      className="flex items-center justify-between rounded-lg border border-border bg-surface-muted/40 px-4 py-3"
                    >
                      <span className="text-sm text-ink-muted">{formatCountKey(k)}</span>
                      <span className="text-lg font-bold tabular-nums text-ink">{v}</span>
                    </div>
                  ))}
                </div>

                {preview.warnings.length ? (
                  <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
                    <p className="mb-2 font-bold">Uyarılar</p>
                    <ul className="list-inside list-disc space-y-1">
                      {preview.warnings.map((w, i) => (
                        <li key={i}>{humanizeImportWarning(w)}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {preview.errors.length ? (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-950 dark:border-red-900 dark:bg-red-950/40 dark:text-red-100">
                    <p className="mb-2 font-bold">Hatalar</p>
                    <ul className="list-inside list-disc space-y-1">
                      {preview.errors.map((w, i) => (
                        <li key={i}>{w}</li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {preview.canCommit && file ? (
                  <div className="space-y-3 border-t border-border pt-5">
                    <p className="text-sm text-ink-muted">
                      Aktarımı başlatmak için aynı .sqlite dosyası kullanılacaktır (sunucu yedeği saklamaz).
                    </p>
                    {commitErr ? (
                      <AlertBox variant="danger" title="Aktarım">
                        {commitErr}
                      </AlertBox>
                    ) : null}
                    <Button
                      type="button"
                      disabled={commitMu.isPending}
                      onClick={() => {
                        if (file) commitMu.mutate({ batchId: preview.importBatchId, f: file })
                      }}
                    >
                      Aktarımı başlat
                    </Button>
                  </div>
                ) : !preview.canCommit ? (
                  <p className="text-sm text-ink-muted">Hatalar giderilene kadar aktarım başlatılamaz.</p>
                ) : (
                  <p className="text-sm text-ink-muted">Aktarım için dosyayı yeniden seçin.</p>
                )}
              </CardBody>
            </Card>
          ) : null}
        </>
      ) : null}
    </div>
  )
}
