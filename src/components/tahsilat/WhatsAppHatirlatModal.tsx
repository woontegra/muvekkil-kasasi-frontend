import type { ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getMuvekkil } from '../../api/muvekkiller'
import { APP_BASE } from '../../config/appPaths'
import { buildWhatsAppWebUrl, normalizeTurkiyePhoneForWhatsApp } from '../../lib/whatsapp'
import { useToast } from '../../toast'
import { AlertBox, Button, ModalScrim } from '../ui'
import { formatCurrencyTR, formatDateTR } from '../../utils/formatters'
import type { TahsilatMerkeziSatirDto } from '../../types/tahsilatMerkezi'

type Props = {
  row: TahsilatMerkeziSatirDto
  buroAdi: string
  onClose: () => void
}

function buildDefaultMessage(row: TahsilatMerkeziSatirDto, buroAdi: string): string {
  const dosyaBilgisi = row.dosyaNo ? `${row.dosyaBaslik} (${row.dosyaNo})` : row.dosyaBaslik
  const vade = formatDateTR(`${row.vadeTarihi}T12:00:00.000Z`)
  const kalan = formatCurrencyTR(Number(row.kalanTutar))
  return `Sayın ${row.muvekkilAd}, ${dosyaBilgisi} kapsamında ${vade} vadeli vekalet ücreti taksidinizden kalan ${kalan} bulunmaktadır. Bilginize sunarız. ${buroAdi}`
}

export function WhatsAppHatirlatModal({ row, buroAdi, onClose }: Props): ReactElement {
  const toast = useToast()
  const navigate = useNavigate()
  const [mesaj, setMesaj] = useState(() => buildDefaultMessage(row, buroAdi))
  const [sending, setSending] = useState(false)

  // Satır kimliği / ilgili alanlar değişince sıfırla; her render'da yeni row nesnesi yazmayı ezmesin.
  useEffect(() => {
    setMesaj(buildDefaultMessage(row, buroAdi))
    // row alanları aşağıda tek tek; `row` nesnesinin kendisi dependency değil.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    row.id,
    row.muvekkilId,
    row.muvekkilAd,
    row.dosyaBaslik,
    row.dosyaNo,
    row.vadeTarihi,
    row.kalanTutar,
    buroAdi
  ])

  const handleSend = async (): Promise<void> => {
    if (!row.muvekkilTelefonVar) {
      toast.warning('Müvekkil telefon numarası kayıtlı değil. İletişim bilgilerini güncelleyin.')
      onClose()
      navigate(`${APP_BASE}/muvekkil/${row.muvekkilId}`)
      return
    }

    setSending(true)
    try {
      const res = await getMuvekkil(row.muvekkilId)
      const telefon = res.telefon?.trim() ?? ''
      const normalized = telefon ? normalizeTurkiyePhoneForWhatsApp(telefon) : null
      if (!normalized) {
        toast.warning('Geçerli bir Türkiye cep telefonu bulunamadı. Müvekkil iletişim bilgilerini güncelleyin.')
        onClose()
        navigate(`${APP_BASE}/muvekkil/${row.muvekkilId}`)
        return
      }
      const url = buildWhatsAppWebUrl(normalized, mesaj.trim())
      window.open(url, '_blank', 'noopener,noreferrer')
      onClose()
    } catch {
      toast.error('Müvekkil bilgisi alınamadı.')
    } finally {
      setSending(false)
    }
  }

  return (
    <ModalScrim onClose={onClose} wide align="top" innerAsDialog>
      <div className="w-full max-w-lg rounded-xl border border-border bg-panel p-5 shadow-xl">
        <div className="mb-4 flex items-start justify-between gap-2">
          <h2 className="text-base font-bold text-ink">WhatsApp hatırlatma</h2>
          <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0" onClick={onClose}>
            ✕
          </Button>
        </div>
        <div className="space-y-3">
          <AlertBox variant="info" title="Bilgi">
            Mesaj otomatik gönderilmez; WhatsApp açıldığında içeriği kontrol edip siz gönderirsiniz.
          </AlertBox>
          <p className="text-xs text-ink-muted">
            Alıcı: <strong className="text-ink">{row.muvekkilAd}</strong>
            {row.muvekkilTelefonVar ? null : (
              <span className="ml-1 text-warning-ink">(telefon kayıtlı değil)</span>
            )}
          </p>
          <label className="block">
            <span className="mb-1 block text-xs font-semibold text-ink-muted">Mesaj metni</span>
            <textarea
              className="min-h-[140px] w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/25 dark:bg-surface-elevated"
              value={mesaj}
              onChange={(e) => setMesaj(e.target.value)}
            />
          </label>
          <div className="flex justify-end gap-2 pt-1">
            <Button type="button" variant="outline" onClick={onClose} disabled={sending}>
              Vazgeç
            </Button>
            <Button type="button" onClick={() => void handleSend()} disabled={sending || !mesaj.trim()}>
              {sending ? 'Hazırlanıyor…' : "WhatsApp'ta Aç"}
            </Button>
          </div>
        </div>
      </div>
    </ModalScrim>
  )
}
