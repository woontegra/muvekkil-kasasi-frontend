import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  adminWhatsAppPaketTalepleriRequest,
  adminWhatsAppPaketTalepOnaylaRequest,
  adminWhatsAppPaketTalepReddetRequest,
  type AdminWhatsAppPaketTalepRow
} from '../../api/adminApi'
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog'
import {
  AlertBox,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  EmptyState,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR
} from '../../components/ui'
import { formatDateTimeTR } from '../../utils/formatters'

function durumBadge(durum: string): ReactElement {
  if (durum === 'BEKLIYOR') return <Badge variant="warning">Bekliyor</Badge>
  if (durum === 'ONAYLANDI') return <Badge variant="success">Onaylandı</Badge>
  if (durum === 'REDDEDILDI') return <Badge variant="danger">Reddedildi</Badge>
  return <Badge variant="default">{durum}</Badge>
}

export function AdminWhatsAppPaketTalepleriPage(): ReactElement {
  const qc = useQueryClient()
  type Filter = 'BEKLIYOR' | 'ONAYLANDI' | 'REDDEDILDI' | 'ALL'
  const [filter, setFilter] = useState<Filter>('BEKLIYOR')
  const [confirm, setConfirm] = useState<{ id: string; yon: 'ONAY' | 'RED'; row: AdminWhatsAppPaketTalepRow } | null>(
    null
  )
  const [banner, setBanner] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const q = useQuery({
    queryKey: ['admin-wa-paket-talepleri', filter],
    queryFn: () =>
      adminWhatsAppPaketTalepleriRequest({
        durum: filter === 'ALL' ? undefined : filter,
        limit: 100
      })
  })

  const rows = q.data?.items ?? []

  const onayMu = useMutation({
    mutationFn: (id: string) => adminWhatsAppPaketTalepOnaylaRequest(id),
    onSuccess: (data) => {
      setErr(null)
      setBanner(
        data.credit.alreadyApplied
          ? 'Talep zaten onaylıydı; ek kredi eklenmedi.'
          : `${data.talep.mesajAdedi.toLocaleString('tr-TR')} mesaj kredisi eklendi.`
      )
      void qc.invalidateQueries({ queryKey: ['admin-wa-paket-talepleri'] })
      void qc.invalidateQueries({ queryKey: ['admin-wa-kredi'] })
      void qc.invalidateQueries({ queryKey: ['admin-wa-kredi-hareket'] })
    },
    onError: (e: Error) => setErr(e.message || 'Onay başarısız.'),
    onSettled: () => setConfirm(null)
  })

  const redMu = useMutation({
    mutationFn: (id: string) => adminWhatsAppPaketTalepReddetRequest(id),
    onSuccess: () => {
      setErr(null)
      setBanner('Talep reddedildi. Kredi eklenmedi.')
      void qc.invalidateQueries({ queryKey: ['admin-wa-paket-talepleri'] })
    },
    onError: (e: Error) => setErr(e.message || 'Red başarısız.'),
    onSettled: () => setConfirm(null)
  })

  const busy = onayMu.isPending || redMu.isPending

  const filters: { id: Filter; label: string }[] = [
    { id: 'BEKLIYOR', label: 'Bekleyen' },
    { id: 'ONAYLANDI', label: 'Onaylanan' },
    { id: 'REDDEDILDI', label: 'Reddedilen' },
    { id: 'ALL', label: 'Tümü' }
  ]

  return (
    <div className="w-full max-w-none space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            WhatsApp Mesaj Paketi Talepleri
          </h1>
          <p className="mt-1 text-sm text-slate-600">
            Ödeme dışarıdan doğrulandıktan sonra talebi onaylayıp kredi ekleyin.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {filters.map((f) => (
            <Button
              key={f.id}
              type="button"
              size="sm"
              variant={filter === f.id ? 'primary' : 'outline'}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </Button>
          ))}
        </div>
      </div>

      {banner ? (
        <AlertBox variant="success" title="Tamam">
          {banner}
        </AlertBox>
      ) : null}
      {err ? (
        <AlertBox variant="danger" title="Hata">
          {err}
        </AlertBox>
      ) : null}

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/80 py-3">
          <CardTitle className="text-base">Talep listesi</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {q.isLoading ? (
            <p className="px-4 py-10 text-center text-sm text-slate-500">Yükleniyor…</p>
          ) : q.isError ? (
            <p className="px-4 py-10 text-center text-sm text-danger">
              {q.error instanceof Error ? q.error.message : 'Veri alınamadı.'}
            </p>
          ) : rows.length === 0 ? (
            <div className="p-6">
              <EmptyState
                title="Kayıt yok"
                description={
                  filter === 'BEKLIYOR'
                    ? 'Bekleyen WhatsApp mesaj paketi talebi yok.'
                    : 'Henüz talep oluşturulmamış.'
                }
              />
            </div>
          ) : (
            <div className="w-full max-w-full overflow-x-auto">
              <Table className="min-w-[1100px]">
                <THead>
                  <TR>
                    <TH>Büro</TH>
                    <TH>Paket</TH>
                    <TH>Mesaj</TH>
                    <TH>Tutar</TH>
                    <TH>Ödeme Referansı</TH>
                    <TH>Talep tarihi</TH>
                    <TH>Durum</TH>
                    <TH className="w-[220px]">İşlem</TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.map((row) => (
                    <TR key={row.id}>
                      <TD>
                        <Link
                          to={`/admin/burolar/${row.tenantId}`}
                          className="font-medium text-slate-900 hover:underline"
                        >
                          {row.buroAdi}
                        </Link>
                        {row.musteriNo ? (
                          <p className="text-xs text-slate-500">#{row.musteriNo}</p>
                        ) : null}
                      </TD>
                      <TD className="text-xs font-mono text-slate-600">{row.packageId}</TD>
                      <TD>{row.mesajAdedi.toLocaleString('tr-TR')}</TD>
                      <TD>{row.fiyatTL.toLocaleString('tr-TR')} TL</TD>
                      <TD>
                        <span className="font-mono text-xs font-semibold tracking-wide text-slate-800">
                          {row.paymentReference}
                        </span>
                      </TD>
                      <TD className="whitespace-nowrap text-xs">
                        {formatDateTimeTR(row.createdAt)}
                      </TD>
                      <TD>{durumBadge(row.durum)}</TD>
                      <TD>
                        {row.durum === 'BEKLIYOR' ? (
                          <div className="flex flex-wrap gap-1.5">
                            <Button
                              type="button"
                              size="sm"
                              disabled={busy}
                              onClick={() => {
                                setBanner(null)
                                setErr(null)
                                setConfirm({ id: row.id, yon: 'ONAY', row })
                              }}
                            >
                              Onayla ve Krediyi Ekle
                            </Button>
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={busy}
                              onClick={() => {
                                setBanner(null)
                                setErr(null)
                                setConfirm({ id: row.id, yon: 'RED', row })
                              }}
                            >
                              Reddet
                            </Button>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>

      <AdminConfirmDialog
        open={confirm != null}
        title={confirm?.yon === 'RED' ? 'Talebi reddet' : 'Talebi onayla'}
        message={
          confirm?.yon === 'ONAY'
            ? [
                `Büro: ${confirm.row.buroAdi}`,
                `Paket: ${confirm.row.packageId}`,
                `Mesaj adedi: ${confirm.row.mesajAdedi.toLocaleString('tr-TR')}`,
                `Tutar: ${confirm.row.fiyatTL.toLocaleString('tr-TR')} TL`,
                `Ödeme Referansı: ${confirm.row.paymentReference}`,
                `Talep tarihi: ${formatDateTimeTR(confirm.row.createdAt)}`,
                '',
                `Bu talep onaylandığında ${confirm.row.mesajAdedi.toLocaleString('tr-TR')} WhatsApp mesaj kredisi ilgili büroya eklenecek. Onaylıyor musunuz?`
              ].join('\n')
            : confirm
              ? [
                  `Büro: ${confirm.row.buroAdi}`,
                  `Paket: ${confirm.row.packageId}`,
                  `Ödeme Referansı: ${confirm.row.paymentReference}`,
                  '',
                  `${confirm.row.buroAdi} bürosunun talebi reddedilecek. Kredi eklenmeyecek. Onaylıyor musunuz?`
                ].join('\n')
              : ''
        }
        confirmLabel={confirm?.yon === 'RED' ? 'Reddet' : 'Onayla ve Krediyi Ekle'}
        danger={confirm?.yon === 'RED'}
        loading={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (!confirm) return
          if (confirm.yon === 'ONAY') onayMu.mutate(confirm.id)
          else redMu.mutate(confirm.id)
        }}
      />
    </div>
  )
}
