import { createLicenseRenewalLink } from '../api/licensePurchase'
import { APP_BASE } from '../config/appPaths'

export const LICENSE_RENEWAL_ENTRY_PATH = `${APP_BASE}/lisans-yenile`

export function safeAppReturnPath(raw: string | null): string | null {
  if (!raw || !raw.startsWith(APP_BASE)) return null
  if (raw.includes('://')) return null
  return raw
}

export async function startLicenseRenewal(): Promise<void> {
  const res = await createLicenseRenewalLink()
  window.open(res.purchaseUrl, '_blank', 'noopener,noreferrer')
}
