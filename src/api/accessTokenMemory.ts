/**
 * Access token yalnızca bellek — localStorage/sessionStorage yok.
 * Sayfa yenilemede HttpOnly refresh cookie + /auth/refresh ile yeniden alınır.
 */

let memoryAccessToken: string | null = null

export function getAccessToken(): string | null {
  return memoryAccessToken
}

export function setAccessToken(token: string | null): void {
  memoryAccessToken = token
}

/** Eski localStorage anahtarını bir kez temizler (geçiş). */
export function purgeLegacyAccessTokenStorage(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('mkd_access_token')
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('mkd_access_token')
    }
  } catch {
    /* ignore */
  }
}
