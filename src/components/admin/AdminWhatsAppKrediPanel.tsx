import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useMemo, useState } from 'react'
import {
  adminWhatsAppKrediAdjustRequest,
  adminWhatsAppKrediHareketlerRequest,
  adminWhatsAppKrediOzetRequest,
  adminWhatsAppPaketTalepleriRequest,
  adminWhatsAppPaketTalepOnaylaRequest,
  adminWhatsAppPaketTalepReddetRequest,
  type AdminWhatsAppKrediHareket,
  type AdminWhatsAppPaketTalepRow
} from '../../api/adminApi'
import { AdminConfirmDialog } from './AdminConfirmDialog'
import {
  AlertBox,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Input,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  Textarea
} from '../ui'
import { formatDateTimeTR } from '../../utils/formatters'

type Props = {
  tenantId: string
  enabled: boolean
}

const PRESETS = [100, 500, 1000, 2500, 5000] as const

function tipLabel(tip: string): string {
  switch (tip) {
    case 'YILLIK_DAHIL':
      return 'Yıllık paket'
    case 'PAKET_SATIN_ALMA':
      return 'Satın alınan paket'
    case 'MESAJ_GONDERIM':
      return 'Mesaj gönderimi'
    case 'IADE':
      return 'İade'
    case 'MANUEL_DUZELTME':
      return 'Admin düzeltmesi'
    default:
      return tip
  }
}

function formatMiktar(n: number): string {
  const abs = Math.abs(n).toLocaleString('tr-TR')
  if (n > 0) return `+${abs}`
  if (n < 0) return `−${abs}`
  return '0'
}

function durumBadge(durum: string): ReactElement {
  const variant =
    durum === 'NORMAL' ? 'success' : durum === 'DUSUK' ? 'warning' : durum === 'KRITIK' ? 'danger' : 'default'
  const label =
    durum === 'NORMAL'
      ? 'Normal'
      : durum === 'DUSUK'
        ? 'Düşük'
        : durum === 'KRITIK'
          ? 'Kritik'
          : durum === 'TUKENDI'
            ? 'Tükendi'
            : durum
  return <Badge variant={variant}>{label}</Badge>
}

export function AdminWhatsAppKrediPanel(props: Props): ReactElement | null {
  const qc = useQueryClient()
  const [miktar, setMiktar] = useState('500')
  const [aciklama, setAciklama] = useState('')
  const [confirm, setConfirm] = useState<'EKLE' | 'DUS' | null>(null)
  const [talepConfirm, setTalepConfirm] = useState<{
    id: string
    yon: 'ONAY' | 'RED'
    row: AdminWhatsAppPaketTalepRow
  } | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const ozetQ = useQuery({
    queryKey: ['admin-wa-kredi', props.tenantId],
    queryFn: () => adminWhatsAppKrediOzetRequest(props.tenantId),
    enabled: props.enabled && Boolean(props.tenantId),
    retry: false
  })

  const hareketQ = useQuery({
    queryKey: ['admin-wa-kredi-hareket', props.tenantId],
    queryFn: () => adminWhatsAppKrediHareketlerRequest(props.tenantId, { limit: 20 }),
    enabled: props.enabled && Boolean(props.tenantId),
    retry: false
  })

  const talepQ = useQuery({
    queryKey: ['admin-wa-paket-talepleri', props.tenantId, 'BEKLIYOR'],
    queryFn: () =>
      adminWhatsAppPaketTalepleriRequest({
        tenantId: props.tenantId,
        durum: 'BEKLIYOR',
        limit: 20
      }),
    enabled: props.enabled && Boolean(props.tenantId),
    retry: false
  })

  const adjustMu = useMutation({
    mutationFn: (yon: 'EKLE' | 'DUS') => {
      const n = Number.parseInt(miktar, 10)
      if (!Number.isInteger(n) || n <= 0) {
        throw new Error('Miktar pozitif tam sayı olmalıdır.')
      }
      const note = aciklama.trim()
      return adminWhatsAppKrediAdjustRequest(props.tenantId, {
        yon,
        miktar: n,
        ...(note ? { aciklama: note } : {})
      })
    },
    onSuccess: (data) => {
      setErr(null)
      setBanner(
        data.yon === 'EKLE'
          ? `${data.miktar.toLocaleString('tr-TR')} WhatsApp mesaj kredisi eklendi. Yeni bakiye: ${data.sonrakiBakiye.toLocaleString('tr-TR')}.`
          : `${data.miktar.toLocaleString('tr-TR')} WhatsApp mesaj kredisi düşüldü. Yeni bakiye: ${data.sonrakiBakiye.toLocaleString('tr-TR')}.`
      )
      setAciklama('')
      setMiktar('')
      void qc.invalidateQueries({ queryKey: ['admin-wa-kredi', props.tenantId] })
      void qc.invalidateQueries({ queryKey: ['admin-wa-kredi-hareket', props.tenantId] })
    },
    onError: (e: Error) => setErr(e.message || 'İşlem başarısız.'),
    onSettled: () => setConfirm(null)
  })

  const talepOnayMu = useMutation({
    mutationFn: (id: string) => adminWhatsAppPaketTalepOnaylaRequest(id),
    onSuccess: (data) => {
      setErr(null)
      setBanner(
        data.credit.alreadyApplied
          ? 'Talep zaten onaylıydı; ek kredi eklenmedi.'
          : `${data.talep.mesajAdedi.toLocaleString('tr-TR')} mesaj paketi onaylandı ve kredi eklendi.`
      )
      void qc.invalidateQueries({ queryKey: ['admin-wa-kredi', props.tenantId] })
      void qc.invalidateQueries({ queryKey: ['admin-wa-kredi-hareket', props.tenantId] })
      void qc.invalidateQueries({ queryKey: ['admin-wa-paket-talepleri'] })
    },
    onError: (e: Error) => setErr(e.message || 'Onay başarısız.'),
    onSettled: () => setTalepConfirm(null)
  })

  const talepRedMu = useMutation({
    mutationFn: (id: string) => adminWhatsAppPaketTalepReddetRequest(id),
    onSuccess: () => {
      setErr(null)
      setBanner('Paket talebi reddedildi.')
      void qc.invalidateQueries({ queryKey: ['admin-wa-paket-talepleri'] })
    },
    onError: (e: Error) => setErr(e.message || 'Red başarısız.'),
    onSettled: () => setTalepConfirm(null)
  })

  const parsedMiktar = useMemo(() => {
    const n = Number.parseInt(miktar, 10)
    return Number.isInteger(n) && n > 0 ? n : null
  }, [miktar])

  const busy =
    adjustMu.isPending || talepOnayMu.isPending || talepRedMu.isPending
  const canEkle = parsedMiktar != null && !busy
  const canDus =
    parsedMiktar != null && !busy && (ozetQ.data?.bakiye ?? 0) >= parsedMiktar

  const confirmMessage =
    confirm === 'EKLE' && parsedMiktar != null
      ? `Bu tenant’a ${parsedMiktar.toLocaleString('tr-TR')} WhatsApp mesaj kredisi eklenecek. Onaylıyor musunuz?`
      : confirm === 'DUS' && parsedMiktar != null
        ? `Bu tenant’tan ${parsedMiktar.toLocaleString('tr-TR')} WhatsApp mesaj kredisi düşülecek. Onaylıyor musunuz?`
        : ''

  if (!props.enabled) return null

  const ozet = ozetQ.data
  const hareketler: AdminWhatsAppKrediHareket[] = hareketQ.data?.items ?? []
  const bekleyenTalepler = talepQ.data?.items ?? []

  return (
    <>
      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm">WhatsApp Mesaj Kredisi</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4">
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
          {ozetQ.isError ? (
            <AlertBox variant="danger" title="Bakiye alınamadı">
              {(ozetQ.error as Error)?.message || 'Bağlantı hatası.'}
            </AlertBox>
          ) : null}

          {ozetQ.isLoading ? (
            <p className="text-sm text-slate-500">Bakiye yükleniyor…</p>
          ) : ozet ? (
            <div className="grid gap-3 sm:grid-cols-3">
              <div className="rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Mevcut bakiye</p>
                <div className="mt-1 flex items-center gap-2">
                  <p className="text-lg font-semibold text-slate-900">
                    {ozet.bakiye.toLocaleString('tr-TR')}
                  </p>
                  {durumBadge(ozet.durum)}
                </div>
              </div>
              <div className="rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Toplam eklenen</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {ozet.toplamEklenen.toLocaleString('tr-TR')}
                </p>
              </div>
              <div className="rounded-md border border-slate-100 bg-slate-50/80 px-3 py-2">
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">Toplam kullanılan</p>
                <p className="mt-1 text-lg font-semibold text-slate-900">
                  {ozet.toplamKullanilan.toLocaleString('tr-TR')}
                </p>
              </div>
            </div>
          ) : null}

          {bekleyenTalepler.length > 0 ? (
            <div className="space-y-2 rounded-md border border-warning/30 bg-warning-soft/40 px-3 py-2.5">
              <p className="text-xs font-semibold text-slate-700">Bekleyen paket talepleri</p>
              <ul className="space-y-2">
                {bekleyenTalepler.map((t) => (
                  <li
                    key={t.id}
                    className="flex flex-wrap items-center justify-between gap-2 text-sm text-slate-800"
                  >
                    <span>
                      {t.mesajAdedi.toLocaleString('tr-TR')} mesaj —{' '}
                      {t.fiyatTL.toLocaleString('tr-TR')} TL
                      <span className="ml-2 font-mono text-xs font-semibold text-slate-700">
                        {t.paymentReference}
                      </span>
                      <span className="ml-2 text-xs text-slate-500">
                        {formatDateTimeTR(t.createdAt)}
                      </span>
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      <Button
                        type="button"
                        size="sm"
                        disabled={busy}
                        onClick={() => {
                          setBanner(null)
                          setErr(null)
                          setTalepConfirm({ id: t.id, yon: 'ONAY', row: t })
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
                          setTalepConfirm({ id: t.id, yon: 'RED', row: t })
                        }}
                      >
                        Reddet
                      </Button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="space-y-2 border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold text-slate-600">Manuel düzenleme</p>
            <div className="flex flex-wrap gap-1.5">
              {PRESETS.map((p) => (
                <Button
                  key={p}
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={busy}
                  onClick={() => {
                    setMiktar(String(p))
                    setBanner(null)
                    setErr(null)
                  }}
                >
                  +{p.toLocaleString('tr-TR')}
                </Button>
              ))}
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <label className="block space-y-1">
                <span className="text-xs font-medium text-slate-500">Miktar</span>
                <Input
                  type="number"
                  min={1}
                  step={1}
                  value={miktar}
                  disabled={busy}
                  onChange={(e) => setMiktar(e.target.value)}
                />
              </label>
              <label className="block space-y-1 sm:col-span-2">
                <span className="text-xs font-medium text-slate-500">Açıklama</span>
                <Textarea
                  rows={2}
                  value={aciklama}
                  disabled={busy}
                  placeholder="İsteğe bağlı — örn. Destek talebi #123"
                  onChange={(e) => setAciklama(e.target.value)}
                />
              </label>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                disabled={!canEkle}
                onClick={() => {
                  setBanner(null)
                  setErr(null)
                  setConfirm('EKLE')
                }}
              >
                Kredi Ekle
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={!canDus}
                onClick={() => {
                  setBanner(null)
                  setErr(null)
                  setConfirm('DUS')
                }}
              >
                Kredi Düş
              </Button>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-3">
            <p className="text-xs font-semibold text-slate-600">Son kredi hareketleri</p>
            {hareketQ.isLoading ? (
              <p className="text-sm text-slate-500">Hareketler yükleniyor…</p>
            ) : hareketler.length === 0 ? (
              <p className="text-sm text-slate-500">Henüz hareket yok.</p>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <TR>
                      <TH>Tarih</TH>
                      <TH>İşlem</TH>
                      <TH>Miktar</TH>
                      <TH>Önceki</TH>
                      <TH>Sonraki</TH>
                      <TH>Açıklama</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {hareketler.map((h) => (
                      <TR key={h.id}>
                        <TD className="whitespace-nowrap text-xs">
                          {formatDateTimeTR(h.createdAt)}
                        </TD>
                        <TD className="text-xs">{tipLabel(h.tip)}</TD>
                        <TD
                          className={`text-xs font-medium ${
                            h.miktar > 0 ? 'text-emerald-700' : h.miktar < 0 ? 'text-rose-700' : ''
                          }`}
                        >
                          {formatMiktar(h.miktar)}
                        </TD>
                        <TD className="text-xs">{h.oncekiBakiye.toLocaleString('tr-TR')}</TD>
                        <TD className="text-xs">{h.sonrakiBakiye.toLocaleString('tr-TR')}</TD>
                        <TD className="max-w-[14rem] truncate text-xs text-slate-600">
                          {h.aciklama || '—'}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            )}
          </div>
        </CardBody>
      </Card>

      <AdminConfirmDialog
        open={confirm != null}
        title={confirm === 'DUS' ? 'Kredi düş' : 'Kredi ekle'}
        message={confirmMessage}
        confirmLabel={confirm === 'DUS' ? 'Düş' : 'Ekle'}
        danger={confirm === 'DUS'}
        loading={busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          if (confirm) adjustMu.mutate(confirm)
        }}
      />

      <AdminConfirmDialog
        open={talepConfirm != null}
        title={talepConfirm?.yon === 'RED' ? 'Talebi reddet' : 'Talebi onayla'}
        message={
          talepConfirm?.yon === 'ONAY'
            ? [
                `Büro: ${talepConfirm.row.buroAdi}`,
                `Paket: ${talepConfirm.row.packageId}`,
                `Mesaj adedi: ${talepConfirm.row.mesajAdedi.toLocaleString('tr-TR')}`,
                `Tutar: ${talepConfirm.row.fiyatTL.toLocaleString('tr-TR')} TL`,
                `Ödeme Referansı: ${talepConfirm.row.paymentReference}`,
                `Talep tarihi: ${formatDateTimeTR(talepConfirm.row.createdAt)}`,
                '',
                `Bu talep onaylandığında ${talepConfirm.row.mesajAdedi.toLocaleString('tr-TR')} WhatsApp mesaj kredisi ilgili büroya eklenecek. Onaylıyor musunuz?`
              ].join('\n')
            : talepConfirm
              ? [
                  `Büro: ${talepConfirm.row.buroAdi}`,
                  `Ödeme Referansı: ${talepConfirm.row.paymentReference}`,
                  '',
                  'Bu paket talebi reddedilecek. Kredi eklenmeyecek. Onaylıyor musunuz?'
                ].join('\n')
              : ''
        }
        confirmLabel={talepConfirm?.yon === 'RED' ? 'Reddet' : 'Onayla ve Krediyi Ekle'}
        danger={talepConfirm?.yon === 'RED'}
        loading={busy}
        onCancel={() => setTalepConfirm(null)}
        onConfirm={() => {
          if (!talepConfirm) return
          if (talepConfirm.yon === 'ONAY') talepOnayMu.mutate(talepConfirm.id)
          else talepRedMu.mutate(talepConfirm.id)
        }}
      />
    </>
  )
}
