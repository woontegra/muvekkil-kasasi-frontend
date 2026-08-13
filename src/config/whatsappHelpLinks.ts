/**
 * Resmi WhatsApp / mağaza yardım bağlantıları.
 * Üçüncü taraf blog veya yönlendirme siteleri kullanılmaz.
 * Bir URL değişirse yalnızca burayı güncelleyin.
 */
export const WHATSAPP_HELP_LINKS = {
  /** WhatsApp Business resmi ürün sayfası */
  businessHome: 'https://www.whatsapp.com/business',

  /** Google Play — WhatsApp Business (com.whatsapp.w4b) */
  playStoreBusiness: 'https://play.google.com/store/apps/details?id=com.whatsapp.w4b',

  /** Apple App Store — WhatsApp Business (id1386412985) */
  appStoreBusiness: 'https://apps.apple.com/app/whatsapp-business/id1386412985',

  /** Yardım Merkezi — WhatsApp Business uygulamasını indirme */
  faqDownloadBusiness: 'https://faq.whatsapp.com/665643701880397',

  /** Yardım Merkezi — Messenger hesabını Business uygulamasına taşıma */
  faqMoveMessengerToBusiness: 'https://faq.whatsapp.com/3059780464322392',

  /** Yardım Merkezi — Sohbet yedeği oluşturma */
  faqChatBackup: 'https://faq.whatsapp.com/481135090640375'
} as const

export type WhatsappHelpLinkKey = keyof typeof WHATSAPP_HELP_LINKS
