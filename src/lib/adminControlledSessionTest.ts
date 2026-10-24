import { normalizeTurkiyePhoneForWhatsApp } from './whatsapp'

/** Backend `CONTROLLED_SESSION_TEST_TEXT` ile aynı olmalı (gönderilen metni backend belirler). */
export const CONTROLLED_SESSION_TEST_TEXT = 'Müvekkil Kasa WhatsApp API bağlantı testi.'

/** Yalnızca TR cep numarası; dönüş 905XXXXXXXXX ya da null. */
export function normalizeControlledTestPhone(raw: string): string | null {
  const n = normalizeTurkiyePhoneForWhatsApp(raw.trim())
  return n && n.startsWith('905') ? n : null
}

/** 905325158507 → "+90 532 *** ** 07" */
export function maskControlledTestPhone(normalized: string): string {
  return `+90 ${normalized.slice(2, 5)} *** ** ${normalized.slice(-2)}`
}

export function controlledTestConfirmMessage(normalized: string): string {
  return [
    `Alıcı: ${maskControlledTestPhone(normalized)}`,
    '',
    'Gönderilecek sabit metin:',
    `“${CONTROLLED_SESSION_TEST_TEXT}”`,
    '',
    'Meta yalnızca alıcı son 24 saat içinde bu işletme numarasına mesaj yazdıysa kabul eder. Aynı gün aynı numaraya ikinci gönderim yapılmaz.'
  ].join('\n')
}

type ApiErrorLike = { status?: number; code?: string; message?: string }

const META_HATA: Record<string, string> = {
  META_131047:
    'Meta reddetti: 24 saatlik müşteri hizmetleri penceresi kapalı. Alıcı son 24 saatte bu işletme numarasına mesaj yazmamış.',
  META_131026: 'Meta reddetti: mesaj alıcıya ulaştırılamıyor (numara WhatsApp kullanmıyor olabilir).',
  META_131030: 'Meta reddetti: alıcı numara izin verilen alıcılar listesinde değil.',
  META_190: 'Meta reddetti: WhatsApp erişim anahtarı geçersiz veya süresi dolmuş.',
  META_130429: 'Meta reddetti: Meta gönderim hız sınırına ulaşıldı. Bir süre sonra tekrar deneyin.',
  META_131056: 'Meta reddetti: bu alıcıya kısa sürede çok fazla mesaj gönderildi.',
  META_80007: 'Meta reddetti: WhatsApp hesabı hız sınırına ulaştı.',
  META_100: 'Meta reddetti: istek parametresi geçersiz.',
  META_131000: 'Meta tarafında beklenmeyen bir hata oluştu.'
}

/** Kullanıcıya gösterilecek Türkçe açıklama — ham teknik mesaj gösterilmez. */
export function controlledTestErrorMessage(err: ApiErrorLike): string {
  const status = err.status ?? 0
  const code = err.code ?? ''
  if (status === 0) {
    return 'Sunucuya ulaşılamadı. İsteğin işlenip işlenmediği bilinmiyor; durumu kontrol etmeden yeniden denemeyin.'
  }
  if (status === 401) return 'Admin oturumunuzun süresi doldu. Sayfayı yenileyip tekrar giriş yapın.'
  if (status === 403) {
    return code === 'ADMIN_INACTIVE'
      ? 'Admin hesabınız pasif; bu işlem yapılamaz.'
      : 'Bu test yalnızca aktif SUPER_ADMIN hesapları tarafından başlatılabilir.'
  }
  if (status === 409) {
    return code === 'OVERRIDE_ACTIVE_NOT_ALLOWED'
      ? 'Güvenlik kontrolü testi engelledi: etkin webhook hedefi Müvekkil Kasa olarak doğrulanamadı. Webhook yönlendirmesini kontrol edin.'
      : 'İşlem mevcut bağlantı durumuyla çakışıyor; test başlatılmadı.'
  }
  if (status === 429) {
    return 'Kısa sürede çok fazla deneme yapıldı (dakikada en fazla 3). Bir dakika bekleyip tekrar deneyin.'
  }
  if (code === 'WHATSAPP_NOT_CONNECTED') return 'Bu büronun WhatsApp bağlantısı aktif değil.'
  if (code === 'INVALID_PHONE') return 'Alıcı telefon numarası geçersiz.'
  if (code === 'TEST_ANCHOR_MISSING') {
    return 'Test kaydı için büroda en az bir müvekkil ve taksit kaydı gerekiyor.'
  }
  if (code === 'FEATURE_DISABLED') return 'WhatsApp Cloud API sunucuda kapalı; test yapılamaz.'
  if (code === 'NO_MESSAGE_ID') {
    return 'Meta mesaj kimliği döndürmedi; gönderim kabul edilmiş sayılmaz.'
  }
  if (META_HATA[code]) return META_HATA[code]
  if (code.startsWith('META_')) return `Meta gönderimi reddetti (Meta kodu ${code.slice(5)}).`
  if (code.startsWith('HTTP_')) return `Meta'ya istek başarısız oldu (HTTP ${code.slice(5)}).`
  if (status === 400) return 'İstek geçersiz; test başlatılmadı.'
  return 'Test gönderimi başarısız oldu.'
}

/**
 * Gönderim denenmiş olabilecek sonuçlarda aynı numaraya tekrar istek kilitlenir:
 * ağ hatası (sonuç bilinmiyor) ve Meta/gönderim hataları (502).
 */
export function controlledTestShouldLock(err: ApiErrorLike): boolean {
  const status = err.status ?? 0
  return status === 0 || status === 502
}
