import type { ReactElement, ReactNode } from 'react'
import { Outlet } from 'react-router-dom'

export function PublicAuthLayout(): ReactElement {
  return (
    <div className="flex min-h-screen flex-col bg-canvas lg:flex-row">
      <aside className="relative flex flex-1 flex-col justify-between overflow-hidden border-b border-border bg-gradient-to-br from-primary via-primary to-accent px-8 py-10 text-primary-fg lg:max-w-[46%] lg:border-b-0 lg:border-r">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.18),transparent_45%)]" />
        <div className="relative z-[1] space-y-6">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-white/80">Woontegra</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-white md:text-3xl">Müvekkil Kasa Defteri</h1>
            <p className="mt-2 max-w-md text-sm leading-relaxed text-white/90">
              Hukuk büronuz için dosya bazlı avans, masraf, vekalet taksitleri ve ofis kasası — web üzerinden çok
              kullanıcılı ve onay odaklı.
            </p>
          </div>
          <ul className="max-w-md space-y-2.5 text-sm text-white/95">
            <FeatureLi>Gerçek kişi / tüzel kişi müvekkil ayrımı ve dosya akışı</FeatureLi>
            <FeatureLi>Onaylı kasa hareketleri doğrudan değişmez; düzeltme kaydı ve onay talepleri</FeatureLi>
            <FeatureLi>Vekalet taksitleri, tahsilat makbuzu ve SMM kesildi mi takibi</FeatureLi>
            <FeatureLi>Ayrı ofis kasası modülü; hesap özeti ve raporlar</FeatureLi>
            <FeatureLi>Tarih gösterimi gg.aa.yyyy · tutar formatı 3.000,00 TL</FeatureLi>
          </ul>
        </div>
        <p className="relative z-[1] mt-10 text-xs text-white/70 lg:mt-0">
          © {new Date().getFullYear()} Woontegra · SaaS sürümü geliştirme önizlemesi
        </p>
      </aside>
      <main className="flex flex-1 items-center justify-center px-4 py-10 lg:px-10">
        <div className="w-full max-w-md">
          <Outlet />
        </div>
      </main>
    </div>
  )
}

function FeatureLi({ children }: { children: ReactNode }): ReactElement {
  return (
    <li className="flex gap-2">
      <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-white/90" aria-hidden />
      <span>{children}</span>
    </li>
  )
}
