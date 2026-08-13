import { apiFetch } from './client'
import type { BildirimKuralTuru } from '../types/tahsilatBildirim'

export type BildirimPlanModu = 'VARSAYILAN' | 'OZEL' | 'KAPALI'

export type TaksitPlanKuralInput = {
  kuralTuru: BildirimKuralTuru
  aktifMi: boolean
  gunOffset: number
  gonderimSaatiDk: number
  metaSablonId: string | null
}

export async function getTaksitHatirlatmaPlan(taksitId: string): Promise<{
  ok: true
  mode: BildirimPlanModu
  ozet: string
  kurallar: TaksitPlanKuralInput[]
}> {
  return apiFetch(`/api/v1/vekalet-taksitleri/${encodeURIComponent(taksitId)}/hatirlatma-plan`)
}

export async function setTaksitHatirlatmaPlan(
  taksitId: string,
  body: { mode: BildirimPlanModu; kurallar?: TaksitPlanKuralInput[] }
): Promise<{ ok: true; mode: BildirimPlanModu; iptalEdilen: number; planlanan: number }> {
  return apiFetch(`/api/v1/vekalet-taksitleri/${encodeURIComponent(taksitId)}/hatirlatma-plan`, {
    method: 'PATCH',
    body: JSON.stringify(body)
  })
}

export async function getRandevuHatirlatmaPlan(randevuId: string): Promise<{
  ok: true
  mode: BildirimPlanModu
  ozet: string
  kurallar: Array<{ ruleKey: string; aktifMi: boolean; offsetDk: number; metaSablonId: string | null }>
  planlananHatirlatmalar?: Array<{ offsetDk: number; planlananAt: string }>
}> {
  return apiFetch(`/api/v1/randevular/${encodeURIComponent(randevuId)}/hatirlatma-plan`)
}

export async function getRandevuBildirimAyarlar(): Promise<{
  ok: true
  otomasyonAktif: boolean
  varsayilanKurallar: Array<{
    offsetDk: number
    aktifMi: boolean
    metaSablonId: string | null
    label: string
  }>
}> {
  return apiFetch('/api/v1/tahsilat-bildirim/randevu-ayarlar')
}

export async function updateRandevuBildirimAyarlar(body: {
  otomasyonAktif: boolean
  varsayilanKurallar: Array<{ offsetDk: number; aktifMi: boolean; metaSablonId: string | null }>
}): Promise<Awaited<ReturnType<typeof getRandevuBildirimAyarlar>>> {
  return apiFetch('/api/v1/tahsilat-bildirim/randevu-ayarlar', {
    method: 'PATCH',
    body: JSON.stringify(body)
  })
}

export function minutesToHHmm(dk: number): string {
  const h = Math.floor(dk / 60)
  const m = dk % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

export function hhmmToMinutes(value: string): number {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!m) return 600
  return Number(m[1]) * 60 + Number(m[2])
}
