import { joinApiUrl } from './apiBase'
import { getAccessToken, setAccessToken } from './accessTokenMemory'
import type { AuthLoginResponse } from '../types/auth'

let refreshInFlight: Promise<string | null> | null = null

/**
 * Tekil refresh — paralel 401’ler aynı isteği paylaşır.
 * Başarısızsa null; sonsuz döngü yok.
 */
export async function refreshAccessTokenOnce(): Promise<string | null> {
  if (refreshInFlight) return refreshInFlight

  refreshInFlight = (async () => {
    try {
      const res = await fetch(joinApiUrl('/api/v1/auth/refresh'), {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })
      if (!res.ok) {
        setAccessToken(null)
        return null
      }
      const body = (await res.json()) as AuthLoginResponse
      if (!body?.accessToken) {
        setAccessToken(null)
        return null
      }
      setAccessToken(body.accessToken)
      return body.accessToken
    } catch {
      setAccessToken(null)
      return null
    } finally {
      refreshInFlight = null
    }
  })()

  return refreshInFlight
}

export function getMemoryAccessToken(): string | null {
  return getAccessToken()
}
