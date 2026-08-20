import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRef, useState, type ReactElement } from 'react'
import {
  copyHazirTemplateAsOzel,
  copyOzelTemplateAsDraft,
  createOzelWhatsAppSablonu,
  deleteOzelWhatsAppSablonu,
  getHazirSablonKutuphanesi,
  getOzelWhatsAppSablonlari,
  metaOnayinaGonderHazirSablon,
  senkronWhatsAppSablonlari,
  submitOzelWhatsAppSablonu,
  updateOzelWhatsAppSablonu,
  WHATSAPP_BAGLANTI_QUERY_KEY,
  type CreateOzelSablonPayload,
  type HazirSablonKatalogItem,
  type OzelSablonDto
} from '../../../api/whatsappBaglanti'
import { friendlyClientErrorMessage } from '../../../api/client'
import { useAuth } from '../../../contexts/AuthContext'
import { isYoneticiRole } from '../../../lib/isYonetici'
import { useToast } from '../../../toast'
import { AlertBox, Badge, Button, EmptyState, useConfirm } from '../../ui'
import { AyarlarPanelShell, ModalShell, SettingRow } from '../shared'
import { OzelSablonFormFields } from './OzelSablonFormFields'
import { SablonOlusturmaRehberi } from './SablonOlusturmaRehberi'
import {
  USAGE_AREA_LABELS,
  emptySablonFormValues,
  slugifyMetaName,
  systemFieldLabel,
  validateBodyVariableEdges,
  BODY_VARIABLE_EDGE_MESSAGE,
  type SablonFormValues
} from './sablonFormShared'

const LIBRARY_QUERY_KEY = [...WHATSAPP_BAGLANTI_QUERY_KEY, 'hazir-kutuphane'] as const
const OZEL_QUERY_KEY = [...WHATSAPP_BAGLANTI_QUERY_KEY, 'ozel-sablonlar'] as const

const CUSTOM_STATUS_LABELS: Record<string, string> = {
  TASLAK: 'Taslak',
  GONDERILIYOR: 'Gönderiliyor',
  BEKLIYOR: 'İnceleniyor',
  ONAYLANDI: 'Onaylandı',
  REDDEDILDI: 'Reddedildi',
  DURAKLATILDI: 'Duraklatıldı',
  DEVRE_DISI: 'Devre dışı'
}

function customStatusLabel(status: string): string {
  return CUSTOM_STATUS_LABELS[status] ?? status
}

function customStatusVariant(
  status: string
): 'success' | 'warning' | 'danger' | 'default' | 'primary' {
  if (status === 'ONAYLANDI') return 'success'
  if (status === 'GONDERILIYOR' || status === 'BEKLIYOR') return 'warning'
  if (status === 'REDDEDILDI') return 'danger'
  if (status === 'TASLAK') return 'primary'
  return 'default'
}

function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('tr-TR')
  } catch {
    return iso
  }
}

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

function CustomTemplateDetailModal(props: {
  item: OzelSablonDto
  onClose: () => void
}): ReactElement {
  const { item } = props
  const previewText = item.variables.reduce(
    (text, v) => text.split(`{{${v.index}}}`).join(v.exampleValue || `{{${v.index}}}`),
    item.bodyText
  )

  return (
    <ModalShell title={item.displayName} onClose={props.onClose}>
      <div className="space-y-3">
        <SettingRow label="Görünen ad" value={item.displayName} />
        <SettingRow label="Meta şablon adı" value={item.metaName} mono />
        <SettingRow label="Durum" value={customStatusLabel(item.statusNormalized)} />
        <SettingRow label="Kullanım alanı" value={USAGE_AREA_LABELS[item.usageArea] ?? item.usageArea} />
        <SettingRow label="Kategori" value={item.category} />
        <SettingRow label="Dil" value="Türkçe (tr)" />

        <div className="rounded-md border border-border bg-surface-muted/30 px-3 py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Mesaj önizlemesi</p>
          <p className="mt-1.5 whitespace-pre-wrap text-sm leading-relaxed text-ink">{previewText}</p>
          {item.footerText ? (
            <p className="mt-2 text-xs text-ink-muted">{item.footerText}</p>
          ) : null}
        </div>

        {item.variables.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Değişkenler</p>
            {item.variables.map((v) => (
              <div key={v.index} className="rounded-md border border-border/70 bg-white px-3 py-2 text-sm">
                <p>
                  <span className="font-semibold">{`{{${v.index}}}`}</span>
                  {' → '}
                  {systemFieldLabel(v.systemField)}
                </p>
                <p className="mt-0.5 text-xs text-ink-muted">Örnek: {v.exampleValue}</p>
              </div>
            ))}
          </div>
        ) : null}

        <SettingRow label="Oluşturulma tarihi" value={formatDateTime(item.createdAt)} />
        {item.submittedAt ? (
          <SettingRow label="Meta'ya gönderilme tarihi" value={formatDateTime(item.submittedAt)} />
        ) : null}
        {item.lastSyncedAt ? (
          <SettingRow label="Son senkronizasyon" value={formatDateTime(item.lastSyncedAt)} />
        ) : null}

        {item.statusNormalized === 'REDDEDILDI' ? (
          <AlertBox variant="danger" title="Red nedeni">
            {item.rejectionReason?.trim() || 'Meta ret nedeni bildirmedi'}
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
  submitting,
  onCopy
}: {
  item: HazirSablonKatalogItem
  canManage: boolean
  onInspect: () => void
  onSubmit: (key: string) => void
  submitting: boolean
  onCopy: (key: string) => void
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
          {canManage ? (
            <Button type="button" variant="outline" size="sm" onClick={() => onCopy(item.libraryKey)}>
              Kopyala ve Özelleştir
            </Button>
          ) : null}
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
  const { confirm } = useConfirm()
  const toast = useToast()
  const qc = useQueryClient()
  const [inspectItem, setInspectItem] = useState<HazirSablonKatalogItem | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formValues, setFormValues] = useState<SablonFormValues>(emptySablonFormValues)
  const [metaTouched, setMetaTouched] = useState(false)
  const [inspectCustom, setInspectCustom] = useState<OzelSablonDto | null>(null)
  const [guideOpen, setGuideOpen] = useState(false)
  const newTemplateBtnRef = useRef<HTMLSpanElement>(null)

  const q = useQuery({
    queryKey: LIBRARY_QUERY_KEY,
    queryFn: getHazirSablonKutuphanesi
  })
  const customQ = useQuery({
    queryKey: OZEL_QUERY_KEY,
    queryFn: getOzelWhatsAppSablonlari
  })

  const submitMu = useMutation({
    mutationFn: (libraryKey: string) => metaOnayinaGonderHazirSablon(libraryKey),
    onSuccess: async (res) => {
      toast.success(res.note || 'Şablon Meta onayına gönderildi.')
      await qc.invalidateQueries({ queryKey: LIBRARY_QUERY_KEY })
      await qc.invalidateQueries({ queryKey: WHATSAPP_BAGLANTI_QUERY_KEY })
    },
    onError: (e) =>
      toast.error(
        friendlyClientErrorMessage(
          e,
          'Şablon Meta hesabında oluşturulamadı. Lütfen bağlantıyı kontrol edip tekrar deneyin.'
        )
      )
  })

  const syncMu = useMutation({
    mutationFn: senkronWhatsAppSablonlari,
    onSuccess: async (res) => {
      const ghost =
        typeof res.reconciledGhosts === 'number' && res.reconciledGhosts > 0
          ? ` ${res.reconciledGhosts} hayalet inceleme kaydı temizlendi.`
          : ''
      toast.success(`${res.synced} şablon senkronize edildi.${ghost}`)
      await qc.invalidateQueries({ queryKey: LIBRARY_QUERY_KEY })
      await qc.invalidateQueries({ queryKey: OZEL_QUERY_KEY })
    },
    onError: (e) => toast.error(friendlyClientErrorMessage(e))
  })
  const createMu = useMutation({
    mutationFn: createOzelWhatsAppSablonu,
    onSuccess: async () => {
      toast.success('Özel şablon taslak olarak kaydedildi.')
      await qc.invalidateQueries({ queryKey: OZEL_QUERY_KEY })
      closeForm()
    },
    onError: (e) => toast.error(friendlyClientErrorMessage(e))
  })
  const updateMu = useMutation({
    mutationFn: (input: { id: string; body: CreateOzelSablonPayload }) =>
      updateOzelWhatsAppSablonu(input.id, input.body),
    onSuccess: async () => {
      toast.success('Taslak şablon güncellendi.')
      await qc.invalidateQueries({ queryKey: OZEL_QUERY_KEY })
      closeForm()
    },
    onError: (e) => toast.error(friendlyClientErrorMessage(e))
  })
  const deleteMu = useMutation({
    mutationFn: deleteOzelWhatsAppSablonu,
    onSuccess: async () => {
      toast.success('Taslak şablon silindi.')
      await qc.invalidateQueries({ queryKey: OZEL_QUERY_KEY })
    },
    onError: (e) => toast.error(friendlyClientErrorMessage(e))
  })
  const submitCustomMu = useMutation({
    mutationFn: submitOzelWhatsAppSablonu,
    onSuccess: async () => {
      toast.success('Şablon Meta onayına gönderildi.')
      await qc.invalidateQueries({ queryKey: OZEL_QUERY_KEY })
      await qc.invalidateQueries({ queryKey: LIBRARY_QUERY_KEY })
    },
    onError: (e) =>
      toast.error(
        friendlyClientErrorMessage(
          e,
          'Şablon Meta hesabında oluşturulamadı. Lütfen bağlantıyı kontrol edip tekrar deneyin.'
        )
      )
  })
  const copyMu = useMutation({
    mutationFn: (libraryKey: string) => copyHazirTemplateAsOzel(libraryKey),
    onSuccess: async () => {
      toast.success('Hazır şablondan taslak oluşturuldu.')
      await qc.invalidateQueries({ queryKey: OZEL_QUERY_KEY })
    },
    onError: (e) => toast.error(friendlyClientErrorMessage(e))
  })
  const copyCustomMu = useMutation({
    mutationFn: (id: string) => copyOzelTemplateAsDraft(id),
    onSuccess: async () => {
      toast.success('Şablon kopyalanıp yeni taslak oluşturuldu.')
      await qc.invalidateQueries({ queryKey: OZEL_QUERY_KEY })
    },
    onError: (e) => toast.error(friendlyClientErrorMessage(e))
  })

  const catalog = q.data?.catalog ?? []
  const customTemplates = customQ.data?.templates ?? []
  const tahsilatCatalog = catalog.filter((c) => (c.templateGroup ?? 'TAHSILAT') === 'TAHSILAT')
  const randevuCatalog = catalog.filter((c) => c.templateGroup === 'RANDEVU')
  const stats = computeStats(catalog)

  function patchForm(patch: Partial<SablonFormValues>): void {
    setFormValues((prev) => ({ ...prev, ...patch }))
  }

  function resetForm(): void {
    setFormValues(emptySablonFormValues())
    setMetaTouched(false)
  }

  function closeForm(): void {
    setShowForm(false)
    setEditingId(null)
    resetForm()
  }

  function openCreateForm(): void {
    resetForm()
    setEditingId(null)
    setShowForm(true)
  }

  function openEditForm(item: OzelSablonDto): void {
    setEditingId(item.id)
    setFormValues({
      displayName: item.displayName,
      metaName: item.metaName,
      usageArea: item.usageArea as CreateOzelSablonPayload['usageArea'],
      category: item.category,
      bodyText: item.bodyText,
      footerText: item.footerText ?? '',
      variables: [...item.variables]
    })
    setMetaTouched(true)
    setShowForm(true)
  }

  function openGuide(): void {
    setInspectItem(null)
    setInspectCustom(null)
    closeForm()
    setGuideOpen(true)
  }

  function closeGuide(): void {
    setGuideOpen(false)
  }

  function finishGuideAndCreate(): void {
    setGuideOpen(false)
    openCreateForm()
  }

  function saveForm(): void {
    if (guideOpen) return
    const payload: CreateOzelSablonPayload = {
      displayName: formValues.displayName.trim(),
      metaName: formValues.metaName.trim() || slugifyMetaName(formValues.displayName),
      usageArea: formValues.usageArea,
      category: formValues.category,
      language: 'tr',
      bodyText: formValues.bodyText,
      footerText: formValues.footerText.trim() || null,
      variables: formValues.variables
    }
    if (editingId) {
      updateMu.mutate({ id: editingId, body: payload })
    } else {
      createMu.mutate(payload)
    }
  }

  async function deleteCustom(id: string): Promise<void> {
    const ok = await confirm({
      title: 'Taslak silinsin mi?',
      message: 'Bu taslak kalıcı olarak silinecek. Devam etmek istiyor musunuz?',
      confirmLabel: 'Sil',
      cancelLabel: 'İptal'
    })
    if (!ok) return
    deleteMu.mutate(id)
  }

  async function submitCustom(id: string): Promise<void> {
    const item = customTemplates.find((t) => t.id === id)
    if (item) {
      const edge = validateBodyVariableEdges(item.bodyText)
      if (!edge.ok) {
        toast.error(edge.message || BODY_VARIABLE_EDGE_MESSAGE)
        return
      }
    }
    const ok = await confirm({
      title: 'Meta onayına gönderilsin mi?',
      message: 'Gönderim sonrası içerik ve Meta adı kilitlenir. Değişiklik için kopya oluşturmanız gerekir.',
      confirmLabel: 'Gönder',
      cancelLabel: 'İptal'
    })
    if (!ok) return
    submitCustomMu.mutate(id)
  }

  function renderSection(title: string, items: HazirSablonKatalogItem[]): ReactElement {
    return (
      <div className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">{title}</p>
        {items.map((item) => (
          <TemplateCard
            key={item.libraryKey}
            item={item}
            canManage={canManage}
            submitting={submitMu.isPending}
            onInspect={() => setInspectItem(item)}
            onSubmit={(key) => submitMu.mutate(key)}
            onCopy={(key) => copyMu.mutate(key)}
          />
        ))}
      </div>
    )
  }

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
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            aria-label="Şablon oluşturma rehberini aç"
            onClick={openGuide}
          >
            ? Şablon Oluşturma Rehberi
          </Button>
          {canManage ? (
            <>
              <span ref={newTemplateBtnRef} className="inline-flex">
                <Button
                  type="button"
                  size="sm"
                  aria-label="Yeni şablon oluştur"
                  onClick={openCreateForm}
                >
                  + Yeni Şablon
                </Button>
              </span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                disabled={syncMu.isPending}
                onClick={() => syncMu.mutate()}
              >
                Şablonları Senkronize Et
              </Button>
            </>
          ) : (
            <span ref={newTemplateBtnRef} className="inline-flex" />
          )}
        </div>
      </div>

      {q.isLoading ? (
        <p className="text-sm text-ink-muted">Yükleniyor…</p>
      ) : q.isError ? (
        <AlertBox variant="danger">{friendlyClientErrorMessage(q.error)}</AlertBox>
      ) : (
        <div className="space-y-5">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-ink">Hazır Şablonlar</h3>
            {renderSection('Tahsilat şablonları', tahsilatCatalog)}
            {randevuCatalog.length ? renderSection('Randevu şablonları', randevuCatalog) : null}
          </div>
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-ink">Büroma Özel Şablonlar</h3>
            {customQ.isLoading ? (
              <p className="text-sm text-ink-muted">Özel şablonlar yükleniyor…</p>
            ) : customTemplates.length === 0 ? (
              <EmptyState
                title="Henüz büronuza özel şablon oluşturmadınız"
                description="Kendi mesaj metninizi hazırlayabilir veya hazır bir şablonu kopyalayıp özelleştirebilirsiniz."
                action={
                  <div className="flex flex-wrap justify-center gap-2">
                    {canManage ? (
                      <Button type="button" size="sm" onClick={openCreateForm}>
                        Yeni Şablon Oluştur
                      </Button>
                    ) : null}
                    <Button type="button" variant="outline" size="sm" onClick={openGuide}>
                      Adım Adım Rehberi Aç
                    </Button>
                  </div>
                }
              />
            ) : (
              <div className="space-y-2">
                {customTemplates.map((item) => (
                  <div key={item.id} className="rounded-lg border border-border bg-white px-4 py-3 shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-ink">{item.displayName}</p>
                        <p className="text-xs text-ink-muted">{item.metaName}</p>
                      </div>
                      <Badge variant={customStatusVariant(item.statusNormalized)} className="normal-case tracking-normal">
                        {customStatusLabel(item.statusNormalized)}
                      </Badge>
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => setInspectCustom(item)}>
                        İncele
                      </Button>
                      {canManage && item.isEditable ? (
                        <>
                          <Button type="button" variant="outline" size="sm" onClick={() => openEditForm(item)}>
                            Düzenle
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={deleteMu.isPending}
                            onClick={() => void deleteCustom(item.id)}
                          >
                            Sil
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            disabled={submitCustomMu.isPending || !q.data?.connectionReady}
                            onClick={() => void submitCustom(item.id)}
                          >
                            Meta Onayına Gönder
                          </Button>
                        </>
                      ) : canManage ? (
                        <Button type="button" variant="outline" size="sm" onClick={() => copyCustomMu.mutate(item.id)}>
                          Kopyala ve Özelleştir
                        </Button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {inspectItem ? <TemplateDetailModal item={inspectItem} onClose={() => setInspectItem(null)} /> : null}
      {inspectCustom ? <CustomTemplateDetailModal item={inspectCustom} onClose={() => setInspectCustom(null)} /> : null}
      {showForm && !guideOpen ? (
        <ModalShell title={editingId ? 'Şablonu Düzenle' : 'Yeni Şablon'} onClose={closeForm}>
          <OzelSablonFormFields
            values={formValues}
            onChange={patchForm}
            metaNameTouched={metaTouched}
            onMetaNameTouched={() => setMetaTouched(true)}
            saveLabel={editingId ? 'Değişiklikleri Kaydet' : 'Taslak Olarak Kaydet'}
            saving={createMu.isPending || updateMu.isPending}
            onSave={saveForm}
            onCancel={closeForm}
          />
        </ModalShell>
      ) : null}
      {guideOpen ? (
        <SablonOlusturmaRehberi
          pageTargets={{ newTemplate: newTemplateBtnRef }}
          canCreate={canManage}
          onClose={closeGuide}
          onCreateOwn={finishGuideAndCreate}
        />
      ) : null}
    </AyarlarPanelShell>
  )
}
