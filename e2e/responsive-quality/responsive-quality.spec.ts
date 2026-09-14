/**
 * Kalıcı responsive-quality kapısı.
 *
 *   npm run test:responsive-quality
 *
 * Salt okunur: finansal yazma yok. App.tsx route sapması uyarısı üretir.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { expect, test, type Page } from '@playwright/test'
import { requireE2eUser } from '../helpers/env'
import {
  ADMIN_ROUTE_PATTERNS,
  APP_ROUTE_PATTERNS,
  NORMAL_USER_RESPONSIVE_ROUTES,
  PUBLIC_ROUTE_PATTERNS,
  REQUIRED_VIEWPORTS,
  SCREENSHOT_VIEWPORTS,
  type ResponsiveRouteDef
} from './inventory'
import {
  auditPage,
  RQ_OUT,
  saveFailureScreenshot,
  writeReports,
  type AuditResult
} from './audit'

const here = path.dirname(fileURLToPath(import.meta.url))
const APP_TSX = path.resolve(here, '../../src/App.tsx')

function extractAppTsxPaths(): string[] {
  const src = fs.readFileSync(APP_TSX, 'utf8')
  const paths: string[] = []
  // Public + admin absolute
  for (const m of src.matchAll(/path="(\/[^"]+)"/g)) paths.push(m[1]!)
  // Nested under APP_BASE
  const appBlock = src.match(/path=\{APP_BASE\}[\s\S]*?<\/Route>\s*\n\s*<Route path="\/"/)
  const block = appBlock?.[0] ?? src
  for (const m of block.matchAll(/path="([^"]+)"/g)) {
    const p = m[1]!
    if (p.startsWith('/')) continue
    if (p === '*') continue
    paths.push(`/app/${p}`)
  }
  if (/path=\{APP_BASE\}/.test(src) || /path=\{APP_BASE\}/.test(src)) paths.push('/app')
  return [...new Set(paths)]
}

function inventoryDriftWarnings(): string[] {
  const warnings: string[] = []
  const coded = extractAppTsxPaths()
  const inventoried = [
    ...PUBLIC_ROUTE_PATTERNS,
    ...APP_ROUTE_PATTERNS,
    ...ADMIN_ROUTE_PATTERNS
  ].map(String)

  for (const p of coded) {
    if (p.includes('*') || p === '/register-office') continue
    const covered = inventoried.some((inv) => {
      if (inv === p) return true
      // pattern match :id
      const re = new RegExp('^' + inv.replace(/:[^/]+/g, '[^/]+') + '$')
      return re.test(p)
    })
    if (!covered) {
      warnings.push(`App.tsx route envanterde yok: ${p}`)
    }
  }
  for (const inv of APP_ROUTE_PATTERNS) {
    const re = new RegExp('^' + inv.replace(/:[^/]+/g, '[^/]+') + '$')
    if (!coded.some((p) => re.test(p) || p === inv)) {
      // soft: nested paths extracted may miss index
      if (inv !== '/app') warnings.push(`Envanterde var, App.tsx çıkarımında yok (kontrol et): ${inv}`)
    }
  }
  return warnings
}

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
    timeout: 60000
  })
  await page.getByText(/oturum doğrulanıyor/i).waitFor({ state: 'detached', timeout: 30000 }).catch(() => undefined)
  await page.waitForSelector('main', { timeout: 30000 })
}

/** Hard navigate + cookie refresh; public login yüzeyi taranmadan önce çağırma. */
async function appGoto(page: Page, pathUrl: string): Promise<void> {
  const targetPath = pathUrl.startsWith('http') ? new URL(pathUrl).pathname + new URL(pathUrl).search : pathUrl

  for (let attempt = 0; attempt < 2; attempt++) {
    await page.goto(targetPath, { waitUntil: 'domcontentloaded' })
    await page
      .getByText(/oturum doğrulanıyor/i)
      .waitFor({ state: 'detached', timeout: 30000 })
      .catch(() => undefined)

    if (!/\/login(?:\?|$)/.test(new URL(page.url()).pathname)) {
      await page.waitForSelector('main', { timeout: 30000 })
      await page.getByText(/^Yükleniyor/i).waitFor({ state: 'hidden', timeout: 20000 }).catch(() => undefined)
      return
    }
    await ensureLoggedIn(page)
  }

  throw new Error(`appGoto auth failed for ${targetPath}; landed on ${page.url()}`)
}

async function readMuvekkilIdFromDom(page: Page): Promise<string | undefined> {
  return page.evaluate(() => {
    for (const a of document.querySelectorAll('a[href*="/app/muvekkil/"]')) {
      const href = (a as HTMLAnchorElement).getAttribute('href') || ''
      const m = href.match(/\/app\/muvekkil\/([^/?#]+)/)
      if (m?.[1] && m[1] !== 'yeni') return m[1]
    }
    return undefined
  })
}

async function resolveDynamics(page: Page): Promise<{ muvekkilId?: string; dosyaId?: string }> {
  // Login sonrası /app home muvekkiller isteğini yakala (cache kaçırmamak için önce listener)
  const listWait = page.waitForResponse(
    (r) => /\/api\/v1\/muvekkiller(\?|$)/.test(r.url()) && r.request().method() === 'GET' && r.ok(),
    { timeout: 60000 }
  )
  await ensureLoggedIn(page)

  let muvekkilId: string | undefined
  try {
    const res = await listWait
    const json = (await res.json()) as { items?: { id: string }[] }
    muvekkilId = json.items?.[0]?.id
  } catch {
    muvekkilId = await readMuvekkilIdFromDom(page)
  }

  if (!muvekkilId) {
    const retry = page.waitForResponse(
      (r) => /\/api\/v1\/muvekkiller(\?|$)/.test(r.url()) && r.request().method() === 'GET' && r.ok(),
      { timeout: 45000 }
    )
    await appGoto(page, '/app')
    try {
      const res = await retry
      const json = (await res.json()) as { items?: { id: string }[] }
      muvekkilId = json.items?.[0]?.id
    } catch {
      muvekkilId = await readMuvekkilIdFromDom(page)
    }
  }

  if (!muvekkilId) {
    console.warn('[responsive-quality] resolveDynamics failed url=', page.url())
    return {}
  }

  const dosyaWait = page.waitForResponse(
    (r) =>
      r.url().includes(`/api/v1/muvekkiller/${muvekkilId}/dosyalar`) &&
      r.request().method() === 'GET' &&
      r.ok(),
    { timeout: 45000 }
  )
  await appGoto(page, `/app/muvekkil/${muvekkilId}`)
  let dosyaId: string | undefined
  try {
    const res = await dosyaWait
    const json = (await res.json()) as { items?: { id: string }[] }
    dosyaId = json.items?.[0]?.id
  } catch {
    dosyaId = await page.evaluate(() => {
      for (const a of document.querySelectorAll('a[href*="/dosya/"]')) {
        const m = (a as HTMLAnchorElement).href.match(/\/dosya\/([^/?#]+)/)
        if (m?.[1]) return m[1]
      }
      return undefined
    })
  }

  return { muvekkilId, dosyaId }
}

function materializeRoute(
  def: ResponsiveRouteDef,
  dyn: { muvekkilId?: string; dosyaId?: string }
): string | null {
  if (def.path) return def.path
  if (def.dynamic === 'muvekkil') {
    if (!dyn.muvekkilId) return null
    return `/app/muvekkil/${dyn.muvekkilId}`
  }
  if (def.dynamic === 'yeni-dosya') {
    if (!dyn.muvekkilId) return null
    return `/app/muvekkil/${dyn.muvekkilId}/dosyalar/yeni`
  }
  if (def.dynamic === 'dosya') {
    if (!dyn.muvekkilId || !dyn.dosyaId) return null
    return `/app/muvekkil/${dyn.muvekkilId}/dosya/${dyn.dosyaId}`
  }
  return null
}

async function activateSurface(page: Page, surface: NonNullable<ResponsiveRouteDef['surfaces']>[number]) {
  if (surface.activate === 'query') {
    const url = new URL(page.url())
    const [k, v] = surface.value.split('=')
    url.searchParams.set(k!, v!)
    await appGoto(page, url.pathname + url.search)
    await page.waitForTimeout(500)
    return
  }
  const btn = page.getByRole('button', { name: new RegExp(surface.value, 'i') }).first()
  if (await btn.count()) {
    await btn.click()
    await page.waitForTimeout(600)
  }
}

test.describe.configure({ mode: 'serial' })

test.describe('Responsive quality gate (normal user)', () => {
  const results: AuditResult[] = []
  const inventoryWarnings = inventoryDriftWarnings()
  let dyn: { muvekkilId?: string; dosyaId?: string } = {}
  let dynResolved = false

  test.afterAll(() => {
    writeReports(results, inventoryWarnings)
  })

  test('App.tsx route envanter uyumu', () => {
    for (const w of inventoryWarnings) {
      console.warn('[responsive-inventory]', w)
    }
    const hard = inventoryWarnings.filter((w) => w.startsWith('App.tsx route envanterde yok'))
    expect(hard, hard.join('\n')).toEqual([])
  })

  for (const vp of REQUIRED_VIEWPORTS) {
    test(`viewport ${vp.name}`, async ({ page }) => {
      test.setTimeout(600_000)
      fs.mkdirSync(path.join(RQ_OUT, 'shots'), { recursive: true })
      await page.setViewportSize({ width: vp.width, height: vp.height })

      if (!dynResolved) {
        dyn = await resolveDynamics(page)
        dynResolved = true
        console.log('[responsive-quality] dynamic ids', dyn)
        expect(dyn.muvekkilId, 'Müvekkil ID salt okunur keşfi başarısız').toBeTruthy()
      } else {
        await ensureLoggedIn(page)
      }

      const appRoutes = NORMAL_USER_RESPONSIVE_ROUTES.filter((r) => r.auth !== false)
      const publicRoutes = NORMAL_USER_RESPONSIVE_ROUTES.filter((r) => r.auth === false)

      for (const def of appRoutes) {
        const pathUrl = materializeRoute(def, dyn)
        if (!pathUrl) {
          results.push({
            route: def.id,
            viewport: vp.name,
            metrics: {
              innerWidth: vp.width,
              innerHeight: vp.height,
              devicePixelRatio: 1,
              clientWidth: vp.width,
              scrollWidth: vp.width
            },
            fail: [
              {
                type: 'skipped_unresolved_dynamic',
                route: def.id,
                viewport: vp.name,
                message: 'Dinamik müvekkil/dosya ID resolve edilemedi — route taranamadı'
              }
            ],
            pass: false
          })
          continue
        }

        const surfaces =
          def.surfaces && def.surfaces.length
            ? def.surfaces
            : [{ id: 'default', label: def.label, activate: 'tab' as const, value: '' }]

        for (const surface of surfaces) {
          await appGoto(page, pathUrl)
          await page.waitForTimeout(700)
          if (surface.value) await activateSurface(page, surface)

          if (def.id === 'ofis-kasasi') {
            await page.waitForTimeout(400)
          }

          const routeKey = surface.id === 'default' ? def.id : `${def.id}::${surface.id}`
          const audit = await auditPage(page, routeKey, vp.name, { expectAuthenticated: true })
          if (surface.id !== 'default') audit.surface = surface.id

          if (!audit.pass && audit.fail[0]) {
            const shot = await saveFailureScreenshot(page, routeKey, vp.name, audit.fail[0].type)
            audit.fail[0].screenshot = shot
          }

          if (SCREENSHOT_VIEWPORTS.some((s) => s.name === vp.name) && surface.id === (def.surfaces?.[0]?.id ?? 'default')) {
            const shotDir = path.join(RQ_OUT, 'shots')
            await page.screenshot({
              path: path.join(shotDir, `${def.id}_${vp.name}.png`),
              fullPage: false
            })
          }

          results.push(audit)
        }
      }

      // Public yüzeyler — oturumu düşürmemek için ayrı context
      const publicCtx = await page.context().browser()!.newContext({
        baseURL: process.env.E2E_BASE_URL ?? 'http://127.0.0.1:5174',
        viewport: { width: vp.width, height: vp.height }
      })
      const publicPage = await publicCtx.newPage()
      for (const def of publicRoutes) {
        const pathUrl = materializeRoute(def, dyn)
        if (!pathUrl) continue
        await publicPage.goto(pathUrl, { waitUntil: 'domcontentloaded' })
        await publicPage.waitForTimeout(500)
        const audit = await auditPage(publicPage, def.id, vp.name, { expectAuthenticated: false })
        if (!audit.pass && audit.fail[0]) {
          const shot = await saveFailureScreenshot(publicPage, def.id, vp.name, audit.fail[0].type)
          audit.fail[0].screenshot = shot
        }
        if (SCREENSHOT_VIEWPORTS.some((s) => s.name === vp.name)) {
          await publicPage.screenshot({
            path: path.join(RQ_OUT, 'shots', `${def.id}_${vp.name}.png`),
            fullPage: false
          })
        }
        results.push(audit)
      }
      await publicCtx.close()

      const vpFails = results.filter((r) => r.viewport === vp.name && !r.pass)
      expect(
        vpFails,
        vpFails.map((r) => `${r.route}: ${r.fail.map((f) => f.type).join(',')}`).join('\n')
      ).toEqual([])
    })
  }

  test('Somut regresyon: müvekkil dosyalar + dashboard taksit işlem butonu (1152×720)', async ({ page }) => {
    await page.setViewportSize({ width: 1152, height: 720 })
    if (!dyn.muvekkilId) {
      dyn = await resolveDynamics(page)
      dynResolved = true
    } else {
      await ensureLoggedIn(page)
    }

    // Dashboard taksit uyarıları
    await appGoto(page, '/app')
    await page.waitForTimeout(1500)
    const dashAudit = await page.evaluate(() => {
      const links = [...document.querySelectorAll('main a, main button')].filter((el) => {
        const r = el.getBoundingClientRect()
        const t = (el.textContent || '').trim()
        return r.width > 0 && (t === '↗' || /dosyayı aç/i.test(el.getAttribute('aria-label') || ''))
      })
      const clipped = links.filter((el) => {
        let a: HTMLElement | null = el.parentElement
        const r = el.getBoundingClientRect()
        while (a) {
          const cs = getComputedStyle(a)
          if (cs.overflowX === 'hidden' || cs.overflowX === 'clip') {
            const ar = a.getBoundingClientRect()
            if (r.right > ar.right + 1) return true
          }
          a = a.parentElement
        }
        return r.right > window.innerWidth + 1
      })
      return { count: links.length, clipped: clipped.length }
    })
    expect(dashAudit.clipped, 'Dashboard taksit işlem butonu kesilmemeli').toBe(0)

    if (dyn.muvekkilId) {
      await appGoto(page, `/app/muvekkil/${dyn.muvekkilId}`)
      await page.waitForTimeout(1200)
      const muAudit = await page.evaluate(() => {
        const links = [...document.querySelectorAll('main a')].filter((el) => {
          const r = el.getBoundingClientRect()
          return r.width > 0 && /dosyayı aç/i.test(el.getAttribute('aria-label') || '')
        })
        const clipped = links.filter((el) => {
          let a: HTMLElement | null = el.parentElement
          const r = el.getBoundingClientRect()
          while (a) {
            const cs = getComputedStyle(a)
            if (cs.overflowX === 'hidden' || cs.overflowX === 'clip') {
              const ar = a.getBoundingClientRect()
              if (r.right > ar.right + 1) return true
            }
            a = a.parentElement
          }
          return r.right > window.innerWidth + 1
        })
        return { count: links.length, clipped: clipped.length }
      })
      expect(muAudit.clipped, 'Müvekkil detay Dosyalar işlem butonu kesilmemeli').toBe(0)
    }
  })
})
