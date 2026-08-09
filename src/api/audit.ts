import { apiFetch } from './client'

export type AuditLogListItem = {
  id: string
  action: string
  entityType: string | null
  entityId: string | null
  userAdSoyad: string | null
  userKullaniciAdi: string | null
  ipAddress: string | null
  createdAt: string
}

export type AuditLogListResponse = {
  ok: true
  items: AuditLogListItem[]
  total: number
  page: number
  limit: number
}

export async function listAuditLogs(params?: { page?: number; limit?: number }): Promise<AuditLogListResponse> {
  const sp = new URLSearchParams()
  if (params?.page) sp.set('page', String(params.page))
  if (params?.limit) sp.set('limit', String(params.limit))
  const qs = sp.toString()
  return apiFetch<AuditLogListResponse>(`/api/v1/audit${qs ? `?${qs}` : ''}`)
}
