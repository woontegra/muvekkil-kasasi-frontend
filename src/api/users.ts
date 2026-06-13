import { apiFetch } from './client'
import type {
  CreateUserPayload,
  ResetUserPasswordPayload,
  UpdateUserPayload,
  UserCreateResponse,
  UserListResponse,
  UserOneResponse,
  UserUpdateResponse
} from '../types/user'

export type ListUsersParams = {
  q?: string
  rol?: 'BURO_SAHIBI' | 'AVUKAT_YONETICI' | 'KATIP_PERSONEL'
  aktifMi?: boolean
  page?: number
  limit?: number
}

function buildQuery(params: ListUsersParams): string {
  const sp = new URLSearchParams()
  if (params.q?.trim()) sp.set('q', params.q.trim())
  if (params.rol) sp.set('rol', params.rol)
  if (params.aktifMi !== undefined) sp.set('aktifMi', params.aktifMi ? 'true' : 'false')
  if (params.page != null) sp.set('page', String(params.page))
  if (params.limit != null) sp.set('limit', String(params.limit))
  const s = sp.toString()
  return s ? `?${s}` : ''
}

export async function listUsers(params: ListUsersParams = {}): Promise<UserListResponse> {
  return apiFetch<UserListResponse>(`/api/v1/users${buildQuery(params)}`)
}

export async function getUser(id: string): Promise<UserOneResponse> {
  return apiFetch<UserOneResponse>(`/api/v1/users/${encodeURIComponent(id)}`)
}

export async function createUser(body: CreateUserPayload): Promise<UserCreateResponse> {
  return apiFetch<UserCreateResponse>('/api/v1/users', {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export async function updateUser(id: string, body: UpdateUserPayload): Promise<UserUpdateResponse> {
  return apiFetch<UserUpdateResponse>(`/api/v1/users/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(body)
  })
}

export async function resetUserPassword(id: string, body: ResetUserPasswordPayload): Promise<{ ok: true }> {
  return apiFetch<{ ok: true }>(`/api/v1/users/${encodeURIComponent(id)}/reset-password`, {
    method: 'POST',
    body: JSON.stringify(body)
  })
}

export async function deactivateUser(id: string): Promise<UserUpdateResponse> {
  return apiFetch<UserUpdateResponse>(`/api/v1/users/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  })
}
