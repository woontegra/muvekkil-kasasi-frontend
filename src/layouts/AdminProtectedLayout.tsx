import type { ReactElement } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { WOONTEGRA_MARK_SRC } from '../branding'
import { useAdminAuth } from '../contexts/AdminAuthContext'
import { cn } from '../lib/cn'
import { Button } from '../components/ui'

function navCls({ isActive }: { isActive: boolean }): string {
  return cn(
    'block rounded-lg px-3 py-2.5 text-[13px] font-semibold transition',
    isActive
      ? 'border border-slate-600/80 bg-slate-800 text-white shadow-inner'
      : 'text-slate-300 hover:bg-slate-800/80 hover:text-white'
  )
}

export function AdminProtectedLayout(): ReactElement {
  const { admin, logout } = useAdminAuth()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen w-full bg-[#0f172a] text-slate-100">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-slate-800 bg-[#0b1224] md:flex">
        <div className="border-b border-slate-800 px-4 py-5">
          <div className="flex items-center gap-3">
            <img src={WOONTEGRA_MARK_SRC} alt="" className="h-9 w-9 shrink-0 rounded-lg border border-slate-700/80 bg-white/95 p-0.5 object-contain" />
            <div className="min-w-0">
              <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-400">Woontegra</p>
              <p className="truncate text-sm font-bold text-white">Süper Admin</p>
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
          <NavLink to="/admin" end className={navCls}>
            Genel Bakış
          </NavLink>
          <NavLink to="/admin/burolar" className={navCls}>
            Kullanıcı Yönetimi
          </NavLink>
          <NavLink to="/admin/lisans-uyarilar" className={navCls}>
            Lisansı Bitecekler
          </NavLink>
          <NavLink to="/admin/pasif-burolar" className={navCls}>
            Pasif Bürolar
          </NavLink>
          <NavLink to="/admin/sistem" className={navCls}>
            Sistem / Adminler
          </NavLink>
          <NavLink to="/admin/ayarlar" className={navCls}>
            Ayarlar
          </NavLink>
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

      <div className="flex min-h-screen min-w-0 flex-1 flex-col bg-slate-50 text-ink">
        <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3 shadow-sm md:hidden">
          <div className="flex items-center gap-2">
            <img src={WOONTEGRA_MARK_SRC} alt="" className="h-8 w-8 rounded-md border border-slate-200 bg-white object-contain" />
            <span className="text-sm font-bold text-slate-900">Woontegra Admin</span>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={() => logout()}>
            Çıkış
          </Button>
        </header>
        <main className="w-full flex-1 px-4 py-5 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
