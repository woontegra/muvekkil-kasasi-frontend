import { joinApiUrl } from './apiBase'
import { getAdminAccessToken, setAdminAccessToken } from './adminAccessTokenMemory'

let adminRefreshInFlight: Promise<string | null> | null = null

export async function refreshAdminAccessTokenOnce(): Promise<string | null> {
  if (adminRefreshInFlight) return adminRefreshInFlight

  adminRefreshInFlight = (async () => {
    try {
      const res = await fetch(joinApiUrl('/api/v1/admin/auth/refresh'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      if (!res.ok) {
        setAdminAccessToken(null)
        return null
      }
      const body = (await res.json()) as { adminAccessToken?: string }
      if (!body?.adminAccessToken) {
        setAdminAccessToken(null)
        return null
      }
      setAdminAccessToken(body.adminAccessToken)
      return body.adminAccessToken
    } catch {
      setAdminAccessToken(null)
      return null
    } finally {
      adminRefreshInFlight = null
    }
  })()

  return adminRefreshInFlight
}

export { getAdminAccessToken }
