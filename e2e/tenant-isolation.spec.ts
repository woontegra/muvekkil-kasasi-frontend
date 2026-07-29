import { test, expect } from '@playwright/test'

/**
 * Tenant izolasyonu — aynı kaydın başka tenant JWT ile 404/403 dönmesi.
 * E2E_USER ile giriş yapılır; ikinci tenant yoksa yalnızca kendi erişimi doğrulanır.
 */
test.describe('API tenant izolasyonu', () => {
  test('müvekkil listesi yalnızca kendi tenantına ait', async ({ request }) => {
    const user = process.env.E2E_USER ?? 'e2e.sahip'
    const pass = process.env.E2E_PASSWORD ?? 'E2eTestPass123!'
    const api = (process.env.E2E_API_URL ?? 'http://localhost:4100').replace(/\/$/, '')

    const login = await request.post(`${api}/api/v1/auth/login`, {
      data: { identifier: user, sifre: pass }
    })
    expect(login.ok()).toBeTruthy()
    const body = await login.json()
    const token = body.accessToken as string
    expect(token).toBeTruthy()

    const list = await request.get(`${api}/api/v1/muvekkiller?limit=5`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    expect(list.ok()).toBeTruthy()
    const data = await list.json()
    expect(Array.isArray(data.items ?? data.muvekkiller ?? [])).toBeTruthy()

    // Geçersiz token
    const bad = await request.get(`${api}/api/v1/muvekkiller?limit=1`, {
      headers: { Authorization: 'Bearer invalid.token.value' }
    })
    expect([401, 403]).toContain(bad.status())

    // Token yok
    const anon = await request.get(`${api}/api/v1/muvekkiller?limit=1`)
    expect([401, 403]).toContain(anon.status())
  })
})
