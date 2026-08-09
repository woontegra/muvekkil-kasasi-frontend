import type { ReactElement } from 'react'
import { WOONTEGRA_LICENSE_URL } from '../../config/woontegraExternal'
import { cn } from '../../lib/cn'
import type { TenantLicenseCurrent } from '../../types/license'
import { kalanGunFromIsoEnd } from '../../utils/tenantLicenseDisplay'

export type DemoTrialBannerProps = {
  license: TenantLicenseCurrent
}

type DemoBannerTone = 'info' | 'warning' | 'critical'

function resolveDemoKalanGun(license: TenantLicenseCurrent): number | null {
  if (license.kalanGun != null) return license.kalanGun
  if (license.demoBitisTarihi) return kalanGunFromIsoEnd(license.demoBitisTarihi)
  return null
}

function toneFromKalanGun(kalanGun: number): DemoBannerTone {
  if (kalanGun <= 2) return 'critical'
  if (kalanGun <= 7) return 'warning'
  return 'info'
}

function demoMessage(kalanGun: number): string {
  if (kalanGun <= 0) return 'Deneme sürümünüzün süresi bugün sona eriyor'
  if (kalanGun === 1) return 'Deneme sürümünüzün bitmesine 1 gün kaldı'
  return `Deneme sürümünüzün bitmesine ${kalanGun} gün kaldı`
}

const toneStyles: Record<DemoBannerTone, { bar: string; btn: string }> = {
  info: {
    bar: 'border-sky-200/80 bg-gradient-to-r from-sky-50 to-blue-50 text-sky-950',
    btn: 'border-sky-300 bg-white/90 text-sky-900 hover:bg-white'
  },
  warning: {
    bar: 'border-amber-300/90 bg-gradient-to-r from-amber-50 to-orange-50 text-amber-950',
    btn: 'border-amber-400 bg-white/90 text-amber-950 hover:bg-white'
  },
  critical: {
    bar: 'border-red-300/90 bg-gradient-to-r from-red-50 to-rose-50 text-red-950',
    btn: 'border-red-400 bg-white/90 text-red-950 hover:bg-white'
  }
}

export function shouldShowDemoTrialBanner(license: TenantLicenseCurrent | undefined): license is TenantLicenseCurrent {
  if (!license?.demoMu) return false
  const kalan = resolveDemoKalanGun(license)
  return kalan != null
}

export function DemoTrialBanner({ license }: DemoTrialBannerProps): ReactElement {
  const kalanGun = resolveDemoKalanGun(license)!
  const tone = toneFromKalanGun(kalanGun)
  const styles = toneStyles[tone]

  return (
    <div
      className={cn(
        'mk-demo-banner-in flex h-10 shrink-0 items-center gap-3 border-b px-3 md:px-5',
        styles.bar
      )}
      role="status"
      aria-live="polite"
    >
      <p className="min-w-0 flex-1 truncate text-xs font-medium sm:text-[13px]">{demoMessage(kalanGun)}</p>
      <div className="flex shrink-0 items-center gap-2">
        <a
          href={WOONTEGRA_LICENSE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            'inline-flex h-7 items-center justify-center rounded-md border px-2.5 text-[11px] font-bold leading-none transition-colors',
            styles.btn
          )}
        >
          Lisans Satın Al
        </a>
      </div>
    </div>
  )
}
