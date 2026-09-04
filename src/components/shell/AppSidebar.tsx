import { useEffect, type ReactElement } from 'react'
import { NavLink } from 'react-router-dom'
import { PROGRAM_LOGO_SRC, WOONTEGRA_MARK_SRC } from '../../branding'
import { APP_BASE } from '../../config/appPaths'
import { NAV_GROUP_LABELS, type NavGroupId, type NavItem, sidebarNavForRole } from '../../config/nav'
import { cn } from '../../lib/cn'
import type { AuthUserDto } from '../../types/auth'

function groupNavItems(items: NavItem[]): { group: NavGroupId; items: NavItem[] }[] {
  const order: NavGroupId[] = ['kasa', 'tahsilat', 'yonetim']
  return order
    .map((group) => ({ group, items: items.filter((i) => i.group === group) }))
    .filter((g) => g.items.length > 0)
}

function navLinkClass({ isActive }: { isActive: boolean }): string {
  return cn(
    'group relative flex min-h-11 items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-200 ease-out',
    isActive
      ? 'bg-white/[0.12] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_4px_16px_rgba(0,0,0,0.18)]'
      : 'text-slate-400 hover:bg-white/[0.06] hover:text-slate-200'
  )
}

function iconShellClass(isActive: boolean): string {
  return cn(
    'flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all duration-200',
    isActive
      ? 'bg-gradient-to-br from-blue-500 to-blue-700 text-white shadow-[0_2px_8px_rgba(59,130,246,0.45)]'
      : 'bg-white/[0.05] text-slate-400 group-hover:bg-white/[0.08] group-hover:text-slate-200'
  )
}

export type AppNavLinksProps = {
  role: AuthUserDto['role'] | undefined
  onNavigate?: () => void
  className?: string
}

/** Sidebar ve mobil drawer ortak menü içeriği. */
export function AppNavLinks({ role, onNavigate, className }: AppNavLinksProps): ReactElement {
  const navItems = sidebarNavForRole(role)
  const groups = groupNavItems(navItems)

  return (
    <nav className={cn('relative min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-3', className)} aria-label="Ana menü">
      {groups.map(({ group, items }, gi) => (
        <div key={group} className={cn(gi > 0 && 'mt-5')}>
          <p className="mb-1.5 px-2 text-[10px] font-bold uppercase tracking-[0.12em] text-slate-600">
            {NAV_GROUP_LABELS[group]}
          </p>
          <ul className="space-y-0.5">
            {items.map((item) => (
              <li key={item.to}>
                <NavLink to={item.to} end={item.to === APP_BASE} className={navLinkClass} onClick={onNavigate}>
                  {({ isActive }) => (
                    <>
                      {isActive ? (
                        <span
                          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-blue-400 shadow-[0_0_8px_rgba(96,165,250,0.6)]"
                          aria-hidden
                        />
                      ) : null}
                      <span className={iconShellClass(isActive)}>{item.icon}</span>
                      <span className="truncate">{item.label}</span>
                    </>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}

export type AppSidebarProps = {
  role: AuthUserDto['role'] | undefined
}

export function AppSidebar({ role }: AppSidebarProps): ReactElement {
  return (
    <aside className="mk-sidebar relative hidden h-full min-h-0 w-[232px] flex-shrink-0 flex-col md:flex">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/[0.04] via-transparent to-black/20" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-white/10 via-white/5 to-transparent" />

      <div className="app-shell-header relative box-border shrink-0 border-b border-white/[0.08] px-3">
        <div className="flex h-full items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/[0.08] ring-1 ring-white/10">
            <img src={PROGRAM_LOGO_SRC} alt="" className="h-[34px] w-[34px] object-contain" />
          </div>
          <div className="min-w-0 flex-1 leading-tight">
            <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-500">Kasa Defteri</p>
            <p className="truncate text-sm font-bold text-white">Müvekkil Kasası</p>
          </div>
        </div>
      </div>

      <AppNavLinks role={role} />

      <footer className="relative shrink-0 border-t border-white/[0.08] px-4 py-3">
        <div className="flex items-center gap-2">
          <img src={WOONTEGRA_MARK_SRC} alt="Woontegra" className="h-5 w-5 shrink-0 opacity-70" />
          <div className="min-w-0">
            <p className="truncate text-[10px] font-semibold text-slate-400">Woontegra</p>
            <p className="text-[10px] tabular-nums text-slate-600">Sürüm 1.0</p>
          </div>
        </div>
      </footer>
    </aside>
  )
}

export type MobileNavDrawerProps = {
  open: boolean
  onClose: () => void
  role: AuthUserDto['role'] | undefined
  buroAdi?: string
}

/** Mobil hamburger menü — arka plan scroll kilidi + overlay. */
export function MobileNavDrawer({ open, onClose, role, buroAdi }: MobileNavDrawerProps): ReactElement | null {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Ana menü">
      <button type="button" className="absolute inset-0 bg-black/45" aria-label="Menüyü kapat" onClick={onClose} />
      <aside className="mk-sidebar relative flex h-full w-[min(20rem,88vw)] max-w-full flex-col shadow-2xl">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/[0.08] px-3 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/[0.08] ring-1 ring-white/10">
              <img src={PROGRAM_LOGO_SRC} alt="" className="h-[34px] w-[34px] object-contain" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">Müvekkil Kasası</p>
              <p className="truncate text-[11px] text-slate-400">{buroAdi ?? '—'}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-slate-300 hover:bg-white/10"
            aria-label="Kapat"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
              <path strokeLinecap="round" d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
        <AppNavLinks role={role} onNavigate={onClose} />
        <footer className="shrink-0 border-t border-white/[0.08] px-4 py-3">
          <div className="flex items-center gap-2">
            <img src={WOONTEGRA_MARK_SRC} alt="Woontegra" className="h-5 w-5 shrink-0 opacity-70" />
            <p className="text-[10px] font-semibold text-slate-400">Woontegra</p>
          </div>
        </footer>
      </aside>
    </div>
  )
}
