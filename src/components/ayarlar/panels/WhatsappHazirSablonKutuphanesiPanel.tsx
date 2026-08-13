import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import {
  getHazirSablonKutuphanesi,
  metaOnayinaGonderHazirSablon,
  senkronWhatsAppSablonlari,
  WHATSAPP_BAGLANTI_QUERY_KEY,
  type HazirSablonKatalogItem
} from '../../../api/whatsappBaglanti'
import { friendlyClientErrorMessage } from '../../../api/client'
import { useAuth } from '../../../contexts/AuthContext'
import { isYoneticiRole } from '../../../lib/isYonetici'
import { useToast } from '../../../toast'
import { AlertBox, Badge, Button } from '../../ui'
import { AyarlarPanelShell } from '../shared'

const LIBRARY_QUERY_KEY = [...WHATSAPP_BAGLANTI_QUERY_KEY, 'hazir-kutuphane'] as const

function statusVariant(
  code: string
): 'success' | 'warning' | 'danger' | 'default' | 'primary' {
  if (code === 'APPROVED') return 'success'
  if (code === 'PENDING' || code === 'SUBMITTING') return 'warning'
  if (code === 'REJECTED') return 'danger'
  return 'default'
}

function LibraryRow({
  item,
  canManage,
  onSubmit,
  submitting
}: {
  item: HazirSablonKatalogItem
  canManage: boolean
  onSubmit: (key: string) => void
  submitting: boolean
}): ReactElement {
  return (
    <div className="border-b border-[var(--color-border)] py-4 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-[var(--color-text)]">{item.displayName}</h3>
            <Badge variant={statusVariant(item.statusCode)}>{item.statusLabel}</Badge>
          </div>
          <p className="text-xs text-[var(--color-muted)]">{item.shortDescription}</p>
          <p className="text-xs text-[var(--color-muted)]">Kullanım: {item.suggestedUse}</p>
          <p className="mt-2 rounded-md bg-[var(--color-surface-2)] px-3 py-2 text-xs leading-relaxed text-[var(--color-text)]">
            {item.bodyPreview}
          </p>
          <p className="text-[11px] text-[var(--color-muted)]">
            Değişkenler: {item.variables.map((v) => `{${v}}`).join(', ')}
          </p>
          {item.statusCode === 'REJECTED' && item.rejectionReason ? (
            <p className="text-xs text-[var(--color-danger)]">Red nedeni: {item.rejectionReason}</p>
          ) : null}
        </div>
        <div className="flex shrink-0 flex-col items-stretch gap-2">
          {item.statusCode === 'APPROVED' ? (
            <Badge variant="success">Onaylandı</Badge>
          ) : null}
          {canManage && item.canSubmitToMeta ? (
            <Button
              type="button"
              size="sm"
              disabled={submitting}
              onClick={() => onSubmit(item.libraryKey)}
            >
              {item.statusCode === 'REJECTED' ? 'Tekrar Gönder' : 'Meta Onayına Gönder'}
            </Button>
          ) : null}
          {item.statusCode === 'APPROVED' ? (
            <p className="max-w-[11rem] text-[11px] text-[var(--color-muted)]">
              Otomasyonda Kullan: WhatsApp Hatırlatmaları bölümünden kurala atayın.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function WhatsappHazirSablonKutuphanesiPanel(): ReactElement {
  const { session } = useAuth()
  const canManage = isYoneticiRole(session?.user.role)
  const toast = useToast()
  const qc = useQueryClient()

  const q = useQuery({
    queryKey: LIBRARY_QUERY_KEY,
    queryFn: getHazirSablonKutuphanesi
  })

  const submitMu = useMutation({
    mutationFn: (libraryKey: string) => metaOnayinaGonderHazirSablon(libraryKey),
    onSuccess: async (res) => {
      toast.success(res.note || 'Şablon Meta onayına gönderildi.')
      await qc.invalidateQueries({ queryKey: LIBRARY_QUERY_KEY })
      await qc.invalidateQueries({ queryKey: WHATSAPP_BAGLANTI_QUERY_KEY })
    },
    onError: (e) => toast.error(friendlyClientErrorMessage(e))
  })

  const syncMu = useMutation({
    mutationFn: senkronWhatsAppSablonlari,
    onSuccess: async (res) => {
      toast.success(`${res.synced} şablon senkronize edildi.`)
      await qc.invalidateQueries({ queryKey: LIBRARY_QUERY_KEY })
    },
    onError: (e) => toast.error(friendlyClientErrorMessage(e))
  })

  return (
    <AyarlarPanelShell
      title="Hazır Şablon Kütüphanesi"
      description="Tahsilat bilgilendirme şablonlarını seçip kendi WhatsApp hesabınızda Meta onayına gönderin. Metinler değiştirilemez."
    >
      {!q.data?.connectionReady ? (
        <AlertBox variant="warning" className="mb-4">
          Meta’ya göndermek için önce WhatsApp hesabınızı bağlamanız gerekir.
        </AlertBox>
      ) : null}

      <div className="mb-3 flex flex-wrap gap-2">
        {canManage ? (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={syncMu.isPending}
            onClick={() => syncMu.mutate()}
          >
            Şablonları Senkronize Et
          </Button>
        ) : null}
      </div>

      {q.isLoading ? (
        <p className="text-sm text-[var(--color-muted)]">Yükleniyor…</p>
      ) : q.isError ? (
        <AlertBox variant="danger">{friendlyClientErrorMessage(q.error)}</AlertBox>
      ) : (
        <div>
          {(q.data?.catalog ?? []).map((item) => (
            <LibraryRow
              key={item.libraryKey}
              item={item}
              canManage={canManage}
              submitting={submitMu.isPending}
              onSubmit={(key) => submitMu.mutate(key)}
            />
          ))}
        </div>
      )}
    </AyarlarPanelShell>
  )
}
