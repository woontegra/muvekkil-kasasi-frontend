import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { adminExpiringTenantsRequest, adminExtendLicenseRequest, type AdminExtendLicenseRequestBody } from '../../api/adminApi'
import type { AdminExpiringTenantRow } from '../../types/admin'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { AdminScrim } from '../../components/admin/AdminScrim'
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Input, Table, TBody, TD, TH, THead, TR } from '../../components/ui'
import { formatCurrencyTR, formatDateTR } from '../../utils/formatters'

export function AdminLicenseAlertsPage(): ReactElement {
  const qc = useQueryClient()
  const { admin } = useAdminAuth()
  const isSuper = admin?.rol === 'SUPER_ADMIN'
  const q = useQuery({
    queryKey: ['admin-expiring', 7],
    queryFn: () => adminExpiringTenantsRequest(7)
  })
  const rows = q.data?.items ?? []

  const [extendRow, setExtendRow] = useState<AdminExpiringTenantRow | null>(null)
  type ExtendTur = 'GUN' | 'AY' | 'YIL'
  const [extendTur, setExtendTur] = useState<ExtendTur>('AY')
  const [extendMiktar, setExtendMiktar] = useState('12')
  const [extendDemo, setExtendDemo] = useState(false)
  const [aciklama, setAciklama] = useState('')
  const [extendErr, setExtendErr] = useState<string | null>(null)

  const extendM = useMutation({
    mutationFn: (body: { id: string; payload: AdminExtendLicenseRequestBody }) =>
      adminExtendLicenseRequest(body.id, body.payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-expiring'] })
      void qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
      setExtendRow(null)
      setAciklama('')
      setExtendErr(null)
    }
  })

  return (
    <div className="w-full max-w-none space-y-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Lisansı Bitecekler</h1>
        <p className="mt-1 text-sm text-slate-600">Önümüzdeki 7 gün içinde lisans bitiş tarihi gelen bürolar.</p>
      </div>

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/80 py-3">
          <CardTitle className="text-base">Uyarı listesi</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {q.isLoading ? (
            <p className="px-4 py-10 text-center text-sm text-ink-muted">Yükleniyor…</p>
          ) : q.isError ? (
            <p className="px-4 py-10 text-center text-sm text-danger">{q.error instanceof Error ? q.error.message : 'Veri alınamadı.'}</p>
          ) : rows.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="Kayıt yok"
                description="Önümüzdeki 7 gün içinde lisansı bitecek büro bulunmuyor."
              />
            </div>
          ) : (
            <div className="w-full max-w-full overflow-x-auto">
              <Table className="min-w-[1000px]">
                <THead>
                  <TR>
                    <TH>Büro adı</TH>
                    <TH>E-posta</TH>
                    <TH>Telefon</TH>
                    <TH>Lisans durumu</TH>
                    <TH>Lisans bitiş</TH>
                    <TH className="text-right">Kalan gün</TH>
                    <TH className="text-right">Yıllık ücret</TH>
                    <TH className="w-[200px]">İşlem</TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.map((t) => (
                    <TR key={t.id}>
                      <TD>
                        <Link className="font-semibold text-primary hover:underline" to={`/admin/burolar/${t.id}`}>
                          {t.buroAdi}
                        </Link>
                      </TD>
                      <TD className="max-w-[200px] truncate text-sm text-ink-muted">{t.eposta ?? '—'}</TD>
                      <TD className="whitespace-nowrap text-sm text-ink-muted">{t.telefon ?? '—'}</TD>
                      <TD>
                        <Badge variant="default" className="!normal-case">
                          {t.lisansDurumu}
                        </Badge>
                      </TD>
                      <TD className="whitespace-nowrap text-sm">{formatDateTR(t.lisansBitisTarihi)}</TD>
                      <TD className="text-right tabular-nums text-sm">{t.kalanGun ?? '—'}</TD>
                      <TD className="text-right text-sm tabular-nums text-ink-muted">
                        {t.yillikUcret != null ? formatCurrencyTR(Number(t.yillikUcret)) : '—'}
                      </TD>
                      <TD>
                        <div className="flex flex-wrap gap-2">
                          <Link
                            to={`/admin/burolar/${t.id}`}
                            className="inline-flex h-8 items-center justify-center rounded-md border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-800 hover:bg-slate-50"
                          >
                            Detay
                          </Link>
                          <Button
                            type="button"
                            size="sm"
                            variant="secondary"
                            disabled={!isSuper}
                            onClick={() => isSuper && setExtendRow(t)}
                          >
                            Lisans uzat
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>

      {extendRow ? (
        <AdminScrim title={`Lisans uzat / demo — ${extendRow.buroAdi}`} onClose={() => !extendM.isPending && setExtendRow(null)}>
          <div className="space-y-3 text-sm text-slate-700">
            {!isSuper ? (
              <p className="text-ink-muted">Bu işlem yalnızca <strong>SUPER_ADMIN</strong> için açıktır.</p>
            ) : (
              <>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="secondary" onClick={() => { setExtendTur('GUN'); setExtendMiktar('7'); setExtendDemo(true); setExtendErr(null) }}>
                    7 gün demo
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => { setExtendTur('AY'); setExtendMiktar('1'); setExtendDemo(false); setExtendErr(null) }}>
                    1 ay
                  </Button>
                  <Button type="button" size="sm" variant="secondary" onClick={() => { setExtendTur('AY'); setExtendMiktar('12'); setExtendDemo(false); setExtendErr(null) }}>
                    12 ay
                  </Button>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-ink-muted">Birim</label>
                  <select
                    className="h-9 w-full rounded-md border border-border bg-white px-2 text-sm"
                    value={extendTur}
                    onChange={(e) => setExtendTur(e.target.value as ExtendTur)}
                  >
                    <option value="GUN">Gün</option>
                    <option value="AY">Ay</option>
                    <option value="YIL">Yıl</option>
                  </select>
                </div>
                <Input label="Miktar" type="number" min={1} value={extendMiktar} onChange={(e) => setExtendMiktar(e.target.value)} />
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={extendDemo} onChange={(e) => setExtendDemo(e.target.checked)} className="rounded border-border" />
                  Demo olarak işaretle
                </label>
                <Input label="Açıklama (denetim notu)" value={aciklama} onChange={(e) => setAciklama(e.target.value)} />
                {extendErr ? <p className="text-sm text-danger">{extendErr}</p> : null}
              </>
            )}
            {extendM.isError ? (
              <p className="text-sm text-danger">{extendM.error instanceof Error ? extendM.error.message : 'Hata'}</p>
            ) : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" disabled={extendM.isPending} onClick={() => setExtendRow(null)}>
                İptal
              </Button>
              <Button
                type="button"
                disabled={extendM.isPending || !isSuper}
                onClick={() => {
                  if (!extendRow) return
                  setExtendErr(null)
                  const n = Number(extendMiktar)
                  if (!Number.isFinite(n) || n < 1 || !Number.isInteger(n)) {
                    setExtendErr('Miktar pozitif tam sayı olmalı.')
                    return
                  }
                  void extendM.mutateAsync({
                    id: extendRow.id,
                    payload: {
                      miktar: n,
                      birim: extendTur,
                      demoMu: extendDemo ? true : undefined,
                      aciklama: aciklama.trim() || undefined
                    }
                  })
                }}
              >
                {extendM.isPending ? 'Kaydediliyor…' : 'Lisansı güncelle'}
              </Button>
            </div>
          </div>
        </AdminScrim>
      ) : null}
    </div>
  )
}
