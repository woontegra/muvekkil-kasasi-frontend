/**
 * Tahsilat Takibi işlem sütunu — gerçek Chromium layout assertion.
 * Auth gerektirmez: aynı density sınıflarının inline eşleniğini ölçer.
 *
 * Çalıştır: npx playwright test e2e/tahsilat-merkezi-table-layout.spec.ts
 */
import { expect, test } from '@playwright/test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const shotDir = path.resolve(__dirname, '../tmp-tahsilat-layout')

const VIEWPORTS = [
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1280x720', width: 1280, height: 720 },
] as const

function fixtureHtml(contentWidth: number): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, sans-serif; background: #f5f5f4; }
  main { width: ${contentWidth}px; max-width: 100%; margin: 0 auto; padding: 16px; }
  .mk-data-table-wrap { width: 100%; max-width: 100%; min-width: 0; border: 1px solid #e5e5e5; border-radius: 8px; background: #fff; }
  .mk-data-table { width: 100%; max-width: 100%; table-layout: fixed; border-collapse: collapse; text-align: left; font-size: 11px; line-height: 1.25; }
  th, td { padding: 8px 6px; vertical-align: middle; }
  th { font-size: 10px; text-transform: uppercase; color: #78716c; }
  .min-w-0 { min-width: 0; }
  .truncate { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .whitespace-nowrap { white-space: nowrap; }
  .text-right { text-align: right; }
  .action-col { width: 22.5rem; min-width: 22.5rem; max-width: 24rem; white-space: nowrap; text-align: right; vertical-align: middle; }
  .actions { display: flex; flex-wrap: nowrap; align-items: center; justify-content: flex-end; gap: 0.375rem; }
  .btn-table {
    display: inline-flex; align-items: center; justify-content: center;
    height: 27px; min-height: 27px; padding: 0 0.375rem; gap: 0.25rem;
    border-radius: 0.375rem; border: 1px solid #d6d3d1; background: #fff;
    font-size: 10px; font-weight: 600; white-space: nowrap; flex-shrink: 0;
    transform: none;
  }
  .btn-primary { background: #1e3a5f; color: #fff; border-color: #1e3a5f; }
</style>
</head>
<body>
<main>
  <div class="mk-data-table-wrap" data-testid="wrap">
    <table class="mk-data-table" data-testid="tahsilat-merkezi-table">
      <thead>
        <tr>
          <th class="min-w-0">Müvekkil</th>
          <th class="min-w-0">Dosya</th>
          <th class="min-w-0">Taksit</th>
          <th class="whitespace-nowrap text-right">Tutar</th>
          <th class="whitespace-nowrap text-right">Ödenen</th>
          <th class="whitespace-nowrap text-right">Kalan</th>
          <th class="whitespace-nowrap">Vade</th>
          <th class="whitespace-nowrap">Süre</th>
          <th class="whitespace-nowrap">Durum</th>
          <th class="action-col">İşlem</th>
        </tr>
      </thead>
      <tbody>
        <tr data-testid="tahsilat-merkezi-row">
          <td class="min-w-0"><div class="truncate">Ahmet Yılmaz Müvekkil Uzun Ad</div></td>
          <td class="min-w-0"><div class="truncate">Boşanma Davası Dosya Başlığı</div></td>
          <td class="min-w-0"><div class="truncate">Taksit #3 - peşinat</div></td>
          <td class="whitespace-nowrap text-right">12.500,00 ₺</td>
          <td class="whitespace-nowrap text-right">5.000,00 ₺</td>
          <td class="whitespace-nowrap text-right">7.500,00 ₺</td>
          <td class="whitespace-nowrap">15.10.2026</td>
          <td class="whitespace-nowrap" data-testid="sure-cell">5 gün kaldı</td>
          <td class="whitespace-nowrap" data-testid="durum-cell">Kısmi ödendi</td>
          <td class="action-col" data-testid="tahsilat-merkezi-islem-cell">
            <div class="actions" data-testid="tahsilat-merkezi-islem-actions">
              <button type="button" class="btn-table btn-primary">Ödeme Al</button>
              <button type="button" class="btn-table">WhatsApp'tan Gönder</button>
              <button type="button" class="btn-table">Ekstre Aç</button>
              <button type="button" class="btn-table">Dosyaya Git</button>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</main>
</body>
</html>`
}

for (const vp of VIEWPORTS) {
  test(`Tahsilat işlem sütunu çakışmaz @ ${vp.name}`, async ({ page }) => {
    fs.mkdirSync(shotDir, { recursive: true })
    // Sidebar (~240) + padding sonrası yaklaşık içerik genişliği
    const contentWidth = Math.max(960, vp.width - 280)
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.setContent(fixtureHtml(contentWidth), { waitUntil: 'load' })

    const metrics = await page.evaluate(() => {
      const table = document.querySelector('[data-testid="tahsilat-merkezi-table"]') as HTMLTableElement
      const row = document.querySelector('[data-testid="tahsilat-merkezi-row"]') as HTMLTableRowElement
      const islem = document.querySelector('[data-testid="tahsilat-merkezi-islem-cell"]') as HTMLTableCellElement
      const actions = document.querySelector('[data-testid="tahsilat-merkezi-islem-actions"]') as HTMLElement
      const buttons = [...actions.querySelectorAll('button')] as HTMLButtonElement[]
      const cells = [...row.querySelectorAll('td')] as HTMLTableCellElement[]

      const box = (el: Element) => {
        const r = el.getBoundingClientRect()
        return { x: r.x, y: r.y, width: r.width, height: r.height, right: r.right, left: r.left }
      }

      const overlaps: string[] = []
      for (let i = 0; i < cells.length; i++) {
        for (let j = i + 1; j < cells.length; j++) {
          const a = box(cells[i]!)
          const b = box(cells[j]!)
          const noOverlap =
            a.right <= b.left + 0.5 ||
            b.right <= a.left + 0.5 ||
            a.y + a.height <= b.y + 0.5 ||
            b.y + b.height <= a.y + 0.5
          if (!noOverlap) overlaps.push(`td[${i}]∩td[${j}]`)
        }
      }

      for (const btn of buttons) {
        const br = box(btn)
        for (let i = 0; i < cells.length - 1; i++) {
          const cr = box(cells[i]!)
          const noOverlap =
            br.right <= cr.left + 0.5 ||
            cr.right <= br.left + 0.5 ||
            br.y + br.height <= cr.y + 0.5 ||
            cr.y + cr.height <= br.y + 0.5
          if (!noOverlap) overlaps.push(`btn:${btn.textContent?.trim()}∩td[${i}]`)
        }
        // Buton işlem hücresi içinde
        const ir = box(islem)
        if (br.left < ir.left - 0.5 || br.right > ir.right + 0.5) {
          overlaps.push(`btn:${btn.textContent?.trim()} outside islem cell`)
        }
      }

      const labels = buttons.map((b) => b.textContent?.trim() ?? '')
      return {
        docScroll: document.documentElement.scrollWidth,
        docClient: document.documentElement.clientWidth,
        tableScroll: table.scrollWidth,
        tableClient: table.clientWidth,
        islem: box(islem),
        buttons: buttons.map((b) => ({ label: b.textContent?.trim(), ...box(b) })),
        cells: cells.map((c, i) => ({ i, text: c.innerText.slice(0, 40), ...box(c) })),
        overlaps,
        labels,
        hasSms: labels.includes('SMS Gönder'),
      }
    })

    expect(metrics.hasSms, 'SMS Gönder olmamalı').toBe(false)
    expect(metrics.labels).toEqual(['Ödeme Al', "WhatsApp'tan Gönder", 'Ekstre Aç', 'Dosyaya Git'])
    expect(metrics.overlaps, JSON.stringify(metrics.overlaps)).toEqual([])
    expect(metrics.tableScroll).toBeLessThanOrEqual(metrics.tableClient + 1)
    expect(metrics.docScroll).toBeLessThanOrEqual(metrics.docClient + 1)

    for (const b of metrics.buttons) {
      expect(b.width, b.label).toBeGreaterThan(8)
      expect(b.height, b.label).toBeGreaterThan(8)
    }

    fs.writeFileSync(
      path.join(shotDir, `metrics-${vp.name}.json`),
      JSON.stringify({ viewport: vp, contentWidth, metrics }, null, 2),
      'utf8',
    )

    if (vp.name === '1440x900') {
      await page.screenshot({
        path: path.join(shotDir, 'tahsilat-islem-1440x900.png'),
        fullPage: true,
      })
    }
  })
}
