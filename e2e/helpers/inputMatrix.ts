import type { Locator, Page } from '@playwright/test'
import { expect } from '@playwright/test'

/** Ortak input yazma senaryoları — “yazılamıyor” regresyonu için. */
export async function assertEditableTextField(
  page: Page,
  field: Locator,
  options?: { turkish?: boolean; clearAndRetype?: boolean }
): Promise<void> {
  await expect(field).toBeVisible()
  await expect(field).toBeEditable()
  await field.click()
  await field.fill('')
  await field.type('abc', { delay: 20 })
  await expect(field).toHaveValue(/abc/)

  if (options?.turkish !== false) {
    await field.fill('')
    await field.type('Ğüşiöç İı', { delay: 15 })
    await expect(field).toHaveValue(/Ğüşiöç İı/)
  }

  await field.press('Control+A')
  await field.type('YZ', { delay: 15 })
  await expect(field).toHaveValue('YZ')

  await field.fill('kopya-kaynak')
  await field.press('Control+A')
  await field.press('Control+C')
  await field.fill('')
  await field.press('Control+V')
  await expect(field).toHaveValue(/kopya-kaynak/)

  if (options?.clearAndRetype !== false) {
    await field.fill('')
    await field.type('sonradan', { delay: 25 })
    await expect(field).toHaveValue('sonradan')
    for (let i = 0; i < 3; i++) await field.press('Backspace')
    await expect(field).toHaveValue('sonra')
    await field.type('DAN', { delay: 20 })
    await expect(field).toHaveValue('sonraDAN')
  }
}

export async function assertMoneyField(page: Page, field: Locator): Promise<void> {
  await expect(field).toBeVisible()
  await expect(field).toBeEditable()
  await field.click()
  await field.fill('')
  await field.type('1500,50', { delay: 25 })
  const v1 = await field.inputValue()
  expect(v1.replace(/\s/g, '')).toMatch(/1\.?500,50|1500,50/)
  await field.fill('')
  await field.type('2500.75', { delay: 25 })
  const v2 = await field.inputValue()
  expect(v2.length).toBeGreaterThan(0)
  await field.press('Control+A')
  await field.type('99,9', { delay: 20 })
  await expect(field).not.toHaveValue('')
}

export async function tabToNext(page: Page): Promise<void> {
  await page.keyboard.press('Tab')
}
