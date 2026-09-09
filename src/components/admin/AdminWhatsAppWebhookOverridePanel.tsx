import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useState } from 'react'
import {
  adminWhatsAppWebhookOverrideDisableRequest,
  adminWhatsAppWebhookOverrideEnableRequest,
  adminWhatsAppWebhookOverrideStatusRequest,
  type AdminWhatsAppWebhookOverrideStatus
} from '../../api/adminApi'
import { AdminConfirmDialog } from './AdminConfirmDialog'
import { AlertBox, Badge, Button, Card, CardBody, CardHeader, CardTitle } from '../ui'

type Props = {
  tenantId: string
  enabled: boolean
}

export function AdminWhatsAppWebhookOverridePanel(props: Props): ReactElement | null {
  const qc = useQueryClient()
  const [confirm, setConfirm] = useState<'enable' | 'disable' | null>(null)
  const [banner, setBanner] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)

  const statusQ = useQuery({
    queryKey: ['admin-wa-webhook-override', props.tenantId],
    queryFn: () => adminWhatsAppWebhookOverrideStatusRequest(props.tenantId),
    enabled: props.enabled && Boolean(props.tenantId),
    retry: false
  })

  const enableMu = useMutation({
    mutationFn: () => adminWhatsAppWebhookOverrideEnableRequest(props.tenantId),
    onSuccess: (data) => {
      setBanner('MK webhook yönlendirmesi etkinleştirildi (Graph doğrulandı).')
      setErr(null)
      void qc.setQueryData(['admin-wa-webhook-override', props.tenantId], data)
    },
    onError: (e: Error) => setErr(e.message || 'Etkinleştirme başarısız.'),
    onSettled: () => setConfirm(null)
  })

  const disableMu = useMutation({
    mutationFn: () => adminWhatsAppWebhookOverrideDisableRequest(props.tenantId),
    onSuccess: (data) => {
      setBanner('MK webhook yönlendirmesi kapatıldı; App callback’ine düşer.')
      setErr(null)
      void qc.setQueryData(['admin-wa-webhook-override', props.tenantId], data)
    },
    onError: (e: Error) => setErr(e.message || 'Devre dışı bırakma başarısız.'),
    onSettled: () => setConfirm(null)
  })

  if (!props.enabled) return null

  const st = statusQ.data as AdminWhatsAppWebhookOverrideStatus | undefined
  const busy = enableMu.isPending || disableMu.isPending
  const mkActive = st?.uiDurum === 'MK_YA_YONLENDIRILIYOR'

  return (
    <>
      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm">WhatsApp webhook override (teşhis)</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          <p className="text-xs text-slate-500">
            Yalnızca bu tenant’ın kayıtlı WABA’sı için WABA-level callback override. Meta App global
            callback değiştirilmez. Production’da dikkatli kullanın.
          </p>
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
          {statusQ.isError ? (
            <AlertBox variant="danger" title="Durum alınamadı">
              {(statusQ.error as Error)?.message || 'Bağlantı olmayabilir.'}
            </AlertBox>
          ) : null}
          {statusQ.isLoading ? (
            <p className="text-sm text-slate-500">Durum yükleniyor…</p>
          ) : st ? (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Webhook override durumu:</span>
                <Badge variant={mkActive ? 'success' : 'default'}>{st.uiLabel}</Badge>
              </div>
              <dl className="space-y-1 text-xs text-slate-600">
                <div>
                  WABA: <span className="font-mono">{st.wabaIdMasked ?? '—'}</span>
                </div>
                <div>
                  Phone: <span className="font-mono">{st.phoneNumberIdMasked ?? '—'}</span>
                  {st.displayPhoneNumber ? ` · ${st.displayPhoneNumber}` : ''}
                </div>
                <div>MK hedef: {st.mkCallbackHostPath ?? '— (env eksik)'}</div>
                <div>
                  Son webhook:{' '}
                  {st.lastWebhookAt ? new Date(st.lastWebhookAt).toLocaleString('tr-TR') : '—'}
                </div>
              </dl>
              <div className="flex flex-wrap gap-2 pt-1">
                <Button
                  type="button"
                  size="sm"
                  disabled={busy || mkActive || !st.mkCallbackUrlConfigured}
                  onClick={() => {
                    setBanner(null)
                    setErr(null)
                    setConfirm('enable')
                  }}
                >
                  MK Webhook&apos;unu Etkinleştir
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  disabled={busy || !mkActive}
                  onClick={() => {
                    setBanner(null)
                    setErr(null)
                    setConfirm('disable')
                  }}
                >
                  MK Webhook&apos;unu Devre Dışı Bırak
                </Button>
              </div>
            </>
          ) : null}
        </CardBody>
      </Card>

      <AdminConfirmDialog
        open={confirm === 'enable'}
        title="MK webhook yönlendirmesini etkinleştir?"
        message="Bu WABA’nın messages status event’leri Müvekkil Kasası webhook URL’sine gidecek. Aynı WABA’yı App callback üzerinden dinleyen diğer entegrasyonlar bu hattın status’unu kaybedebilir. App global callback değişmez."
        confirmLabel="Etkinleştir"
        loading={enableMu.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => enableMu.mutate()}
      />
      <AdminConfirmDialog
        open={confirm === 'disable'}
        title="MK webhook yönlendirmesini kapat?"
        message="WABA alternate callback kaldırılır; event’ler Meta App Dashboard callback’ine döner. App global URL değiştirilmez."
        confirmLabel="Devre dışı bırak"
        danger
        loading={disableMu.isPending}
        onCancel={() => setConfirm(null)}
        onConfirm={() => disableMu.mutate()}
      />
    </>
  )
}
