import { useQuery } from '@tanstack/react-query'
import type { FormEvent, ReactElement } from 'react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { adminBackupCatalogRequest, type BackupCatalogStatus } from '../../api/adminApi'
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

export function AdminBackupPage(): ReactElement {
  const [searchParams, setSearchParams] = useSearchParams()
  const [qInput, setQInput] = useState(searchParams.get('q') ?? '')
  const q = searchParams.get('q') ?? ''
  const page = useMemo(() => Math.max(1, Number(searchParams.get('page')) || 1), [searchParams])
  const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit')) || 20))

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
    </div>
  )
}
