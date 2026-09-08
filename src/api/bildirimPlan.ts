import { apiFetch } from './client'
import type { BildirimKuralTuru } from '../types/tahsilatBildirim'
import {
  hhmmToMinutes as parseHhmmToMinutes,
  minutesToHHmm as formatMinutesToHHmm
} from '../lib/bildirimSendWindow'

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
  return formatMinutesToHHmm(dk)
}

export function hhmmToMinutes(value: string): number {
  return parseHhmmToMinutes(value) ?? 600
}
