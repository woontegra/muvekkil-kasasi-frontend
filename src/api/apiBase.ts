/** API kök URL — VITE_API_BASE_URL öncelikli, yoksa VITE_API_URL. Boşsa Vite proxy kullanılır. */
function isLocalFrontend(): boolean {
  if (typeof window === 'undefined') return false
  const host = window.location.hostname
  return host === 'localhost' || host === '127.0.0.1'
}

function readConfiguredApiUrl(): string {
  const base = import.meta.env.VITE_API_BASE_URL
  const alt = import.meta.env.VITE_API_URL
  // Boş string bile olsa VITE_API_BASE_URL tanımlıysa VITE_API_URL'e düşme (|| tuzağı)
  if (base !== undefined) return String(base).trim().replace(/\/$/, '')
  if (alt !== undefined && String(alt).trim()) return String(alt).trim().replace(/\/$/, '')
  return ''
}

export function getApiBaseUrl(): string {
  const configured = readConfiguredApiUrl()

  // Yerel geliştirme: localhost arayüzü → Vite proxy (http://localhost:4000)
  // Uzak API testi için: VITE_FORCE_REMOTE_API=true
  if (import.meta.env.DEV && isLocalFrontend() && import.meta.env.VITE_FORCE_REMOTE_API !== 'true') {
    return ''
  }

  return configured
}

export function joinApiUrl(path: string): string {
  if (path.startsWith('http')) return path
  const p = path.startsWith('/') ? path : `/${path}`
  return `${getApiBaseUrl()}${p}`
}

export function apiBaseLabel(): string {
  const base = getApiBaseUrl()
  return base || '(vite proxy → http://localhost:4000)'
}

let localRemoteWarned = false

/** Yerel Vite uzak API'ye gidiyorsa konsola uyar (force remote açıksa). */
export function warnIfLocalFrontendHitsRemoteApi(): void {
  if (!import.meta.env.DEV || localRemoteWarned || typeof window === 'undefined') return
  const base = getApiBaseUrl()
  if (!base) return
  const isRemoteApi = !base.includes('localhost') && !base.includes('127.0.0.1')
  if (!isLocalFrontend() || !isRemoteApi) return
  localRemoteWarned = true
  // eslint-disable-next-line no-console
  console.warn(
    `[api] Yerel arayüz uzak backend kullanıyor: ${base}`,
    '\n→ Yerel backend için VITE_FORCE_REMOTE_API ayarını kaldırın veya .env.local içinde VITE_API_BASE_URL= boş bırakın.'
  )
}
