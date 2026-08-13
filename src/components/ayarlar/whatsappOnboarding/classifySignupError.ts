export type SignupFailureKind = 'consumer_not_ready' | 'cancelled' | 'generic'

/**
 * Embedded Signup / Meta hata metinlerinden kullanıcı dostu kategori üretir.
 * Ham Meta mesajını olduğu gibi göstermez; kurtarma akışına yönlendirir.
 */
export function classifySignupFailure(raw: unknown): SignupFailureKind {
  const msg = (raw instanceof Error ? raw.message : String(raw ?? '')).toLowerCase()

  if (
    /iptal|cancel|kapatıldı|closed|user.?denied|access.?denied|oturumu tamamlanmadı/.test(msg)
  ) {
    return 'cancelled'
  }

  if (
    /consumer|messenger|normal whatsapp|kişisel|personal|not.?eligible|already.?registered|numara.*whatsapp|whatsapp.*numara|business.?app|coexistence|waba|telefon bilgisi alınamadı|phone.?number/.test(
      msg
    )
  ) {
    return 'consumer_not_ready'
  }

  return 'generic'
}

export function isConsumerNotReadyFailure(raw: unknown): boolean {
  return classifySignupFailure(raw) === 'consumer_not_ready'
}
