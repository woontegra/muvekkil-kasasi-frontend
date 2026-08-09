import { expect, test } from '@playwright/test'
import { loadE2eEnv } from './helpers/env'

loadE2eEnv()

const infoUser = process.env.E2E_LINKED_ADMIN_USER
const infoPass = process.env.E2E_LINKED_ADMIN_PASSWORD
const e2eUser = process.env.E2E_USER
const e2ePass = process.env.E2E_PASSWORD

test.describe('Production smoke — tek giriş / admin kart', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test.skip(!infoUser || !infoPass, 'linked admin env yok')

  test('info@ tek giriş, Admin Paneli, /admin ikinci login yok', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/e-posta|kullanıcı/i).fill(infoUser!)
    await page.getByLabel(/parola|şifre/i).fill(infoPass!)
    await page.getByRole('button', { name: /giriş/i }).click()
    await expect(page).toHaveURL(/\/app/, { timeout: 30_000 })

    const card = page.getByRole('button', { name: /Admin Paneli/i })
    await expect(card).toBeVisible({ timeout: 30_000 })
    await card.click()
    await expect(page).toHaveURL(/\/admin(?!\/login)/, { timeout: 30_000 })
    await expect(page).not.toHaveURL(/\/admin\/login/)
    await page.reload()
    await expect(page).toHaveURL(/\/admin(?!\/login)/, { timeout: 30_000 })
  })
})

test.describe('Production smoke — normal kullanıcı', () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test.skip(!e2eUser || !e2ePass, 'e2e user env yok')

  test('BURO_SAHIBI Admin Paneli kartı görmez', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel(/e-posta|kullanıcı/i).fill(e2eUser!)
    await page.getByLabel(/parola|şifre/i).fill(e2ePass!)
    await page.getByRole('button', { name: /giriş/i }).click()
    await expect(page).toHaveURL(/\/app/, { timeout: 30_000 })
    await expect(page.getByRole('button', { name: /Admin Paneli/i })).toHaveCount(0)
    await expect(page.getByText('Müşteri, kullanıcı ve lisans işlemlerini yönetin.')).toHaveCount(0)
    await page.goto('/admin')
    await expect(page).not.toHaveURL(/\/admin\/?$/)
  })
})
