import { apiFetch } from './client'
import type { TenantLicenseCurrent } from '../types/license'

export async function getCurrentLicense(): Promise<TenantLicenseCurrent> {
  return apiFetch<TenantLicenseCurrent>('/api/v1/license/current')
}
