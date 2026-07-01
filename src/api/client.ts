import { apiBaseLabel, getApiBaseUrl, joinApiUrl, warnIfLocalFrontendHitsRemoteApi } from './apiBase'

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
    public readonly details?: unknown,
    public readonly infraError = false
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export const API_INFRA_ERROR_MESSAGE =
  'İşlem sırasında bir hata oluştu. İlgili API endpointi bulunamadı veya sunucu cevap vermedi.'

export const LOGIN_ERROR_MESSAGE =
  'Giriş yapılamadı. Bilgilerinizi kontrol edin veya hesabınız henüz aktifleştirilmemiş olabilir.'

export function friendlyLoginErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.infraError || err.status === 404 || err.status >= 500) {
      return LOGIN_ERROR_MESSAGE
    }
    if (err.status === 401) {
      return LOGIN_ERROR_MESSAGE
    }
    if (/endpoint|API/i.test(err.message)) {
      return LOGIN_ERROR_MESSAGE
    }
    return err.message
  }
  if (err instanceof TypeError) {
    return LOGIN_ERROR_MESSAGE
  }
  return LOGIN_ERROR_MESSAGE
}

export const FORGOT_PASSWORD_ERROR_MESSAGE =
  'Şifre sıfırlama işlemi şu anda tamamlanamadı. Lütfen bilgilerinizi kontrol edin veya daha sonra tekrar deneyin.'

export function friendlyForgotPasswordErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.infraError || err.status === 404 || err.status >= 500) {
      return FORGOT_PASSWORD_ERROR_MESSAGE
    }
    if (/endpoint|API|sunucu cevap vermedi/i.test(err.message)) {
      return FORGOT_PASSWORD_ERROR_MESSAGE
    }
    return err.message
  }
  if (err instanceof TypeError) {
    return FORGOT_PASSWORD_ERROR_MESSAGE
  }
  return FORGOT_PASSWORD_ERROR_MESSAGE
}

/** Ödeme al modalı için kullanıcıya gösterilen altyapı hatası mesajı */
export const ODEME_API_INFRA_USER_MESSAGE =
  'Ödeme kaydedilemedi. Sunucu bağlantısı veya API yolu kontrol edilmeli.'

function looksLikeHtml(text: string): boolean {
  const t = text.trimStart()
  return t.startsWith('<!') || t.startsWith('<html') || /<\/html>/i.test(t) || /Cannot (GET|POST|PUT|PATCH|DELETE)/i.test(t)
}

function resolveErrorMessage(raw: string, status: number): { message: string; infra: boolean } {
  if (!raw || looksLikeHtml(raw)) {
    return { message: API_INFRA_ERROR_MESSAGE, infra: true }
  }
  if (status === 404) {
    return { message: API_INFRA_ERROR_MESSAGE, infra: true }
  }
  return { message: raw, infra: false }
}

function logApiRequest(method: string, path: string, fullUrl: string): void {
  if (!import.meta.env.DEV) return
  // eslint-disable-next-line no-console
  console.info('[api]', method, path, { fullUrl, apiBaseUrl: apiBaseLabel() })
}

function logApiError(
  method: string,
  path: string,
  fullUrl: string,
  status: number,
  contentType: string | null
): void {
  if (!import.meta.env.DEV) return
  // eslint-disable-next-line no-console
  console.error('[api error]', {
    method,
    path,
    apiBaseUrl: apiBaseLabel(),
    fullUrl,
    statusCode: status,
    contentType: contentType ?? '(yok)'
  })
}

/** Ağ kopuk / sunucu ulaşılamaz (fetch TypeError vb.) */
export function friendlyClientErrorMessage(err: unknown, fallback = 'İşlem tamamlanamadı.'): string {
  if (err instanceof ApiError) return err.message
  if (err instanceof TypeError) {
    const m = err.message
    if (m === 'Failed to fetch' || m.includes('NetworkError') || m.toLowerCase().includes('load failed')) {
      return 'Sunucuya ulaşılamadı. Lütfen daha sonra tekrar deneyin.'
    }
  }
  return fallback
}

export function isApiInfraError(err: unknown): boolean {
  if (err instanceof TypeError) return true
  if (err instanceof ApiError) return err.infraError || err.status === 404
  return false
}

export function resolveOdemeApiError(err: unknown): string | null {
  if (!err) return null
  if (isApiInfraError(err)) return ODEME_API_INFRA_USER_MESSAGE
  return friendlyClientErrorMessage(err, 'Ödeme kaydedilemedi.')
}

export { getApiBaseUrl, joinApiUrl }

const PUBLIC_AUTH_PATHS = new Set([
  '/api/v1/auth/login',
  '/api/v1/auth/logout',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password'
])

function isPublicAuthPath(path: string): boolean {
  return PUBLIC_AUTH_PATHS.has(path)
}

async function handleFailedResponse(
  res: Response,
  method: string,
  path: string,
  fullUrl: string
): Promise<never> {
  let message = res.statusText
  let code: string | undefined
  let details: unknown
  let infra = false
  const ct = res.headers.get('content-type')
  logApiError(method, path, fullUrl, res.status, ct)

  if (ct?.includes('application/json')) {
    try {
      const j = (await res.json()) as { message?: string; error?: string; code?: string; details?: unknown }
      if (j.message) message = j.message
      code = j.code ?? j.error
      details = j.details
      if (res.status === 404) {
        infra = true
        message = API_INFRA_ERROR_MESSAGE
      }
    } catch {
      infra = true
      message = API_INFRA_ERROR_MESSAGE
    }
  } else {
    try {
      const t = await res.text()
      const resolved = resolveErrorMessage(t, res.status)
      message = resolved.message
      infra = resolved.infra
    } catch {
      infra = true
      message = API_INFRA_ERROR_MESSAGE
    }
  }

  throw new ApiError(message, res.status, code, details, infra)
}

export async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  warnIfLocalFrontendHitsRemoteApi()
  const method = (init?.method ?? 'GET').toUpperCase()
  const fullUrl = joinApiUrl(path)
  logApiRequest(method, path, fullUrl)

  const token = getAccessToken()
  const headers = new Headers(init?.headers)
  if (!headers.has('Content-Type') && init?.body != null) {
    headers.set('Content-Type', 'application/json')
  }
  if (!isPublicAuthPath(path) && token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let res: Response
  try {
    res = await fetch(fullUrl, { ...init, headers })
  } catch (err) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('[api error]', {
        method,
        path,
        apiBaseUrl: apiBaseLabel(),
        fullUrl,
        statusCode: '(ağ hatası)',
        contentType: '(yok)',
        error: err
      })
    }
    throw err
  }

  if (!res.ok) {
    await handleFailedResponse(res, method, path, fullUrl)
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

/** multipart/form-data (Content-Type otomatik boundary); dosya yükleme vb. */
export async function apiFetchMultipart<T>(path: string, formData: FormData): Promise<T> {
  const method = 'POST'
  const fullUrl = joinApiUrl(path)
  logApiRequest(method, path, fullUrl)

  const token = getAccessToken()
  const headers = new Headers()
  if (!isPublicAuthPath(path) && token) {
    headers.set('Authorization', `Bearer ${token}`)
  }

  let res: Response
  try {
    res = await fetch(fullUrl, { method: 'POST', body: formData, headers })
  } catch (err) {
    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.error('[api error]', {
        method,
        path,
        apiBaseUrl: apiBaseLabel(),
        fullUrl,
        statusCode: '(ağ hatası)',
        contentType: '(yok)',
        error: err
      })
    }
    throw err
  }

  if (!res.ok) {
    await handleFailedResponse(res, method, path, fullUrl)
  }

  return (await res.json()) as T
}
