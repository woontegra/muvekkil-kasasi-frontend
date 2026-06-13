import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminTenantActivateRequest, adminTenantsListRequest } from '../../api/adminApi'
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { AlertBox, Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Table, TBody, TD, TH, THead, TR } from '../../components/ui'
import { formatDateTR } from '../../utils/formatters'
import { lisansDurumuTr, tenantEffectiveLisansBitisTarihi } from '../../utils/tenantLicenseDisplay'

export function AdminPassiveTenantsPage(): ReactElement {
  const { admin } = useAdminAuth()
  const qc = useQueryClient()
  const isSuper = admin?.rol === 'SUPER_ADMIN'

  const [activateConfirmId, setActivateConfirmId] = useState<string | null>(null)
  const [banner, setBanner] = useState<string | null>(null)

  useEffect(() => {
    if (!banner) return
    const timer = window.setTimeout(() => setBanner(null), 5000)
    return () => window.clearTimeout(timer)
  }, [banner])

  const listQ = useQuery({
    queryKey: ['admin-tenants', 'pasif-buro'],
    queryFn: () => adminTenantsListRequest({ aktifMi: false, page: 1, limit: 200 })
  })
  const rows = listQ.data?.items ?? []

  const activateM = useMutation({
    mutationFn: (id: string) => adminTenantActivateRequest(id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-tenants'] })
      void qc.invalidateQueries({ queryKey: ['admin-tenant'] })
      void qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
      setActivateConfirmId(null)
      setBanner('Büro aktifleştirildi.')
    }
  })

  const pendingRow = rows.find((r) => r.id === activateConfirmId)

  return (
    <div className="w-full max-w-none space-y-5">
      <AdminConfirmDialog
        open={Boolean(activateConfirmId && pendingRow)}
        title="Büroyu aktifleştir"
        message="Bu büroyu tekrar aktif etmek istiyor musunuz?"
        confirmLabel="Aktifleştir"
        loading={activateM.isPending}
        onCancel={() => setActivateConfirmId(null)}
        onConfirm={() => {
          if (activateConfirmId) void activateM.mutateAsync(activateConfirmId)
        }}
      />

      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Pasif Bürolar</h1>
        <p className="mt-1 text-sm text-slate-600">
          Büro erişimi kapalı kiracılar (aktifMi=false). Lisans satırı abonelik durumunu gösterir; büro pasif olsa da lisans kaydı ayrı kalabilir.
        </p>
      </div>

      {banner ? (
        <AlertBox variant="success" title="Tamamlandı">
          {banner}
        </AlertBox>
      ) : null}

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/80 py-3">
          <CardTitle className="text-base">Liste</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {listQ.isLoading ? (
            <p className="px-4 py-10 text-center text-sm text-ink-muted">Yükleniyor…</p>
          ) : listQ.isError ? (
            <p className="px-4 py-10 text-center text-sm text-danger">{listQ.error instanceof Error ? listQ.error.message : 'Liste alınamadı.'}</p>
          ) : rows.length === 0 ? (
            <div className="p-6">
              <EmptyState title="Pasif büro bulunmuyor." description="Büro erişimi kapalı kayıtlı kiracı yok." />
            </div>
          ) : (
            <div className="w-full max-w-full overflow-x-auto">
              <Table className="min-w-[960px]">
                <THead>
                  <TR>
                    <TH>Büro adı</TH>
                    <TH>E-posta</TH>
                    <TH>Telefon</TH>
                    <TH>Lisans</TH>
                    <TH>Lisans bitiş</TH>
                    <TH>Büro erişimi</TH>
                    <TH className="w-[220px]">İşlem</TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.map((t) => {
                    const eff = tenantEffectiveLisansBitisTarihi(
                      t.lisansBitisTarihi,
                      t.lisansDurumu,
                      t.demoMu,
                      t.demoBitisTarihi
                    )
                    return (
                      <TR key={t.id}>
                        <TD>
                          <Link className="font-semibold text-primary hover:underline" to={`/admin/burolar/${t.id}`}>
                            {t.buroAdi}
                          </Link>
                        </TD>
                        <TD className="max-w-[200px] truncate text-sm text-ink-muted">{t.eposta ?? '—'}</TD>
                        <TD className="whitespace-nowrap text-sm text-ink-muted">{t.telefon ?? '—'}</TD>
                        <TD>
                          <span className="font-semibold text-ink">{lisansDurumuTr(t.lisansDurumu)}</span>
                          <span className="ml-1 text-xs text-ink-muted">({t.lisansDurumu})</span>
                        </TD>
                        <TD className="whitespace-nowrap text-sm">{eff ? formatDateTR(eff) : formatDateTR(t.lisansBitisTarihi)}</TD>
                        <TD>
                          <Badge variant="warning" className="!normal-case">
                            Pasif
                          </Badge>
                        </TD>
                        <TD>
                          <div className="flex flex-wrap gap-2">
                            <Link
                              to={`/admin/burolar/${t.id}`}
                              className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                            >
                              Detaya git
                            </Link>
                            <Button
                              type="button"
                              size="sm"
                              variant="secondary"
                              disabled={!isSuper || activateM.isPending}
                              title={!isSuper ? 'Yalnız süper admin aktifleştirebilir.' : undefined}
                              onClick={() => setActivateConfirmId(t.id)}
                            >
                              Aktifleştir
                            </Button>
                          </div>
                        </TD>
                      </TR>
                    )
                  })}
                </TBody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>
      {activateM.isError ? (
        <p className="text-sm text-danger">{activateM.error instanceof Error ? activateM.error.message : 'İşlem başarısız.'}</p>
      ) : null}
    </div>
  )
}
