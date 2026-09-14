/**
 * Hızlı teslim turu — yalnız 1152×720 + P0 kritik yüzeyler.
 * Tam 11-viewport suite’i yeniden başlatmaz.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { requireE2eUser } from '../helpers/env'
import { auditPage, RQ_OUT, saveFailureScreenshot, type AuditResult } from './audit'

const here = path.dirname(fileURLToPath(import.meta.url))
const OUT = path.join(RQ_OUT, 'critical-1152')

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
      await page.getByText(/^Yükleniyor/i).waitFor({ state: 'hidden', timeout: 15000 }).catch(() => undefined)
      return
    }
    await ensureLoggedIn(page)
  }
  throw new Error(`auth failed for ${pathUrl}; landed on ${page.url()}`)
}

async function resolveIds(page: Page): Promise<{ muvekkilId: string; dosyaId: string }> {
  const listWait = page.waitForResponse(
    (r) => /\/api\/v1\/muvekkiller(\?|$)/.test(r.url()) && r.request().method() === 'GET' && r.ok(),
    { timeout: 45000 }
  )
  await ensureLoggedIn(page)
  const listRes = await listWait
  const listJson = (await listRes.json()) as { items?: { id: string }[] }
  const muvekkilId = listJson.items?.[0]?.id
  expect(muvekkilId, 'müvekkil id').toBeTruthy()

  const dosyaWait = page.waitForResponse(
    (r) =>
      r.url().includes(`/api/v1/muvekkiller/${muvekkilId}/dosyalar`) &&
      r.request().method() === 'GET' &&
      r.ok(),
    { timeout: 45000 }
  )
  await appGoto(page, `/app/muvekkil/${muvekkilId}`)
  const dosyaRes = await dosyaWait
  const dosyaJson = (await dosyaRes.json()) as { items?: { id: string }[] }
  let dosyaId = dosyaJson.items?.[0]?.id
  if (!dosyaId) {
    const href = await page.evaluate(() => {
      for (const a of document.querySelectorAll('a[href*="/app/dosya/"]')) {
        const h = (a as HTMLAnchorElement).getAttribute('href') || ''
        const m = h.match(/\/app\/dosya\/([^/?#]+)/)
        if (m?.[1]) return m[1]
      }
      return ''
    })
    dosyaId = href || undefined
  }
  expect(dosyaId, 'dosya id').toBeTruthy()
  return { muvekkilId: muvekkilId!, dosyaId: dosyaId! }
}

async function clickTab(page: Page, name: RegExp): Promise<void> {
  const tab = page.getByRole('tab', { name }).or(page.getByRole('button', { name })).first()
  if ((await tab.count()) > 0) {
    await tab.click({ timeout: 8000 }).catch(() => undefined)
    await page.waitForTimeout(350)
  }
}

test.describe('Critical 1152 delivery P0', () => {
  test.setTimeout(180_000)

  test('1152×720 kritik yüzeyler', async ({ page }) => {
    fs.mkdirSync(OUT, { recursive: true })
    await page.setViewportSize({ width: 1152, height: 720 })

    const { muvekkilId, dosyaId } = await resolveIds(page)
    const results: AuditResult[] = []

    const targets: { id: string; path: string; prep?: (p: Page) => Promise<void> }[] = [
      {
        id: 'home-taksit-uyarilari',
        path: '/app',
        prep: async (p) => {
          await p.getByText(/taksit uyar/i).first().scrollIntoViewIfNeeded().catch(() => undefined)
          await p.waitForTimeout(250)
        }
      },
      {
        id: 'muvekkil-dosyalar',
        path: `/app/muvekkil/${muvekkilId}`,
        prep: async (p) => {
          await clickTab(p, /^dosyalar$/i)
        }
      },
      {
        id: 'dosya-kasa',
        path: `/app/muvekkil/${muvekkilId}/dosya/${dosyaId}`,
        prep: async (p) => {
          await clickTab(p, /kasa hareket/i)
        }
      },
      { id: 'ofis-kasasi', path: '/app/ofis-kasasi' },
      {
        id: 'ayarlar-gelir-gider-kalemleri',
        path: '/app/ayarlar?bolum=gelir-gider-kalemleri'
      }
    ]

    for (const t of targets) {
      try {
        await appGoto(page, t.path)
        if (t.prep) await t.prep(page)
        const audit = await auditPage(page, t.id, '1152x720', { expectAuthenticated: true })
        if (!audit.pass && audit.fail[0]) {
          const shot = await saveFailureScreenshot(page, `critical_${t.id}`, '1152x720', audit.fail[0].type)
          audit.fail[0].screenshot = shot
        }
        await page.screenshot({ path: path.join(OUT, `${t.id}.png`), fullPage: false })
        results.push(audit)
        if (!audit.pass) {
          console.error(`[critical-1152] FAIL ${t.id}`, audit.fail.map((f) => f.message).join(' | '))
        } else {
          console.log(`[critical-1152] PASS ${t.id}`)
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        console.error(`[critical-1152] ERROR ${t.id}: ${msg}`)
        results.push({
          route: t.id,
          viewport: '1152x720',
          metrics: {
            innerWidth: 1152,
            innerHeight: 720,
            devicePixelRatio: 1,
            clientWidth: 1152,
            scrollWidth: 1152
          },
          fail: [{ type: 'route_error', route: t.id, viewport: '1152x720', message: msg }],
          pass: false
        })
      }
    }

    const lines = [
      '# Critical 1152 delivery',
      '',
      `Generated: ${new Date().toISOString()}`,
      '',
      '| Surface | PASS/FAIL | Findings |',
      '|---|---|---|'
    ]
    for (const r of results) {
      lines.push(
        `| ${r.route} | ${r.pass ? 'PASS' : 'FAIL'} | ${r.fail.map((f) => f.type).join(', ') || '—'} |`
      )
    }
    const allPass = results.every((r) => r.pass)
    lines.push('', `Overall: **${allPass ? 'PASS' : 'FAIL'}**`)
    fs.writeFileSync(path.join(OUT, 'report.md'), lines.join('\n'), 'utf8')
    fs.writeFileSync(path.join(OUT, 'report.json'), JSON.stringify({ allPass, results }, null, 2), 'utf8')

    expect(allPass, results.filter((r) => !r.pass).map((r) => `${r.route}: ${r.fail[0]?.message}`).join('\n')).toBe(
      true
    )
  })
})
