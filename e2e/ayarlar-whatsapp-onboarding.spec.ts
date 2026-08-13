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

async function openWhatsAppSection(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/app/ayarlar?bolum=whatsapp')
  await expect(page.getByText(/WhatsApp Bağlantısı/i)).toBeVisible({ timeout: 20_000 })
}

test.describe('WhatsApp bağlantı onboarding', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test('Bağla → önce onboarding; Normal WhatsApp → Meta yok, rehber açılır', async ({ page }) => {
    const { user, password } = requireE2eUser()
    await loginAs(page, user, password)
    await openWhatsAppSection(page)

    const bagla = page.getByTestId('wa-connect-cta')
    const bagli = page.getByText(/^Bağlı$/i)
    if (await bagli.isVisible().catch(() => false)) {
      test.skip(true, 'Tenant zaten bağlı — onboarding CTA yok')
    }

    await expect(bagla).toBeVisible()
    await bagla.click()
    await expect(page.getByTestId('wa-onboarding-modal')).toBeVisible()
    await expect(page.getByTestId('wa-onboarding-chooser')).toBeVisible()
    await expect(page.getByText(/WhatsApp Numaranızı Bağlayalım/i)).toBeVisible()

    // FB SDK henüz yüklenmemeli (Meta popup yok)
    const fbSdk = page.locator('#facebook-jssdk')
    await expect(fbSdk).toHaveCount(0)

    await page.getByTestId('wa-choice-consumer').click()
    await expect(page.getByTestId('wa-consumer-intro')).toBeVisible()
    await expect(fbSdk).toHaveCount(0)

    await page.getByTestId('wa-start-consumer-guide').click()
    await expect(page.getByTestId('wa-consumer-guide')).toBeVisible()
    await expect(fbSdk).toHaveCount(0)

    await page.getByTestId('wa-guide-next').click()
    await expect(page.getByTestId('wa-link-play')).toBeVisible()
    await expect(page.getByTestId('wa-link-appstore')).toBeVisible()

    await page.getByTestId('wa-guide-back').click()
    await expect(page.getByText(/yedekleyin/i)).toBeVisible()
  })

  test('Nasıl Bağlanır + Emin değilim + Business yolu', async ({ page }) => {
    const { user, password } = requireE2eUser()
    await loginAs(page, user, password)
    await openWhatsAppSection(page)

    await expect(page.getByTestId('wa-help-section')).toBeVisible()
    await page.getByTestId('wa-how-to-connect').first().click()
    await expect(page.getByTestId('wa-help-hub')).toBeVisible()

    await page.getByTestId('wa-help-chooser').click()
    await expect(page.getByTestId('wa-onboarding-chooser')).toBeVisible()

    await page.getByTestId('wa-choice-unsure').click()
    await expect(page.getByTestId('wa-unsure')).toBeVisible()
    await page.getByTestId('wa-unsure-business').click()
    await expect(page.getByTestId('wa-business-info')).toBeVisible()
    await expect(page.getByTestId('wa-business-connect')).toBeVisible()
  })

  test('Yeni numara seçeneği Bağlantıya Devam Et gösterir', async ({ page }) => {
    const { user, password } = requireE2eUser()
    await loginAs(page, user, password)
    await openWhatsAppSection(page)

    const bagla = page.getByTestId('wa-connect-cta')
    if (!(await bagla.isVisible().catch(() => false))) {
      test.skip(true, 'Bağla CTA yok')
    }
    await bagla.click()
    await page.getByTestId('wa-choice-new').click()
    await expect(page.getByTestId('wa-new-number-info')).toBeVisible()
    await expect(page.getByTestId('wa-new-connect')).toBeVisible()
  })
})

test.describe('Linked SUPER_ADMIN onboarding görünürlüğü', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  const user = process.env.E2E_LINKED_ADMIN_USER
  const pass = process.env.E2E_LINKED_ADMIN_PASSWORD

  test.skip(!user || !pass, 'E2E_LINKED_ADMIN_USER/PASSWORD yok')

  test('SuperAdmin+BURO_SAHIBI rehber ve yardım görür', async ({ page }) => {
    await loginAs(page, user!, pass!)
    await openWhatsAppSection(page)
    await expect(page.getByTestId('wa-help-section')).toBeVisible()
    await page.getByRole('button', { name: /Kurulum Rehberi|Nasıl Bağlanır/i }).first().click()
    await expect(page.getByTestId('wa-onboarding-modal')).toBeVisible()
  })
})
