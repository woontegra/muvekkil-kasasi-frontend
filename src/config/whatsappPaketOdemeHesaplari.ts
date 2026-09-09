/**
 * WhatsApp ek mesaj paketi — Havale/EFT ödeme hesapları (tek kaynak).
 * Modal / başarı / bekleyen talep detayı aynı listeyi kullanır.
 */
export type WhatsAppPaketOdemeHesabi = {
  id: string
  bankaAdi: string
  hesapSahibi: string
  /** Boşluksuz IBAN — kopyalama değeri. */
  iban: string
}

export const WHATSAPP_PAKET_ODEME_HESAPLARI: readonly WhatsAppPaketOdemeHesabi[] = [
  {
    id: 'isbank',
    bankaAdi: 'Türkiye İş Bankası A.Ş.',
    hesapSahibi: 'Woontegra Teknoloji Yazılım ve Dijital Hizmetler Ltd. Şti.',
    iban: 'TR900006400000136600487451'
  },
  {
    id: 'enpara',
    bankaAdi: 'Enpara Bank A.Ş.',
    hesapSahibi: 'Woontegra Teknoloji Yazılım ve Dijital Hizmetler Ltd. Şti.',
    iban: 'TR710015700000000204988746'
  }
] as const

export const WHATSAPP_PAKET_ODEME_BILGI_METNI =
  'Ödemenizi aşağıdaki banka hesaplarından herhangi birine Havale/EFT ile yapabilirsiniz. Ödemeniz kontrol edilip onaylandıktan sonra satın aldığınız mesaj hakkı hesabınıza eklenecektir.'

export const WHATSAPP_PAKET_ODEME_REFERANS_BILGI_METNI =
  'Ödemenizin hızlı eşleştirilebilmesi için Havale/EFT açıklamasına bu referansı yazınız.'

/** Ekran için 4’lü gruplu IBAN. */
export function formatIbanGrouped(iban: string): string {
  const compact = iban.replace(/\s+/g, '').toUpperCase()
  return compact.replace(/(.{4})/g, '$1 ').trim()
}

export function compactIban(iban: string): string {
  return iban.replace(/\s+/g, '').toUpperCase()
}
