import { test, expect } from '@playwright/test'

async function waitAppReady(page: import('@playwright/test').Page): Promise<void> {
  await expect(page.getByText(/oturum doğrulanıyor/i)).toHaveCount(0, { timeout: 30_000 })
  await expect(page).not.toHaveURL(/\/login/)
}

test.describe('Responsive / modal taşma', () => {
  test('dar ekranda ana sayfa yatay taşmaz', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/app')
    await waitAppReady(page)
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2)
  })

  test('tablet genişlikte tahsilat merkezi', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/app/tahsilat-merkezi')
    await waitAppReady(page)
    await expect(page).not.toHaveURL(/\/login/)
    const bodyOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 4
    )
    expect(bodyOverflow).toBeFalsy()
  })
})
