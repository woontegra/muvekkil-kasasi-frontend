import { test, expect } from '@playwright/test'
import { apiBase, loadE2eEnv, requireE2eUser } from './helpers/env'

test.describe('HttpOnly refresh oturum (bellek access token)', () => {
  test.beforeAll(() => {
    loadE2eEnv()
  })

  test('login sonrası localStorage/sessionStorage’da token yok; yenilemede oturum korunur', async ({
    page
  }) => {
    const { user, password } = requireE2eUser()
    await page.goto('/login')
    await page.getByLabel(/e-posta veya kullanıcı/i).fill(user)
    await page.getByLabel(/^şifre$/i).fill(password)
    await page.getByRole('button', { name: /giriş yap/i }).click()
    await expect(page).toHaveURL(/\/app(\/|$)/, { timeout: 30_000 })

    const storage = await page.evaluate(() => ({
      lsToken: localStorage.getItem('mkd_access_token'),
      lsAdmin: localStorage.getItem('mkd_admin_access_token'),
      ssToken: sessionStorage.getItem('mkd_access_token'),
      keys: Object.keys(localStorage).filter((k) => /token|jwt|auth/i.test(k))
    }))
    expect(storage.lsToken).toBeNull()
    expect(storage.lsAdmin).toBeNull()
    expect(storage.ssToken).toBeNull()
    expect(storage.keys).toEqual([])

    const cookies = await page.context().cookies()
    const rt = cookies.find((c) => c.name === 'mkd_rt')
    expect(rt, 'mkd_rt HttpOnly cookie beklenir').toBeTruthy()
    expect(rt!.httpOnly).toBe(true)

    await page.reload()
    await expect(page).toHaveURL(/\/app(\/|$)/, { timeout: 30_000 })
  })

  test('logout sonrası login ekranı; storage temiz', async ({ page }) => {
    const { user, password } = requireE2eUser()
    await page.goto('/login')
    await page.getByLabel(/e-posta veya kullanıcı/i).fill(user)
    await page.getByLabel(/^şifre$/i).fill(password)
    await page.getByRole('button', { name: /giriş yap/i }).click()
    await expect(page).toHaveURL(/\/app(\/|$)/, { timeout: 30_000 })

    await page.getByRole('button', { name: /çıkış/i }).click()
    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })

    const storage = await page.evaluate(() => localStorage.getItem('mkd_access_token'))
    expect(storage).toBeNull()
  })

  test('geçersiz bearer 401; cookie ile page refresh 200', async ({ page, request }) => {
    const { user, password } = requireE2eUser()
    await page.goto('/login')
    await page.getByLabel(/e-posta veya kullanıcı/i).fill(user)
    await page.getByLabel(/^şifre$/i).fill(password)
    await page.getByRole('button', { name: /giriş yap/i }).click()
    await expect(page).toHaveURL(/\/app(\/|$)/, { timeout: 30_000 })

    const origin = process.env.CORS_ORIGIN?.split(',')[0]?.trim() ?? 'http://localhost:5173'
    const bad = await request.get(`${apiBase()}/api/v1/me`, {
      headers: { Authorization: 'Bearer not.a.jwt' }
    })
    expect(bad.status()).toBe(401)

    const pageRefresh = await page.request.post('/api/v1/auth/refresh', {
      headers: { Origin: origin }
    })
    expect(pageRefresh.ok(), `refresh status=${pageRefresh.status()}`).toBeTruthy()
  })
})
