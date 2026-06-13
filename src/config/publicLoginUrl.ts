/** Müşteriye gönderilecek giriş adresi (boşsa mevcut origin + `/login`). */
export function getPublicLoginUrl(): string {
  const raw = (import.meta.env.VITE_PUBLIC_APP_LOGIN_URL as string | undefined)?.trim()
  if (raw) return raw.replace(/\/$/, '')
  if (typeof window !== 'undefined') {
    return `${window.location.origin}/login`
  }
  return 'https://muvekkil.woontegra.com/login'
}
