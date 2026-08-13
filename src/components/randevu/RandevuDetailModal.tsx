import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { deleteRandevu, RANDEVULAR_QUERY_KEY } from '../../api/randevular'
import { getRandevuHatirlatmaPlan } from '../../api/bildirimPlan'
import { APP_BASE } from '../../config/appPaths'
import { formatDateTRLong, formatTimeTR } from '../../lib/randevuCalendar'
import type { RandevuDto } from '../../types/randevu'
import { useToast } from '../../toast'
import { Button, ModalScrim, useConfirm } from '../ui'
import {
  IconCalendar,
  IconClock,
  RANDEVU_DETAIL_MODAL_WIDTH,
  RandevuDetailField,
  RandevuModalBody,
  RandevuModalFooter,
  RandevuModalHeader,
  RandevuModalMetaItem,
  RandevuModalPanel
} from './RandevuModalChrome'

type Props = {
  randevu: RandevuDto
  onClose: () => void
  onEdit: () => void
  onDeleted: () => void
}

export function RandevuDetailModal({ randevu, onClose, onEdit, onDeleted }: Props): ReactElement {
  const toast = useToast()
  const { confirm } = useConfirm()
  const queryClient = useQueryClient()

  const planQ = useQuery({
    queryKey: ['randevu-hatirlatma-plan', randevu.id],
    queryFn: () => getRandevuHatirlatmaPlan(randevu.id)
  })

  const deleteMu = useMutation({
    mutationFn: () => deleteRandevu(randevu.id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: RANDEVULAR_QUERY_KEY })
      toast.success('Randevu silindi.')
      onDeleted()
      onClose()
    },
    onError: () => {
      toast.error('Randevu silinemedi.')
    }
  })

  async function handleDelete(): Promise<void> {
    const ok = await confirm({
      title: 'Randevuyu sil',
      message: 'Bu randevuyu silmek istediğinize emin misiniz?',
      confirmLabel: 'Sil',
      danger: true
    })
    if (ok) deleteMu.mutate()
  }

  const start = new Date(randevu.baslangicAt)
  const dateLabel = Number.isNaN(start.getTime()) ? '—' : formatDateTRLong(start)
  const aciklama = randevu.aciklama?.trim()

  return (
    <ModalScrim onClose={onClose} draggable={false} innerAsDialog innerClassName={RANDEVU_DETAIL_MODAL_WIDTH}>
      <RandevuModalPanel>
        <RandevuModalHeader
          title={randevu.baslik}
          meta={
            <>
              <RandevuModalMetaItem icon={<IconCalendar />}>{dateLabel}</RandevuModalMetaItem>
              <RandevuModalMetaItem icon={<IconClock />}>
                {formatTimeTR(randevu.baslangicAt)} – {formatTimeTR(randevu.bitisAt)}
              </RandevuModalMetaItem>
            </>
          }
        />

        <RandevuModalBody className="space-y-5">
          <dl className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
            <RandevuDetailField label="Müvekkil">
              {randevu.muvekkilId && randevu.muvekkilAd ? (
                <Link to={`${APP_BASE}/muvekkil/${randevu.muvekkilId}`} className="text-primary hover:underline">
                  {randevu.muvekkilAd}
                </Link>
              ) : (
                '—'
              )}
            </RandevuDetailField>
            <RandevuDetailField label="Dosya">
              {randevu.dosyaId && randevu.dosyaBaslik && randevu.muvekkilId ? (
                <Link
                  to={`${APP_BASE}/muvekkil/${randevu.muvekkilId}/dosya/${randevu.dosyaId}`}
                  className="text-primary hover:underline"
                >
                  {randevu.dosyaBaslik}
                </Link>
              ) : (
                '—'
              )}
            </RandevuDetailField>
            <RandevuDetailField label="Sorumlu">{randevu.sorumluAdSoyad?.trim() || '—'}</RandevuDetailField>
            <RandevuDetailField label="Konum">{randevu.konum?.trim() || '—'}</RandevuDetailField>
            <RandevuDetailField label="WhatsApp Hatırlatması">
              {randevu.hatirlatmaOzet ?? planQ.data?.ozet ?? '—'}
            </RandevuDetailField>
          </dl>

          {planQ.data?.planlananHatirlatmalar?.length ? (
            <div className="rounded-lg border border-border/70 bg-surface-muted/25 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
                Planlanan hatırlatmalar
              </p>
              <ul className="mt-2 space-y-1 text-sm text-ink-muted">
                {planQ.data.planlananHatirlatmalar.map((h) => (
                  <li key={`${h.offsetDk}-${h.planlananAt}`}>
                    {new Date(h.planlananAt).toLocaleString('tr-TR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {aciklama ? (
            <div className="rounded-lg border border-border/70 bg-surface-muted/25 px-4 py-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">Açıklama</p>
              <p className="mt-2 max-h-40 overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-ink">
                {aciklama}
              </p>
            </div>
          ) : null}
        </RandevuModalBody>

        <RandevuModalFooter
          left={
            <Button type="button" variant="ghost" className="w-full sm:w-auto" onClick={onClose}>
              Kapat
            </Button>
          }
          right={
            <>
              <Button type="button" className="w-full sm:w-auto" onClick={onEdit}>
                Düzenle
              </Button>
              <Button
                type="button"
                variant="danger"
                className="w-full sm:w-auto"
                onClick={() => void handleDelete()}
                disabled={deleteMu.isPending}
              >
                Sil
              </Button>
            </>
          }
        />
      </RandevuModalPanel>
    </ModalScrim>
  )
}
