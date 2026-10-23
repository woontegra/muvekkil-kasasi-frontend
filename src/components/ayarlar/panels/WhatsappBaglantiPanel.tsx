import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import {
  baglanCoexistence,
  completeEmbeddedSignup,
  dogrulaWhatsAppBaglanti,
  esitleCoexistence,
  getCoexistenceDurum,
  getEmbeddedSignupConfig,
  getMesajDurumu,
  getWhatsAppBaglantiDurum,
  kaldirWhatsAppBaglanti,
  kaydetTelefon,
  senkronWhatsAppSablonlari,
  yenileCoexistenceMetaDurum,
  WHATSAPP_BAGLANTI_QUERY_KEY,
  type CoexistenceSyncDurum,
  type CoexistenceSyncTur
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
import { buildEmbeddedSignupLoginOptions, coexistenceReconnectGuidance } from './whatsappEmbeddedSignup'

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

const BUSINESS_APP_FINISH_EVENT = 'FINISH_WHATSAPP_BUSINESS_APP_ONBOARDING'

type SignupTarget = 'OTOMATIK' | 'COEXISTENCE_YENIDEN'

function syncDurumEtiket(s: CoexistenceSyncDurum | null): string {
  if (!s) return 'İstenmedi'
  switch (s.durum) {
    case 'ISTENIYOR':
      return 'İsteniyor…'
    case 'ISTENDI':
      return s.progress != null ? `İstendi (%${s.progress})` : `İstendi (${s.itemsReceived} kayıt)`
    case 'TAMAMLANDI':
      return 'Tamamlandı'
    case 'REDDEDILDI':
      return 'İşletme paylaşımı reddetti'
    case 'BELIRSIZ':
      return 'Sonuç belirsiz'
    case 'BASARISIZ':
      return 'Başarısız — tekrar denenebilir'
    default:
      return s.durum
  }
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
  const pendingIdsRef = useRef<{ wabaId: string; phoneNumberId: string; event: string } | null>(null)
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

  const coexQuery = useQuery({
    queryKey: [...WHATSAPP_BAGLANTI_QUERY_KEY, 'coexistence'],
    queryFn: getCoexistenceDurum
  })

  const mesajQuery = useQuery({
    queryKey: [...WHATSAPP_BAGLANTI_QUERY_KEY, 'mesaj-durumu'],
    queryFn: getMesajDurumu
  })

  const [pin, setPin] = useState('')

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
          if (wabaId) {
            // Business App finish yalnızca waba_id döndürebilir; telefon sunucuda WABA'dan doğrulanır.
            pendingIdsRef.current = { wabaId, phoneNumberId, event: String(data.event) }
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

  const coexMu = useMutation({
    mutationFn: baglanCoexistence,
    onSuccess: (r) => {
      toast.success(
        r.uyarilar && r.uyarilar.length > 0
          ? `Coexistence bağlantısı kaydedildi. Uyarı: ${r.uyarilar.join('; ')}`
          : 'Coexistence bağlantısı tamamlandı. 24 saat içinde eşitlemeyi başlatın.'
      )
      invalidate()
    },
    onError: (e) => {
      toast.error(friendlyClientErrorMessage(e))
    }
  })

  async function launchEmbeddedSignup(target: SignupTarget = 'OTOMATIK'): Promise<void> {
    if (!isYonetici || busy) return
    const cfg = configQuery.data
    if (!cfg?.configured || !cfg.appId || !cfg.configId) {
      toast.error('Müvekkil Kasa Meta uygulaması yapılandırması eksik (App ID / Config ID / App Secret).')
      return
    }
    const configId = cfg.configId
    if (target === 'COEXISTENCE_YENIDEN' && !cfg.coexistenceEnabled) {
      toast.error('Coexistence bağlantısı sunucuda etkin değil.')
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
            if (!ids?.wabaId) {
              reject(
                new Error(
                  'WhatsApp Business hesabı bilgisi alınamadı. WhatsApp Business App onboarding’i tamamlayıp tekrar deneyin.'
                )
              )
              return
            }
            const businessAppOnboarding = ids.event === BUSINESS_APP_FINISH_EVENT
            if (target === 'COEXISTENCE_YENIDEN' || businessAppOnboarding) {
              if (!cfg.coexistenceEnabled) {
                reject(new Error('Coexistence bağlantısı sunucuda etkin değil.'))
                return
              }
              coexMu.mutate(
                {
                  mod: target === 'COEXISTENCE_YENIDEN' ? 'YENIDEN_BAGLANTI' : 'ILK_BAGLANTI',
                  code,
                  wabaId: ids.wabaId,
                  phoneNumberId: ids.phoneNumberId || null
                },
                { onSettled: () => resolve() }
              )
              return
            }
            if (!ids.phoneNumberId) {
              reject(new Error('Telefon numarası bilgisi alınamadı. Bağlantıyı tekrar deneyin.'))
              return
            }
            completeMu.mutate(
              { code, wabaId: ids.wabaId, phoneNumberId: ids.phoneNumberId },
              {
                onSettled: () => resolve()
              }
            )
          },
          buildEmbeddedSignupLoginOptions(configId)
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

  async function onCoexistenceYenidenBaglan(): Promise<void> {
    const ok = await confirm({
      title: 'Coexistence ile yeniden bağla',
      message: coexistenceReconnectGuidance(durumQuery.data?.displayPhoneNumber),
      confirmLabel: 'Meta ile devam et'
    })
    if (!ok) return
    await launchEmbeddedSignup('COEXISTENCE_YENIDEN')
  }

  async function onCoexistenceEsitle(tur: CoexistenceSyncTur): Promise<void> {
    const ok = await confirm({
      title: tur === 'KISILER' ? 'Kişileri eşitle' : 'Mesaj geçmişini eşitle',
      message:
        'Meta bu isteği her bağlantı için yalnızca bir kez kabul eder. Müvekkil Kasa yalnızca ilerleme ve kayıt sayısını tutar; mesaj veya kişi içeriği saklanmaz.',
      confirmLabel: 'Eşitlemeyi başlat'
    })
    if (!ok) return
    try {
      await esitleCoexistence(tur)
      toast.success('Eşitleme isteği gönderildi.')
    } catch (e) {
      toast.error(friendlyClientErrorMessage(e))
    } finally {
      invalidate()
    }
  }

  async function onTelefonKaydi(): Promise<void> {
    if (!/^\d{6}$/.test(pin)) {
      toast.error('PIN 6 haneli olmalıdır.')
      return
    }
    try {
      await kaydetTelefon(pin)
      setPin('')
      toast.success('Telefon kaydı tamamlandı.')
    } catch (e) {
      toast.error(friendlyClientErrorMessage(e))
    } finally {
      invalidate()
    }
  }

  async function onCoexistenceMetaDurum(): Promise<void> {
    try {
      await yenileCoexistenceMetaDurum()
      toast.success('Meta numara durumu güncellendi.')
      invalidate()
    } catch (e) {
      toast.error(friendlyClientErrorMessage(e))
    }
  }

  const d = durumQuery.data
  const coex = coexQuery.data
  const coexEnabled = Boolean(configQuery.data?.coexistenceEnabled)
  const canCoexReconnect = isYonetici && coexEnabled && Boolean(d?.yenidenBaglanabilir)
  const showCoexPanel =
    Boolean(coex) && (coex?.connectionMode === 'COEXISTENCE' || Boolean(coex?.disconnectedAt) || canCoexReconnect)
  const statusPending = durumQuery.isLoading || durumQuery.isFetching
  const statusFailed = durumQuery.isError
  const connected = !statusFailed && Boolean(d?.connected)
  const badge = statusFailed
    ? { label: 'Durum alınamadı', variant: 'warning' as const }
    : statusPending && !d
      ? { label: 'Yükleniyor…', variant: 'default' as const }
      : durumEtiket(d?.durum ?? 'BAGLI_DEGIL', connected)

  const healthy = connected && Boolean(d?.gercekGonderimAktif) && !d?.sonHataOzeti
  const statusTone = statusFailed
    ? 'border-danger/40 bg-danger-soft/80'
    : healthy
      ? 'border-success/40 bg-success-soft/80'
      : connected
        ? 'border-warning/40 bg-warning-soft/80'
        : 'border-border bg-surface-muted/40'

  return (
    <AyarlarPanelShell
      title="WhatsApp bağlantısı"
      description="Büro WhatsApp Business hesabınızı bağlayın. Bağlantı sağlıklıysa otomatik mesajlar bu numaradan gider."
    >
      {durumQuery.isError ? (
        <AlertBox variant="danger" title="Bağlantı durumu yüklenemedi">
          {friendlyClientErrorMessage(durumQuery.error, 'Bağlantı durumu alınamadı. Bildirim ayarı hatası bağlantıyı koparmaz.')}
        </AlertBox>
      ) : null}

      <div className={`overflow-hidden rounded-xl border ${statusTone} shadow-sm`}>
        <div className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex h-2.5 w-2.5 shrink-0 rounded-full ${
                  statusFailed ? 'bg-danger' : healthy ? 'bg-success' : connected ? 'bg-warning' : 'bg-ink-subtle'
                }`}
                aria-hidden
              />
              <p className="text-base font-bold text-ink">{badge.label}</p>
              {!statusFailed && d?.gercekGonderimAktif ? (
                <Badge variant="success" className="normal-case tracking-normal">
                  Gönderime hazır
                </Badge>
              ) : null}
              {!statusFailed && connected && !d?.gercekGonderimAktif ? (
                <Badge variant="warning" className="normal-case tracking-normal">
                  Gönderim bekliyor
                </Badge>
              ) : null}
            </div>
            {statusFailed ? null : connected ? (
              <>
                <p className="mt-2 text-2xl font-bold tracking-tight text-ink sm:text-3xl">
                  {d?.displayPhoneNumber ?? '—'}
                </p>
                <p className="mt-1 text-sm text-ink-muted">
                  {d?.verifiedName?.trim()
                    ? d.verifiedName
                    : 'Doğrulanmış işletme adı henüz görünmüyor'}
                </p>
              </>
            ) : (
              <p className="mt-2 max-w-xl text-sm leading-relaxed text-ink-muted">
                Otomatik tahsilat ve randevu hatırlatmaları için önce WhatsApp Business hesabınızı
                bağlayın. Bağlı değilken manuel wa.me akışı kullanılabilir.
              </p>
            )}
          </div>

          {statusFailed ? null : !connected && isYonetici ? (
            <div className="flex shrink-0 flex-wrap gap-2">
              {canCoexReconnect ? (
                <Button
                  type="button"
                  onClick={() => void onCoexistenceYenidenBaglan()}
                  disabled={busy || coexMu.isPending}
                  data-testid="wa-coex-reconnect-cta"
                >
                  {busy || coexMu.isPending ? 'Bağlanıyor…' : 'Yeniden bağla (Coexistence)'}
                </Button>
              ) : null}
              <Button
                type="button"
                variant={canCoexReconnect ? 'outline' : undefined}
                onClick={() => openOnboarding('connect')}
                disabled={busy || completeMu.isPending || coexMu.isPending || configQuery.isLoading}
                data-testid="wa-connect-cta"
              >
                {busy || completeMu.isPending ? 'Bağlanıyor…' : 'WhatsApp Business’ı Bağla'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => openOnboarding('guide')}
                data-testid="wa-how-to-connect"
              >
                Nasıl Bağlanır?
              </Button>
            </div>
          ) : null}
        </div>

        {statusFailed ? null : connected ? (
          <div className="border-t border-border/70 bg-white/70 px-5 py-4">
            <dl className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <dt className="text-sm font-medium text-ink-muted">Bağlantı tarihi</dt>
                <dd className="mt-1 text-sm font-semibold text-ink">{formatTrDate(d?.connectedAt)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-ink-muted">Son webhook</dt>
                <dd className="mt-1 text-sm font-semibold text-ink">{formatTrDate(d?.lastWebhookAt)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-ink-muted">Durum özeti</dt>
                <dd className="mt-1 text-sm font-semibold text-ink">
                  {healthy ? 'Sağlıklı' : d?.sonHataOzeti ? 'Dikkat gerekli' : 'Bağlı'}
                </dd>
              </div>
            </dl>

            {showSharedTestBadges && d?.sharedWebhookTestConnection ? (
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge variant="success" className="normal-case tracking-normal">
                  WhatsApp API bağlı
                </Badge>
                <Badge variant="default" className="normal-case tracking-normal">
                  Webhook paylaşılmış/test bağlantısı
                </Badge>
              </div>
            ) : null}
            {!statusFailed && d?.webhookOverrideActive ? (
              <div className="mt-3">
                <Badge variant="primary" className="normal-case tracking-normal">
                  Webhook override aktif
                </Badge>
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {!statusFailed && isYonetici && d?.durum === 'ONAY_BEKLIYOR' && d.connectionMode === 'CLOUD_API' ? (
        <div className="rounded-xl border border-warning/40 bg-warning-soft/60 p-4" data-testid="wa-phone-register">
          <p className="text-sm font-semibold text-ink">Telefon kaydını tamamlayın</p>
          <p className="mt-1 text-sm text-ink-muted">
            Bu numara Cloud API’ye henüz kayıtlı değil. Numaranın iki adımlı doğrulama PIN’ini (6 hane) girin.
            WhatsApp Business uygulamasında kullanılan numaralar için bu işlem sunucu tarafından engellenir.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              type="password"
              inputMode="numeric"
              autoComplete="off"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-32 rounded-md border border-border bg-white px-3 py-2 text-sm"
              aria-label="Telefon kayıt PIN"
            />
            <Button type="button" onClick={() => void onTelefonKaydi()} disabled={pin.length !== 6}>
              Kaydı tamamla
            </Button>
          </div>
        </div>
      ) : null}

      {!statusFailed && mesajQuery.data?.baglantiVar && mesajQuery.data.basariKriterleri ? (
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm" data-testid="wa-success-criteria">
          <p className="text-sm font-semibold text-ink">Canlı başarı ölçütleri</p>
          <ul className="mt-2 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2">
            {(
              [
                ['metaConnectedCloudApi', 'Meta: CONNECTED + Cloud API', coex?.metaStatusCheckedAt ?? null],
                ['bagli', 'Müvekkil Kasa bağlantısı aktif', d?.connectedAt ?? null],
                ['gelenMesajAlindi', 'Gelen mesaj alındı', mesajQuery.data.sonGelenMesajAt ?? null],
                ['gidenMesajTeslimEdildi', 'Giden mesaj teslim edildi', mesajQuery.data.sonTeslimAt ?? mesajQuery.data.sonOkunduAt ?? null]
              ] as const
            ).map(([key, label, at]) => {
              const ok = mesajQuery.data!.basariKriterleri![key]
              return (
                <li key={key} className="flex items-center justify-between gap-2 rounded-md bg-surface-muted/30 px-3 py-2">
                  <span className="text-ink">{label}</span>
                  <Badge variant={ok ? 'success' : 'default'} className="normal-case tracking-normal">
                    {ok ? `Evet${at ? ` · ${formatTrDate(at)}` : ''}` : 'Bekleniyor'}
                  </Badge>
                </li>
              )
            })}
          </ul>
          {mesajQuery.data.sonTelefondanGonderimAt ? (
            <p className="mt-2 text-xs text-ink-muted">
              Telefondaki WhatsApp Business’tan son gönderim: {formatTrDate(mesajQuery.data.sonTelefondanGonderimAt)}
            </p>
          ) : null}
        </div>
      ) : null}

      {!statusFailed && showCoexPanel && coex ? (
        <div className="rounded-xl border border-border bg-white p-4 shadow-sm" data-testid="wa-coex-panel">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold text-ink">WhatsApp Business uygulaması (Coexistence)</p>
            {coex.connectionMode === 'COEXISTENCE' ? (
              <Badge variant={coex.disconnectedAt ? 'warning' : 'success'} className="normal-case tracking-normal">
                {coex.disconnectedAt ? 'Bağlantı kesildi' : 'Coexistence aktif'}
              </Badge>
            ) : null}
            {!coex.metaUygulamaHazir ? (
              <Badge variant="warning" className="normal-case tracking-normal">
                Meta yapılandırması eksik
              </Badge>
            ) : null}
            {coex.connectionMode && !coex.webhookMuvekkileYonlu ? (
              <Badge variant="warning" className="normal-case tracking-normal">
                Webhook Müvekkil Kasa’ya yönlü değil
              </Badge>
            ) : null}
          </div>
          <dl className="mt-3 grid grid-cols-1 gap-3 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-ink-muted">Platform</dt>
              <dd className="font-semibold text-ink">{coex.platformType ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Business uygulamasında</dt>
              <dd className="font-semibold text-ink">
                {coex.isOnBizApp == null ? '—' : coex.isOnBizApp ? 'Evet' : 'Hayır'}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Meta numara durumu</dt>
              <dd className="font-semibold text-ink">
                {coex.phoneStatus ?? '—'}
                {coex.metaStatusCheckedAt ? (
                  <span className="ml-1 font-normal text-ink-muted">({formatTrDate(coex.metaStatusCheckedAt)})</span>
                ) : null}
              </dd>
            </div>
          </dl>

          {coex.disconnectedAt ? (
            <AlertBox variant="warning" title="Meta bağlantıyı kesti" className="mt-3">
              {formatTrDate(coex.disconnectedAt)} — {coex.disconnectReason ?? 'Neden bildirilmedi'}. Numara ve hesap
              bilgileri korunuyor; aynı numarayla Coexistence yeniden bağlantısı yapabilirsiniz.
            </AlertBox>
          ) : null}

          {coex.connectionMode === 'COEXISTENCE' && coex.onboardedAt ? (
            <div className="mt-3 rounded-lg border border-border/70 bg-surface-muted/30 p-3">
              <p className="text-sm font-semibold text-ink">Kişi ve geçmiş eşitleme</p>
              <p className="mt-0.5 text-sm text-ink-muted">
                {coex.syncWindowOpen
                  ? `Son tarih: ${formatTrDate(coex.syncDeadline)}. Meta her tür için tek istek kabul eder.`
                  : `Eşitleme süresi doldu (${formatTrDate(coex.syncDeadline)}).`}
              </p>
              <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(['KISILER', 'GECMIS'] as const).map((tur) => {
                  const s = coex.eslestirme[tur]
                  const canRequest =
                    isYonetici && coex.syncWindowOpen && coex.tokenUygulamasiUyumlu && (!s || s.durum === 'BASARISIZ')
                  return (
                    <div key={tur} className="flex items-center justify-between gap-2 rounded-md bg-white px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-ink">{tur === 'KISILER' ? 'Kişiler' : 'Mesaj geçmişi'}</p>
                        <p className="text-xs text-ink-muted">{syncDurumEtiket(s)}</p>
                      </div>
                      {canRequest ? (
                        <Button type="button" size="sm" variant="outline" onClick={() => void onCoexistenceEsitle(tur)}>
                          Eşitle
                        </Button>
                      ) : null}
                    </div>
                  )
                })}
              </div>
            </div>
          ) : null}

          {isYonetici ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {d?.yenidenBaglanabilir ? (
                <Button type="button" size="sm" variant="ghost" onClick={() => void onCoexistenceMetaDurum()}>
                  Meta durumunu yenile
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {statusFailed ? null : !connected ? (
        <div className="space-y-3">
          {!isYonetici ? (
            <p className="text-sm text-ink-muted">Bağlantı yalnızca büro sahibi / yönetici tarafından yapılabilir.</p>
          ) : null}
          {isYonetici && configQuery.data && !configQuery.data.configured ? (
            <AlertBox variant="warning" title="Yapılandırma eksik">
              Meta App ID, Embedded Signup Config ID, App Secret veya webhook adresi / doğrulama anahtarı tanımlı
              değil.
            </AlertBox>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {d?.sonHataOzeti ? (
            <AlertBox variant="warning" title="Son hata">
              {d.sonHataOzeti}
            </AlertBox>
          ) : null}

          {isYonetici ? (
            <div className="rounded-xl border border-border bg-white p-4 shadow-sm">
              <p className="text-sm font-semibold text-ink">Bağlantı işlemleri</p>
              <p className="mt-1 text-sm text-ink-muted">
                Doğrulama, şablon senkronu ve bağlantıyı kaldırma.
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={() => void onDogrula()}>
                  Bağlantıyı doğrula
                </Button>
                <Button type="button" variant="outline" onClick={() => void onSenkron()}>
                  Şablonları senkronize et
                </Button>
                {canCoexReconnect ? (
                  <Button
                    type="button"
                    variant="outline"
                    disabled={busy || coexMu.isPending}
                    onClick={() => void onCoexistenceYenidenBaglan()}
                    data-testid="wa-coex-reconnect"
                  >
                    Yeniden bağla (Coexistence)
                  </Button>
                ) : null}
                <Button type="button" variant="danger" onClick={() => void onKaldir()}>
                  Bağlantıyı kaldır
                </Button>
              </div>
            </div>
          ) : null}
        </div>
      )}

      <div
        className="rounded-xl border border-dashed border-border bg-surface-muted/20 px-4 py-3"
        data-testid="wa-help-section"
      >
        <p className="text-sm font-semibold text-ink">Yardım ve kurulum</p>
        <p className="mt-0.5 text-sm text-ink-muted">Rehberler ve bağlantıyı yeniden deneme.</p>
        <div className="mt-2.5 flex flex-wrap gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => openOnboarding('guide')}>
            WhatsApp Kurulum Rehberi
          </Button>
          <Button type="button" variant="ghost" size="sm" onClick={() => openOnboarding('consumer_guide')}>
            Normal WhatsApp’tan Business’a Geçiş
          </Button>
          {isYonetici ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={busy || completeMu.isPending || coexMu.isPending || !configQuery.data?.configured}
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
