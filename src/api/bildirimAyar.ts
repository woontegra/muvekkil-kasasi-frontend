import { apiFetch } from './client'
import type { DosyaDto } from '../types/dosya'
import type { MuvekkilDto } from '../types/muvekkil'
import type { VekaletTaksitiDto } from '../types/vekalet'

export type BildirimAyarToggleResponse = {
  ok: true
  aktif: boolean
  iptalEdilenSayisi: number
  planlananYeniden: number
  pendingOnceki: number
}

export async function getMuvekkilBildirimAyar(id: string): Promise<{
  otomatikBildirimIzni: boolean
  pendingPlanliSayisi: number
  kullaniciMesaji: string
}> {
  return apiFetch(`/api/v1/muvekkiller/${encodeURIComponent(id)}/bildirim-ayar`)
}

export async function patchMuvekkilBildirimAyar(
  id: string,
  otomatikBildirimIzni: boolean
): Promise<BildirimAyarToggleResponse & { muvekkil: MuvekkilDto | null }> {
  return apiFetch(`/api/v1/muvekkiller/${encodeURIComponent(id)}/bildirim-ayar`, {
    method: 'PATCH',
    body: JSON.stringify({ otomatikBildirimIzni })
  })
}

export async function getDosyaBildirimAyar(id: string): Promise<{
  otomatikBildirimAktif: boolean
  muvekkilOtomatikBildirimIzni: boolean
  pendingPlanliSayisi: number
  kullaniciMesaji: string
  muvekkilKapaliUyari: string | null
}> {
  return apiFetch(`/api/v1/dosyalar/${encodeURIComponent(id)}/bildirim-ayar`)
}

export async function patchDosyaBildirimAyar(
  id: string,
  otomatikBildirimAktif: boolean
): Promise<BildirimAyarToggleResponse & { dosya: DosyaDto | null }> {
  return apiFetch(`/api/v1/dosyalar/${encodeURIComponent(id)}/bildirim-ayar`, {
    method: 'PATCH',
    body: JSON.stringify({ otomatikBildirimAktif })
  })
}

export async function patchTaksitBildirimAyar(
  id: string,
  otomatikBildirimAktif: boolean
): Promise<BildirimAyarToggleResponse & { taksit: VekaletTaksitiDto | null }> {
  return apiFetch(`/api/v1/vekalet-taksitleri/${encodeURIComponent(id)}/bildirim-ayar`, {
    method: 'PATCH',
    body: JSON.stringify({ otomatikBildirimAktif })
  })
}
