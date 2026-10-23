/** Meta Embedded Signup — WhatsApp Business uygulaması (Coexistence) özelliği. */
export const BUSINESS_APP_FEATURE_TYPE = 'whatsapp_business_app_onboarding'

/**
 * FB.login seçenekleri. `extras.version` bilerek verilmez: Meta 15 Ekim 2026'dan beri sürümsüz
 * istekleri v4 olarak sunar ve v4 için geçerli bir `version` değeri yoktur. v5 oturum nesnesi
 * `waba_id` döndürmediğinden v5'e geçilmez.
 */
export function buildEmbeddedSignupLoginOptions(configId: string): Record<string, unknown> {
  return {
    config_id: configId,
    response_type: 'code',
    override_default_response_type: true,
    extras: {
      setup: {},
      featureType: BUSINESS_APP_FEATURE_TYPE,
      sessionInfoVersion: '3'
    }
  }
}

/**
 * v4 "önce telefon numarası" akışı: ilk ekran her iki akışta da numara ekleme ekranıdır; Business App
 * numarası listelenmez, elle yazıldığında Meta Coexistence akışına (profil → QR) kendisi geçer.
 */
export function coexistenceReconnectGuidance(displayPhoneNumber?: string | null): string {
  const numara = displayPhoneNumber?.trim() ? displayPhoneNumber.trim() : 'kayıtlı numaranızı'
  return [
    `Meta penceresi “WhatsApp telefon numaranızı ekleyin” ekranıyla açılır; bu Meta’nın güncel akışıdır. Numara listede görünmese de ${numara} ülke koduyla elle yazın.`,
    'Meta numaranın WhatsApp Business uygulamasında kullanıldığını algılayınca işletme profilinizi gösterir ve telefondaki WhatsApp Business uygulamasından QR kod okutmanızı ister.',
    'SMS veya sesli arama ile doğrulama kodu istenirse devam etmeyin ve pencereyi kapatın: bu Coexistence değil, yeni numara kaydıdır.',
    'Telefondaki uygulama çalışmaya devam eder; bağlı ek cihazların (WhatsApp Web vb.) oturumu kapanabilir. Farklı hesap veya numara seçilirse işlem hiçbir değişiklik yapmadan durur.'
  ].join(' ')
}
