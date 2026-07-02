import { useQuery } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useState } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { getDashboardSummary } from '../api/dashboard'
import { getCurrentLicense } from '../api/license'
import { APP_BASE, HOME_PAGE_LABEL } from '../config/appPaths'
import { sidebarNavForRole } from '../config/nav'
import { useAuth } from '../contexts/AuthContext'
import { roleLabel } from '../lib/roleLabel'
import { cn } from '../lib/cn'
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, AlertBox } from '../components/ui'
import { useSafeBackdropClose } from '../components/ui/useSafeBackdropClose'

import type { AuthUserDto } from '../types/auth'

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

function navClassName({ isActive }: { isActive: boolean }): string {
  return cn(
    'flex items-center gap-2 rounded-lg px-3 py-2 text-[13px] font-semibold transition',
    isActive
      ? 'bg-primary-soft text-primary shadow-inner'
      : 'text-ink-muted hover:bg-surface-muted hover:text-ink'
  )
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

  return (
    <div className="flex h-[100dvh] max-h-[100dvh] w-full min-h-0 flex-col overflow-hidden bg-canvas md:flex-row">
      <aside className="hidden h-full min-h-0 w-[220px] flex-shrink-0 flex-col border-r border-border bg-panel md:flex">
        <div className="flex h-14 shrink-0 flex-col justify-center gap-0.5 border-b border-border px-4">
          <p className="text-[10px] font-bold uppercase leading-none tracking-wider text-ink-subtle">Woontegra</p>
          <p className="truncate text-sm font-bold leading-tight text-ink">Kasa Defteri</p>
          {session ? (
            <p className="truncate text-[11px] font-semibold leading-tight text-primary" title={session.tenant.slug}>
              {session.tenant.buroAdi}
            </p>
          ) : null}
        </div>
        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto overscroll-contain p-2" aria-label="Ana menü">
          {navItems.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === APP_BASE} className={navClassName}>
              {item.label}
            </NavLink>
          ))}
        </nav>
        <footer className="shrink-0 border-t border-border bg-panel px-3 py-2.5 text-[10px] leading-snug text-ink-subtle">
          <p className="font-medium text-ink-muted">Woontegra Teknoloji Yazılım ve Dijital Hizmetler Ltd. Şti.</p>
          <p className="mt-1 tabular-nums text-ink-subtle">Sürüm 1.0</p>
        </footer>
      </aside>

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-panel px-3 shadow-sm md:gap-6 md:px-5">
          <div className="min-w-0 flex-1 md:hidden">
            <p className="truncate text-xs font-bold leading-tight text-ink">{session?.tenant.buroAdi ?? '—'}</p>
            <p className="truncate text-[11px] leading-tight text-ink-muted">{mobilePageSubtitle(loc.pathname, session?.user.role)}</p>
          </div>
          <div className="hidden min-w-0 flex-1 md:block">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Büro</p>
            <p className="truncate text-sm font-bold leading-tight text-ink">{session?.tenant.buroAdi}</p>
            <p className="truncate text-[11px] leading-tight text-ink-subtle">Kod: {session?.tenant.slug}</p>
          </div>
          <div className="hidden min-w-0 md:block md:max-w-[280px]">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">Kullanıcı</p>
            <p className="truncate text-sm font-bold leading-tight text-ink">
              {session?.user.adSoyad}
              {session?.tenant.musteriNo ? (
                <span className="font-normal text-ink-muted"> · Müşteri No: {session.tenant.musteriNo}</span>
              ) : null}
            </p>
          </div>
          <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className={cn('relative gap-1.5', !hasBadge && 'opacity-75')}
              type="button"
              onClick={() => setOnayAcik(true)}
            >
              Onay bekleyen
              {hasBadge ? (
                <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                  {onaySayisi}
                </span>
              ) : null}
            </Button>
            <span className="hidden rounded-md border border-border bg-surface-muted px-2 py-1 text-[11px] font-semibold text-ink-muted sm:inline">
              {session ? roleLabel(session.user.role) : '—'}
            </span>
            <Button variant="outline" size="sm" onClick={() => logout()}>
              Çıkış
            </Button>
          </div>
        </header>

        {onayAcik ? (
          <div
            className="fixed inset-0 z-30 flex items-start justify-end bg-black/25 p-3 pt-16 backdrop-blur-[1px]"
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
          {licenseSoftKritik && lic ? (
            <div className="mb-4 flex flex-col gap-2 rounded-lg border border-orange-400 bg-gradient-to-r from-orange-50 to-amber-50 px-3 py-3 text-sm text-orange-950 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <p className="min-w-0 font-medium">
                Lisansınızın bitmesine {lic.kalanGun ?? '—'} gün kaldı. Yenileme için Woontegra ile iletişime geçin.
              </p>
              <Link
                to={`${APP_BASE}/ayarlar`}
                className="inline-flex shrink-0 items-center justify-center rounded-md border border-orange-500 bg-white px-3 py-1.5 text-xs font-bold text-orange-950 hover:bg-orange-100"
              >
                Detayları gör
              </Link>
            </div>
          ) : null}
          {licenseSoftYaklasiyor && lic ? (
            <div className="mb-4 flex flex-col gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-3 text-sm text-amber-950 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <p className="min-w-0 font-medium">Lisansınızın bitmesine {lic.kalanGun ?? '—'} gün kaldı.</p>
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
          <Outlet />
        </main>
      </div>
    </div>
  )
}
