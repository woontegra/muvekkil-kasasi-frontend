import { expect, test } from '@playwright/test'
import { loadE2eEnv, requireE2eUser } from './helpers/env'

loadE2eEnv()

const EXPECTED_TEMPLATE_NAMES = [
  'Vadeden Önce Hatırlatma',
  'Vade Günü Hatırlatma',
  'Gecikmiş Ödeme Hatırlatma',
  'Kısmi Ödeme Sonrası Kalan Tutar',
  'Genel Taksit Hatırlatma',
  'Ödeme Alındı Bilgilendirmesi'
]

async function loginAs(page: import('@playwright/test').Page, user: string, pass: string): Promise<void> {
  await page.goto('/login')
  await page.getByLabel(/e-posta veya kullanıcı/i).fill(user)
  await page.getByRole('textbox', { name: /^Şifre$/i }).fill(pass)
  await page.getByRole('button', { name: /giriş yap/i }).click()
  await expect(page).toHaveURL(/\/app(\/|$)/, { timeout: 30_000 })
}

async function openWhatsAppSablonlari(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/app/ayarlar')
  await expect(page.getByRole('heading', { name: /^Ayarlar$/i })).toBeVisible({ timeout: 20_000 })

  const navItem = page.getByRole('navigation', { name: /Ayar kategorileri/i }).getByRole('button', {
    name: /^WhatsApp Şablonları$/i
  })
  const mobileSelect = page.locator('select').filter({
    has: page.locator('option', { hasText: 'WhatsApp Şablonları' })
  })

  if (await navItem.isVisible().catch(() => false)) {
    await navItem.click()
  } else {
    await mobileSelect.selectOption('whatsapp-sablonlari')
  }

  await expect(page).toHaveURL(/bolum=whatsapp-sablonlari/)
  await expect(page.getByRole('heading', { name: /^WhatsApp Şablonları$/i })).toBeVisible()
}

test.describe('Ayarlar → WhatsApp Şablonları', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('kütüphane kompakt kartlarda listelenir, detay modal ile açılır', async ({ page }) => {
    const { user, password } = requireE2eUser()
    await loginAs(page, user, password)
    await openWhatsAppSablonlari(page)

    await expect(page.getByText(/Toplam hazır şablon:/i)).toBeVisible()
    for (const name of EXPECTED_TEMPLATE_NAMES) {
      await expect(page.getByRole('heading', { name })).toBeVisible()
    }

    const firstInspect = page.getByRole('button', { name: /^İncele$/i }).first()
    await firstInspect.click()
    await expect(page.getByText(/Mesaj önizlemesi/i)).toBeVisible()
    await expect(page.getByText(/Meta şablon adı/i)).toBeVisible()
    await page.getByRole('button', { name: /^✕$/i }).click()
    await expect(page.getByText(/Mesaj önizlemesi/i)).toHaveCount(0)
  })

  test('Şablonlara Git otomasyon sayfasından yönlendirir', async ({ page }) => {
    const { user, password } = requireE2eUser()
    await loginAs(page, user, password)

    await page.goto('/app/ayarlar?bolum=whatsapp')
    const link = page.getByRole('link', { name: /Şablonlara Git/i }).first()
    if (await link.isVisible().catch(() => false)) {
      await link.click()
      await expect(page).toHaveURL(/bolum=whatsapp-sablonlari/)
    }
  })
})
