import { apiFetch } from './client'
import type { DosyaMaliOzetResponse, MuvekkilKarlilikResponse } from '../types/maliOzet'

export async function getDosyaMaliOzet(
  dosyaId: string,
  params?: { periodPreset?: string; bas?: string | null; bit?: string | null }
): Promise<DosyaMaliOzetResponse> {
  const sp = new URLSearchParams()
  if (params?.periodPreset) sp.set('periodPreset', params.periodPreset)
  if (params?.bas) sp.set('bas', params.bas)
  if (params?.bit) sp.set('bit', params.bit)
  const q = sp.toString()
  return apiFetch<DosyaMaliOzetResponse>(
    `/api/v1/dosyalar/${encodeURIComponent(dosyaId)}/mali-ozet${q ? `?${q}` : ''}`
  )
}

export async function getMuvekkilKarlilik(
  muvekkilId: string,
  params?: { periodPreset?: string; bas?: string | null; bit?: string | null }
): Promise<MuvekkilKarlilikResponse> {
  const sp = new URLSearchParams()
  if (params?.periodPreset) sp.set('periodPreset', params.periodPreset)
  if (params?.bas) sp.set('bas', params.bas)
  if (params?.bit) sp.set('bit', params.bit)
  const q = sp.toString()
  return apiFetch<MuvekkilKarlilikResponse>(
    `/api/v1/muvekkiller/${encodeURIComponent(muvekkilId)}/karlilik${q ? `?${q}` : ''}`
  )
}
