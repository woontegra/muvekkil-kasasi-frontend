import { test, expect } from '@playwright/test'
import { assertEditableTextField, assertMoneyField } from './helpers/inputMatrix'

const stamp = Date.now()
const muvekkilAd = `E2E Müvekkil ${stamp}`
const dosyaBaslik = `E2E Dosya ${stamp}`

async function waitAppReady(page: import('@playwright/test').Page): Promise<void> {
  await expect(page.getByText(/oturum doğrulanıyor/i)).toHaveCount(0, { timeout: 30_000 })
  await expect(page).not.toHaveURL(/\/login/)
}

test.describe.serial('Temel kullanıcı akışları', () => {
  let muvekkilUrl = ''
  let dosyaUrl = ''

  test('ana sayfa ve menü yüklenir', async ({ page }) => {
    await page.goto('/app')
    await waitAppReady(page)
    await expect(page.getByRole('navigation').or(page.locator('aside')).first()).toBeVisible()
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))
    await page.goto('/app/muvekkiller/yeni')
    await waitAppReady(page)
    await page.waitForTimeout(400)
    const critical = errors.filter((e) => !/ResizeObserver|Non-Error/i.test(e))
    expect(critical, critical.join('\n')).toEqual([])
  })

  test('müvekkil oluştur — input matrisi + kayıt', async ({ page }) => {
    await page.goto('/app/muvekkiller/yeni')
    await waitAppReady(page)
    const ad = page.getByLabel(/^ad soyad$/i)
    await assertEditableTextField(page, ad)
    await ad.fill(muvekkilAd)

    const telefon = page.getByLabel(/^telefon$/i)
    await telefon.fill('05321234567')
    await expect(telefon).toHaveValue(/05321234567|5321234567/)

    const not = page.getByLabel(/^not$/i)
    if (await not.isVisible().catch(() => false)) {
      await not.fill('E2E not Ğüşiöç')
      await expect(not).toHaveValue(/E2E not/)
    }

    const kaydet = page.getByRole('button', { name: /kaydet|oluştur/i }).first()
    await kaydet.click()
    await expect(page).toHaveURL(/\/muvekkil\//, { timeout: 20_000 })
    await waitAppReady(page)
    muvekkilUrl = page.url()
    await expect(page.getByText(muvekkilAd).first()).toBeVisible()
  })

  test('müvekkil arama ve liste yenileme', async ({ page }) => {
    test.skip(!muvekkilUrl, 'Müvekkil oluşmadı')
    await page.goto('/app')
    await waitAppReady(page)
    const search = page.getByPlaceholder(/ara|müvekkil|dosya/i).first()
    if (await search.isVisible().catch(() => false)) {
      await assertEditableTextField(page, search, { turkish: true })
      await search.fill(muvekkilAd.slice(0, 12))
    }
    await expect(page.getByText(muvekkilAd).first()).toBeVisible({ timeout: 15_000 })
    await page.reload()
    await waitAppReady(page)
    await expect(page.getByText(muvekkilAd).first()).toBeVisible({ timeout: 15_000 })
  })

  test('dosya oluştur', async ({ page }) => {
    test.skip(!muvekkilUrl, 'Müvekkil oluşmadı')
    await page.goto(muvekkilUrl)
    await waitAppReady(page)
    const yeniDosya = page.getByRole('link', { name: /yeni dosya|dosya ekle/i }).or(
      page.getByRole('button', { name: /yeni dosya|dosya ekle/i })
    )
    await yeniDosya.first().click()
    await expect(page).toHaveURL(/dosyalar\/yeni/, { timeout: 15_000 })
    await waitAppReady(page)

    const baslik = page.getByLabel(/konu başlığı/i)
    await assertEditableTextField(page, baslik)
    await baslik.fill(dosyaBaslik)

    const aciklama = page.getByLabel(/açıklama/i)
    if (await aciklama.isVisible().catch(() => false)) {
      await aciklama.fill('E2E dosya açıklaması')
    }

    const kaydet = page.getByRole('button', { name: /kaydet|oluştur/i }).first()
    await kaydet.click()
    await expect(page).toHaveURL(/\/dosya\//, { timeout: 20_000 })
    await waitAppReady(page)
    dosyaUrl = page.url()
    await expect(page.getByText(dosyaBaslik).first()).toBeVisible()
  })

  test('dosya sekmeleri ve deep link', async ({ page }) => {
    test.skip(!dosyaUrl, 'Dosya oluşmadı')
    await page.goto(dosyaUrl)
    await waitAppReady(page)
    await expect(page.getByText(dosyaBaslik).first()).toBeVisible({ timeout: 20_000 })

    const tabNames = [
      'Kasa Hareketleri',
      'Anlaşılan vekalet ücreti ve taksitler',
      'SMM Takibi',
      'Makbuzlar',
      'Müvekkil Ekstresi',
      'Hesap Özeti',
      'Mali Özet'
    ]
    for (const name of tabNames) {
      const btn = page.getByRole('button', { name, exact: true })
      await expect(btn).toBeVisible()
      await btn.click()
      await page.waitForTimeout(250)
    }

    // Deep link: ?tab=ekstre
    await page.goto(`${dosyaUrl.split('?')[0]}?tab=ekstre`)
    await waitAppReady(page)
    await expect(page.getByRole('button', { name: 'Müvekkil Ekstresi', exact: true })).toHaveClass(
      /ring-2/
    )
  })

  test('vekalet ücreti / para alanı', async ({ page }) => {
    test.skip(!dosyaUrl, 'Dosya oluşmadı')
    await page.goto(dosyaUrl)
    await waitAppReady(page)
    await page.getByRole('button', { name: 'Anlaşılan vekalet ücreti ve taksitler', exact: true }).click()
    const ekle = page.getByRole('button', { name: /vekalet|plan|ekle|tanımla|oluştur/i }).first()
    if (!(await ekle.isVisible().catch(() => false))) {
      test.skip(true, 'Vekalet ekleme butonu yok')
    }
    await ekle.click()
    const money = page.locator('input[inputmode="decimal"], input[placeholder="0,00"]').first()
    if (await money.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await assertMoneyField(page, money)
    }
    await expect(page.locator('[role="dialog"], .fixed.inset-0').first()).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('Tahsilat / Bildirim / Ofis / Ayarlar sayfaları açılır', async ({ page }) => {
    for (const path of [
      '/app/tahsilat-merkezi',
      '/app/bildirim-merkezi',
      '/app/ofis-kasasi',
      '/app/icra-tahsilat',
      '/app/raporlar',
      '/app/ayarlar',
      '/app/kullanicilar'
    ]) {
      await page.goto(path)
      await waitAppReady(page)
      await expect(page.locator('body')).not.toContainText(/Unexpected Application Error/i)
      await expect(page).not.toHaveURL(/\/login/)
    }
  })

  test('Bildirim ayarları — şablon yazılabilir (test modu)', async ({ page }) => {
    await page.goto('/app/ayarlar')
    await waitAppReady(page)
    const card = page.getByText(/otomatik tahsilat bildirimleri/i)
    if (!(await card.isVisible().catch(() => false))) {
      test.skip(true, 'Bildirim ayar kartı yok (yetki?)')
    }
    const textarea = page.getByLabel(/gönderilecek mesaj/i).first()
    if (await textarea.isVisible().catch(() => false)) {
      const before = await textarea.inputValue()
      await textarea.click()
      await textarea.type(' E2E', { delay: 20 })
      await expect(textarea).toHaveValue(new RegExp(`${before.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} E2E`))
      await page.waitForTimeout(1500)
      await expect(textarea).toHaveValue(/E2E/)
      await textarea.fill(before)
    }
  })

  test('temizlik — müvekkil silme veya işaretleme', async ({ page }) => {
    test.skip(!muvekkilUrl, 'Müvekkil yok')
    await page.goto(muvekkilUrl)
    await waitAppReady(page)
    const sil = page.getByRole('button', { name: /sil|pasif|arşiv/i }).first()
    if (await sil.isVisible().catch(() => false)) {
      await sil.click()
      const onay = page.getByRole('button', { name: /onayla|sil|evet|tamam/i }).last()
      if (await onay.isVisible().catch(() => false)) await onay.click()
    }
  })
})
