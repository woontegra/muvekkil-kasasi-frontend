import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Page } from '@playwright/test'

const here = path.dirname(fileURLToPath(import.meta.url))
export const RQ_OUT = path.resolve(here, '../../tmp-responsive-quality')

export type AuditFailure = {
  type: string
  route: string
  viewport: string
  selector?: string
  message: string
  elementBox?: Record<string, number> | null
  containerBox?: Record<string, number> | null
  screenshot?: string
}

export type AuditResult = {
  route: string
  surface?: string
  viewport: string
  metrics: {
    innerWidth: number
    innerHeight: number
    devicePixelRatio: number
    clientWidth: number
    scrollWidth: number
    mainClientWidth?: number
    mainScrollWidth?: number
  }
  fail: AuditFailure[]
  pass: boolean
}

function boxesOverlap(
  a: { left: number; right: number; top: number; bottom: number },
  b: { left: number; right: number; top: number; bottom: number }
): boolean {
  return !(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top)
}

export async function captureViewportMetrics(page: Page) {
  return page.evaluate(() => {
    const doc = document.documentElement
    const main = document.querySelector('main')
    return {
      innerWidth: window.innerWidth,
      innerHeight: window.innerHeight,
      devicePixelRatio: window.devicePixelRatio,
      clientWidth: doc.clientWidth,
      scrollWidth: doc.scrollWidth,
      mainClientWidth: main?.clientWidth,
      mainScrollWidth: main?.scrollWidth
    }
  })
}

/**
 * Sayfa responsive denetimi — salt okunur.
 * html/body overflow-x:hidden sahte PASS’e güvenmez; main + element kırpılmasını da ölçer.
 */
export async function auditPage(
  page: Page,
  route: string,
  viewport: string,
  opts?: { expectAuthenticated?: boolean }
): Promise<AuditResult> {
  const metrics = await captureViewportMetrics(page)
  const fail: AuditFailure[] = []

  const push = (f: Omit<AuditFailure, 'route' | 'viewport'>) => {
    fail.push({ ...f, route, viewport })
  }

  const href = page.url()
  if (opts?.expectAuthenticated !== false && /\/login(?:\?|$)/.test(new URL(href).pathname)) {
    push({
      type: 'unauthenticated_redirect',
      message: `Beklenen authenticated yüzey login'e düştü: ${href}`
    })
    return { route, viewport, metrics, fail, pass: false }
  }

  // 1) Yatay taşma — document VE main
  if (metrics.scrollWidth > metrics.clientWidth + 1) {
    push({
      type: 'horizontal_overflow_document',
      message: `document scrollWidth ${metrics.scrollWidth} > clientWidth ${metrics.clientWidth}`
    })
  }
  if (
    metrics.mainScrollWidth != null &&
    metrics.mainClientWidth != null &&
    metrics.mainScrollWidth > metrics.mainClientWidth + 2
  ) {
    push({
      type: 'horizontal_overflow_main',
      message: `main scrollWidth ${metrics.mainScrollWidth} > clientWidth ${metrics.mainClientWidth}`
    })
  }

  // 2–8) Element denetimleri
  const elementAudit = await page.evaluate(() => {
    const vw = window.innerWidth
    const issues: {
      type: string
      selector: string
      message: string
      elementBox: { left: number; right: number; top: number; bottom: number; width: number; height: number }
      containerBox?: { left: number; right: number; top: number; bottom: number; width: number; height: number } | null
    }[] = []

    const visible = (el: Element) => {
      const s = getComputedStyle(el)
      if (s.display === 'none' || s.visibility === 'hidden' || Number(s.opacity) === 0) return false
      const r = el.getBoundingClientRect()
      return r.width > 0.5 && r.height > 0.5
    }

    const cssPath = (el: Element): string => {
      if ((el as HTMLElement).dataset?.testid) return `[data-testid="${(el as HTMLElement).dataset.testid}"]`
      const id = (el as HTMLElement).id
      if (id) return `#${id}`
      const tag = el.tagName.toLowerCase()
      const cls = typeof el.className === 'string' ? el.className.trim().split(/\s+/).slice(0, 2).join('.') : ''
      return cls ? `${tag}.${cls}` : tag
    }

    const boxOf = (el: Element) => {
      const r = el.getBoundingClientRect()
      return {
        left: Math.round(r.left * 10) / 10,
        right: Math.round(r.right * 10) / 10,
        top: Math.round(r.top * 10) / 10,
        bottom: Math.round(r.bottom * 10) / 10,
        width: Math.round(r.width * 10) / 10,
        height: Math.round(r.height * 10) / 10
      }
    }

    const intentionalHScrollParent = (el: Element): HTMLElement | null => {
      let a: HTMLElement | null = el.parentElement
      while (a && a !== document.body) {
        const ox = getComputedStyle(a).overflowX
        if (ox === 'auto' || ox === 'scroll') {
          const ar = a.getBoundingClientRect()
          // Kaydırıcı kendisi viewport içindeyse çocukların taşması kasıtlı (sekme şeridi vb.)
          if (ar.left >= -2 && ar.right <= vw + 2 && ar.width > 0) return a
        }
        a = a.parentElement
      }
      return null
    }

    const interactive = [
      ...document.querySelectorAll(
        'main button, main a[href], main input, main select, main textarea, main [role="button"], main .mk-data-table button, main .mk-data-table a'
      )
    ].filter(visible)

    for (const el of interactive) {
      const r = el.getBoundingClientRect()
      const box = boxOf(el)
      const hScrollParent = intentionalHScrollParent(el)

      // Yatay viewport dışı — kaydırılabilir satırlar dahil (işlem sütunu kesilmesi)
      // Kasıtlı overflow-x:auto şeritlerindeki sekme/chip butonları hariç
      if (!hScrollParent && (r.right > vw + 1 || r.left < -1)) {
        issues.push({
          type: 'element_outside_viewport_x',
          selector: cssPath(el),
          message: `Element yatay viewport dışında (left=${box.left}, right=${box.right}, vw=${vw})`,
          elementBox: box
        })
      }

      // Overflow ancestor kırpması — görünen genişlik < scrollWidth
      if (!hScrollParent) {
        let ancestor: HTMLElement | null = el.parentElement
        while (ancestor && ancestor !== document.body) {
          const cs = getComputedStyle(ancestor)
          const ox = cs.overflowX
          if (ox === 'hidden' || ox === 'clip' || ox === 'scroll' || ox === 'auto') {
            const ar = ancestor.getBoundingClientRect()
            // Buton/link sağ kenarı container sağını aşıyor mu?
            if (r.right > ar.right + 1 && (ox === 'hidden' || ox === 'clip')) {
              issues.push({
                type: 'clipped_by_overflow_ancestor',
                selector: cssPath(el),
                message: `Element overflow:${ox} ancestor tarafından kesiliyor`,
                elementBox: box,
                containerBox: boxOf(ancestor)
              })
              break
            }
          }
          ancestor = ancestor.parentElement
        }
      }

      // Görünen genişlik < gerçek içerik genişliği (kesilmiş)
      const htmlEl = el as HTMLElement
      if (htmlEl.scrollWidth > htmlEl.clientWidth + 2 && (el.tagName === 'BUTTON' || el.tagName === 'A')) {
        // truncate linkler hariç — işlem butonları whitespace-nowrap olmalı
        const nowrap = getComputedStyle(el).whiteSpace
        if (nowrap === 'nowrap' || el.closest('[data-testid*="islem"], td:last-child')) {
          issues.push({
            type: 'button_content_clipped',
            selector: cssPath(el),
            message: `scrollWidth ${htmlEl.scrollWidth} > clientWidth ${htmlEl.clientWidth}`,
            elementBox: box
          })
        }
      }
    }

    // Tablo hücre çakışması — aynı satırda komşu hücre içeriği
    for (const row of document.querySelectorAll('main table.mk-data-table tbody tr, main .mk-data-table tbody tr')) {
      const cells = [...row.querySelectorAll('td')].filter(visible)
      for (let i = 0; i < cells.length - 1; i++) {
        const a = cells[i]!
        const b = cells[i + 1]!
        const aInner = a.querySelector('button, a, span.inline-flex, [data-testid]') || a
        const bInner = b.querySelector('button, a, span.inline-flex, [data-testid]') || b
        if (!visible(aInner) || !visible(bInner)) continue
        const ba = boxOf(aInner)
        const bb = boxOf(bInner)
        // hücre sınırları içinde kalmalı: aInner.right <= a.right + 1
        const aCell = boxOf(a)
        if (ba.right > aCell.right + 1.5) {
          issues.push({
            type: 'cell_content_overflow',
            selector: cssPath(aInner),
            message: `Hücre içeriği sütun sınırını aşıyor (overflow ${Math.round(ba.right - aCell.right)}px)`,
            elementBox: ba,
            containerBox: aCell
          })
        }
        if (
          !(ba.right <= bb.left || bb.right <= ba.left || ba.bottom <= bb.top || bb.bottom <= ba.top)
        ) {
          issues.push({
            type: 'column_overlap',
            selector: `${cssPath(aInner)} ∩ ${cssPath(bInner)}`,
            message: 'Komşu sütun içerikleri kesişiyor',
            elementBox: ba,
            containerBox: bb
          })
        }
      }
    }

    // Modal / sheet taşması
    for (const modal of document.querySelectorAll('[role="dialog"], [data-testid*="modal"], .fixed.inset-0 > *')) {
      if (!visible(modal)) continue
      const r = modal.getBoundingClientRect()
      if (r.width > vw + 4 || r.left < -4 || r.right > vw + 4) {
        issues.push({
          type: 'modal_overflow',
          selector: cssPath(modal),
          message: `Modal/sheet viewport dışına taşıyor`,
          elementBox: boxOf(modal)
        })
      }
    }

    // Sidebar ana içeriğin üstüne binmesin (md+)
    const sidebar = document.querySelector('aside, [data-testid="app-sidebar"]')
    const main = document.querySelector('main')
    if (sidebar && main && visible(sidebar) && window.innerWidth >= 768) {
      const sb = boxOf(sidebar)
      const mb = boxOf(main)
      if (sb.right > mb.left + 2 && sb.left < mb.right) {
        // sticky overlap check — sidebar should end before main starts
        if (Math.abs(sb.right - mb.left) > 2 && sb.right > mb.left) {
          issues.push({
            type: 'sidebar_overlap_main',
            selector: 'aside ∩ main',
            message: 'Sidebar ana içeriğin üzerine biniyor',
            elementBox: sb,
            containerBox: mb
          })
        }
      }
    }

    // İstenmeyen yatay tablo scroll
    for (const wrap of document.querySelectorAll('.mk-data-table-wrap')) {
      if (!visible(wrap)) continue
      const el = wrap as HTMLElement
      if (el.scrollWidth > el.clientWidth + 2) {
        issues.push({
          type: 'table_horizontal_scroll',
          selector: cssPath(wrap),
          message: `Tablo yatay scroll: ${el.scrollWidth} > ${el.clientWidth}`,
          elementBox: boxOf(wrap)
        })
      }
    }

    return issues
  })

  for (const issue of elementAudit) {
    push({
      type: issue.type,
      selector: issue.selector,
      message: issue.message,
      elementBox: issue.elementBox,
      containerBox: issue.containerBox ?? null
    })
  }

  return {
    route,
    viewport,
    metrics,
    fail,
    pass: fail.length === 0
  }
}

export async function saveFailureScreenshot(
  page: Page,
  routeId: string,
  viewport: string,
  type: string
): Promise<string> {
  const dir = path.join(RQ_OUT, 'failures')
  fs.mkdirSync(dir, { recursive: true })
  const safe = `${routeId}_${viewport}_${type}`.replace(/[^\w.-]+/g, '_')
  const file = path.join(dir, `${safe}.png`)
  await page.screenshot({ path: file, fullPage: false })
  return file
}

export function writeReports(results: AuditResult[], inventoryWarning: string[]): void {
  fs.mkdirSync(RQ_OUT, { recursive: true })
  const jsonPath = path.join(RQ_OUT, 'responsive-quality-report.json')
  const mdPath = path.join(RQ_OUT, 'responsive-quality-report.md')
  const htmlPath = path.join(RQ_OUT, 'responsive-quality-report.html')

  const failCount = results.reduce((n, r) => n + r.fail.length, 0)
  const passCount = results.filter((r) => r.pass).length

  const payload = {
    generatedAt: new Date().toISOString(),
    summary: {
      combinations: results.length,
      pass: passCount,
      failCombinations: results.length - passCount,
      failCount,
      inventoryWarnings: inventoryWarning
    },
    results
  }
  fs.writeFileSync(jsonPath, JSON.stringify(payload, null, 2), 'utf8')

  const lines = [
    '# Responsive quality report',
    '',
    `Generated: ${payload.generatedAt}`,
    '',
    `Combinations: **${results.length}** · PASS: **${passCount}** · FAIL combos: **${results.length - passCount}** · Total findings: **${failCount}**`,
    ''
  ]
  if (inventoryWarning.length) {
    lines.push('## Inventory warnings', ...inventoryWarning.map((w) => `- ${w}`), '')
  }
  if (failCount > 0) {
    lines.push('> **responsive tamam değil** — FAIL bulguları var.', '')
  } else {
    lines.push('> Responsive quality gate: **PASS** (0 FAIL).', '')
  }
  lines.push('| Route | Viewport | Yatay taşma | Kesilen işlem | Çakışma | Modal taşması | PASS/FAIL |', '|---|---|---|---|---|---|---|')
  for (const r of results) {
    const types = new Set(r.fail.map((f) => f.type))
    const yatay = types.has('horizontal_overflow_document') || types.has('horizontal_overflow_main') || types.has('table_horizontal_scroll') ? 'FAIL' : 'OK'
    const kesilen =
      types.has('clipped_by_overflow_ancestor') ||
      types.has('button_content_clipped') ||
      types.has('element_outside_viewport_x')
        ? 'FAIL'
        : 'OK'
    const cakisma = types.has('column_overlap') || types.has('cell_content_overflow') ? 'FAIL' : 'OK'
    const modal = types.has('modal_overflow') ? 'FAIL' : 'OK'
    lines.push(
      `| ${r.route}${r.surface ? ` / ${r.surface}` : ''} | ${r.viewport} | ${yatay} | ${kesilen} | ${cakisma} | ${modal} | ${r.pass ? 'PASS' : 'FAIL'} |`
    )
  }
  lines.push('', '## Findings')
  for (const r of results.filter((x) => !x.pass)) {
    lines.push(`### ${r.route} @ ${r.viewport}`)
    for (const f of r.fail) {
      lines.push(`- **${f.type}**: ${f.message}${f.selector ? ` (\`${f.selector}\`)` : ''}`)
    }
  }
  fs.writeFileSync(mdPath, lines.join('\n'), 'utf8')

  const html = `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"/><title>Responsive quality</title>
  <style>body{font-family:system-ui,sans-serif;margin:24px}table{border-collapse:collapse;width:100%}th,td{border:1px solid #ccc;padding:6px 8px;font-size:12px}th{background:#f5f5f5}.fail{color:#b91c1c;font-weight:700}.pass{color:#15803d}</style></head><body>
  <h1>Responsive quality</h1>
  <p>${payload.generatedAt} — FAIL findings: <strong class="${failCount ? 'fail' : 'pass'}">${failCount}</strong></p>
  <pre>${inventoryWarning.map((w) => escapeHtml(w)).join('\n')}</pre>
  <table><thead><tr><th>Route</th><th>Viewport</th><th>Yatay</th><th>Kesilen</th><th>Çakışma</th><th>Modal</th><th>Sonuç</th></tr></thead><tbody>
  ${results
    .map((r) => {
      const types = new Set(r.fail.map((f) => f.type))
      const yatay = types.has('horizontal_overflow_document') || types.has('horizontal_overflow_main') || types.has('table_horizontal_scroll') ? 'FAIL' : 'OK'
      const kesilen =
        types.has('clipped_by_overflow_ancestor') || types.has('button_content_clipped') || types.has('element_outside_viewport_x')
          ? 'FAIL'
          : 'OK'
      const cakisma = types.has('column_overlap') || types.has('cell_content_overflow') ? 'FAIL' : 'OK'
      const modal = types.has('modal_overflow') ? 'FAIL' : 'OK'
      return `<tr><td>${escapeHtml(r.route)}${r.surface ? ' / ' + escapeHtml(r.surface) : ''}</td><td>${r.viewport}</td><td>${yatay}</td><td>${kesilen}</td><td>${cakisma}</td><td>${modal}</td><td class="${r.pass ? 'pass' : 'fail'}">${r.pass ? 'PASS' : 'FAIL'}</td></tr>`
    })
    .join('\n')}
  </tbody></table></body></html>`
  fs.writeFileSync(htmlPath, html, 'utf8')
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export { boxesOverlap }
