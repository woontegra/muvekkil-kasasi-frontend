import type { ReactElement } from 'react'
import { useState } from 'react'
import { createLicenseRenewalLink } from '../../api/licensePurchase'
import { cn } from '../../lib/cn'
import type { TenantLicenseCurrent } from '../../types/license'

export type LicenseRenewalBannerProps = {
  license: TenantLicenseCurrent
}

type RenewalBannerTone = 'warning' | 'critical'

function toneFromUyari(uyari: TenantLicenseCurrent['uyariSeviyesi']): RenewalBannerTone {
  if (uyari === 'KRITIK' || uyari === 'BITTI') return 'critical'
  return 'warning'
}

function renewalMessage(kalanGun: number): string {
  if (kalanGun <= 0) return 'Lisansınızın süresi bugün sona eriyor'
  if (kalanGun === 1) return 'Lisansınızın bitmesine 1 gün kaldı'
  return `Lisansınızın bitmesine ${kalanGun} gün kaldı`
}

const toneStyles: Record<RenewalBannerTone, { bar: string; btn: string }> = {
  warning: {
    bar: 'border-amber-300/90 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-950',
    btn: 'border-amber-400 bg-white/90 text-amber-950 hover:bg-white'
  },
  critical: {
    bar: 'border-red-300/90 bg-gradient-to-r from-red-50 to-rose-50 text-red-950',
    btn: 'border-red-400 bg-white/90 text-red-950 hover:bg-white'
  }
}

export function shouldShowLicenseRenewalBanner(
  license: TenantLicenseCurrent | undefined
): license is TenantLicenseCurrent {
  if (!license || license.demoMu) return false
  if (license.kalanGun == null) return false
  if (license.uyariSeviyesi !== 'YAKLASIYOR' && license.uyariSeviyesi !== 'KRITIK') return false
  return license.kalanGun <= 30
}

export function LicenseRenewalBanner({ license }: LicenseRenewalBannerProps): ReactElement {
  const kalanGun = license.kalanGun ?? 0
  const tone = toneFromUyari(license.uyariSeviyesi)
  const styles = toneStyles[tone]
  const [loading, setLoading] = useState(false)

  async function handleRenewClick(): Promise<void> {
    if (loading) return
    setLoading(true)
    try {
      const res = await createLicenseRenewalLink()
      window.open(res.purchaseUrl, '_blank', 'noopener,noreferrer')
    } catch {
      window.alert('Lisans yenileme bağlantısı oluşturulamadı. Lütfen tekrar deneyin.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={cn(
        'mk-renewal-banner-in flex h-10 shrink-0 items-center gap-3 border-b px-3 md:px-5',
        styles.bar
      )}
      role="status"
      aria-live="polite"
    >
      <p className="min-w-0 flex-1 truncate text-xs font-medium sm:text-[13px]">{renewalMessage(kalanGun)}</p>
      <div className="flex shrink-0 items-center gap-2">
        <button
          type="button"
          disabled={loading}
          onClick={() => void handleRenewClick()}
          className={cn(
            'inline-flex h-7 items-center justify-center rounded-md border px-2.5 text-[11px] font-bold leading-none transition-colors disabled:opacity-60',
            styles.btn
          )}
        >
          {loading ? 'Hazırlanıyor…' : 'Lisansı Yenile'}
        </button>
      </div>
    </div>
  )
}
