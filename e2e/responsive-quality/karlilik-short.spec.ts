/**
 * Kısa viewport kontrolü — Kârlılık Analizi (1440×900, 1366×768, mobil).
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { requireE2eUser } from '../helpers/env'

const here = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(here, '../../tmp-responsive-quality/karlilik-short')

async function ensureLoggedIn(page: Page): Promise<void> {
  const onApp =
    /\/app(\/|$)/.test(page.url()) &&
    !/\/login/.test(page.url()) &&
    (await page.locator('main').count()) > 0
  if (onApp) return

  const { user, password } = requireE2eUser()
  await page.goto('/login', { waitUntil: 'domcontentloaded' })
  await page.getByLabel(/e-posta veya kullanıcı/i).fill(user)
  await page.getByLabel(/^şifre$/i).fill(password)
  await page.getByRole('button', { name: /giriş yap/i }).click()
  await page.waitForURL((url) => url.pathname === '/app' || url.pathname.startsWith('/app/'), {
    timeout: 45000
  })
  await page.getByText(/oturum doğrulanıyor/i).waitFor({ state: 'detached', timeout: 20000 }).catch(() => undefined)
  await page.waitForSelector('main', { timeout: 20000 })
}

async function appGoto(page: Page, pathUrl: string): Promise<void> {
  for (let attempt = 0; attempt < 2; attempt++) {
    await page.goto(pathUrl, { waitUntil: 'domcontentloaded' })
    await page
      .getByText(/oturum doğrulanıyor/i)
      .waitFor({ state: 'detached', timeout: 20000 })
      .catch(() => undefined)
    if (!/\/login(?:\?|$)/.test(new URL(page.url()).pathname)) {
      await page.waitForSelector('main', { timeout: 20000 })
      return
    }
    await ensureLoggedIn(page)
  }
  throw new Error(`auth failed for ${pathUrl}`)
}

const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '390x844', width: 390, height: 844 }
] as const

test.describe('karlilik short viewports', () => {
  test('Kârlılık kartları 1440 / 1366 / mobil', async ({ page }) => {
    fs.mkdirSync(OUT, { recursive: true })
    const listWait = page.waitForResponse(
      (r) => /\/api\/v1\/muvekkiller(\?|$)/.test(r.url()) && r.request().method() === 'GET' && r.ok(),
      { timeout: 45000 }
    )
    await ensureLoggedIn(page)
    const listJson = (await (await listWait).json()) as { items?: { id: string }[] }
    const muvekkilId = listJson.items?.[0]?.id
    expect(muvekkilId).toBeTruthy()

    const karlilikWait = page.waitForResponse(
      (r) =>
        r.url().includes(`/api/v1/muvekkiller/${muvekkilId}/karlilik`) &&
        r.request().method() === 'GET' &&
        r.ok(),
      { timeout: 45000 }
    )
    await page.setViewportSize({ width: VIEWPORTS[0].width, height: VIEWPORTS[0].height })
    await appGoto(page, `/app/muvekkil/${muvekkilId}`)
    const res = await karlilikWait
    const body = (await res.json()) as {
      tumZamanlar?: {
        ofisGeliri?: { TRY?: string; USD?: string; EUR?: string }
        netKazanc?: { TRY?: string; USD?: string; EUR?: string }
      }
    }
    expect(body.tumZamanlar?.netKazanc?.TRY).toBeDefined()
    expect(body.tumZamanlar?.ofisGeliri).toBeDefined()

    for (const vp of VIEWPORTS) {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      if (vp !== VIEWPORTS[0]) {
        await appGoto(page, `/app/muvekkil/${muvekkilId}`)
      }
      await page.getByText('Kârlılık Analizi').first().scrollIntoViewIfNeeded()
      await expect(page.getByText(/net kazanç/i).first()).toBeVisible({ timeout: 15000 })
      const shot = path.join(OUT, `karlilik-${vp.name}.png`)
      await page.screenshot({ path: shot, fullPage: false })
      const box = await page.locator('main').boundingBox()
      expect(box, `main visible ${vp.name}`).toBeTruthy()
      if (box && vp.width >= 1366) expect(box.width).toBeGreaterThan(800)
      if (box && vp.width < 500) expect(box.width).toBeGreaterThan(300)
    }
  })
})
