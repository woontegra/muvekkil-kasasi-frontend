import { apiFetch } from './client'

export type LicensePurchaseLinkResponse = {
  ok: true
  purchaseUrl: string
  expiresAt: string
}

export async function createLicensePurchaseLink(): Promise<LicensePurchaseLinkResponse> {
  return apiFetch<LicensePurchaseLinkResponse>('/api/v1/license/purchase-link', { method: 'POST' })
}

export async function createLicenseRenewalLink(): Promise<LicensePurchaseLinkResponse> {
  return apiFetch<LicensePurchaseLinkResponse>('/api/v1/license/renewal-link', { method: 'POST' })
}
