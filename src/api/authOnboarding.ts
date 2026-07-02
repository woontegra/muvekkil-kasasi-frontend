import { apiFetch } from './client'
import type { AuthLoginResponse, MeResponse } from '../types/auth'

export type ActivateLicenseResponse = MeResponse

export type ChangeInitialPasswordResponse = MeResponse & {
  message: string
}

export async function activateLicenseRequest(licenseKey: string): Promise<ActivateLicenseResponse> {
  return apiFetch<ActivateLicenseResponse>('/api/v1/auth/activate-license', {
    method: 'POST',
    body: JSON.stringify({ licenseKey: licenseKey.trim() })
  })
}

export async function changeInitialPasswordRequest(
  yeniSifre: string,
  yeniSifreTekrar: string
): Promise<ChangeInitialPasswordResponse> {
  return apiFetch<ChangeInitialPasswordResponse>('/api/v1/auth/change-initial-password', {
    method: 'POST',
    body: JSON.stringify({ yeniSifre, yeniSifreTekrar })
  })
}

export type AuthPayloadWithOnboarding = AuthLoginResponse
