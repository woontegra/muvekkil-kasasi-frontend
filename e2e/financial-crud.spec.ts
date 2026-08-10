import { test, expect } from '@playwright/test'
import { assertEditableTextField, assertMoneyField } from './helpers/inputMatrix'
import { waitAppReady } from './helpers/waitAppReady'
import fs from 'node:fs'
import path from 'node:path'

const stamp = Date.now()
const muvekkilAd = `E2E Fin ${stamp}`
const dosyaBaslik = `E2E Fin Dosya ${stamp}`

test.describe.serial('Finansal CRUD + PDF (UI)', () => {
  let dosyaUrl = ''

  test('müvekkil + dosya + vekalet taksit + kısmi ödemeler', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('pageerror', (e) => consoleErrors.push(e.message))
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text())
    })

    await page.goto('/app/muvekkiller/yeni')
    await waitAppReady(page)
    const ad = page.getByLabel(/^ad soyad$/i)
    await assertEditableTextField(page, ad)
    await ad.fill(muvekkilAd)
    await page.getByLabel(/^telefon$/i).fill('05328881122')
    await page.getByRole('button', { name: /kaydet|oluştur/i }).first().click()
    await expect(page).toHaveURL(/\/muvekkil\//, { timeout: 20_000 })

    await page.getByRole('link', { name: /yeni dosya|dosya ekle/i }).or(page.getByRole('button', { name: /yeni dosya|dosya ekle/i })).first().click()
    await expect(page).toHaveURL(/dosyalar\/yeni/, { timeout: 15_000 })
    await waitAppReady(page)
    const baslik = page.getByLabel(/konu başlığı/i)
    await assertEditableTextField(page, baslik)
    await baslik.fill(dosyaBaslik)
    await page.getByRole('button', { name: /kaydet|oluştur/i }).first().click()
    await expect(page).toHaveURL(/\/dosya\//, { timeout: 20_000 })
    dosyaUrl = page.url()

    // Vekalet sekmesi
    const vekaletTab = page.getByRole('tab', { name: /vekalet/i }).or(page.getByRole('button', { name: /vekalet/i }))
    if (await vekaletTab.first().isVisible().catch(() => false)) {
      await vekaletTab.first().click()
    } else {
      await page.goto(dosyaUrl.includes('?') ? `${dosyaUrl}&tab=vekalet` : `${dosyaUrl}?tab=vekalet`)
    }
    await waitAppReady(page)

    const tutarField = page.getByLabel(/toplam|anlaşılan|vekalet tutar/i).first()
    if (await tutarField.isVisible().catch(() => false)) {
      await assertMoneyField(page, tutarField)
      await tutarField.fill('1000')
      const kaydetVek = page.getByRole('button', { name: /kaydet|oluştur|güncelle/i }).first()
      await kaydetVek.click()
      await page.waitForTimeout(800)
    }

    // Tek taksit / plan butonu
    const tekTaksit = page.getByRole('button', { name: /tek taksit|taksit plan|plan oluştur/i }).first()
    if (await tekTaksit.isVisible().catch(() => false)) {
      await tekTaksit.click()
      const modalTutar = page.getByLabel(/tutar/i).first()
      if (await modalTutar.isVisible().catch(() => false)) {
        await modalTutar.fill('1000')
      }
      await page.getByRole('button', { name: /kaydet|oluştur|onayla/i }).last().click()
      await page.waitForTimeout(1000)
    }

    // Ödeme al
    const odemeBtn = page.getByRole('button', { name: /ödeme al|tahsilat|kısmi/i }).first()
    if (await odemeBtn.isVisible().catch(() => false)) {
      await odemeBtn.click()
      const odemeTutar = page.getByLabel(/^tutar$/i).or(page.getByLabel(/ödeme tutar/i)).first()
      await expect(odemeTutar).toBeVisible({ timeout: 10_000 })
      await assertMoneyField(page, odemeTutar)
      await odemeTutar.fill('300')
      // Çift tık kaydet
      const kaydet = page.getByRole('button', { name: /kaydet|tamam|onayla/i }).last()
      await kaydet.dblclick()
      await page.waitForTimeout(1500)
      await expect(page.getByText(/kısmi|300|ödeme/i).first()).toBeVisible({ timeout: 10_000 })
    }

    await page.reload()
    await waitAppReady(page)
    await expect(page.getByText(dosyaBaslik).first()).toBeVisible()

    const critical = consoleErrors.filter(
      (e) =>
        !/ResizeObserver|favicon|Download the React DevTools|Non-Error|\[api error\]|Failed to load resource|NetworkError|401 \(Unauthorized\)|ağ hatası/i.test(
          e
        )
    )
    expect(critical, critical.join('\n')).toEqual([])
  })

  test('ekstre PDF indir + yazdır', async ({ page }) => {
    test.skip(!dosyaUrl, 'Dosya yok')
    await page.goto(dosyaUrl)
    await waitAppReady(page)

    await page.getByRole('button', { name: 'Müvekkil Ekstresi' }).click()
    const pdfBtn = page.getByRole('button', { name: 'PDF İndir' })
    await expect(pdfBtn).toBeVisible({ timeout: 20_000 })
    await expect(pdfBtn).toBeEnabled({ timeout: 30_000 })

    // Önizleme metni = PDF/yazdır ile aynı ekstre kaynağı
    await expect(page.getByText(muvekkilAd).first()).toBeVisible()
    await expect(page.getByText(dosyaBaslik).first()).toBeVisible()
    await expect(page.getByRole('cell', { name: 'MÜVEKKIL EKSTRESI' })).toBeVisible()

    const downloadPromise = page.waitForEvent('download', { timeout: 60_000 })
    await pdfBtn.click()
    await expect(page.getByText('Müvekkil ekstresi PDF olarak indirildi.')).toBeVisible({
      timeout: 60_000
    })
    const download = await downloadPromise
    const out = path.join(test.info().outputDir, download.suggestedFilename() || 'ekstre.pdf')
    await download.saveAs(out)
    const buf = fs.readFileSync(out)
    expect(buf.length).toBeGreaterThan(100)
    expect(buf.subarray(0, 4).toString('utf8')).toBe('%PDF')
    const latin1 = buf.toString('latin1')
    expect(latin1).toMatch(/\/Type\s*\/Catalog|endobj/)
    expect(latin1).not.toMatch(/Tahsilat Takibi|Ana menü|Bildirim Merkezi/)
    // Metin tabanlı PDF (Roboto gömülü stream/font)
    expect(latin1).toMatch(/Font|Roboto|stream/)

    // Print CSS: yalnızca ekstre kökü; print stub
    await page.evaluate(() => {
      window.print = () => {
        ;(window as unknown as { __printCalled?: boolean }).__printCalled = true
      }
    })
    const yazdir = page.getByRole('button', { name: 'Yazdır' })
    await expect(yazdir).toBeEnabled()
    await yazdir.click()
    await expect(page.locator('[id^="ekstre-print-"]').first()).toBeAttached({ timeout: 10_000 })
    const modalPrint = page.locator('[role="dialog"]').getByRole('button', { name: 'Yazdır' })
    if (await modalPrint.isVisible({ timeout: 3000 }).catch(() => false)) {
      await modalPrint.click()
    }
    await expect
      .poll(async () =>
        page.evaluate(() => Boolean((window as unknown as { __printCalled?: boolean }).__printCalled))
      )
      .toBe(true)

    const printCssHidesChrome = await page.evaluate(() => {
      const sheets = Array.from(document.styleSheets)
      let found = false
      for (const sheet of sheets) {
        try {
          for (const rule of Array.from(sheet.cssRules || [])) {
            if (rule instanceof CSSMediaRule && rule.media.mediaText.includes('print')) {
              const text = Array.from(rule.cssRules)
                .map((r) => r.cssText)
                .join('\n')
              if (/body\s*>\s*:not|#root|visibility:\s*hidden/i.test(text)) found = true
            }
          }
        } catch {
          /* cross-origin sheets */
        }
      }
      return found
    })
    expect(printCssHidesChrome).toBe(true)
  })
})
