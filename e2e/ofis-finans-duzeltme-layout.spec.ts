/**
 * Salt okunur layout fixture — Ofis Kasası dönem kartları + gruplu satır iskeleti.
 * Auth yok. npx playwright test e2e/ofis-finans-duzeltme-layout.spec.ts --project=public
 */
import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const shotDir = path.resolve(__dirname, '../tmp-ofis-finans-duzeltme')

const VIEWPORTS = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1280x720', width: 1280, height: 720 },
  { name: '1024x768', width: 1024, height: 768 }
] as const

function html(): string {
  return `<!DOCTYPE html><html lang="tr"><head><meta charset="utf-8"/>
<style>
*{box-sizing:border-box}body{margin:0;font-family:system-ui;background:#f5f5f4;padding:16px}
.cards{display:grid;gap:12px;grid-template-columns:repeat(3,minmax(0,1fr))}
@media(max-width:1024px){.cards{grid-template-columns:1fr}}
.card{border:1px solid #e7e5e4;border-radius:8px;padding:10px 12px;background:#fff}
.card h3{margin:0;font-size:10px;text-transform:uppercase;color:#78716c}
.card .val{margin-top:4px;font-size:17px;font-weight:700}
.row{font-size:10px;display:flex;justify-content:space-between;margin-top:2px}
.pos{color:#047857;font-weight:600}.neg{color:#b91c1c;font-weight:600}
.period{margin:12px 0;padding:10px;border:1px solid #e7e5e4;border-radius:8px;background:#fff;display:flex;flex-wrap:wrap;gap:8px}
select,input{height:32px;font-size:11px;border:1px solid #d6d3d1;border-radius:6px;padding:0 8px}
.stats{display:grid;gap:12px;grid-template-columns:repeat(4,minmax(0,1fr));margin-bottom:12px}
@media(max-width:1024px){.stats{grid-template-columns:1fr 1fr}}
table{width:100%;border-collapse:collapse;background:#fff;font-size:11px}
td,th{padding:8px 6px;border-bottom:1px solid #e7e5e4;vertical-align:top}
.duz{background:#fff1f2;border-left:4px solid #f43f5e}
.badge{display:inline-block;padding:2px 6px;border-radius:4px;background:#fef3c7;font-size:10px;font-weight:600}
</style></head><body>
<div class="cards" data-testid="balance-cards">
  <div class="card"><h3>Güncel Net Kasa Bakiyesi (TRY)</h3><div class="val">−5.500,00&nbsp;₺</div>
    <div class="row"><span>Toplam gelir</span><span>65.000,00&nbsp;₺</span></div>
    <div class="row"><span>Toplam gider</span><span>71.000,00&nbsp;₺</span></div>
    <div class="row"><span>Düzeltme etkisi</span><span class="pos">+500,00&nbsp;₺</span></div>
    <div class="row"><span>Net bakiye</span><span>−5.500,00&nbsp;₺</span></div>
  </div>
  <div class="card"><h3>Güncel Net Kasa Bakiyesi (USD)</h3><div class="val">$15.000,00</div>
    <div class="row"><span>Toplam gelir</span><span>$15.000,00</span></div>
    <div class="row"><span>Toplam gider</span><span>$0,00</span></div>
    <div class="row"><span>Düzeltme etkisi</span><span>€0,00</span></div>
  </div>
  <div class="card"><h3>Güncel Net Kasa Bakiyesi (EUR)</h3><div class="val">€0,00</div>
    <div class="row"><span>Toplam gelir</span><span>€0,00</span></div>
    <div class="row"><span>Toplam gider</span><span>€0,00</span></div>
    <div class="row"><span>Düzeltme etkisi</span><span>€0,00</span></div>
  </div>
</div>
<div class="period" data-testid="period">
  <select><option>Bu Ay</option></select>
  <input type="date" value="2026-09-01"/><input type="date" value="2026-09-22"/>
  <span style="font-size:10px;color:#78716c">Bu Ay · 2026-09-01 → 2026-09-22</span>
</div>
<div class="stats">
  <div class="card"><h3>Dönem Geliri</h3><div class="row"><span>TRY</span><span>7.500,00&nbsp;₺</span></div><div class="row"><span>USD</span><span>$15.000,00</span></div><div class="row"><span>EUR</span><span>€0,00</span></div></div>
  <div class="card"><h3>Dönem Gideri</h3><div class="row"><span>TRY</span><span>0,00&nbsp;₺</span></div><div class="row"><span>USD</span><span>$0,00</span></div><div class="row"><span>EUR</span><span>€0,00</span></div></div>
  <div class="card"><h3>Dönem Neti</h3><div class="row"><span>TRY</span><span>7.500,00&nbsp;₺</span></div><div class="row"><span>USD</span><span>$15.000,00</span></div></div>
  <div class="card"><h3>Onaysız İşlem</h3><div class="val">0</div></div>
</div>
<table data-testid="hareket-table">
<tr><th>Tarih</th><th>Tip</th><th>Açıklama</th><th>Tutar / Etki</th></tr>
<tr class="duz" data-testid="duzeltme-row"><td>10.08.2026<br/><small>Düzeltme: 05.09.2026</small></td><td>Düzeltme</td><td>Neden: tutar düzeltmesi<br/>Düzelten: Ayşe<br/>65.000 → 65.500</td><td class="pos">+500,00&nbsp;₺</td></tr>
<tr data-testid="parent-row"><td>10.08.2026</td><td>Gelir <span class="badge">Düzeltildi</span></td><td>Ağustos geliri</td><td>65.000,00&nbsp;₺</td></tr>
</table>
</body></html>`
}

for (const vp of VIEWPORTS) {
  test(`ofis finans layout @ ${vp.name}`, async ({ page }) => {
    fs.mkdirSync(shotDir, { recursive: true })
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.setContent(html(), { waitUntil: 'load' })
    const m = await page.evaluate(() => ({
      scrollW: document.documentElement.scrollWidth,
      clientW: document.documentElement.clientWidth,
      cards: document.querySelector('[data-testid="balance-cards"]')!.getBoundingClientRect().width,
      table: document.querySelector('[data-testid="hareket-table"]')!.getBoundingClientRect().width
    }))
    expect(m.scrollW).toBeLessThanOrEqual(vp.width + 1)
    expect(m.table).toBeLessThanOrEqual(vp.width)
    if (vp.name === '1366x768') {
      await page.screenshot({ path: path.join(shotDir, 'after-1366x768.png'), fullPage: true })
    }
    fs.writeFileSync(path.join(shotDir, `metrics-${vp.name}.json`), JSON.stringify({ vp, m }, null, 2))
  })
}
