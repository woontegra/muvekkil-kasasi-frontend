import { useQuery } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { getDashboardSummary } from '../api/dashboard'
import { getCurrentLicense } from '../api/license'
import { APP_BASE, HOME_PAGE_LABEL } from '../config/appPaths'
import { sidebarNavForRole } from '../config/nav'
import { useAuth } from '../contexts/AuthContext'
import { roleLabel } from '../lib/roleLabel'
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, AlertBox } from '../components/ui'
import { useSafeBackdropClose } from '../components/ui/useSafeBackdropClose'
import { PageTransition } from '../motion'
import { AppSidebar } from '../components/shell/AppSidebar'
import { DemoTrialBanner, shouldShowDemoTrialBanner } from '../components/shell/DemoTrialBanner'
import {
  LicenseRenewalBanner,
  shouldShowLicenseRenewalBanner
} from '../components/shell/LicenseRenewalBanner'
import { TopbarActionChip } from '../components/shell/TopbarActionChip'

import type { AuthUserDto } from '../types/auth'

function userInitials(adSoyad: string | undefined): string {
  if (!adSoyad?.trim()) return '?'
  const parts = adSoyad.trim().split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[parts.length - 1]![0] ?? ''}`.toUpperCase()
  }
  return (parts[0]!.slice(0, 2) || '?').toUpperCase()
}

function normalizePath(pathname: string): string {
  const p = pathname.replace(/\/$/, '')
  return p || APP_BASE
}

/** Mobil menü seçimi: alt sayfalarda ana menü köküne eşle. */
function selectedSidebarPath(pathname: string, role: AuthUserDto['role'] | undefined): string {
  const p = normalizePath(pathname)
  if (p === APP_BASE) return APP_BASE
  if (p.startsWith(`${APP_BASE}/muvekkiller`)) return APP_BASE
  if (p.startsWith(`${APP_BASE}/ayarlar`)) return `${APP_BASE}/ayarlar`
  const nav = sidebarNavForRole(role)
  const hit = nav.filter((item) => item.to !== APP_BASE).find((item) => p === item.to || p.startsWith(`${item.to}/`))
  return hit?.to ?? APP_BASE
}

function mobilePageSubtitle(pathname: string, role: AuthUserDto['role'] | undefined): string {
  const p = normalizePath(pathname)
  if (p === APP_BASE) return HOME_PAGE_LABEL
  if (p.startsWith(`${APP_BASE}/muvekkiller/yeni`)) return 'Yeni müvekkil'
  if (p.includes('/dosyalar/yeni') && p.startsWith(`${APP_BASE}/muvekkil/`)) return 'Yeni dosya'
  if (p.includes('/dosya/') && p.startsWith(`${APP_BASE}/muvekkil/`)) return 'Dosya detayı'
  if (p.startsWith(`${APP_BASE}/muvekkil/`)) return 'Müvekkil detayı'
  if (p.startsWith(`${APP_BASE}/kullanicilar`)) return 'Kullanıcılar'
  if (p.startsWith(`${APP_BASE}/ayarlar/masaustu-ice-aktar`)) return 'Masaüstü içe aktar'
  if (p.startsWith(`${APP_BASE}/ayarlar`)) return 'Ayarlar'
  const nav = sidebarNavForRole(role)
  const hit = nav.find((x) => p === x.to || (x.to !== APP_BASE && (p === x.to || p.startsWith(`${x.to}/`))))
  return hit?.label ?? 'Uygulama'
}

export function DashboardShell(): ReactElement {
  const { session, logout } = useAuth()
  const loc = useLocation()
  const navigate = useNavigate()
  const [onayAcik, setOnayAcik] = useState(false)
  const onayBackdropClose = useSafeBackdropClose(() => setOnayAcik(false))
  const navItems = sidebarNavForRole(session?.user.role)

  const summaryQuery = useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: getDashboardSummary,
    staleTime: 30_000,
    retry: 1
  })

  const licenseQuery = useQuery({
    queryKey: ['tenant-license-current'],
    queryFn: getCurrentLicense,
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    retry: 1
  })

  const s = summaryQuery.data
  const onaySayisi = s?.onayBekleyenToplam ?? 0
  const hasBadge = onaySayisi > 0

  const lic = licenseQuery.data
  const licenseHard =
    lic &&
    (lic.uyariSeviyesi === 'BITTI' || lic.uyariSeviyesi === 'PASIF' || lic.lisansDurumu === 'SURESI_DOLDU')
  const licenseInfoEksik = lic && lic.uyariSeviyesi === 'BILGI_EKSIK'
  const licenseSoftKritik = lic && lic.uyariSeviyesi === 'KRITIK' && !licenseHard
  const licenseSoftYaklasiyor = lic && lic.uyariSeviyesi === 'YAKLASIYOR' && !licenseHard
  const showDemoBanner = shouldShowDemoTrialBanner(lic)
  const showRenewalHeaderBanner = shouldShowLicenseRenewalBanner(lic) && !showDemoBanner

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] w-full min-h-0 flex-col overflow-hidden bg-canvas md:flex-row">
      <AppSidebar role={session?.user.role} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="app-shell-header box-border flex shrink-0 items-center justify-between gap-4 border-b border-border bg-panel px-4 shadow-sm md:px-5">
          <div className="min-w-0 flex-1 md:hidden">
            <p className="truncate text-xs font-bold leading-tight text-ink">{session?.tenant.buroAdi ?? '—'}</p>
            <p className="truncate text-[11px] leading-tight text-ink-muted">{mobilePageSubtitle(loc.pathname, session?.user.role)}</p>
          </div>
          <div className="hidden min-w-0 flex-1 md:block">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-ink-muted">Büro</p>
            <p className="truncate text-sm font-bold leading-tight text-ink">{session?.tenant.buroAdi}</p>
          </div>

          <div className="flex shrink-0 items-center gap-3">
            {hasBadge ? (
              <TopbarActionChip
                type="button"
                variant="default"
                badge={onaySayisi}
                onClick={() => setOnayAcik(true)}
                aria-label={`Onay bekleyen, ${onaySayisi} kayıt`}
              >
                Onay bekleyen
              </TopbarActionChip>
            ) : null}

            <div className="flex items-center gap-2 border-l border-border pl-3">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary"
                aria-hidden
              >
                {userInitials(session?.user.adSoyad)}
              </div>
              <div className="hidden min-w-0 sm:block">
                <p className="max-w-[200px] truncate text-sm font-semibold leading-tight text-ink">{session?.user.adSoyad}</p>
                <p className="text-[11px] leading-tight text-ink-muted">{session ? roleLabel(session.user.role) : '—'}</p>
              </div>
              <button
                type="button"
                onClick={() => logout()}
                className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-md px-2 text-xs font-medium text-ink-muted transition-colors hover:bg-surface-muted hover:text-ink"
                aria-label="Çıkış yap"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                </svg>
                <span className="hidden md:inline">Çıkış</span>
              </button>
            </div>
          </div>
        </header>

        {showDemoBanner && lic ? <DemoTrialBanner license={lic} /> : null}
        {showRenewalHeaderBanner && lic ? <LicenseRenewalBanner license={lic} /> : null}

        {onayAcik ? (
          <div
            className="fixed inset-0 z-30 flex items-start justify-end bg-black/25 p-3 pt-[var(--app-header-height)] backdrop-blur-[1px]"
            role="presentation"
            {...onayBackdropClose}
          >
            <Card
              className="max-h-[min(80vh,520px)] w-full max-w-md overflow-hidden shadow-card"
              onClick={(e) => e.stopPropagation()}
            >
              <CardHeader className="flex flex-row items-center justify-between gap-2">
                <CardTitle>Onay bekleyenler</CardTitle>
                <Button variant="ghost" size="sm" type="button" onClick={() => setOnayAcik(false)}>
                  Kapat
                </Button>
              </CardHeader>
              <CardBody className="max-h-[420px] space-y-2 overflow-y-auto">
                {summaryQuery.isError ? (
                  <p className="text-xs text-danger">Özet yüklenemedi. Sayfayı yenileyin.</p>
                ) : summaryQuery.isLoading ? (
                  <p className="text-xs text-ink-muted">Yükleniyor…</p>
                ) : s ? (
                  <>
                    <p className="text-xs text-ink-muted">
                      Onay bekleyen toplam: <strong className="text-ink">{s.onayBekleyenToplam}</strong> (dosya kasası{' '}
                      <strong>{s.dosyaKasaOnayBekleyen}</strong> + ofis kasası <strong>{s.ofisKasaOnayBekleyen}</strong>).
                    </p>
                    <ul className="space-y-2 text-sm">
                      <li className="rounded-lg border border-border bg-surface-muted/50 p-2.5">
                        <Badge variant="warning" className="!normal-case">
                          Dosya kasası
                        </Badge>
                        <p className="mt-1 text-ink-muted">
                          <strong className="text-ink">{s.dosyaKasaOnayBekleyen}</strong> onaysız hareket. İlgili{' '}
                          <Link to={APP_BASE} className="font-semibold text-primary hover:underline" onClick={() => setOnayAcik(false)}>
                            müvekkil → dosya detayı
                          </Link>{' '}
                          üzerinden onaylayın veya reddedin.
                        </p>
                      </li>
                      <li className="rounded-lg border border-border bg-surface-muted/50 p-2.5">
                        <Badge variant="default" className="!normal-case">
                          Ofis kasası
                        </Badge>
                        <p className="mt-1 text-ink-muted">
                          <strong className="text-ink">{s.ofisKasaOnayBekleyen}</strong> onaysız hareket.
                        </p>
                        <Link
                          to={`${APP_BASE}/ofis-kasasi`}
                          className="mt-1 inline-block text-xs font-semibold text-primary hover:underline"
                          onClick={() => setOnayAcik(false)}
                        >
                          Ofis kasasına git
                        </Link>
                      </li>
                    </ul>
                  </>
                ) : (
                  <p className="text-xs text-ink-muted">Özet yok.</p>
                )}
              </CardBody>
            </Card>
          </div>
        ) : null}

        <div className="shrink-0 border-b border-border bg-panel px-3 py-2 md:hidden">
          <label htmlFor="nav-jump" className="sr-only">
            Menü
          </label>
          <select
            id="nav-jump"
            className="h-9 w-full rounded-md border border-border bg-white px-2 text-sm font-medium text-ink"
            value={selectedSidebarPath(loc.pathname, session?.user.role)}
            onChange={(e) => {
              const v = e.target.value
              if (v) navigate(v)
            }}
          >
            {navItems.map((item) => (
              <option key={item.to} value={item.to}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <main className="min-h-0 w-full flex-1 overflow-y-auto overscroll-contain bg-canvas px-3 py-4 md:px-6 md:py-5">
          {licenseInfoEksik && lic ? (
            <div className="mb-4 flex flex-col gap-2 rounded-lg border border-sky-300 bg-sky-50 px-3 py-3 text-sm text-sky-950 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <p className="min-w-0 font-medium">{lic.bilgiMesaji ?? 'Lisans bitiş tarihi henüz tanımlanmamış.'}</p>
              <Link
                to={`${APP_BASE}/ayarlar`}
                className="inline-flex shrink-0 items-center justify-center rounded-md border border-sky-400 bg-white px-3 py-1.5 text-xs font-bold text-sky-950 hover:bg-sky-100"
              >
                Detayları gör
              </Link>
            </div>
          ) : null}
          {licenseHard ? (
            <div className="mb-4 flex flex-col gap-2 rounded-lg border border-red-300 bg-red-50 px-3 py-3 text-sm text-red-950 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <p className="min-w-0 font-medium">
                {lic.uyariSeviyesi === 'PASIF'
                  ? 'Büro erişimi pasif durumda. Woontegra ile iletişime geçin.'
                  : lic.lisansDurumu === 'SURESI_DOLDU' || lic.uyariSeviyesi === 'BITTI'
                    ? 'Lisans süreniz sona ermiştir. Yeni kayıt ve düzenleme işlemleri kapatılmıştır.'
                    : 'Lisans uyarısı: lütfen ayarlar sayfasından kontrol edin.'}
              </p>
              <Link
                to={`${APP_BASE}/ayarlar`}
                className="inline-flex shrink-0 items-center justify-center rounded-md border border-red-400 bg-white px-3 py-1.5 text-xs font-bold text-red-900 hover:bg-red-100"
              >
                Detayları gör
              </Link>
            </div>
          ) : null}
          {licenseSoftKritik && lic && !showDemoBanner && !showRenewalHeaderBanner ? (
            <div className="mb-4 flex flex-col gap-2 rounded-lg border border-orange-400 bg-gradient-to-r from-orange-50 to-amber-50 px-3 py-3 text-sm text-orange-950 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <p className="min-w-0 font-medium">
                Lisansınızın bitmesine {licenseQuery.data?.kalanGun ?? '—'} gün kaldı.
              </p>
              <Link
                to={`${APP_BASE}/ayarlar`}
                className="inline-flex shrink-0 items-center justify-center rounded-md border border-orange-500 bg-white px-3 py-1.5 text-xs font-bold text-orange-950 hover:bg-orange-100"
              >
                Lisansı yenile
              </Link>
            </div>
          ) : null}
          {licenseSoftYaklasiyor && lic && !showDemoBanner && !showRenewalHeaderBanner ? (
            <div className="mb-4 flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-950 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <p className="min-w-0 font-medium">Lisansınızın bitmesine {licenseQuery.data?.kalanGun ?? '—'} gün kaldı.</p>
              <Link
                to={`${APP_BASE}/ayarlar`}
                className="inline-flex shrink-0 items-center justify-center rounded-md border border-amber-500/60 bg-white px-3 py-1.5 text-xs font-bold text-amber-950 hover:bg-amber-100"
              >
                Detayları gör
              </Link>
            </div>
          ) : null}
          {!lic && session?.tenant.lisansDurumu === 'SURESI_DOLDU' ? (
            <div className="mb-4">
              <AlertBox variant="warning" title="Lisans süreniz sona erdi">
                Görüntüleme yapabilirsiniz; yeni kayıt ve düzenleme işlemleri engellenmiştir. Yenileme için Woontegra ile iletişime geçin.
              </AlertBox>
            </div>
          ) : null}
          <PageTransition />
        </main>
      </div>
    </div>
  )
}
