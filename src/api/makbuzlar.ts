import { apiFetch } from './client'
import type { DosyaMakbuzlariResponse } from '../types/makbuz'

export async function getDosyaMakbuzlari(dosyaId: string): Promise<DosyaMakbuzlariResponse> {
  return apiFetch<DosyaMakbuzlariResponse>(`/api/v1/dosyalar/${encodeURIComponent(dosyaId)}/makbuzlar`)
}
