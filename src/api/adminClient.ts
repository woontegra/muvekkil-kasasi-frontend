const ADMIN_TOKEN_KEY = 'mkd_admin_access_token'

export const ADMIN_ACCESS_TOKEN_STORAGE_KEY = ADMIN_TOKEN_KEY

export function getAdminAccessToken(): string | null {
  if (typeof localStorage === 'undefined') return null
  return localStorage.getItem(ADMIN_TOKEN_KEY)
}

export function setAdminAccessToken(token: string | null): void {
  if (typeof localStorage === 'undefined') return
  if (token) localStorage.setItem(ADMIN_TOKEN_KEY, token)
  else localStorage.removeItem(ADMIN_TOKEN_KEY)
}

const base = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

function joinUrl(path: string): string {
  if (path.startsWith('http')) return path
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

const PUBLIC_ADMIN_PATHS = new Set(['/api/v1/admin/auth/login', '/api/v1/admin/auth/logout'])

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
    const lines = Object.entries(fe).flatMap(([field, msgs]) => (Array.isArray(msgs) ? msgs.map((m) => `${field}: ${m}`) : []))
    if (lines.length) return lines.join(' ')
  }
  const form = d.formErrors
  if (Array.isArray(form) && form.length) return form.join(' ')
  return ''
}

export async function adminApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAdminAccessToken()
  const headers = new Headers(init?.headers)
  if (!headers.has('Content-Type') && init?.body != null) {
    headers.set('Content-Type', 'application/json')
  }
  if (!PUBLIC_ADMIN_PATHS.has(path) && token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  const res = await fetch(joinUrl(path), { ...init, headers })
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
