import { joinApiUrl } from './apiBase'
import { friendlyClientErrorMessage } from './client'
import {
  getAdminAccessToken,
  purgeLegacyAdminAccessTokenStorage,
  setAdminAccessToken
} from './adminAccessTokenMemory'
import { refreshAdminAccessTokenOnce } from './refreshAdminAccess'

export { getAdminAccessToken, setAdminAccessToken, purgeLegacyAdminAccessTokenStorage }

const PUBLIC_ADMIN_PATHS = new Set([
  '/api/v1/admin/auth/login',
  '/api/v1/admin/auth/logout',
  '/api/v1/admin/auth/refresh',
  '/api/v1/admin/auth/elevate-from-tenant'
])

export class AdminApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string
  ) {
    super(message)
    this.name = 'AdminApiError'
  }
}

function formatValidationDetails(details: unknown): string {
  if (!details || typeof details !== 'object') return ''
  const d = details as { fieldErrors?: Record<string, string[]>; formErrors?: string[] }
  const fe = d.fieldErrors
  if (fe && typeof fe === 'object') {
    const lines = Object.entries(fe).flatMap(([field, msgs]) =>
      Array.isArray(msgs) ? msgs.map((m) => `${field}: ${m}`) : []
    )
    if (lines.length) return lines.join(' ')
  }
  const form = d.formErrors
  if (Array.isArray(form) && form.length) return form.join(' ')
  return ''
}

export async function adminApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const doFetch = async (token: string | null): Promise<Response> => {
    const headers = new Headers(init?.headers)
    if (!headers.has('Content-Type') && init?.body != null) {
      headers.set('Content-Type', 'application/json')
    }
    if (!PUBLIC_ADMIN_PATHS.has(path) && token) {
      headers.set('Authorization', `Bearer ${token}`)
    }
    return fetch(joinApiUrl(path), { ...init, headers, credentials: 'include' })
  }

  let res: Response
  try {
    res = await doFetch(getAdminAccessToken())
  } catch (err) {
    throw new AdminApiError(
      friendlyClientErrorMessage(
        err,
        'Sunucuya ulaşılamadı. Lütfen bağlantınızı kontrol edin veya daha sonra tekrar deneyin.'
      ),
      0,
      'NETWORK_ERROR'
    )
  }

  if (res.status === 401 && !PUBLIC_ADMIN_PATHS.has(path)) {
    const next = await refreshAdminAccessTokenOnce()
    if (next) {
      res = await doFetch(next)
    }
  }

  if (!res.ok) {
    let message = res.statusText
    let code: string | undefined
    const ct = res.headers.get('content-type')
    if (ct?.includes('application/json')) {
      try {
        const j = (await res.json()) as { message?: string; error?: string; details?: unknown }
        if (j.message) message = j.message
        code = j.error
        const detailText = formatValidationDetails(j.details)
        if (detailText) {
          message = message && message !== res.statusText ? `${message} — ${detailText}` : detailText
        }
      } catch {
        /* ignore */
      }
    }
    throw new AdminApiError(message, res.status, code)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
