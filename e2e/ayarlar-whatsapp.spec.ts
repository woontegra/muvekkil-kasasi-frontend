import { expect, test } from '@playwright/test'
import { loadE2eEnv, requireE2eUser } from './helpers/env'

loadE2eEnv()

async function loginAs(page: import('@playwright/test').Page, user: string, pass: string): Promise<void> {
  await page.goto('/login')
  await page.getByLabel(/e-posta veya kullanıcı/i).fill(user)
  await page.getByRole('textbox', { name: /^Şifre$/i }).fill(pass)
  await page.getByRole('button', { name: /giriş yap/i }).click()
  await expect(page).toHaveURL(/\/app(\/|$)/, { timeout: 30_000 })
}

async function expectWhatsAppAyarlari(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/app/ayarlar')
  await expect(page.getByRole('heading', { name: /^Ayarlar$/i })).toBeVisible({ timeout: 20_000 })

  const navWhatsApp = page.getByRole('navigation', { name: /Ayar kategorileri/i }).getByRole('button', {
    name: /^WhatsApp$/i
  })
  const mobileSelect = page.locator('select').filter({ has: page.locator('option', { hasText: 'WhatsApp' }) })

  if (await navWhatsApp.isVisible().catch(() => false)) {
    await expect(navWhatsApp).toBeVisible()
    await navWhatsApp.click()
  } else {
    await expect(mobileSelect).toBeVisible()
    await mobileSelect.selectOption('whatsapp')
  }

  await expect(page).toHaveURL(/bolum=whatsapp/)
  await expect(page.getByText(/WhatsApp Bağlantısı/i)).toBeVisible()
  await expect(page.getByText(/Hazır Şablon Kütüphanesi/i)).toBeVisible()
}

test.describe('Ayarlar → WhatsApp (tenant rolü)', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('BURO_SAHIBI WhatsApp sekmesini görür', async ({ page }) => {
    const { user, password } = requireE2eUser()
    await loginAs(page, user, password)
    await expectWhatsAppAyarlari(page)
  })
})

test.describe('Linked SUPER_ADMIN + BURO_SAHIBI', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  const user = process.env.E2E_LINKED_ADMIN_USER
  const pass = process.env.E2E_LINKED_ADMIN_PASSWORD

  test.skip(!user || !pass, 'E2E_LINKED_ADMIN_USER/PASSWORD yok')

  test('tenant login sonrası WhatsApp + Admin Paneli birlikte görünür', async ({ page }) => {
    await loginAs(page, user!, pass!)
    await expect(page.getByRole('button', { name: /Admin Paneli/i })).toBeVisible({ timeout: 20_000 })

    await expectWhatsAppAyarlari(page)
    const bagla = page.getByRole('button', { name: /WhatsApp Business/i })
    const bagliBadge = page.getByText(/^Bağlı$/i)
    await expect(bagla.or(bagliBadge).first()).toBeVisible()
  })
})
