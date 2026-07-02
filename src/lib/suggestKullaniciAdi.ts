import { normalizeKullaniciAdi } from './normalizeKullaniciAdi'

/**
 * Yetkili adı veya büro adından kullanıcı adı önerisi.
 * Boş veya çok kısa girdide minimum uzunlukta öneri döner.
 */
export function suggestKullaniciAdi(raw: string): string {
  const s = normalizeKullaniciAdi(raw)
  if (!s) return ''
  if (s.length < 3) {
    const pad = 'mkd'
    return `${s}${s ? '-' : ''}${pad}`.slice(0, 64)
  }
  return s
}
