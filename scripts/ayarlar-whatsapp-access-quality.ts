/**
 * Node smoke: Ayarlar WhatsApp görünürlüğü tenant rolüne bağlıdır; SUPER_ADMIN bayrağı yoktur.
 * Çalıştır: npx --yes tsx scripts/ayarlar-whatsapp-access-quality.ts
 */
import assert from 'node:assert/strict'
import {
  buildAyarlarNavItems,
  resolveAyarlarAccess
} from '../src/components/ayarlar/ayarlarSections.ts'
import type { AuthUserDto } from '../src/types/auth.ts'

const roles: AuthUserDto['role'][] = ['BURO_SAHIBI', 'AVUKAT_YONETICI', 'KATIP_PERSONEL']

for (const role of roles) {
  const access = resolveAyarlarAccess(role)
  const ids = buildAyarlarNavItems(access).map((i) => i.id)
  assert.equal(access.canViewWhatsApp, true, `${role} canViewWhatsApp`)
  assert.ok(ids.includes('whatsapp'), `${role} nav whatsapp`)
  assert.ok(ids.includes('whatsapp-sablonlari'), `${role} nav whatsapp-sablonlari`)
  assert.equal(access.canManageWhatsApp, role !== 'KATIP_PERSONEL', `${role} manage`)
}

const linkedOwner = resolveAyarlarAccess('BURO_SAHIBI')
assert.equal(linkedOwner.canViewWhatsApp, true)
assert.equal(linkedOwner.canManageWhatsApp, true)
const linkedNav = buildAyarlarNavItems(linkedOwner)
assert.ok(linkedNav.some((i) => i.id === 'whatsapp'))
assert.ok(linkedNav.some((i) => i.id === 'whatsapp-sablonlari'))
const whatsappIdx = linkedNav.findIndex((i) => i.id === 'whatsapp')
const sablonIdx = linkedNav.findIndex((i) => i.id === 'whatsapp-sablonlari')
assert.ok(sablonIdx === whatsappIdx + 1, 'whatsapp-sablonlari hemen whatsapp altında')

assert.equal(resolveAyarlarAccess(undefined).canViewWhatsApp, false)

console.log('ayarlar-whatsapp-access-quality: OK')
