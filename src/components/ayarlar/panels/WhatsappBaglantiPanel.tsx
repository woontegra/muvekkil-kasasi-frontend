import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  completeEmbeddedSignup,
  dogrulaWhatsAppBaglanti,
  getEmbeddedSignupConfig,
  getWhatsAppBaglantiDurum,
  kaldirWhatsAppBaglanti,
  senkronWhatsAppSablonlari,
  WHATSAPP_BAGLANTI_QUERY_KEY
} from '../../../api/whatsappBaglanti'
import { friendlyClientErrorMessage } from '../../../api/client'
import { useAuth } from '../../../contexts/AuthContext'
import { useAdminAuth } from '../../../contexts/AdminAuthContext'
import { isYoneticiRole } from '../../../lib/isYonetici'
import { isSuperAdminRole } from '../../../lib/adminRoles'
import { useToast } from '../../../toast'
import { AlertBox, Badge, Button, useConfirm } from '../../ui'
import { AyarlarPanelShell } from '../shared'
import {
  classifySignupFailure,
  WhatsappOnboardingModal,
  type WhatsappOnboardingOpenMode
} from '../whatsappOnboarding'

declare global {
  interface Window {
    FB?: {
      init: (opts: Record<string, unknown>) => void
      login: (
        cb: (response: { authResponse?: { code?: string } | null; status?: string }) => void,
        opts: Record<string, unknown>
      ) => void
    }
    fbAsyncInit?: () => void
  }
}

function formatTrDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '—'
  return d.toLocaleString('tr-TR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

function durumEtiket(durum: string, connected: boolean): { label: string; variant: 'success' | 'warning' | 'danger' | 'default' | 'primary' } {
  if (connected || durum === 'BAGLI' || durum === 'ACTIVE') {
    return { label: 'Bağlı', variant: 'success' }
  }
  if (durum === 'BAGLANIYOR' || durum === 'ONAY_BEKLIYOR' || durum === 'PENDING') {
    return { label: 'Bağlanıyor', variant: 'warning' }
  }
  if (durum === 'HATA' || durum === 'HATALI') {
    return { label: 'Hatalı', variant: 'danger' }
  }
  if (durum === 'BAGLANTI_KESILDI' || durum === 'DISABLED' || durum === 'SUSPENDED') {
    return { label: 'Bağlantı kesildi', variant: 'default' }
  }
  return { label: 'Bağlı değil', variant: 'default' }
}

function loadFacebookSdk(appId: string, graphVersion: string): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.FB) {
      window.FB.init({ appId, autoLogAppEvents: true, xfbml: false, version: graphVersion })
      resolve()
      return
    }
    const existing = document.getElementById('facebook-jssdk')
    if (existing) {
      const t0 = Date.now()
      const wait = window.setInterval(() => {
        if (window.FB) {
          window.clearInterval(wait)
          window.FB.init({ appId, autoLogAppEvents: true, xfbml: false, version: graphVersion })
          resolve()
        } else if (Date.now() - t0 > 15000) {
          window.clearInterval(wait)
          reject(new Error('Facebook SDK yüklenemedi.'))
        }
      }, 100)
      return
    }
    window.fbAsyncInit = () => {
      window.FB?.init({ appId, autoLogAppEvents: true, xfbml: false, version: graphVersion })
      resolve()
    }
    const script = document.createElement('script')
    script.id = 'facebook-jssdk'
    script.async = true
    script.defer = true
    script.src = 'https://connect.facebook.net/en_US/sdk.js'
    script.onerror = () => reject(new Error('Facebook SDK script hatası.'))
    document.body.appendChild(script)
  })
}

export function WhatsappBaglantiPanel(): ReactElement {
  const { session } = useAuth()
  const { admin: platformAdmin, isAuthenticated: platformAdminOk } = useAdminAuth()
  const showSharedTestBadges =
    platformAdminOk && isSuperAdminRole(platformAdmin?.rol) && platformAdmin?.aktifMi === true
  const isYonetici = isYoneticiRole(session?.user.role)
  const toast = useToast()
  const { confirm } = useConfirm()
  const qc = useQueryClient()
  const [busy, setBusy] = useState(false)
  const [onboardingOpen, setOnboardingOpen] = useState(false)
  const [onboardingMode, setOnboardingMode] = useState<WhatsappOnboardingOpenMode>('connect')
  const pendingIdsRef = useRef<{ wabaId: string; phoneNumberId: string } | null>(null)
  const signupErrorHintRef = useRef(false)

  const durumQuery = useQuery({
    queryKey: [...WHATSAPP_BAGLANTI_QUERY_KEY, 'durum'],
    queryFn: getWhatsAppBaglantiDurum
  })

  const configQuery = useQuery({
    queryKey: [...WHATSAPP_BAGLANTI_QUERY_KEY, 'config'],
    queryFn: getEmbeddedSignupConfig,
    enabled: isYonetici
  })

  const invalidate = useCallback(() => {
    void qc.invalidateQueries({ queryKey: WHATSAPP_BAGLANTI_QUERY_KEY })
  }, [qc])

  const openOnboarding = useCallback((mode: WhatsappOnboardingOpenMode) => {
    setOnboardingMode(mode)
    setOnboardingOpen(true)
  }, [])

  useEffect(() => {
    function onMessage(event: MessageEvent): void {
      if (typeof event.origin !== 'string' || !event.origin.includes('facebook.com')) return
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data
        if (!data || data.type !== 'WA_EMBEDDED_SIGNUP') return
        // Cloud API FINISH + Business App coexistence FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING
        if (
          data.event === 'FINISH' ||
          data.event === 'FINISH_ONLY_WABA' ||
          data.event === 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING'
        ) {
          const wabaId = String(data.data?.waba_id ?? data.data?.wabaId ?? '')
          const phoneNumberId = String(
            data.data?.phone_number_id ??
              data.data?.phoneNumberId ??
              data.data?.phone_number_ids?.[0] ??
              ''
          )
          if (wabaId && phoneNumberId) {
            pendingIdsRef.current = { wabaId, phoneNumberId }
          } else if (wabaId) {
            // Meta Business App finish örneği yalnızca waba_id döndürebilir; phone id varsa ayrıca gelir.
            pendingIdsRef.current = { wabaId, phoneNumberId: phoneNumberId || '' }
          }
        }
        if (data.event === 'ERROR') {
          const errText = String(
            data.data?.error_message ?? data.data?.message ?? data.error_message ?? data.event ?? ''
          )
          // Meta ERROR — kullanıcıyı ham popup’ta bırakmamak için kurtarma bayrağı
          signupErrorHintRef.current = true
          void errText
        }
      } catch {
        /* ignore non-JSON */
      }
    }
    window.addEventListener('message', onMessage)
    return () => window.removeEventListener('message', onMessage)
  }, [])

  const completeMu = useMutation({
    mutationFn: completeEmbeddedSignup,
    onSuccess: () => {
      toast.success('WhatsApp Business bağlantısı tamamlandı.')
      invalidate()
    },
    onError: (e) => {
      if (classifySignupFailure(e) === 'consumer_not_ready') {
        openOnboarding('recovery')
        return
      }
      toast.error(friendlyClientErrorMessage(e))
    }
  })

  async function launchEmbeddedSignup(): Promise<void> {
    if (!isYonetici || busy) return
    const cfg = configQuery.data
    if (!cfg?.configured || !cfg.appId || !cfg.configId) {
      toast.error('Embedded Signup yapılandırması eksik (App ID / Config ID).')
      return
    }
    setBusy(true)
    pendingIdsRef.current = null
    signupErrorHintRef.current = false
    try {
      await loadFacebookSdk(cfg.appId, cfg.graphVersion.startsWith('v') ? cfg.graphVersion : `v${cfg.graphVersion}`)
      await new Promise<void>((resolve, reject) => {
        window.FB!.login(
          (response) => {
            const code = response.authResponse?.code
            if (!code) {
              if (signupErrorHintRef.current) {
                reject(new Error('Bu numara henüz WhatsApp Business’a hazır olmayabilir.'))
                return
              }
              reject(new Error('Meta oturumu tamamlanmadı veya iptal edildi.'))
              return
            }
            const ids = pendingIdsRef.current
            if (!ids?.wabaId || !ids.phoneNumberId) {
              reject(
                new Error(
                  'WABA / telefon bilgisi alınamadı. WhatsApp Business App onboarding’i tamamlayıp tekrar deneyin.'
                )
              )
              return
            }
            completeMu.mutate(
              { code, wabaId: ids.wabaId, phoneNumberId: ids.phoneNumberId },
              {
                onSettled: () => resolve()
              }
            )
          },
          {
            config_id: cfg.configId,
            response_type: 'code',
            override_default_response_type: true,
            extras: {
              setup: {},
              // Meta: mevcut WhatsApp Business App numarası + Cloud API coexistence
              featureType: 'whatsapp_business_app_onboarding',
              sessionInfoVersion: '3'
            }
          }
        )
      })
    } catch (e) {
      const kind = classifySignupFailure(e)
      if (kind === 'consumer_not_ready') {
        openOnboarding('recovery')
      } else if (kind === 'cancelled') {
        toast.error('Bağlantı tamamlanmadı. İsterseniz tekrar deneyebilir veya kurulum rehberine bakabilirsiniz.')
      } else {
        toast.error(friendlyClientErrorMessage(e))
      }
    } finally {
      setBusy(false)
    }
  }

  async function onDogrula(): Promise<void> {
    try {
      await dogrulaWhatsAppBaglanti()
      toast.success('Bağlantı doğrulandı.')
      invalidate()
    } catch (e) {
      toast.error(friendlyClientErrorMessage(e))
    }
  }

  async function onSenkron(): Promise<void> {
    try {
      const r = await senkronWhatsAppSablonlari()
      toast.success(`Şablonlar senkronize edildi (${r.synced}).`)
      invalidate()
    } catch (e) {
      toast.error(friendlyClientErrorMessage(e))
    }
  }

  async function onKaldir(): Promise<void> {
    const ok = await confirm({
      title: 'WhatsApp bağlantısını kaldır',
      message:
        'Bağlantı kaldırılacak; otomatik WhatsApp gönderimleri durur. Devam etmek istiyor musunuz?',
      confirmLabel: 'Bağlantıyı kaldır',
      danger: true
    })
    if (!ok) return
    try {
      await kaldirWhatsAppBaglanti()
      toast.success('WhatsApp bağlantısı kaldırıldı.')
      invalidate()
    } catch (e) {
      toast.error(friendlyClientErrorMessage(e))
    }
  }

  const d = durumQuery.data
  const connected = Boolean(d?.connected)
  const badge = durumEtiket(d?.durum ?? 'BAGLI_DEGIL', connected)

  return (
    <AyarlarPanelShell
      title="WhatsApp Bağlantısı"
      description="Büro WhatsApp Business hesabınızı Meta üzerinden bağlayın. Webhook olayları yalnızca Müvekkil Kasa’ya gelir."
    >
      {durumQuery.isError ? (
        <AlertBox variant="danger" title="Durum yüklenemedi">
          {friendlyClientErrorMessage(durumQuery.error)}
        </AlertBox>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={badge.variant} className="normal-case tracking-normal">
          {badge.label}
        </Badge>
        {d?.gercekGonderimAktif ? (
          <Badge variant="success" className="normal-case tracking-normal">
            API gönderim hazır
          </Badge>
        ) : null}
        {d?.webhookOverrideActive ? (
          <Badge variant="primary" className="normal-case tracking-normal">
            Webhook override aktif
          </Badge>
        ) : null}
        {showSharedTestBadges && connected && d?.sharedWebhookTestConnection ? (
          <>
            <Badge variant="success" className="normal-case tracking-normal">
              WhatsApp API bağlı
            </Badge>
            <Badge variant="default" className="normal-case tracking-normal">
              Webhook paylaşılmış/test bağlantısı
            </Badge>
          </>
        ) : null}
      </div>

      {!connected ? (
        <div className="mt-4 space-y-3">
          <p className="text-sm text-ink-muted">
            Bağlı değil. Otomatik tahsilat WhatsApp’ı için önce Business hesabınızı bağlayın.
            Bağlı değilken manuel <span className="font-medium">wa.me</span> akışı kullanılabilir.
          </p>
          {isYonetici ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={() => openOnboarding('connect')}
                disabled={busy || completeMu.isPending || configQuery.isLoading}
                data-testid="wa-connect-cta"
              >
                {busy || completeMu.isPending ? 'Bağlanıyor…' : 'WhatsApp Business’ı Bağla'}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => openOnboarding('guide')}
                data-testid="wa-how-to-connect"
              >
                Nasıl Bağlanır?
              </Button>
            </div>
          ) : (
            <p className="text-sm text-ink-muted">Bağlantı yalnızca büro sahibi / yönetici tarafından yapılabilir.</p>
          )}
          {isYonetici && configQuery.data && !configQuery.data.configured ? (
            <AlertBox variant="warning" title="Yapılandırma eksik">
              Sunucu tarafında App ID, Embedded Signup Config ID veya App Secret tanımlı değil.
            </AlertBox>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <dl className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">Telefon</dt>
              <dd className="text-sm text-ink">{d?.displayPhoneNumber ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">Doğrulanmış ad</dt>
              <dd className="text-sm text-ink">{d?.verifiedName ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">Bağlantı tarihi</dt>
              <dd className="text-sm text-ink">{formatTrDate(d?.connectedAt)}</dd>
            </div>
            <div>
              <dt className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">Son webhook</dt>
              <dd className="text-sm text-ink">{formatTrDate(d?.lastWebhookAt)}</dd>
            </div>
          </dl>

          {d?.sonHataOzeti ? (
            <AlertBox variant="warning" title="Son hata">
              {d.sonHataOzeti}
            </AlertBox>
          ) : null}

          {isYonetici ? (
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => void onDogrula()}>
                Bağlantıyı doğrula
              </Button>
              <Button type="button" variant="outline" onClick={() => void onSenkron()}>
                Şablonları senkronize et
              </Button>
              <Button type="button" variant="danger" onClick={() => void onKaldir()}>
                Bağlantıyı kaldır
              </Button>
              <Button type="button" variant="ghost" size="sm" onClick={() => openOnboarding('guide')} data-testid="wa-how-to-connect">
                WhatsApp Kurulum Rehberi
              </Button>
            </div>
          ) : null}
        </div>
      )}

      <div className="mt-6 rounded-lg border border-border bg-surface-muted/40 px-3 py-3" data-testid="wa-help-section">
        <p className="text-sm font-semibold text-ink">Yardıma mı ihtiyacınız var?</p>
        <p className="mt-0.5 text-xs text-ink-muted">Adım adım kurulum rehberi — destek beklemeden ilerleyin.</p>
        <div className="mt-2 flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => openOnboarding('guide')}>
            WhatsApp Kurulum Rehberi
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => openOnboarding('consumer_guide')}>
            Normal WhatsApp’tan Business’a Geçiş
          </Button>
          {isYonetici ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={busy || completeMu.isPending || !configQuery.data?.configured}
              onClick={() => void launchEmbeddedSignup()}
            >
              Bağlantıyı Tekrar Dene
            </Button>
          ) : null}
        </div>
      </div>

      <WhatsappOnboardingModal
        open={onboardingOpen}
        mode={onboardingMode}
        onClose={() => setOnboardingOpen(false)}
        onStartEmbeddedSignup={() => void launchEmbeddedSignup()}
        connectBusy={busy || completeMu.isPending}
      />
    </AyarlarPanelShell>
  )
}
