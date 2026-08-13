/**
 * Onboarding yardımcılar — vitest yok; tsx ile duman testi.
 *   npx tsx scripts/whatsapp-onboarding-smoke.ts
 */
import assert from 'node:assert/strict'
import { WHATSAPP_HELP_LINKS } from '../src/config/whatsappHelpLinks.ts'
import { classifySignupFailure } from '../src/components/ayarlar/whatsappOnboarding/classifySignupError.ts'

assert.equal(
  WHATSAPP_HELP_LINKS.playStoreBusiness,
  'https://play.google.com/store/apps/details?id=com.whatsapp.w4b'
)
assert.equal(
  WHATSAPP_HELP_LINKS.appStoreBusiness,
  'https://apps.apple.com/app/whatsapp-business/id1386412985'
)
assert.ok(WHATSAPP_HELP_LINKS.faqChatBackup.includes('faq.whatsapp.com'))
assert.ok(WHATSAPP_HELP_LINKS.faqMoveMessengerToBusiness.includes('faq.whatsapp.com'))
assert.ok(WHATSAPP_HELP_LINKS.faqDownloadBusiness.includes('faq.whatsapp.com'))
assert.ok(WHATSAPP_HELP_LINKS.businessHome.includes('whatsapp.com/business'))

assert.equal(classifySignupFailure('Meta oturumu tamamlanmadı veya iptal edildi.'), 'cancelled')
assert.equal(classifySignupFailure('WABA / telefon bilgisi alınamadı'), 'consumer_not_ready')
assert.equal(classifySignupFailure(new Error('Bu numara henüz WhatsApp Business’a hazır olmayabilir.')), 'consumer_not_ready')
assert.equal(classifySignupFailure('network timeout'), 'generic')

console.log(JSON.stringify({ ok: true, links: Object.keys(WHATSAPP_HELP_LINKS).length }))
