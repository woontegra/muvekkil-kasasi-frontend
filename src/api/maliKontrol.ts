import { apiFetch } from './client'
import type { MaliKontrolResponse } from '../types/maliKontrol'

export const MALI_KONTROL_QUERY_KEY = ['mali-kontrol-uyarilar'] as const

export async function getMaliKontrolUyarilari(): Promise<MaliKontrolResponse> {
  return apiFetch<MaliKontrolResponse>('/api/v1/mali-kontrol/uyarilar')
}
