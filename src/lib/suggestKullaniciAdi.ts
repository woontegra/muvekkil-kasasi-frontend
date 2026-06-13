/** Türkçe / Latin harflerini küçük ASCII kullanıcı adı önerisine çevirir (Woontegra admin hızlı kayıt). */
const TR_ASCII: Record<string, string> = {
  ı: 'i',
  İ: 'i',
  ş: 's',
  Ş: 's',
  ğ: 'g',
  Ğ: 'g',
  ü: 'u',
  Ü: 'u',
  ö: 'o',
  Ö: 'o',
  ç: 'c',
  Ç: 'c',
  â: 'a',
  Â: 'a',
  ê: 'e',
  Ê: 'e',
  î: 'i',
  Î: 'i',
  ô: 'o',
  Ô: 'o',
  û: 'u',
  Û: 'u'
}

function mapTr(s: string): string {
  let out = ''
  for (const ch of s) {
    out += TR_ASCII[ch] ?? ch
  }
  return out
}

/**
 * Yetkili adı veya büro adından kullanıcı adı önerisi (küçük harf, a-z 0-9 . _ -).
 * Boş veya çok kısa girdide boş veya anlamlı minimum uzunlukta dize döner.
 */
export function suggestKullaniciAdi(raw: string): string {
  const t = raw.trim()
  if (!t) return ''

  let s = mapTr(t)
  s = s.normalize('NFD').replace(/\p{M}/gu, '')
  s = s.toLowerCase()
  s = s.replace(/[^a-z0-9]+/g, '.')
  s = s.replace(/\.+/g, '.').replace(/^\.+|\.+$/g, '')

  if (s.length < 3) {
    const pad = 'mkd'
    s = s ? `${s}.${pad}` : pad
  }
  return s.slice(0, 64)
}
