import { apiFetch } from './client'
import type { AuthTenantDto } from '../types/auth'

export type UpdateTenantProfilePayload = {
  buroAdi?: string
  telefon?: string | null
  eposta?: string | null
  adres?: string | null
  vergiNo?: string | null
  vergiDairesi?: string | null
}

export type UpdateTenantProfileResponse = {
  ok: true
  tenant: AuthTenantDto
}

export async function updateTenantProfile(body: UpdateTenantProfilePayload): Promise<UpdateTenantProfileResponse> {
  return apiFetch<UpdateTenantProfileResponse>('/api/v1/tenant/profile', {
    method: 'PATCH',
    body: JSON.stringify(body)
  })
}
