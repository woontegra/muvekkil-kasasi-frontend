const TOKEN_KEY = 'mkd_access_token'

export const ACCESS_TOKEN_STORAGE_KEY = TOKEN_KEY

export function getAccessToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(TOKEN_KEY)
}

export function setAccessToken(token: string | null): void {
  if (typeof localStorage === 'undefined') return
  if (token) localStorage.setItem(TOKEN_KEY, token)
  else localStorage.removeItem(TOKEN_KEY)
}

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

const base = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

function joinUrl(path: string): string {
  if (path.startsWith('http')) return path
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

function isPublicAuthPath(path: string): boolean {
  return path === '/api/v1/auth/login' || path === '/api/v1/auth/register-office'
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAccessToken()
  const headers = new Headers(init?.headers)
  if (!headers.has('Content-Type') && init?.body != null) {
    headers.set('Content-Type', 'application/json')
  }
  if (!isPublicAuthPath(path) && token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(joinUrl(path), {
    ...init,
    headers
  })

  if (!res.ok) {
    let message = res.statusText
    let code: string | undefined
    let details: unknown
    const ct = res.headers.get('content-type')
    if (ct?.includes('application/json')) {
      try {
        const j = (await res.json()) as { message?: string; error?: string; details?: unknown }
        if (j.message) message = j.message
        code = j.error
        details = j.details
      } catch {
        /* ignore */
      }
    } else {
      try {
        const t = await res.text()
        if (t) message = t
      } catch {
        /* ignore */
      }
    }
    throw new ApiError(message, res.status, code, details)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
