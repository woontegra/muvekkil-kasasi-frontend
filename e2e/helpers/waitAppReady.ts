import { expect, type Page } from '@playwright/test'
import { loadE2eEnv, requireE2eUser } from './env'

/** storageState cookie bayatsa yeniden giriş; orijinal hedef URL korunur. */
export async function waitAppReady(page: Page): Promise<void> {
  loadE2eEnv()
  const intended = page.url()
  await expect(page.getByText(/oturum doğrulanıyor/i)).toHaveCount(0, { timeout: 30_000 })
  if (/\/login/.test(page.url())) {
    const { user, password } = requireE2eUser()
    await page.getByLabel(/e-posta veya kullanıcı/i).fill(user)
    await page.getByLabel(/^şifre$/i).fill(password)
    await page.getByRole('button', { name: /giriş yap/i }).click()
    await expect(page).toHaveURL(/\/app/, { timeout: 30_000 })
    const target = /\/login/.test(intended) ? '/app' : intended.replace(/https?:\/\/[^/]+/, '') || '/app'
    if (!page.url().includes(target.split('?')[0]!) || target.includes('muvekkiller')) {
      await page.goto(target.startsWith('/') ? target : '/app')
      await expect(page.getByText(/oturum doğrulanıyor/i)).toHaveCount(0, { timeout: 30_000 })
    }
  }
  await expect(page).not.toHaveURL(/\/login/)
}
