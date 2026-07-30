import { expect, test } from '@playwright/test'
import { loadE2eEnv } from './helpers/env'

loadE2eEnv()

/**
 * Tek giriş: normal login → Admin Paneli kartı → /admin (ikinci login yok).
 * Pozitif senaryo yalnızca E2E_LINKED_ADMIN_USER + E2E_LINKED_ADMIN_PASSWORD ile çalışır.
 */
test.describe('Admin Paneli kartı (tenant oturumu)', () => {
  test('admin oturumu yokken Admin Paneli kartı render edilmez', async ({ page }) => {
    await page.goto('/app')
    const card = page.getByRole('button', { name: /Admin Paneli/i })
    await expect(card).toHaveCount(0)
    await expect(page.getByText('Müşteri, kullanıcı ve lisans işlemlerini yönetin.')).toHaveCount(0)
  })
})

test.describe('Tek giriş Admin Paneli', () => {
  // setup storageState (e2e.sahip) bu senaryoyu bozar — temiz oturum zorunlu
  test.use({ storageState: { cookies: [], origins: [] } })

  const user = process.env.E2E_LINKED_ADMIN_USER
  const pass = process.env.E2E_LINKED_ADMIN_PASSWORD

  test.skip(!user || !pass, 'E2E_LINKED_ADMIN_USER/PASSWORD yok — pozitif tek giriş atlandı')

  test('normal login sonrası kart görünür ve /admin ikinci login istemez', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/e-posta|kullanıcı/i).fill(user!)
    await page.getByLabel(/parola|şifre/i).fill(pass!)
    await page.getByRole('button', { name: /giriş/i }).click()

    await expect(page).toHaveURL(/\/app/, { timeout: 20_000 })
    await expect(page).not.toHaveURL(/\/admin\/login/)
    const card = page.getByRole('button', { name: /Admin Paneli/i })
    await expect(card).toBeVisible({ timeout: 20_000 })
    await card.click()
    await expect(page).toHaveURL(/\/admin(?!\/login)/)
    await expect(page).not.toHaveURL(/\/admin\/login/)
    await expect(page.getByText(/Admin oturumu doğrulanıyor/i)).toHaveCount(0, { timeout: 15_000 })
  })
})
