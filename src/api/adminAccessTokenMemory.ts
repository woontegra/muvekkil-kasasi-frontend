/**
 * Admin access token yalnızca bellek.
 */

let memoryAdminAccessToken: string | null = null

export function getAdminAccessToken(): string | null {
  return memoryAdminAccessToken
}

export function setAdminAccessToken(token: string | null): void {
  memoryAdminAccessToken = token
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
