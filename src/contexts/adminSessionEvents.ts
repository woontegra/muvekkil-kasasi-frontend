import type { AdminUserDto } from '../types/admin'

const APPLY = 'mkd-admin-session-apply'
const CLEAR = 'mkd-admin-session-clear'

export function emitAdminSessionApply(adminAccessToken: string, adminUser: AdminUserDto): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(APPLY, { detail: { adminAccessToken, adminUser } }))
}

export function emitAdminSessionClear(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(CLEAR))
}

export function subscribeAdminSessionEvents(handlers: {
  onApply: (adminAccessToken: string, adminUser: AdminUserDto) => void
  onClear: () => void
}): () => void {
  const onApply = (e: Event) => {
    const detail = (e as CustomEvent<{ adminAccessToken: string; adminUser: AdminUserDto }>).detail
    if (detail?.adminAccessToken && detail.adminUser) {
      handlers.onApply(detail.adminAccessToken, detail.adminUser)
    }
  }
  const onClear = () => handlers.onClear()
  window.addEventListener(APPLY, onApply)
  window.addEventListener(CLEAR, onClear)
  return () => {
    window.removeEventListener(APPLY, onApply)
    window.removeEventListener(CLEAR, onClear)
  }
}
