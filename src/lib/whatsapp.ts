/** Türkiye cep telefonunu WhatsApp wa.me formatına dönüştürür (90XXXXXXXXXX). */
export function normalizeTurkiyePhoneForWhatsApp(telefon: string): string | null {
  const digits = telefon.replace(/\D/g, '')
  if (digits.length === 10 && digits.startsWith('5')) return `90${digits}`
  if (digits.length === 11 && digits.startsWith('0')) return `9${digits}`
  if (digits.length === 12 && digits.startsWith('90')) return digits
  return null
}

export function buildWhatsAppWebUrl(phoneE164WithoutPlus: string, message: string): string {
  return `https://wa.me/${phoneE164WithoutPlus}?text=${encodeURIComponent(message)}`
}

/** Backend planlama/otomasyon reason kodları → kullanıcıya görünen Türkçe. */
const WHATSAPP_AUTOMATION_REASON_LABELS: Record<string, string> = {
  whatsapp_automation_disabled:
    'Platform WhatsApp otomasyonu kapalı. Sunucu yapılandırmasında açılması gerekir.',
  whatsapp_automation_enabled: 'Platform WhatsApp otomasyonu açık.',
  otomasyon_kapali:
    'Büro otomasyonu kapalı. Ayarlardan otomatik hatırlatmaları açın (Aç kaydedilir).',
  otomasyon_acik: 'Büro otomasyonu açık.'
}

/**
 * Planlama sonucu `reason` alanını toast için Türkçeleştirir.
 * Bilinen snake_case kodları eşler; bilinmeyen teknik kodları ham göstermez.
 */
export function whatsappAutomationReasonLabel(
  reason: string | null | undefined,
  fallback = 'Planlama atlandı.'
): string {
  const raw = reason?.trim()
  if (!raw) return fallback
  const mapped = WHATSAPP_AUTOMATION_REASON_LABELS[raw]
  if (mapped) return mapped
  // Ham teknik kod (snake_case / SCREAMING_SNAKE) kullanıcıya gösterilmez.
  if (/^[a-z][a-z0-9_]*$/.test(raw) || /^[A-Z][A-Z0-9_]*$/.test(raw)) return fallback
  return raw
}

