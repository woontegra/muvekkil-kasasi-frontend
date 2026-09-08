import { useMutation, useQuery } from '@tanstack/react-query'
import { useEffect, useState, type ReactElement } from 'react'
import {
  getKuralTestOnizleme,
  listKuralTestAdayTaksitler,
  sendKuralTestGonder
} from '../../../api/tahsilatBildirim'
import { friendlyClientErrorMessage } from '../../../api/client'
import { bildirimKuralTuruLabel, type BildirimKuralTuru } from '../../../types/tahsilatBildirim'
import { useToast } from '../../../toast'
import { AlertBox, Button, Input, ModalScrim, useConfirm } from '../../ui'

type Props = {
  kuralId: string
  kuralTuru: BildirimKuralTuru
  onClose: () => void
}

export function KuralWhatsappTestModal(props: Props): ReactElement {
  const toast = useToast()
  const { confirm } = useConfirm()
  const [q, setQ] = useState('')
  const [taksitId, setTaksitId] = useState('')
  const [testTelefon, setTestTelefon] = useState('')
  const [result, setResult] = useState<{
    ok: boolean
    message: string
    providerMessageId?: string | null
    durum?: string
    deliveryLabel?: string | null
    errorCode?: string | null
    webhook?: {
      statusRaw?: string | null
      errorCode?: string | null
      received?: boolean
      overrideActive?: boolean | null
      hasOverrideCallback?: boolean | null
      lastWebhookAt?: string | null
    } | null
    metaError?: {
      httpStatus?: number | null
      message?: string | null
      type?: string | null
      code?: number | string | null
      error_subcode?: number | null
      error_user_title?: string | null
      error_user_msg?: string | null
      details?: string | null
      fbtrace_id?: string | null
    } | null
  } | null>(null)

  const adayQ = useQuery({
    queryKey: ['kural-test-aday', q],
    queryFn: () => listKuralTestAdayTaksitler(q || undefined)
  })

  const onizlemeQ = useQuery({
    queryKey: ['kural-test-onizleme', props.kuralId, taksitId],
    queryFn: () => getKuralTestOnizleme(props.kuralId, taksitId),
    enabled: Boolean(taksitId)
  })

  useEffect(() => {
    setResult(null)
  }, [taksitId, testTelefon])

  const sendMu = useMutation({
    mutationFn: () =>
      sendKuralTestGonder(props.kuralId, {
        taksitId,
        testTelefon,
        confirm: true
      }),
    onSuccess: (res) => {
      const delivered = res.deliveryLabel === 'TESLIM_EDILDI' || res.durum === 'TESLIM_EDILDI' || res.durum === 'OKUNDU'
      setResult({
        ok: Boolean(res.ok),
        message:
          res.message ??
          (res.ok
            ? delivered
              ? 'Teslim edildi.'
              : 'Meta kabul etti (wamid alındı).'
            : 'Gönderilemedi.'),
        providerMessageId: res.providerMessageId,
        durum: res.durum,
        deliveryLabel: res.deliveryLabel ?? (delivered ? 'TESLIM_EDILDI' : res.ok ? 'META_KABUL' : null),
        errorCode: res.errorCode,
        webhook: res.webhook ?? null,
        metaError: res.metaError ?? null
      })
      if (res.ok) {
        toast.success(
          delivered
            ? 'Teslim edildi.'
            : res.idempotent
              ? 'Meta kabul etti (önceki test; tekrar yok).'
              : 'Meta kabul etti.'
        )
      } else {
        toast.error(res.message || 'Test mesajı gönderilemedi.')
      }
    },
    onError: (err) => {
      toast.error(friendlyClientErrorMessage(err, 'Test mesajı gönderilemedi.'))
    }
  })

  const handleSend = async (): Promise<void> => {
    if (!taksitId) {
      toast.error('Test için bir taksit seçin.')
      return
    }
    if (testTelefon.trim().length < 10) {
      toast.error('Test telefonu girin.')
      return
    }
    if (onizlemeQ.data && onizlemeQ.data.templateHazir === false) {
      toast.error('Onaylı şablon hazır değil. Önce kurala şablon atayın.')
      return
    }
    const ok = await confirm({
      title: 'Test mesajını göndermek istiyor musunuz?',
      message:
        'Gerçek Meta şablonu, seçtiğiniz test telefonuna gönderilir. Vade günü ve 10:00–20:00 şartı bu testte bilinçli olarak geçilir. Normal otomasyon etkilenmez.',
      confirmLabel: 'Test mesajını gönder',
      cancelLabel: 'Vazgeç'
    })
    if (!ok) return
    sendMu.mutate()
  }

  const items = adayQ.data?.items ?? []
  const onizleme = onizlemeQ.data

  return (
    <ModalScrim onClose={props.onClose} wide>
      <div className="rounded-xl border border-border bg-white p-5 shadow-xl">
        <h2 className="text-base font-bold text-ink">Şimdi test mesajı gönder</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Kural: <strong>{bildirimKuralTuruLabel(props.kuralTuru)}</strong>. Mesaj girdiğiniz test
          telefonuna gider.
        </p>

        <div className="mt-4 space-y-3">
          <Input
            label="Taksit ara"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Müvekkil veya dosya adı"
          />

          <div>
            <label className="text-xs font-semibold text-ink-muted">Test edilecek taksit</label>
            <select
              className="mt-1 w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink"
              value={taksitId}
              onChange={(e) => setTaksitId(e.target.value)}
              disabled={adayQ.isLoading}
            >
              <option value="">Seçin…</option>
              {items.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>
            {adayQ.isError ? (
              <p className="mt-1 text-xs text-danger">
                {friendlyClientErrorMessage(adayQ.error, 'Taksit listesi alınamadı.')}
              </p>
            ) : null}
          </div>

          <Input
            label="Test telefonu"
            value={testTelefon}
            onChange={(e) => setTestTelefon(e.target.value)}
            placeholder="05xx xxx xx xx"
            hint="Müvekkil telefonu kullanılmaz; yalnızca bu numara."
          />

          {taksitId && onizlemeQ.isLoading ? (
            <p className="text-sm text-ink-muted">Önizleme yükleniyor…</p>
          ) : null}
          {onizlemeQ.isError ? (
            <AlertBox variant="warning" title="Önizleme alınamadı">
              {friendlyClientErrorMessage(onizlemeQ.error)}
            </AlertBox>
          ) : null}

          {onizleme ? (
            <div className="space-y-3 rounded-lg border border-border bg-surface-muted/20 p-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Meta şablon</p>
                <p className="mt-1 text-sm text-ink">
                  {onizleme.metaSablon
                    ? `${onizleme.metaSablon.metaName} (${onizleme.metaSablon.language}) — ${onizleme.metaSablon.statusNormalized}`
                    : 'Şablon atanmamış'}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Değişkenler</p>
                <dl className="mt-1 grid gap-1 text-sm sm:grid-cols-2">
                  {Object.entries(onizleme.degiskenler ?? {}).map(([k, v]) => (
                    <div key={k} className="flex gap-2">
                      <dt className="text-ink-muted">{k}:</dt>
                      <dd className="font-medium text-ink">{String(v)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
                  Gönderilecek metin (önizleme)
                </p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
                  {onizleme.onizlemeMetin ?? 'Önizleme üretilemedi.'}
                </p>
              </div>
              {!onizleme.templateHazir ? (
                <AlertBox variant="warning" title="Şablon hazır değil">
                  Onaylı Meta şablonu veya değişken eşlemesi eksik. Test gönderimi başarısız olabilir.
                </AlertBox>
              ) : null}
              <ul className="list-disc space-y-1 pl-5 text-xs text-ink-muted">
                {(onizleme.notlar ?? []).map((n) => (
                  <li key={n}>{n}</li>
                ))}
              </ul>
            </div>
          ) : null}

          {result ? (
            <AlertBox
              variant={result.ok ? 'success' : 'danger'}
              title={
                result.ok
                  ? result.deliveryLabel === 'TESLIM_EDILDI'
                    ? 'Teslim edildi'
                    : 'Meta kabul etti'
                  : 'Gönderilemedi'
              }
            >
              <p>{result.message}</p>
              {result.providerMessageId ? (
                <p className="mt-1 font-mono text-xs">wamid: {result.providerMessageId}</p>
              ) : null}
              {result.durum ? <p className="mt-1 text-xs">Kayıt durumu: {result.durum}</p> : null}
              {result.ok && result.deliveryLabel !== 'TESLIM_EDILDI' ? (
                <p className="mt-2 text-xs text-ink-muted">
                  Bu aşama yalnızca Meta’nın send API kabulünü gösterir. “Teslim edildi” yalnızca
                  webhook <code>delivered</code> geldikten sonra yazılır.
                </p>
              ) : null}
              {result.ok && result.webhook ? (
                <dl className="mt-2 grid gap-1 border-t border-border/60 pt-2 text-xs text-ink-muted sm:grid-cols-2">
                  <dt>Webhook status</dt>
                  <dd>
                    {result.webhook.received
                      ? result.webhook.statusRaw || 'alındı'
                      : 'Bu wamid için status kaydı yok'}
                  </dd>
                  {result.webhook.errorCode ? (
                    <>
                      <dt>Webhook hata kodu</dt>
                      <dd className="font-mono">{result.webhook.errorCode}</dd>
                    </>
                  ) : null}
                  {result.webhook.overrideActive != null ? (
                    <>
                      <dt>WABA override</dt>
                      <dd>{result.webhook.overrideActive ? 'aktif' : 'pasif / yok'}</dd>
                    </>
                  ) : null}
                </dl>
              ) : null}
              {!result.ok && result.metaError ? (
                <dl className="mt-2 grid gap-1 border-t border-border/60 pt-2 font-mono text-[11px] text-ink-muted sm:grid-cols-2">
                  {result.metaError.httpStatus != null ? (
                    <>
                      <dt>httpStatus</dt>
                      <dd>{String(result.metaError.httpStatus)}</dd>
                    </>
                  ) : null}
                  {result.metaError.message ? (
                    <>
                      <dt>message</dt>
                      <dd className="break-words whitespace-pre-wrap">{result.metaError.message}</dd>
                    </>
                  ) : null}
                  {result.metaError.type ? (
                    <>
                      <dt>type</dt>
                      <dd>{result.metaError.type}</dd>
                    </>
                  ) : null}
                  {result.metaError.code != null ? (
                    <>
                      <dt>code</dt>
                      <dd>{String(result.metaError.code)}</dd>
                    </>
                  ) : null}
                  {result.metaError.error_subcode != null ? (
                    <>
                      <dt>error_subcode</dt>
                      <dd>{String(result.metaError.error_subcode)}</dd>
                    </>
                  ) : null}
                  {result.metaError.error_user_title ? (
                    <>
                      <dt>error_user_title</dt>
                      <dd>{result.metaError.error_user_title}</dd>
                    </>
                  ) : null}
                  {result.metaError.error_user_msg ? (
                    <>
                      <dt>error_user_msg</dt>
                      <dd className="break-words whitespace-pre-wrap">{result.metaError.error_user_msg}</dd>
                    </>
                  ) : null}
                  {result.metaError.details ? (
                    <>
                      <dt>error_data.details</dt>
                      <dd className="break-words whitespace-pre-wrap">{result.metaError.details}</dd>
                    </>
                  ) : null}
                  {result.metaError.fbtrace_id ? (
                    <>
                      <dt>fbtrace_id</dt>
                      <dd>{result.metaError.fbtrace_id}</dd>
                    </>
                  ) : null}
                </dl>
              ) : null}
              {!result.ok && result.errorCode && !result.metaError ? (
                <p className="mt-1 font-mono text-xs">Kod: {result.errorCode}</p>
              ) : null}
              {!result.ok ? (
                <p className="mt-2 text-xs text-ink-muted">
                  Başarısız test aynı kural/taksit/telefon ile tekrar denenebilir.
                </p>
              ) : null}
            </AlertBox>
          ) : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={props.onClose} disabled={sendMu.isPending}>
            Kapat
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={sendMu.isPending || !taksitId || !testTelefon.trim() || Boolean(result?.ok)}
            onClick={() => void handleSend()}
          >
            {sendMu.isPending ? 'Gönderiliyor…' : 'Test mesajını gönder'}
          </Button>
        </div>
      </div>
    </ModalScrim>
  )
}
