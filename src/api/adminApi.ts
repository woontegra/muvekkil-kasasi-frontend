import { adminApiFetch } from './adminClient'
import type {
  AdminCreateTenantPayload,
  AdminCreateTenantResponse,
  AdminDashboardResponse,
  AdminExpiringTenantsResponse,
  AdminLoginResponse,
  AdminMeResponse,
  AdminSystemInfoResponse,
  AdminTenantDetailResponse,
  AdminTenantsListResponse,
  AdminUserDto,
  TenantUserRoleDto
} from '../types/admin'

export async function adminLoginRequest(identifier: string, sifre: string): Promise<AdminLoginResponse> {
  return adminApiFetch<AdminLoginResponse>('/api/v1/admin/auth/login', {
    method: 'POST',
    body: JSON.stringify({ identifier, sifre })
  })
}

export async function adminMeRequest(): Promise<AdminMeResponse> {
  return adminApiFetch<AdminMeResponse>('/api/v1/admin/me')
}

export async function adminDashboardRequest(): Promise<AdminDashboardResponse> {
  return adminApiFetch<AdminDashboardResponse>('/api/v1/admin/dashboard')
}

export async function adminCreateTenantRequest(payload: AdminCreateTenantPayload): Promise<AdminCreateTenantResponse> {
  const body: Record<string, unknown> = { ...payload }
  for (const k of Object.keys(body)) {
    if (body[k] === undefined || body[k] === null) delete body[k]
  }
  return adminApiFetch<AdminCreateTenantResponse>('/api/v1/admin/tenants', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export async function adminTenantsListRequest(params: {
  q?: string
  lisansDurumu?: string
  aktifMi?: boolean
  page?: number
  limit?: number
}): Promise<AdminTenantsListResponse> {
  const sp = new URLSearchParams()
  if (params.q?.trim()) sp.set('q', params.q.trim())
  if (params.lisansDurumu) sp.set('lisansDurumu', params.lisansDurumu)
  if (params.aktifMi === true) sp.set('aktifMi', 'true')
  if (params.aktifMi === false) sp.set('aktifMi', 'false')
  if (params.page) sp.set('page', String(params.page))
  if (params.limit) sp.set('limit', String(params.limit))
  const q = sp.toString()
  return adminApiFetch<AdminTenantsListResponse>(`/api/v1/admin/tenants${q ? `?${q}` : ''}`)
}

export async function adminTenantDetailRequest(id: string): Promise<AdminTenantDetailResponse> {
  return adminApiFetch<AdminTenantDetailResponse>(`/api/v1/admin/tenants/${encodeURIComponent(id)}`)
}

export async function adminTenantUpdateRequest(
  id: string,
  body: Record<string, unknown>
): Promise<{ ok: true; tenant: unknown }> {
  return adminApiFetch(`/api/v1/admin/tenants/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  })
}

export type AdminExtendLicenseRequestBody = {
  miktar?: number
  birim?: 'GUN' | 'AY' | 'YIL'
  bitisTarihi?: string
  demoMu?: boolean
  aciklama?: string
  /** @deprecated API uyumluluğu; UI kullanmaz. */
  aySayisi?: number
  /** @deprecated API uyumluluğu; UI kullanmaz. */
  yilSayisi?: number
}

export async function adminExtendLicenseRequest(
  id: string,
  body: AdminExtendLicenseRequestBody
): Promise<{ ok: true; tenant: unknown }> {
  return adminApiFetch(`/api/v1/admin/tenants/${encodeURIComponent(id)}/extend-license`, {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export async function adminTenantActivateRequest(id: string): Promise<{ ok: true; tenant: unknown }> {
  return adminApiFetch(`/api/v1/admin/tenants/${encodeURIComponent(id)}/activate`, { method: 'POST' })
}

export async function adminTenantDeactivateRequest(id: string): Promise<{ ok: true; tenant: unknown }> {
  return adminApiFetch(`/api/v1/admin/tenants/${encodeURIComponent(id)}/deactivate`, { method: 'POST' })
}

export async function adminTenantDeleteRequest(id: string): Promise<{ ok: true }> {
  return adminApiFetch(`/api/v1/admin/tenants/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function adminResendWelcomeMailRequest(
  id: string
): Promise<{ ok: true; mailSent: boolean; mailError?: string }> {
  return adminApiFetch(`/api/v1/admin/tenants/${encodeURIComponent(id)}/resend-welcome-mail`, {
    method: 'POST'
  })
}

export async function adminUserUpdateRequest(
  userId: string,
  body: {
    tenantId: string
    adSoyad?: string
    eposta?: string | null
    telefon?: string | null
    rol?: TenantUserRoleDto
    aktifMi?: boolean
  }
): Promise<{ ok: true; user: unknown }> {
  return adminApiFetch(`/api/v1/admin/users/${encodeURIComponent(userId)}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  })
}

export async function adminResetUserPasswordRequest(
  userId: string,
  tenantId: string,
  yeniSifre?: string
): Promise<{ ok: true; geciciSifre: string }> {
  const sp = new URLSearchParams()
  sp.set('tenantId', tenantId)
  return adminApiFetch(`/api/v1/admin/users/${encodeURIComponent(userId)}/reset-password?${sp.toString()}`, {
    method: 'POST',
    body: JSON.stringify(yeniSifre ? { yeniSifre } : {})
  })
}

export async function adminExpiringTenantsRequest(days?: number): Promise<AdminExpiringTenantsResponse> {
  const sp = new URLSearchParams()
  if (days != null) sp.set('days', String(days))
  const q = sp.toString()
  return adminApiFetch<AdminExpiringTenantsResponse>(`/api/v1/admin/tenants/expiring${q ? `?${q}` : ''}`)
}

export async function adminAdminUsersListRequest(): Promise<{ ok: true; items: AdminUserDto[] }> {
  return adminApiFetch('/api/v1/admin/admin-users')
}

export async function adminAdminUserCreateRequest(body: {
  adSoyad: string
  kullaniciAdi: string
  eposta?: string | null
  sifre: string
  rol: AdminUserDto['rol']
}): Promise<{ ok: true; user: AdminUserDto }> {
  return adminApiFetch('/api/v1/admin/admin-users', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export async function adminAdminUserUpdateRequest(
  id: string,
  body: Partial<{ adSoyad: string; eposta: string | null; rol: AdminUserDto['rol']; aktifMi: boolean }>
): Promise<{ ok: true; user: AdminUserDto }> {
  return adminApiFetch(`/api/v1/admin/admin-users/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  })
}

export async function adminAdminUserResetPasswordRequest(
  id: string,
  yeniSifre?: string
): Promise<{ ok: true; geciciSifre: string }> {
  return adminApiFetch(`/api/v1/admin/admin-users/${encodeURIComponent(id)}/reset-password`, {
    method: 'POST',
    body: JSON.stringify(yeniSifre ? { yeniSifre } : {})
  })
}

export async function adminAdminUserActivateRequest(id: string): Promise<{ ok: true; user: AdminUserDto }> {
  return adminApiFetch(`/api/v1/admin/admin-users/${encodeURIComponent(id)}/activate`, { method: 'POST' })
}

export async function adminAdminUserDeactivateRequest(id: string): Promise<{ ok: true; user: AdminUserDto }> {
  return adminApiFetch(`/api/v1/admin/admin-users/${encodeURIComponent(id)}/deactivate`, { method: 'POST' })
}

export async function adminSettingsProfileGet(): Promise<{ ok: true; profile: AdminUserDto }> {
  return adminApiFetch('/api/v1/admin/settings/profile')
}

export async function adminSettingsProfilePut(body: {
  adSoyad?: string
  eposta?: string | null
}): Promise<{ ok: true; profile: AdminUserDto }> {
  return adminApiFetch('/api/v1/admin/settings/profile', {
    method: 'PUT',
    body: JSON.stringify(body)
  })
}

export async function adminSettingsChangePasswordRequest(body: {
  mevcutSifre: string
  yeniSifre: string
  yeniSifreTekrar: string
}): Promise<{ ok: true }> {
  return adminApiFetch('/api/v1/admin/settings/change-password', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export async function adminSettingsSystemInfoRequest(): Promise<AdminSystemInfoResponse> {
  return adminApiFetch<AdminSystemInfoResponse>('/api/v1/admin/settings/system-info')
}
