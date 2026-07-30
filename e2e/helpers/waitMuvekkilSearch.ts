import type { Page, Response } from '@playwright/test'

/** Ana sayfa müvekkil listesi GET /api/v1/muvekkiller — debounce sonrası gelen isteği yakala. */
export function waitMuvekkilListResponse(page: Page, q: string, timeout = 20_000): Promise<Response> {
  const expected = q.trim()
  return page.waitForResponse(
    (res) => {
      if (res.request().method() !== 'GET') return false
      if (!res.ok()) return false
      let url: URL
      try {
        url = new URL(res.url())
      } catch {
        return false
      }
      if (!url.pathname.includes('/api/v1/muvekkiller')) return false
      // Tek kayıt detay isteklerini ele
      if (/\/api\/v1\/muvekkiller\/[^/?]+/.test(url.pathname)) return false
      const param = (url.searchParams.get('q') ?? '').trim()
      if (!expected) return param === ''
      return param === expected
    },
    { timeout }
  )
}
