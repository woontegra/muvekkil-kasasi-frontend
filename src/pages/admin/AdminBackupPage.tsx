import { useMutation, useQuery } from '@tanstack/react-query'
import type { FormEvent, ReactElement } from 'react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { adminBackupCatalogRequest, adminBackupDaysRequest, adminBackupRestoreRequest, type BackupCatalogItem, type BackupCatalogStatus } from '../../api/adminApi'
import { AdminApiError } from '../../api/adminClient'
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb'
import { AdminEmptyState } from '../../components/admin/AdminEmptyState'
import { Badge, Button, Card, CardBody, Input, Table, TBody, TD, TH, THead, TR } from '../../components/ui'
import { formatDateTR, formatDateTimeTR } from '../../utils/formatters'
import { lisansDurumuTr } from '../../utils/tenantLicenseDisplay'

const PAGE_SIZES = [10, 20, 50] as const

function statusLabel(status: BackupCatalogStatus): string {
  if (status === 'BASARILI') return 'Tamam'
  if (status === 'EKSIK') return 'Eksik dosya'
  return 'Yedek yok'
}

function statusVariant(status: BackupCatalogStatus): 'success' | 'warning' | 'default' {
  if (status === 'BASARILI') return 'success'
  if (status === 'EKSIK') return 'warning'
  return 'default'
}

function restoreErrorText(code: string | undefined): string {
  if (code === 'RESTORE_CONFIRMATION_MISMATCH') return 'Büro adı doğrulanamadı.'
  if (code === 'DECRYPT_FAILED' || code === 'RESTORE_MANIFEST_MISMATCH') return 'Yedek doğrulanamadı.'
  if (code === 'RESTORE_TENANT_MISMATCH' || code === 'RESTORE_FOREIGN_TENANT' || code === 'RESTORE_OBJECT_KEY') {
    return 'Yedek bu büroya ait değil.'
  }
  if (code === 'RESTORE_SAFETY_BACKUP_FAILED') return 'Güvenlik yedeği yazılamadı. Veriler değiştirilmedi.'
  if (code === 'RESTORE_TENANT_INELIGIBLE') return 'Bu büro geri yüklenemez.'
  if (code === 'BACKUP_ENV_MISSING') return 'Sunucuda yedek ayarları eksik.'
  if (code === 'RESTORE_FAILED') return 'Geri yükleme tamamlanamadı. Değişiklikler geri alındı.'
  return 'Geri yükleme tamamlanamadı.'
}

export function AdminBackupPage(): ReactElement {
  const [searchParams, setSearchParams] = useSearchParams()
  const [qInput, setQInput] = useState(searchParams.get('q') ?? '')
  const q = searchParams.get('q') ?? ''
  const page = useMemo(() => Math.max(1, Number(searchParams.get('page')) || 1), [searchParams])
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 20))

  const [openTenant, setOpenTenant] = useState<BackupCatalogItem | null>(null)

  const listQ = useQuery({
    queryKey: ['admin-backups', q, page, limit],
    queryFn: () => adminBackupCatalogRequest({ q: q || undefined, page, limit })
  })

  function applySearch(event: FormEvent): void {
    event.preventDefault()
    const sp = new URLSearchParams()
    if (qInput.trim()) sp.set('q', qInput.trim())
    sp.set('page', '1')
    sp.set('limit', String(limit))
    setSearchParams(sp)
  }

  function setPage(next: number): void {
    const sp = new URLSearchParams(searchParams)
    sp.set('page', String(next))
    sp.set('limit', String(limit))
    setSearchParams(sp)
  }

  const rows = listQ.data?.items ?? []
  const total = listQ.data?.total ?? 0
  const summary = listQ.data?.summary
  const totalPages = Math.max(1, Math.ceil(total / limit))
  const errorText =
    listQ.error instanceof AdminApiError
      ? listQ.error.code === 'BACKUP_ENV_MISSING'
        ? 'Yedek listesi için API servisinde R2 ayarları eksik.'
        : listQ.error.message
      : listQ.error
        ? 'Yedek listesi alınamadı.'
        : null

  return (
    <div className="w-full max-w-none space-y-4">
      <AdminBreadcrumb
        items={[
          { label: 'Ana Sayfa', to: '/admin' },
          { label: 'Admin Paneli', to: '/admin' },
          { label: 'Yedek Yönetimi' }
        ]}
      />

      <div>
        <h1 className="text-lg font-semibold text-slate-900">Yedek Yönetimi</h1>
        <p className="mt-1 text-xs text-slate-500">
          Gerçek müşteriler veritabanındaki büro kaydıyla eşleştirilir. Yedek dosya adlarında kişisel veri yoktur.
        </p>
      </div>

      {summary ? (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <CardBody>
              <p className="text-xs text-slate-500">Yedeklenen gerçek müşteri</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.eligibleCount}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-slate-500">Son çalışmada başarılı</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.successCount}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-slate-500">Son çalışmada başarısız</p>
              <p className="mt-1 text-2xl font-semibold text-slate-900">{summary.failedCount}</p>
            </CardBody>
          </Card>
          <Card>
            <CardBody>
              <p className="text-xs text-slate-500">Son yedek çalışması</p>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {summary.lastRunAt ? formatDateTimeTR(summary.lastRunAt) : 'Kayıt yok'}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {summary.lastRunDate ? `Gün: ${formatDateTR(summary.lastRunDate)}` : 'Henüz nesne yok'}
              </p>
            </CardBody>
          </Card>
        </div>
      ) : null}

      <Card>
        <CardBody className="space-y-4">
          <form className="flex flex-wrap items-end gap-2" onSubmit={applySearch}>
            <label className="min-w-[240px] flex-1 text-xs text-slate-600">
              Büro adı, e-posta veya tenant UUID
              <Input
                className="mt-1"
                value={qInput}
                onChange={(event) => setQInput(event.target.value)}
                placeholder="Ara"
              />
            </label>
            <Button type="submit">Ara</Button>
          </form>

          {errorText ? <p className="text-sm text-red-700">{errorText}</p> : null}
          {listQ.isLoading ? <p className="text-sm text-slate-500">Yükleniyor…</p> : null}

          {!listQ.isLoading && !errorText && rows.length === 0 ? (
            <AdminEmptyState
              title="Kayıt bulunamadı"
              description="Bu aramada yedek kapsamındaki gerçek müşteri yok."
            />
          ) : null}

          {rows.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH>Büro / kullanıcı</TH>
                    <TH>E-posta</TH>
                    <TH>Tenant UUID</TH>
                    <TH>Lisans</TH>
                    <TH>Son başarılı yedek</TH>
                    <TH className="text-right">Yedek sayısı</TH>
                    <TH>En eski yedek</TH>
                    <TH>Son durum</TH>
                    <TH>İşlem</TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.map((row) => (
                    <TR key={row.tenantId}>
                      <TD>
                        <div className="font-medium text-slate-900">{row.buroAdi}</div>
                        <div className="text-xs text-slate-500">
                          {row.sahipAdSoyad ?? '—'}
                          {row.kullaniciAdi ? ` · ${row.kullaniciAdi}` : ''}
                        </div>
                      </TD>
                      <TD className="max-w-[200px] truncate text-sm text-slate-600">{row.eposta ?? '—'}</TD>
                      <TD className="whitespace-nowrap font-mono text-xs text-slate-700">{row.tenantId}</TD>
                      <TD className="text-sm">{lisansDurumuTr(row.lisansDurumu)}</TD>
                      <TD className="whitespace-nowrap text-sm">{formatDateTR(row.lastSuccessfulBackupDate)}</TD>
                      <TD className="text-right tabular-nums text-sm">{row.backupCount}</TD>
                      <TD className="whitespace-nowrap text-sm">{formatDateTR(row.oldestBackupDate)}</TD>
                      <TD>
                        <Badge variant={statusVariant(row.lastBackupStatus)} className="!normal-case">
                          {statusLabel(row.lastBackupStatus)}
                        </Badge>
                      </TD>
                      <TD>
                        <Button type="button" variant="outline" size="sm" onClick={() => setOpenTenant(row)}>
                          Yedekleri Gör
                        </Button>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          ) : null}
        </CardBody>
      </Card>

      {listQ.data ? (
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-500">
          <span>
            Toplam {total} kayıt · Sayfa {page}/{totalPages}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <label className="flex items-center gap-1.5">
              Sayfa boyutu
              <select
                className="h-8 rounded border border-slate-200 bg-white px-2 text-xs"
                value={limit}
                onChange={(event) => {
                  const next = Number(event.target.value)
                  const sp = new URLSearchParams(searchParams)
                  sp.set('limit', String(next))
                  sp.set('page', '1')
                  setSearchParams(sp)
                }}
              >
                {PAGE_SIZES.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
            </label>
            <Button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)}>
              Önceki
            </Button>
            <Button type="button" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
              Sonraki
            </Button>
          </div>
        </div>
      ) : null}
      {openTenant ? <BackupDaysDialog tenant={openTenant} onClose={() => setOpenTenant(null)} /> : null}
    </div>
  )
}

function BackupDaysDialog(props: { tenant: BackupCatalogItem; onClose: () => void }): ReactElement {
  const [pendingDate, setPendingDate] = useState<string | null>(null)
  const [confirmName, setConfirmName] = useState('')
  const daysQ = useQuery({
    queryKey: ['admin-backup-days', props.tenant.tenantId],
    queryFn: () => adminBackupDaysRequest(props.tenant.tenantId)
  })
  const restoreM = useMutation({
    mutationFn: (calendarDate: string) =>
      adminBackupRestoreRequest(props.tenant.tenantId, {
        calendarDate,
        confirmBuroAdi: confirmName.trim()
      })
  })
  const nameMatches = confirmName.trim() === props.tenant.buroAdi.trim()
  const errorCode = restoreM.error instanceof AdminApiError ? restoreM.error.code : undefined
  const daysError = daysQ.error instanceof AdminApiError ? daysQ.error.code : undefined

  return (
    <div className="fixed inset-0 z-[80] flex items-start justify-center overflow-y-auto bg-slate-900/40 px-4 py-10">
      <div className="w-full max-w-3xl rounded-lg bg-white p-5 shadow-xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold text-slate-900">{props.tenant.buroAdi}</h2>
            <p className="mt-1 font-mono text-xs text-slate-500">{props.tenant.tenantId}</p>
          </div>
          <Button type="button" variant="outline" size="sm" onClick={props.onClose} disabled={restoreM.isPending}>
            Kapat
          </Button>
        </div>

        {daysQ.isLoading ? <p className="mt-4 text-sm text-slate-500">Yedekler yükleniyor…</p> : null}
        {daysError ? <p className="mt-4 text-sm text-red-700">{restoreErrorText(daysError)}</p> : null}

        {daysQ.data && daysQ.data.days.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">Bu büro için R2'de günlük yedek yok.</p>
        ) : null}

        {daysQ.data && daysQ.data.days.length > 0 ? (
          <div className="mt-4 overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Yedek günü</TH>
                  <TH>Son dosya zamanı</TH>
                  <TH>Durum</TH>
                  <TH>İşlem</TH>
                </TR>
              </THead>
              <TBody>
                {daysQ.data.days.map((day) => (
                  <TR key={day.calendarDate}>
                    <TD className="whitespace-nowrap text-sm">{formatDateTR(day.calendarDate)}</TD>
                    <TD className="whitespace-nowrap text-sm">{formatDateTimeTR(day.lastModified)}</TD>
                    <TD>
                      <Badge variant={day.status === 'BASARILI' ? 'success' : 'warning'} className="!normal-case">
                        {day.status === 'BASARILI' ? 'Tamam' : 'Eksik dosya'}
                      </Badge>
                    </TD>
                    <TD>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={day.status !== 'BASARILI' || restoreM.isPending}
                        onClick={() => {
                          setPendingDate(day.calendarDate)
                          setConfirmName('')
                          restoreM.reset()
                        }}
                      >
                        Geri Yükle
                      </Button>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        ) : null}

        {pendingDate ? (
          <form
            className="mt-4 space-y-3 rounded-md border border-amber-200 bg-amber-50 p-4"
            onSubmit={(event) => {
              event.preventDefault()
              if (!nameMatches || restoreM.isPending) return
              restoreM.mutate(pendingDate)
            }}
          >
            <p className="text-sm font-semibold text-amber-950">Mevcut veriler seçilen tarihteki verilerle değiştirilecek.</p>
            <p className="text-sm text-amber-950">
              Büro: {props.tenant.buroAdi}
              <br />
              Tenant UUID: <span className="font-mono text-xs">{props.tenant.tenantId}</span>
              <br />
              Seçilen yedek: {formatDateTR(pendingDate)}
            </p>
            <label className="block text-xs text-slate-700">
              Onay için büro adını yazın
              <Input className="mt-1" value={confirmName} onChange={(event) => setConfirmName(event.target.value)} autoComplete="off" />
            </label>
            {restoreM.isError ? <p className="text-sm text-red-700">{restoreErrorText(errorCode)}</p> : null}
            {restoreM.data ? (
              <p className="text-sm text-emerald-800">
                Geri yükleme tamamlandı. Yedek günü {formatDateTR(restoreM.data.calendarDate)}. Zaman{' '}
                {formatDateTimeTR(restoreM.data.restoredAt)}.
              </p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Button type="submit" disabled={!nameMatches || restoreM.isPending || Boolean(restoreM.data)}>
                {restoreM.isPending ? 'Geri yükleniyor…' : 'Geri yüklemeyi başlat'}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={restoreM.isPending}
                onClick={() => {
                  setPendingDate(null)
                  setConfirmName('')
                  restoreM.reset()
                }}
              >
                Vazgeç
              </Button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  )
}
