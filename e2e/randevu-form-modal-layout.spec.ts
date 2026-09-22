/**
 * Yeni Randevu modal — kompakt genişlik / 1366 kaydırmasız görünürlük.
 * Auth gerektirmez: ModalScrim + RANDEVU_FORM_MODAL_WIDTH eşleniğini ölçer.
 *
 * Çalıştır: npx playwright test e2e/randevu-form-modal-layout.spec.ts --project=public
 */
import { expect, test } from '@playwright/test'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const shotDir = path.resolve(__dirname, '../tmp-randevu-modal-layout')

/** Önceki class: w-[min(680px,...)] max-w-full — ModalScrim w-full ile birleşince ekranı dolduruyordu. */
const BEFORE = {
  note: 'ModalScrim w-full + max-w-full kazanır → neredeyse viewport genişliği',
  formula: '≈100vw − padding (max-w-full + w-full çakışması)'
}

const AFTER_WIDTH = 'min(56rem, calc(100vw - 2rem))'

const VIEWPORTS = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1024x768', width: 1024, height: 768 }
] as const

function expectedWidth(vpWidth: number): number {
  // md:p-4 → 16px her yan; formül 100vw-2rem ile aynı
  return Math.min(56 * 16, vpWidth - 32)
}

function fixtureHtml(): string {
  return `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8" />
<style>
  * { box-sizing: border-box; }
  body { margin: 0; font-family: system-ui, sans-serif; background: #1c1917; }
  .scrim {
    position: fixed; inset: 0; display: flex; align-items: center; justify-content: center;
    padding: 16px; overflow-y: auto; background: rgba(0,0,0,.35);
  }
  /* ModalScrim varsayılanı + ! override (RANDEVU_FORM_MODAL_WIDTH) */
  .panel-shell {
    width: min(56rem, calc(100vw - 2rem)) !important;
    max-width: min(56rem, calc(100vw - 2rem)) !important;
    margin: 0 auto;
  }
  .panel {
    width: 100%; overflow: hidden; border-radius: 12px; border: 1px solid #e7e5e4;
    background: #fff; box-shadow: 0 20px 40px rgba(0,0,0,.18);
  }
  .header { padding: 12px 20px; border-bottom: 1px solid #e7e5e4; background: linear-gradient(135deg,#fafaf9,#fff); }
  .title { margin: 0; font-size: 13px; font-weight: 600; }
  .sub { margin: 2px 0 0; font-size: 10px; color: #78716c; }
  .body { padding: 12px 20px 14px; display: flex; flex-direction: column; gap: 12px; }
  .field label { display: block; margin-bottom: 4px; font-size: 10px; font-weight: 600; color: #78716c; }
  .control {
    height: 32px; width: 100%; min-width: 0; max-width: 100%;
    border: 1px solid #d6d3d1; border-radius: 6px; padding: 0 10px; font-size: 11px;
  }
  textarea.control { height: auto; min-height: 0; padding: 6px 10px; resize: vertical; }
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  @media (max-width: 767px) { .grid-2 { grid-template-columns: 1fr; } }
  .hint { margin: 4px 0 0; font-size: 10px; color: #78716c; }
  .footer {
    display: flex; justify-content: flex-end; gap: 8px;
    padding: 10px 20px; border-top: 1px solid #e7e5e4; background: #fafaf9;
  }
  .btn {
    height: 32px; padding: 0 12px; border-radius: 6px; border: 1px solid #d6d3d1;
    font-size: 11px; font-weight: 600; background: #fff;
  }
  .btn-primary { background: #1e3a5f; color: #fff; border-color: #1e3a5f; }
</style>
</head>
<body>
  <div class="scrim" data-testid="scrim">
    <div class="panel-shell" data-testid="randevu-form-shell" role="dialog" aria-modal="true">
      <div class="panel" data-testid="randevu-form-modal">
        <div class="header">
          <h2 class="title">Yeni Randevu</h2>
          <p class="sub">Randevu tarihini ve ilgili bilgileri belirleyin.</p>
        </div>
        <form>
          <div class="body">
            <div class="field">
              <label>Başlık *</label>
              <input class="control" value="Örnek randevu" />
            </div>
            <div class="grid-2">
              <div class="field"><label>Müvekkil</label><input class="control" placeholder="Müvekkil ara…" /></div>
              <div class="field"><label>Dosya</label><select class="control"><option>— Seçiniz —</option></select></div>
            </div>
            <div class="grid-2">
              <div class="field"><label>Tarih *</label><input class="control" type="date" value="2026-09-22" /></div>
              <div class="field"><label>Sorumlu</label><select class="control"><option>— Seçiniz —</option></select></div>
            </div>
            <div class="grid-2">
              <div class="field"><label>Başlangıç *</label><input class="control" type="time" value="10:00" /></div>
              <div class="field"><label>Bitiş *</label><input class="control" type="time" value="10:30" /></div>
            </div>
            <div class="field"><label>Konum</label><input class="control" /></div>
            <div class="field">
              <label>Açıklama</label>
              <textarea class="control" rows="2"></textarea>
            </div>
            <div class="field">
              <label>WhatsApp Hatırlatması</label>
              <select class="control">
                <option>Büro ayarlarını kullan</option>
              </select>
              <p class="hint">Müvekkil seçildiğinde hatırlatma planı ayarlanabilir.</p>
            </div>
          </div>
          <div class="footer" data-testid="randevu-form-footer">
            <button type="button" class="btn">Vazgeç</button>
            <button type="submit" class="btn btn-primary">Randevu Oluştur</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</body>
</html>`
}

for (const vp of VIEWPORTS) {
  test(`Yeni Randevu modal kompakt @ ${vp.name}`, async ({ page }) => {
    fs.mkdirSync(shotDir, { recursive: true })
    await page.setViewportSize({ width: vp.width, height: vp.height })
    await page.setContent(fixtureHtml(), { waitUntil: 'load' })

    const metrics = await page.evaluate(() => {
      const shell = document.querySelector('[data-testid="randevu-form-shell"]') as HTMLElement
      const modal = document.querySelector('[data-testid="randevu-form-modal"]') as HTMLElement
      const footer = document.querySelector('[data-testid="randevu-form-footer"]') as HTMLElement
      const scrim = document.querySelector('[data-testid="scrim"]') as HTMLElement
      const box = (el: Element) => {
        const r = el.getBoundingClientRect()
        return {
          x: Math.round(r.x * 10) / 10,
          y: Math.round(r.y * 10) / 10,
          width: Math.round(r.width * 10) / 10,
          height: Math.round(r.height * 10) / 10,
          right: Math.round(r.right * 10) / 10,
          bottom: Math.round(r.bottom * 10) / 10
        }
      }
      return {
        vw: window.innerWidth,
        vh: window.innerHeight,
        pageScrollWidth: document.documentElement.scrollWidth,
        scrimScroll: { scrollTop: scrim.scrollTop, scrollHeight: scrim.scrollHeight, clientHeight: scrim.clientHeight },
        shell: box(shell),
        modal: box(modal),
        footer: box(footer),
        centeredX: Math.abs(window.innerWidth / 2 - (box(shell).x + box(shell).width / 2)) < 2,
        fitsViewport:
          box(shell).width <= window.innerWidth &&
          box(shell).height <= window.innerHeight &&
          box(shell).x >= 0 &&
          box(shell).y >= 0 &&
          box(shell).right <= window.innerWidth + 1 &&
          box(shell).bottom <= window.innerHeight + 1,
        noInternalScrollNeeded: box(shell).height <= window.innerHeight - 32
      }
    })

    const reportPath = path.join(shotDir, `metrics-${vp.name}.json`)
    fs.writeFileSync(
      reportPath,
      JSON.stringify(
        {
          viewport: vp,
          before: {
            ...BEFORE,
            approxWidthPx: vp.width - 32
          },
          after: {
            formula: AFTER_WIDTH,
            expectedWidthPx: expectedWidth(vp.width),
            measured: metrics
          }
        },
        null,
        2
      ),
      'utf8'
    )

    expect(metrics.pageScrollWidth).toBeLessThanOrEqual(vp.width)
    expect(metrics.shell.width).toBeCloseTo(expectedWidth(vp.width), 0)
    expect(metrics.shell.width).toBeLessThanOrEqual(900)
    expect(metrics.centeredX).toBe(true)
    expect(metrics.fitsViewport).toBe(true)
    expect(metrics.footer.bottom).toBeLessThanOrEqual(vp.height)
    expect(metrics.modal.height).toBeLessThan(vp.height)

    if (vp.name === '1366x768') {
      expect(metrics.noInternalScrollNeeded).toBe(true)
      expect(metrics.scrimScroll.scrollHeight).toBeLessThanOrEqual(metrics.scrimScroll.clientHeight + 1)
      await page.screenshot({
        path: path.join(shotDir, 'after-1366x768.png'),
        fullPage: false
      })
    }
  })
}

test('öncesi/sonrası ölçü özeti yazar', async () => {
  fs.mkdirSync(shotDir, { recursive: true })
  const rows = VIEWPORTS.map((vp) => {
    const afterW = expectedWidth(vp.width)
    const beforeW = vp.width - 32
    return {
      viewport: vp.name,
      beforeWidthPx: beforeW,
      afterWidthPx: afterW,
      deltaPx: beforeW - afterW,
      afterFits896Cap: afterW <= 896
    }
  })
  fs.writeFileSync(path.join(shotDir, 'before-after-summary.json'), JSON.stringify({ formula: AFTER_WIDTH, rows }, null, 2), 'utf8')
  expect(rows.every((r) => r.afterFits896Cap)).toBe(true)
})
