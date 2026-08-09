import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import {
  invalidateTahsilatBildirim,
  markBildirimJobGonderildi,
  openBildirimJobWhatsApp
} from '../../api/tahsilatBildirim'
import { friendlyClientErrorMessage } from '../../api/client'
import { tableActionLinkAccentClass, tableActionsFlexRow } from '../ui'
import { useToast } from '../../toast'
import type { BildirimIsDurumu, TahsilatBildirimIsiDto } from '../../types/tahsilatBildirim'

const PENDING_STATUSES: BildirimIsDurumu[] = ['PLANLANDI', 'KUYRUKTA', 'SIMULASYON_TAMAMLANDI']

function canOpenWhatsApp(durum: BildirimIsDurumu): boolean {
  return PENDING_STATUSES.includes(durum)
}

function canMarkSent(durum: BildirimIsDurumu): boolean {
  return PENDING_STATUSES.includes(durum)
}

type Props = {
  row: TahsilatBildirimIsiDto
  onStatusChange?: (durum: BildirimIsDurumu) => void
}

export function BildirimJobWhatsAppActions({ row, onStatusChange }: Props): ReactElement | null {
  const toast = useToast()
  const qc = useQueryClient()

  const openMu = useMutation({
    mutationFn: () => openBildirimJobWhatsApp(row.id),
    onSuccess: (res) => {
      if (!res.deepLinkUrl) {
        toast.error('WhatsApp bağlantısı oluşturulamadı.')
        return
      }
      window.open(res.deepLinkUrl, '_blank', 'noopener,noreferrer')
      toast.success('WhatsApp açıldı. Mesajı kontrol edip gönderebilirsiniz.')
      invalidateTahsilatBildirim(qc)
      if (res.durum) onStatusChange?.(res.durum as BildirimIsDurumu)
    },
    onError: (err) => {
      const msg = friendlyClientErrorMessage(err, 'WhatsApp açılamadı.')
      if (/telefon|INVALID_PHONE/i.test(msg)) {
        toast.warning('Bu müvekkilin telefon numarası kayıtlı değil.')
        return
      }
      toast.error(msg)
    }
  })

  const markMu = useMutation({
    mutationFn: () => markBildirimJobGonderildi(row.id),
    onSuccess: (res) => {
      toast.success('Gönderildi olarak işaretlendi.')
      invalidateTahsilatBildirim(qc)
      if (res.durum) onStatusChange?.(res.durum as BildirimIsDurumu)
    },
    onError: (err) => {
      toast.error(friendlyClientErrorMessage(err, 'Kayıt güncellenemedi.'))
    }
  })

  if (!canOpenWhatsApp(row.durum) && !canMarkSent(row.durum)) {
    return null
  }

  return (
    <div className={tableActionsFlexRow}>
      {canOpenWhatsApp(row.durum) ? (
        <button
          type="button"
          className={tableActionLinkAccentClass}
          disabled={openMu.isPending || markMu.isPending}
          onClick={() => openMu.mutate()}
        >
          {openMu.isPending ? 'Açılıyor…' : "WhatsApp'ta Aç"}
        </button>
      ) : null}
      {canMarkSent(row.durum) ? (
        <button
          type="button"
          className={tableActionLinkAccentClass}
          disabled={openMu.isPending || markMu.isPending}
          onClick={() => markMu.mutate()}
        >
          {markMu.isPending ? 'Kaydediliyor…' : 'Gönderildi olarak işaretle'}
        </button>
      ) : null}
    </div>
  )
}
