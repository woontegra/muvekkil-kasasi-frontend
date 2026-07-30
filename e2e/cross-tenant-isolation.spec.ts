import { test, expect } from '@playwright/test'
import { loadE2eEnv, apiBase } from './helpers/env'

/**
 * Gerçek iki E2E tenant (A: e2e.sahip, B: e2e.b.sahip) arasında IDOR.
 */
test.describe('İki tenant izolasyonu (API)', () => {
  test('A tokenı ile B kayıtlarına erişemez', async ({ request }) => {
    loadE2eEnv()
    const pass = process.env.E2E_PASSWORD ?? 'E2eTestPass123!'
    const api = apiBase()

    const bodyA = await (
      await request.post(`${api}/api/v1/auth/login`, { data: { identifier: 'e2e.sahip', sifre: pass } })
    ).json()
    const bodyB = await (
      await request.post(`${api}/api/v1/auth/login`, { data: { identifier: 'e2e.b.sahip', sifre: pass } })
    ).json()
    expect(bodyA.accessToken).toBeTruthy()
    expect(bodyB.accessToken).toBeTruthy()
    expect(bodyA.user.tenantId).not.toBe(bodyB.user.tenantId)
    const tokenA = bodyA.accessToken as string
    const tokenB = bodyB.accessToken as string

    const stamp = Date.now()
    const mB = await request.post(`${api}/api/v1/muvekkiller`, {
      headers: { Authorization: `Bearer ${tokenB}` },
      data: { tur: 'GERCEK', adSoyad: `Iso B ${stamp}`, telefon: '05327770001' }
    })
    expect(mB.ok()).toBeTruthy()
    const midB = (await mB.json()).muvekkil.id as string

    const dB = await request.post(`${api}/api/v1/muvekkiller/${midB}/dosyalar`, {
      headers: { Authorization: `Bearer ${tokenB}` },
      data: { konuBasligi: `Iso B Dosya ${stamp}`, dosyaTuru: 'DAVA' }
    })
    expect(dB.ok()).toBeTruthy()
    const didB = (await dB.json()).dosya.id as string

    const crossM = await request.get(`${api}/api/v1/muvekkiller/${midB}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    })
    expect([403, 404]).toContain(crossM.status())
    expect(await crossM.text()).not.toMatch(/Iso B/)

    const crossD = await request.get(`${api}/api/v1/dosyalar/${didB}`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    })
    expect([403, 404]).toContain(crossD.status())

    const crossOzet = await request.get(`${api}/api/v1/dosyalar/${didB}/mali-ozet`, {
      headers: { Authorization: `Bearer ${tokenA}` }
    })
    expect([403, 404]).toContain(crossOzet.status())

    const spoof = await request.post(`${api}/api/v1/muvekkiller`, {
      headers: { Authorization: `Bearer ${tokenA}` },
      data: {
        tur: 'GERCEK',
        adSoyad: `Spoof ${stamp}`,
        telefon: '05327770002',
        tenantId: bodyB.user.tenantId
      }
    })
    expect(spoof.ok()).toBeTruthy()
    const created = await spoof.json()
    expect(created.muvekkil.tenantId).toBe(bodyA.user.tenantId)
  })
})
