/**
 * Admin access token yalnızca bellek.
 * HttpOnly admin refresh cookie JS’ten okunamaz; önceki başarılı admin
 * oturumu için sessionStorage ipucu (tenant ekranlarında kör refresh engeli).
 */

const ADMIN_SESSION_HINT_KEY = 'mkd_admin_session_hint'

let memoryAdminAccessToken: string | null = null

export function getAdminAccessToken(): string | null {
  return memoryAdminAccessToken
}

export function setAdminAccessToken(token: string | null): void {
  memoryAdminAccessToken = token
}

export function hasAdminSessionHint(): boolean {
  try {
    return typeof sessionStorage !== 'undefined' && sessionStorage.getItem(ADMIN_SESSION_HINT_KEY) === '1'
  } catch {
    return false
  }
}

export function setAdminSessionHint(enabled: boolean): void {
  try {
    if (typeof sessionStorage === 'undefined') return
    if (enabled) sessionStorage.setItem(ADMIN_SESSION_HINT_KEY, '1')
    else sessionStorage.removeItem(ADMIN_SESSION_HINT_KEY)
  } catch {
    /* ignore */
  }
}

export function purgeLegacyAdminAccessTokenStorage(): void {
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem('mkd_admin_access_token')
    }
    if (typeof sessionStorage !== 'undefined') {
      sessionStorage.removeItem('mkd_admin_access_token')
    }
  } catch {
    /* ignore */
  }
}
