import { test, expect } from '@playwright/test'
import { loadE2eEnv, apiBase } from './helpers/env'

test.describe('Rol matrisi (UI + API)', () => {
  test('katip menü/API: kullanıcı listesi 403', async ({ page, request }) => {
    loadE2eEnv()
    const pass = process.env.E2E_PASSWORD ?? 'E2eTestPass123!'
    const api = apiBase()

    await page.goto('/login')
    await page.getByLabel(/e-posta veya kullanıcı/i).fill('e2e.katip')
    await page.getByLabel(/^şifre$/i).fill(pass)
    await page.getByRole('button', { name: /giriş yap/i }).click()
    await expect(page).toHaveURL(/\/app/, { timeout: 30_000 })

    const login = await request.post(`${api}/api/v1/auth/login`, {
      data: { identifier: 'e2e.katip', sifre: pass }
    })
    const token = (await login.json()).accessToken as string
    const users = await request.get(`${api}/api/v1/users`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    expect(users.status()).toBe(403)

    const mali = await request.get(`${api}/api/v1/mali-kontrol/uyarilar`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    expect(mali.status()).toBe(403)
  })
})
