import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useState, type ReactElement } from 'react'
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
import { AyarlarPanelShell, ModalShell, SettingRow } from '../shared'

const LIBRARY_QUERY_KEY = [...WHATSAPP_BAGLANTI_QUERY_KEY, 'hazir-kutuphane'] as const

function displayStatusLabel(item: HazirSablonKatalogItem): string {
  if (item.statusCode === 'NOT_CREATED') return 'Henüz gönderilmedi'
  return item.statusLabel
}

function statusVariant(
  code: string
): 'success' | 'warning' | 'danger' | 'default' | 'primary' {
  if (code === 'APPROVED') return 'success'
  if (code === 'PENDING' || code === 'SUBMITTING') return 'warning'
  if (code === 'REJECTED') return 'danger'
  return 'default'
}

function computeStats(catalog: HazirSablonKatalogItem[]): {
  total: number
  approved: number
  pending: number
  rejected: number
} {
  let approved = 0
  let pending = 0
  let rejected = 0
  for (const item of catalog) {
    if (item.statusCode === 'APPROVED') approved += 1
    else if (item.statusCode === 'PENDING' || item.statusCode === 'SUBMITTING') pending += 1
    else if (item.statusCode === 'REJECTED') rejected += 1
  }
  return { total: catalog.length, approved, pending, rejected }
}

function actionLabel(item: HazirSablonKatalogItem): string | null {
  if (item.statusCode === 'APPROVED') return null
  if (item.statusCode === 'REJECTED') return 'Tekrar Gönder'
  if (item.canSubmitToMeta) return 'Meta Onayına Gönder'
  if (item.statusCode === 'PENDING' || item.statusCode === 'SUBMITTING') return null
  return null
}

function TemplateDetailModal(props: {
  item: HazirSablonKatalogItem
  onClose: () => void
}): ReactElement {
  const { item } = props
  return (
    <ModalShell title={item.displayName} onClose={props.onClose}>
      <div className="space-y-3">
        <div className="rounded-md border border-border bg-surface-muted/30 px-3 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Mesaj önizlemesi</p>
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink">{item.bodyPreview}</p>
        </div>
        <SettingRow
          label="Değişkenler"
          value={item.variables.map((v) => `{${v}}`).join(', ')}
        />
        <SettingRow label="Meta şablon adı" value={item.metaTemplateName} mono />
        <SettingRow label="Dil" value={item.language === 'tr' ? 'Türkçe' : item.language} />
        <SettingRow label="Kategori" value={item.category} />
        <SettingRow label="Meta durumu" value={displayStatusLabel(item)} />
        {item.statusCode === 'REJECTED' && item.rejectionReason ? (
          <AlertBox variant="danger" title="Red nedeni">
            {item.rejectionReason}
          </AlertBox>
        ) : null}
      </div>
    </ModalShell>
  )
}

function TemplateCard({
  item,
  canManage,
  onInspect,
  onSubmit,
  submitting
}: {
  item: HazirSablonKatalogItem
  canManage: boolean
  onInspect: () => void
  onSubmit: (key: string) => void
  submitting: boolean
}): ReactElement {
  const action = actionLabel(item)

  return (
    <div className="rounded-lg border border-border bg-white px-4 py-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-sm font-semibold text-ink">{item.displayName}</h3>
            <Badge variant={statusVariant(item.statusCode)} className="normal-case tracking-normal">
              {displayStatusLabel(item)}
            </Badge>
          </div>
          <p className="text-xs text-ink-muted">{item.shortDescription}</p>
          <p className="text-xs text-ink-subtle">Kullanım: {item.suggestedUse}</p>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Button type="button" variant="outline" size="sm" onClick={onInspect}>
            İncele
          </Button>
          {canManage && action ? (
            <Button
              type="button"
              size="sm"
              disabled={submitting || !item.canSubmitToMeta}
              onClick={() => onSubmit(item.libraryKey)}
            >
              {action}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  )
}

export function WhatsappSablonlariPanel(): ReactElement {
  const { session } = useAuth()
  const canManage = isYoneticiRole(session?.user.role)
  const toast = useToast()
  const qc = useQueryClient()
  const [inspectItem, setInspectItem] = useState<HazirSablonKatalogItem | null>(null)

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

  const catalog = q.data?.catalog ?? []
  const stats = computeStats(catalog)

  return (
    <AyarlarPanelShell
      title="WhatsApp Şablonları"
      description="Otomatik tahsilat bildirimlerinde kullanabileceğiniz hazır WhatsApp şablonlarını kendi WhatsApp Business hesabınızda Meta onayına gönderin."
    >
      {!q.data?.connectionReady ? (
        <AlertBox variant="warning" className="mb-4">
          Meta’ya göndermek için önce WhatsApp hesabınızı bağlamanız gerekir.
        </AlertBox>
      ) : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-ink-muted">
          <span>
            Toplam hazır şablon: <span className="font-semibold text-ink">{stats.total}</span>
          </span>
          <span>
            Onaylanan: <span className="font-semibold text-ink">{stats.approved}</span>
          </span>
          <span>
            İncelenen: <span className="font-semibold text-ink">{stats.pending}</span>
          </span>
          <span>
            Reddedilen: <span className="font-semibold text-ink">{stats.rejected}</span>
          </span>
        </div>
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
        <p className="text-sm text-ink-muted">Yükleniyor…</p>
      ) : q.isError ? (
        <AlertBox variant="danger">{friendlyClientErrorMessage(q.error)}</AlertBox>
      ) : (
        <div className="space-y-2">
          {catalog.map((item) => (
            <TemplateCard
              key={item.libraryKey}
              item={item}
              canManage={canManage}
              submitting={submitMu.isPending}
              onInspect={() => setInspectItem(item)}
              onSubmit={(key) => submitMu.mutate(key)}
            />
          ))}
        </div>
      )}

      {inspectItem ? <TemplateDetailModal item={inspectItem} onClose={() => setInspectItem(null)} /> : null}
    </AyarlarPanelShell>
  )
}
