import type { ReactElement } from 'react'
import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { WOONTEGRA_MARK_SRC } from '../branding'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import { isSuperAdminRole } from '../lib/adminRoles'
import { cn } from '../lib/cn'
import { Button } from '../components/ui'
import { PageTransition } from '../motion'

function navCls({ isActive }: { isActive: boolean }): string {
  return cn(
    'block rounded-lg px-3 py-2.5 text-[13px] font-semibold transition',
    isActive
      ? 'border border-slate-600/80 bg-slate-800 text-white shadow-inner'
      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
  )
}

const NAV_ITEMS: { to: string; label: string; end?: boolean; superOnly?: boolean }[] = [
  { to: '/admin', label: 'Genel Bakış', end: true },
  { to: '/admin/burolar', label: 'Kullanıcı Yönetimi' },
  { to: '/admin/lisans-uyarilar', label: 'Lisansı Bitecekler' },
  { to: '/admin/pasif-burolar', label: 'Pasif Bürolar' },
  { to: '/admin/sistem', label: 'Sistem / Adminler', superOnly: true },
  { to: '/admin/ayarlar', label: 'Ayarlar' }
]

function AdminNavLinks(props: { onNavigate?: () => void; isSuper: boolean }): ReactElement {
  return (
    <>
      {NAV_ITEMS.filter((item) => !item.superOnly || props.isSuper).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={navCls}
          onClick={props.onNavigate}
        >
          {item.label}
        </NavLink>
      ))}
    </>
  )
}

export function AdminProtectedLayout(): ReactElement {
  const { admin, logout } = useAdminAuth()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isSuper = isSuperAdminRole(admin?.rol)

  return (
    <div className="flex min-h-screen w-full bg-[#0f172a] text-slate-100">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-800 bg-[#0b1224] md:flex">
        <div className="border-b border-slate-800 px-4 py-5">
          <div className="flex items-center gap-3">
            <img src={WOONTEGRA_MARK_SRC} alt="" className="h-9 w-9 shrink-0 rounded-lg border border-slate-700/80 bg-white/95 p-0.5 object-contain" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Woontegra</p>
              <p className="truncate text-sm font-bold text-white">Platform Admin</p>
            </div>
          </div>
          {admin ? (
            <p className="mt-3 truncate rounded-md bg-slate-800/80 px-2 py-1.5 text-xs text-slate-300" title={admin.kullaniciAdi}>
              {admin.adSoyad}
              <span className="mt-0.5 block text-[10px] font-normal uppercase text-slate-500">{admin.rol}</span>
            </p>
          ) : null}
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2" aria-label="Admin menü">
          <AdminNavLinks isSuper={isSuper} />
        </nav>
        <div className="mt-auto space-y-2 border-t border-slate-800 p-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full border-slate-600 bg-transparent text-slate-200 hover:bg-slate-800"
            onClick={() => navigate('/login')}
          >
            Büro girişi
          </Button>
          <Button type="button" variant="ghost" size="sm" className="w-full text-slate-400 hover:bg-slate-800 hover:text-white" onClick={() => logout()}>
            Çıkış
          </Button>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Menüyü kapat"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative flex h-full w-72 max-w-[85vw] flex-col bg-[#0b1224] shadow-xl">
            <div className="border-b border-slate-800 px-4 py-4">
              <p className="text-sm font-bold text-white">Woontegra Admin</p>
              {admin ? <p className="mt-1 text-xs text-slate-400">{admin.adSoyad} · {admin.rol}</p> : null}
            </div>
            <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2" aria-label="Admin menü">
              <AdminNavLinks isSuper={isSuper} onNavigate={() => setMobileOpen(false)} />
            </nav>
            <div className="space-y-2 border-t border-slate-800 p-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-full border-slate-600 bg-transparent text-slate-200"
                onClick={() => {
                  setMobileOpen(false)
                  navigate('/login')
                }}
              >
                Büro girişi
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full text-slate-400"
                onClick={() => {
                  setMobileOpen(false)
                  logout()
                }}
              >
                Çıkış
              </Button>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-slate-50 text-ink">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm md:hidden">
          <div className="flex items-center gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setMobileOpen(true)} aria-label="Menüyü aç">
              Menü
            </Button>
            <img src={WOONTEGRA_MARK_SRC} alt="" className="h-8 w-8 rounded-md border border-slate-200 bg-white object-contain" />
            <span className="text-sm font-bold text-slate-900">Woontegra Admin</span>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => logout()}>
            Çıkış
          </Button>
        </header>
        <main className="w-full flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <PageTransition />
        </main>
      </div>
    </div>
  )
}
