import { apiFetch } from './client'
import type {
  CreateVekaletTaksitPayload,
  DosyaVekaletResponse,
  MarkTaksitPaidPayload,
  MarkTaksitSmmPayload,
  UpdateVekaletTaksitPayload,
  UpsertVekaletPayload,
  VekaletTaksitiDto,
  VekaletUcretiDto
} from '../types/vekalet'

export async function getDosyaVekalet(dosyaId: string): Promise<DosyaVekaletResponse> {
  return apiFetch<DosyaVekaletResponse>(`/api/v1/dosyalar/${encodeURIComponent(dosyaId)}/vekalet`)
}

export async function upsertDosyaVekalet(
  dosyaId: string,
  payload: UpsertVekaletPayload
): Promise<{ ok: true; vekaletUcreti: VekaletUcretiDto }> {
  return apiFetch(`/api/v1/dosyalar/${encodeURIComponent(dosyaId)}/vekalet`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function createVekaletTaksiti(
  dosyaId: string,
  payload: CreateVekaletTaksitPayload
): Promise<{ ok: true; taksit: VekaletTaksitiDto }> {
  return apiFetch(`/api/v1/dosyalar/${encodeURIComponent(dosyaId)}/vekalet/taksitler`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function updateVekaletTaksiti(
  id: string,
  payload: UpdateVekaletTaksitPayload
): Promise<{ ok: true; taksit: VekaletTaksitiDto }> {
  return apiFetch(`/api/v1/vekalet-taksitleri/${encodeURIComponent(id)}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  })
}

export async function markTaksitPaid(
  id: string,
  payload: MarkTaksitPaidPayload
): Promise<{ ok: true; taksit: VekaletTaksitiDto }> {
  return apiFetch(`/api/v1/vekalet-taksitleri/${encodeURIComponent(id)}/odendi`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function markTaksitSmmKesildi(
  id: string,
  payload: MarkTaksitSmmPayload
): Promise<{ ok: true; taksit: VekaletTaksitiDto }> {
  return apiFetch(`/api/v1/vekalet-taksitleri/${encodeURIComponent(id)}/smm-kesildi`, {
    method: 'POST',
    body: JSON.stringify(payload)
  })
}

export async function cancelVekaletTaksiti(id: string): Promise<{ ok: true; taksit: VekaletTaksitiDto }> {
  return apiFetch(`/api/v1/vekalet-taksitleri/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  })
}
