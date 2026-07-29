import { apiFetch } from './client'
import type { DosyaMaliOzetResponse, MuvekkilKarlilikResponse } from '../types/maliOzet'

export async function getDosyaMaliOzet(dosyaId: string): Promise<DosyaMaliOzetResponse> {
  return apiFetch<DosyaMaliOzetResponse>(`/api/v1/dosyalar/${encodeURIComponent(dosyaId)}/mali-ozet`)
}

export async function getMuvekkilKarlilik(muvekkilId: string): Promise<MuvekkilKarlilikResponse> {
  return apiFetch<MuvekkilKarlilikResponse>(`/api/v1/muvekkiller/${encodeURIComponent(muvekkilId)}/karlilik`)
}
