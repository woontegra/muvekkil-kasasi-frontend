import type { ReactElement } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { APP_BASE } from '../config/appPaths'
import { SIDEBAR_NAV } from '../config/nav'
import { MOCK_ONAY_KUYRUGU, MOCK_SUMMARY, gorunenAd, muvekkilById } from '../data/mockFlow'
import { useAuth } from '../contexts/AuthContext'
import { roleLabel } from '../lib/roleLabel'
import { cn } from '../lib/cn'
import { Badge, Button, Card, CardBody, CardHeader, CardTitle } from '../components/ui'
import { useState } from 'react'
import { formatDateTR } from '../utils/formatters'

function normalizePath(pathname: string): string {
  const p = pathname.replace(/\/$/, '')
  return p || APP_BASE
}

/** Mobil menü seçimi: alt sayfalarda ana menü köküne eşle. */
function selectedSidebarPath(pathname: string): string {
  const p = normalizePath(pathname)
  if (p === APP_BASE) return APP_BASE
  const hit = SIDEBAR_NAV.filter((item) => item.to !== APP_BASE).find((item) => p === item.to || p.startsWith(`${item.to}/`))
  return hit?.to ?? APP_BASE
}

function mobilePageSubtitle(pathname: string): string {
  const p = normalizePath(pathname)
  if (p === APP_BASE) return 'Ana Sayfa'
  if (p.includes('/dosya/') && p.startsWith(`${APP_BASE}/muvekkil/`)) return 'Dosya detayı'
  if (p.startsWith(`${APP_BASE}/muvekkil/`)) return 'Müvekkil detayı'
  const hit = SIDEBAR_NAV.find((x) => p === x.to || (x.to !== APP_BASE && (p === x.to || p.startsWith(`${x.to}/`))))
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

  const onaySayisi = MOCK_SUMMARY.onayBekleyenIslem

  return (
    <div className="flex min-h-screen bg-canvas">
      <aside className="sticky top-0 hidden h-screen w-[220px] flex-shrink-0 flex-col border-r border-border bg-panel shadow-sm md:flex">
        <div className="border-b border-border px-4 py-3">
          <p className="text-[10px] font-bold uppercase tracking-wider text-ink-subtle">Woontegra</p>
          <p className="truncate text-sm font-bold text-ink">Kasa Defteri</p>
          {session ? (
            <p className="mt-0.5 truncate text-[11px] font-semibold text-primary" title={session.tenant.slug}>
              {session.tenant.buroAdi}
            </p>
          ) : null}
        </div>
        <nav className="flex-1 space-y-0.5 overflow-y-auto p-2" aria-label="Ana menü">
          {SIDEBAR_NAV.map((item) => (
            <NavLink key={item.to} to={item.to} end={item.to === APP_BASE} className={navClassName}>
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex min-h-14 flex-wrap items-center justify-between gap-3 border-b border-border bg-panel/95 px-3 py-2 shadow-header backdrop-blur md:px-5">
          <div className="min-w-0 flex-1 md:hidden">
            <p className="truncate text-xs font-bold text-ink">{session?.tenant.buroAdi ?? '—'}</p>
            <p className="truncate text-[11px] text-ink-muted">{mobilePageSubtitle(loc.pathname)}</p>
          </div>
          <div className="hidden min-w-0 flex-1 md:block">
            <p className="text-xs font-semibold text-ink-muted">Büro</p>
            <p className="truncate text-sm font-bold text-ink">{session?.tenant.buroAdi}</p>
            <p className="truncate text-xs text-ink-subtle">Kod: {session?.tenant.slug}</p>
          </div>
          <div className="hidden min-w-0 md:block md:max-w-[240px]">
            <p className="text-xs font-semibold text-ink-muted">Kullanıcı</p>
            <p className="truncate text-sm font-bold text-ink">
              {session?.user.adSoyad}{' '}
              <span className="font-normal text-ink-muted">({session?.user.kullaniciAdi})</span>
            </p>
          </div>
          <div className="flex flex-shrink-0 flex-wrap items-center justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              className="relative gap-1.5"
              type="button"
              onClick={() => setOnayAcik(true)}
            >
              Onay bekleyen
              {onaySayisi > 0 ? (
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
            onClick={() => setOnayAcik(false)}
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
                <p className="text-xs text-ink-muted">
                  Detaylı işlemler dosya kasası ekranında satır bazında görünür. Burada yalnızca kuyruk özeti (mock).
                </p>
                <ul className="space-y-2">
                  {MOCK_ONAY_KUYRUGU.map((x) => {
                    const m = muvekkilById(x.muvekkilId)
                    return (
                      <li key={x.id} className="rounded-lg border border-border bg-surface-muted/50 p-2.5 text-sm">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <Badge variant={x.tur === 'DUZENLEME_TALEBI' ? 'accent' : x.tur === 'OFIS_KASA' ? 'default' : 'warning'}>
                            {x.tur === 'KASA' ? 'Dosya kasası' : x.tur === 'OFIS_KASA' ? 'Ofis kasası' : 'Düzenleme'}
                          </Badge>
                          <span className="text-[11px] text-ink-subtle">{formatDateTR(x.tarih)}</span>
                        </div>
                        <p className="mt-1 font-medium text-ink">{x.ozet}</p>
                        {m ? (
                          <Link
                            to={`${APP_BASE}/muvekkil/${x.muvekkilId}/dosya/${x.dosyaId}`}
                            className="mt-1 inline-block text-xs font-semibold text-primary hover:underline"
                            onClick={() => setOnayAcik(false)}
                          >
                            Dosyaya git — {gorunenAd(m)}
                          </Link>
                        ) : null}
                      </li>
                    )
                  })}
                </ul>
              </CardBody>
            </Card>
          </div>
        ) : null}

        <div className="border-b border-border bg-panel px-3 py-2 md:hidden">
          <label htmlFor="nav-jump" className="sr-only">
            Menü
          </label>
          <select
            id="nav-jump"
            className="h-9 w-full rounded-md border border-border bg-white px-2 text-sm font-medium text-ink"
            value={selectedSidebarPath(loc.pathname)}
            onChange={(e) => {
              const v = e.target.value
              if (v) navigate(v)
            }}
          >
            {SIDEBAR_NAV.map((item) => (
              <option key={item.to} value={item.to}>
                {item.label}
              </option>
            ))}
          </select>
        </div>

        <main className="flex-1 overflow-auto px-3 py-4 md:px-5 md:py-5">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
