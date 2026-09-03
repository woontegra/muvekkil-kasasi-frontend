/**
 * İcra tahsilat create-form doğrulama kalite scripti.
 * Çalıştır: npx tsx scripts/icra-tahsilat-create-form-quality.ts
 */
import assert from 'node:assert/strict'
import {
  buildCreateIcraTahsilatPayload,
  validateCreateIcraTahsilatForm,
  type CreateIcraFormInput
} from '../src/lib/icraTahsilatCreateForm.ts'

const USER = '11111111-1111-1111-1111-111111111111'
const PERSONEL = '22222222-2222-2222-2222-222222222222'

function base(partial: Partial<CreateIcraFormInput> = {}): CreateIcraFormInput {
  return {
    alacakTuru: 'KARSI_TARAF_VEKALET',
    borcluAd: 'Ahmet Yılmaz',
    muvekkilId: '',
    dosyaId: '',
    toplamTutarRaw: '10.000,00',
    tahsilatTipi: 'SADECE_TAKSIT',
    pesinatTutarRaw: '',
    taksitSayisiRaw: '3',
    ilkVade: '2026-09-03',
    tahsilatTarihi: '2026-09-03',
    odemeYontemi: 'NAKIT',
    personelId: '',
    currentUserId: USER,
    aciklama: '',
    ...partial
  }
}

let passed = 0
function check(name: string, fn: () => void): void {
  fn()
  passed += 1
  console.log(`✓ ${name}`)
}

check('eksik ortak alanlar → Kaydet pasif', () => {
  const issues = validateCreateIcraTahsilatForm(base({ borcluAd: '', toplamTutarRaw: '' }))
  assert.ok(issues.some((i) => i.field === 'borcluAd'))
  assert.ok(issues.some((i) => i.field === 'toplamTutar'))
})

check('toplam 0,00 → Kaydet pasif', () => {
  const issues = validateCreateIcraTahsilatForm(base({ toplamTutarRaw: '0,00' }))
  assert.ok(issues.some((i) => i.field === 'toplamTutar'))
})

check('(ben) Peşin → personelId ve userId payload’da null; User.id personel FK değil', () => {
  const built = buildCreateIcraTahsilatPayload(base({ tahsilatTipi: 'PESIN_TAHSIL', personelId: '' }))
  assert.equal(built.ok, true)
  if (built.ok) {
    assert.equal(built.payload.tahsilatiYapanPersonelId, null)
    assert.equal(built.payload.tahsilatiYapanUserId, null)
    assert.notEqual(built.payload.tahsilatiYapanPersonelId, USER)
    assert.equal(built.payload.taksitSayisi, 0)
  }
})

check('Peşin → taksit alanları zorunlu değil', () => {
  const issues = validateCreateIcraTahsilatForm(
    base({ tahsilatTipi: 'PESIN_TAHSIL', taksitSayisiRaw: '', ilkVade: '' })
  )
  assert.equal(issues.length, 0)
})

check('Açık PrimPersonel seçimi → yalnızca personelId gider', () => {
  const built = buildCreateIcraTahsilatPayload(
    base({ tahsilatTipi: 'PESIN_TAHSIL', personelId: PERSONEL })
  )
  assert.equal(built.ok, true)
  if (built.ok) {
    assert.equal(built.payload.tahsilatiYapanPersonelId, PERSONEL)
    assert.equal(built.payload.tahsilatiYapanUserId, null)
  }
})

check('Peşinat+taksit + geçerli → aktif', () => {
  const issues = validateCreateIcraTahsilatForm(
    base({
      tahsilatTipi: 'PESINAT_TAKSIT',
      pesinatTutarRaw: '2.500,00',
      taksitSayisiRaw: '3',
      personelId: ''
    })
  )
  assert.equal(issues.length, 0)
})

check('Peşinat+taksit + eksik peşinat → pasif', () => {
  const issues = validateCreateIcraTahsilatForm(
    base({ tahsilatTipi: 'PESINAT_TAKSIT', pesinatTutarRaw: '' })
  )
  assert.ok(issues.some((i) => i.field === 'pesinatTutar'))
})

check('Sadece taksit → personel opsiyonel', () => {
  const built = buildCreateIcraTahsilatPayload(base({ tahsilatTipi: 'SADECE_TAKSIT' }))
  assert.equal(built.ok, true)
  if (built.ok) {
    assert.equal(built.payload.tahsilatiYapanPersonelId, null)
    assert.equal(built.payload.tahsilatiYapanUserId, null)
  }
})

check('Personelden (ben) geçiş → eski personelId temizlenir', () => {
  const built = buildCreateIcraTahsilatPayload(
    base({ tahsilatTipi: 'PESIN_TAHSIL', personelId: '' })
  )
  assert.equal(built.ok, true)
  if (built.ok) assert.equal(built.payload.tahsilatiYapanPersonelId, null)
})

check('İlgili dosya seçilmemesi engellemez', () => {
  assert.equal(validateCreateIcraTahsilatForm(base({ dosyaId: '' })).length, 0)
})

check('Türkçe para formatları', () => {
  for (const raw of ['10000', '10.000,00', '10000,00']) {
    const built = buildCreateIcraTahsilatPayload(base({ toplamTutarRaw: raw }))
    assert.equal(built.ok, true, raw)
    if (built.ok) assert.equal(built.payload.toplamTutar, 10000)
  }
})

check('Peşinat+taksit → peşin geçişte peşinat sızmaz', () => {
  const built = buildCreateIcraTahsilatPayload(
    base({ tahsilatTipi: 'PESIN_TAHSIL', pesinatTutarRaw: '5.000,00', taksitSayisiRaw: '5' })
  )
  assert.equal(built.ok, true)
  if (built.ok) {
    assert.equal(built.payload.pesinatTutar, 0)
    assert.equal(built.payload.taksitSayisi, 0)
  }
})

console.log(`\n${passed} checks passed.`)
