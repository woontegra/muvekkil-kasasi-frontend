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
