import { apiFetch } from './client'
import type { MuvekkilEkstreDto, MuvekkilEkstreResponse } from '../types/muvekkilEkstre'

export async function getMuvekkilEkstre(
  dosyaId: string,
  itibariyleTarih?: string | null
): Promise<MuvekkilEkstreDto> {
  const q =
    itibariyleTarih && /^\d{4}-\d{2}-\d{2}$/.test(itibariyleTarih)
      ? `?itibariyleTarih=${encodeURIComponent(itibariyleTarih)}`
      : ''
  const res = await apiFetch<MuvekkilEkstreResponse>(
    `/api/v1/dosyalar/${encodeURIComponent(dosyaId)}/muvekkil-ekstresi${q}`
  )
  return res.ekstre
}
