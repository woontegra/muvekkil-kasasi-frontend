import { apiFetch } from './client'
import type { HesapDonemiOzetResponse } from '../types/hesapDonemi'

export const HESAP_DONEMI_OZET_QUERY_KEY = ['hesap-donemi-ozet'] as const

export async function getHesapDonemiOzet(referenceDate?: string | null): Promise<HesapDonemiOzetResponse> {
  const qs = referenceDate ? `?referenceDate=${encodeURIComponent(referenceDate)}` : ''
  return apiFetch<HesapDonemiOzetResponse>(`/api/v1/ofis-kasa/anasayfa-ozet${qs}`)
}

export async function updateHesapDonemiModu(modu: 'MONTHLY' | 'YEARLY'): Promise<{ ok: boolean }> {
  return apiFetch<{ ok: boolean }>('/api/v1/ofis-kasa/hesap-donemi-modu', {
    method: 'PATCH',
    body: JSON.stringify({ hesapDonemiModu: modu })
  })
}
