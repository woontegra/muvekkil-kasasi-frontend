/**
 * Responsive overflow smoke — auth gerektirir (E2E_USER / E2E_PASS).
 * Her APP_BASE route'unda yatay taşma olmadığını doğrular.
 *
 * Çalıştırma:
 *   npx playwright test e2e/responsive-overflow.smoke.spec.ts
 */
import { expect, test, type Page } from '@playwright/test'

const APP_BASE = '/app'

const ROUTES = [
  APP_BASE,
  `${APP_BASE}/ofis-kasasi`,
  `${APP_BASE}/icra-tahsilat`,
  `${APP_BASE}/tahsilat-merkezi`,
  `${APP_BASE}/bildirim-merkezi`,
  `${APP_BASE}/randevular`,
  `${APP_BASE}/raporlar`,
  `${APP_BASE}/ayarlar`,
  `${APP_BASE}/kullanicilar`
]

const VIEWPORTS = [
  { width: 360, height: 740 },
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1440, height: 900 }
]

async function assertNoHorizontalOverflow(page: Page): Promise<void> {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth
    }
  })
  expect(
    overflow.scrollWidth,
    `Yatay taşma: scrollWidth=${overflow.scrollWidth} clientWidth=${overflow.clientWidth}`
  ).toBeLessThanOrEqual(overflow.clientWidth + 1)
}

test.describe('Responsive overflow smoke', () => {
  test.beforeEach(async ({ page }) => {
    const user = process.env.E2E_USER
    const pass = process.env.E2E_PASS
    test.skip(!user || !pass, 'E2E_USER / E2E_PASS gerekli')

    await page.goto('/login')
    await page.getByLabel(/kullanıcı|e-posta|email/i).first().fill(user!)
    await page.locator('input[type="password"]').fill(pass!)
    await page.getByRole('button', { name: /giriş/i }).click()
    await page.waitForURL(/\/app/, { timeout: 30_000 })
  })

  for (const vp of VIEWPORTS) {
    test(`viewport ${vp.width}x${vp.height}`, async ({ page }) => {
      await page.setViewportSize(vp)
      for (const route of ROUTES) {
        await page.goto(route)
        await page.waitForLoadState('domcontentloaded')
        await assertNoHorizontalOverflow(page)
      }
    })
  }
})
