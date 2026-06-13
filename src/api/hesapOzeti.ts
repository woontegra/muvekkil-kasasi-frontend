import { apiFetch } from './client'
import type { DosyaHesapOzetiResponse } from '../types/hesapOzeti'

export async function getDosyaHesapOzeti(dosyaId: string): Promise<DosyaHesapOzetiResponse> {
  return apiFetch<DosyaHesapOzetiResponse>(`/api/v1/dosyalar/${encodeURIComponent(dosyaId)}/hesap-ozeti`)
}
