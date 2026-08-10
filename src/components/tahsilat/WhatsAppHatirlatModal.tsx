import { useMutation, useQueryClient } from '@tanstack/react-query'

import type { ReactElement } from 'react'

import { useEffect, useState } from 'react'

import { useNavigate } from 'react-router-dom'

import { invalidateTahsilatBildirim, markBildirimJobGonderildi } from '../../api/tahsilatBildirim'

import { prepareManualWhatsApp, previewManualWhatsApp } from '../../api/tahsilatMerkezi'

import { friendlyClientErrorMessage } from '../../api/client'

import { APP_BASE } from '../../config/appPaths'

import { useToast } from '../../toast'

import { AlertBox, Button, ModalScrim } from '../ui'

import type { TahsilatMerkeziSatirDto } from '../../types/tahsilatMerkezi'



type Props = {

  row: TahsilatMerkeziSatirDto

  onClose: () => void

}



export function WhatsAppHatirlatModal({ row, onClose }: Props): ReactElement {

  const toast = useToast()

  const navigate = useNavigate()

  const qc = useQueryClient()

  const [mesaj, setMesaj] = useState('')

  const [telefonMaskeli, setTelefonMaskeli] = useState<string | null>(null)

  const [telefonGecerli, setTelefonGecerli] = useState(true)

  const [loadingPreview, setLoadingPreview] = useState(true)

  const [muvekkilAdi, setMuvekkilAdi] = useState(row.muvekkilAd)

  const [jobId, setJobId] = useState<string | null>(null)

  const [whatsappAcildi, setWhatsappAcildi] = useState(false)



  useEffect(() => {

    let cancelled = false

    setLoadingPreview(true)

    void previewManualWhatsApp(row.id)

      .then((p) => {

        if (cancelled) return

        setMesaj(p.mesaj)

        setTelefonMaskeli(p.telefonMaskeli)

        setTelefonGecerli(p.telefonGecerli)

        setMuvekkilAdi(p.muvekkilAdi)

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



  const prepareMu = useMutation({

    mutationFn: () =>

      prepareManualWhatsApp(row.id, {

        mesaj,

        idempotencyKey: `ui-wa-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`

      }),

    onSuccess: (res) => {

      if (!res.deepLinkUrl) {

        toast.error('WhatsApp bağlantısı oluşturulamadı.')

        return

      }

      window.open(res.deepLinkUrl, '_blank', 'noopener,noreferrer')

      if (res.jobId) setJobId(res.jobId)

      setWhatsappAcildi(true)

      invalidateTahsilatBildirim(qc)

      toast.success('WhatsApp açıldı. Mesajı kontrol edip gönderebilirsiniz.')

    },

    onError: (e) => {

      const msg = friendlyClientErrorMessage(e, 'WhatsApp hazırlanamadı.')

      if (/telefon|INVALID_PHONE/i.test(msg)) {

        toast.warning('Bu müvekkilin telefon numarası kayıtlı değil.')

        onClose()

        navigate(`${APP_BASE}/muvekkil/${row.muvekkilId}`)

        return

      }

      toast.error(msg)

    }

  })



  const markMu = useMutation({

    mutationFn: () => {

      if (!jobId) throw new Error('Önce WhatsApp\'ı açın.')

      return markBildirimJobGonderildi(jobId)

    },

    onSuccess: () => {

      toast.success('Gönderildi olarak işaretlendi.')

      invalidateTahsilatBildirim(qc)

      onClose()

    },

    onError: (e) => {

      toast.error(friendlyClientErrorMessage(e, 'Kayıt güncellenemedi.'))

    }

  })



  return (

    <ModalScrim onClose={onClose} wide innerAsDialog>

      <div className="mx-auto w-full max-w-lg rounded-xl border border-border bg-panel p-5 shadow-xl">

        <div className="mb-4 flex items-start justify-between gap-2">

          <h2 className="text-base font-bold text-ink">WhatsApp Hatırlatması</h2>

          <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0" onClick={onClose}>

            ✕

          </Button>

        </div>

        <div className="space-y-3">

          <AlertBox variant="info" title="Bilgi">

            Hatırlatma mesajları program tarafından hazırlanır. Gönderim, sizin WhatsApp hesabınız üzerinden

            tamamlanır.

          </AlertBox>

          {loadingPreview ? (

            <p className="text-sm text-ink-muted">Önizleme hazırlanıyor…</p>

          ) : (

            <>

              <div className="grid gap-1 text-xs text-ink-muted">

                <p>

                  <strong className="text-ink">Alıcı:</strong> {muvekkilAdi}

                </p>

                <p>

                  <strong className="text-ink">Telefon:</strong>{' '}

                  {telefonMaskeli ?? (telefonGecerli ? '—' : 'Kayıtlı değil')}

                </p>

              </div>

              {!telefonGecerli ? (

                <AlertBox variant="warning" title="Telefon gerekli">

                  Bu müvekkilin telefon numarası kayıtlı değil.

                </AlertBox>

              ) : null}

              <label className="block">

                <span className="mb-1 block text-xs font-semibold text-ink-muted">Mesaj metni</span>

                <textarea

                  className="min-h-[140px] w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 dark:bg-surface-elevated"

                  value={mesaj}

                  onChange={(e) => setMesaj(e.target.value)}

                />

              </label>

              <div className="flex flex-wrap justify-end gap-2 pt-1">

                <Button type="button" variant="outline" onClick={onClose} disabled={prepareMu.isPending || markMu.isPending}>

                  {whatsappAcildi ? 'Kapat' : 'İptal'}

                </Button>

                {whatsappAcildi && jobId ? (

                  <Button type="button" variant="outline" onClick={() => markMu.mutate()} disabled={markMu.isPending}>

                    {markMu.isPending ? 'Kaydediliyor…' : 'Gönderildi olarak işaretle'}

                  </Button>

                ) : null}

                <Button

                  type="button"

                  onClick={() => prepareMu.mutate()}

                  disabled={prepareMu.isPending || !mesaj.trim() || !telefonGecerli}

                >

                  {prepareMu.isPending ? 'Açılıyor…' : "WhatsApp'ta Aç"}

                </Button>

              </div>

            </>

          )}

        </div>

      </div>

    </ModalScrim>

  )

}

