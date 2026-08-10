import { useMutation } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { previewManualSms, sendManualSms } from '../../api/tahsilatMerkezi'
import { APP_BASE } from '../../config/appPaths'
import { useToast } from '../../toast'
import { AlertBox, Button, ModalScrim } from '../ui'
import type { TahsilatMerkeziSatirDto } from '../../types/tahsilatMerkezi'

type Props = {
  row: TahsilatMerkeziSatirDto
  onClose: () => void
}

export function SmsHatirlatModal({ row, onClose }: Props): ReactElement {
  const toast = useToast()
  const navigate = useNavigate()
  const [mesaj, setMesaj] = useState('')
  const [telefonMaskeli, setTelefonMaskeli] = useState<string | null>(null)
  const [loadingPreview, setLoadingPreview] = useState(true)
  const [muvekkilAdi, setMuvekkilAdi] = useState(row.muvekkilAd)
  const [smsParca, setSmsParca] = useState(1)
  const [bakiye, setBakiye] = useState(0)
  const [testModu, setTestModu] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoadingPreview(true)
    void previewManualSms(row.id)
      .then((p) => {
        if (cancelled) return
        setMesaj(p.mesaj)
        setTelefonMaskeli(p.telefonMaskeli)
        setMuvekkilAdi(p.muvekkilAdi)
        setSmsParca(p.smsParcaSayisi)
        setBakiye(p.bakiye)
        setTestModu(p.testModu)
      })
      .catch((e) => {
        if (!cancelled) toast.error(e instanceof Error ? e.message : 'Önizleme alınamadı.')
      })
      .finally(() => {
        if (!cancelled) setLoadingPreview(false)
      })
    return () => {
      cancelled = true
    }
  }, [row.id, toast])

  const sendMu = useMutation({
    mutationFn: () =>
      sendManualSms(row.id, {
        mesaj,
        idempotencyKey: `ui-sms-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      }),
    onSuccess: (res) => {
      if (res.status === 'FAILED') {
        toast.error(res.message ?? 'SMS gönderilemedi.')
        return
      }
      toast.success(testModu ? 'SMS test modunda simüle edildi.' : 'SMS gönderildi.')
      onClose()
    },
    onError: (e) => {
      const msg = e instanceof Error ? e.message : 'SMS gönderilemedi.'
      if (/telefon|INVALID_PHONE/i.test(msg)) {
        toast.warning(msg)
        onClose()
        navigate(`${APP_BASE}/muvekkil/${row.muvekkilId}`)
        return
      }
      toast.error(msg)
    }
  })

  return (
    <ModalScrim onClose={onClose} wide innerAsDialog>
      <div className="mx-auto w-full max-w-lg rounded-xl border border-border bg-panel p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-2">
          <h2 className="text-base font-bold text-ink">SMS Gönder</h2>
          <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0" onClick={onClose}>
            ✕
          </Button>
        </div>

        {loadingPreview ? (
          <p className="text-sm text-ink-muted">Önizleme hazırlanıyor…</p>
        ) : (
          <>
            <p className="mb-3 text-sm text-ink-muted">
              <strong className="text-ink">{muvekkilAdi}</strong>
              {telefonMaskeli ? ` · ${telefonMaskeli}` : ' · Telefon yok'}
            </p>
            {testModu ? (
              <AlertBox variant="info" title="Test modu" className="mb-3">
                Gerçek SMS gönderilmez; kredi simüle edilir.
              </AlertBox>
            ) : null}
            <label className="mb-1 block text-xs font-semibold text-ink-muted">Mesaj</label>
            <textarea
              className="mb-2 min-h-[120px] w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink dark:bg-surface-elevated"
              value={mesaj}
              onChange={(e) => setMesaj(e.target.value)}
            />
            <p className="mb-4 text-xs text-ink-muted">
              Tahmini kredi: {smsParca} · Mevcut bakiye: {bakiye}
            </p>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose} disabled={sendMu.isPending}>
                Vazgeç
              </Button>
              <Button
                type="button"
                disabled={sendMu.isPending || !mesaj.trim() || !telefonMaskeli}
                onClick={() => void sendMu.mutate()}
              >
                {sendMu.isPending ? 'Gönderiliyor…' : 'SMS Gönder'}
              </Button>
            </div>
          </>
        )}
      </div>
    </ModalScrim>
  )
}
