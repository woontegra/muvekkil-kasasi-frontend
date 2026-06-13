import type { ReactElement } from 'react'
import { Outlet } from 'react-router-dom'
import { PROGRAM_LOGO_SRC, WOONTEGRA_MARK_SRC } from '../branding'

const FEATURES: { label: string; letter: string }[] = [
  { letter: 'M', label: 'Müvekkil ve dosya takibi' },
  { letter: 'A', label: 'Avans ve masraf kontrolü' },
  { letter: 'V', label: 'Vekalet taksit yönetimi' },
  { letter: 'H', label: 'Makbuz ve hesap özeti' }
]

export function PublicAuthLayout(): ReactElement {
  return (
    <div className="relative min-h-screen min-h-[100dvh] text-ink">
      <h1 id="auth-hero-title" className="sr-only">
        Müvekkil Kasa Defteri
      </h1>

      {/* Masaüstü auth ile aynı: açık mavi zemin, grid, yumuşak lekeler */}
      <div className="pointer-events-none fixed inset-0 z-0" aria-hidden>
        <div
          className="absolute inset-0"
          style={{
            background:
              'radial-gradient(120% 80% at 10% 15%, rgba(37, 99, 235, 0.16) 0%, transparent 55%), radial-gradient(90% 70% at 92% 8%, rgba(8, 145, 178, 0.14) 0%, transparent 50%), radial-gradient(70% 50% at 50% 100%, rgba(245, 158, 11, 0.08) 0%, transparent 45%), linear-gradient(165deg, #f4f8ff 0%, #e8f0fc 38%, #e0ebfa 100%)'
          }}
        />
        <div
          className="absolute inset-0 opacity-[0.055] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_45%,black_15%,transparent_72%)]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(15, 23, 42, 0.35) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.35) 1px, transparent 1px)',
            backgroundSize: '28px 28px'
          }}
        />
        <div className="absolute -left-20 top-[18%] h-[280px] w-[280px] rounded-full bg-[#3b82f6] opacity-55 blur-[52px]" />
        <div className="absolute -right-10 bottom-[12%] h-[220px] w-[220px] rounded-full bg-[#06b6d4] opacity-55 blur-[52px]" />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen max-w-[1080px] grid-cols-1 content-start gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(320px,0.95fr)] lg:content-center lg:gap-x-10 lg:gap-y-8 lg:py-12 xl:max-w-[1120px]">
        <section className="flex min-h-0 flex-col pt-1 lg:max-w-xl lg:justify-center" aria-labelledby="auth-hero-title">
          <div className="mb-5 inline-flex w-max max-w-full items-center gap-2 rounded-full border border-cyan-600/25 bg-white/60 px-3 py-1.5 text-[0.68rem] font-bold uppercase tracking-[0.12em] text-cyan-800 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-sm">
            <span className="flex text-primary" aria-hidden>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
              </svg>
            </span>
            Web SaaS · Bulut tabanlı ofis sürümü
          </div>

          <div className="mb-5">
            <img src={PROGRAM_LOGO_SRC} alt="" className="block h-auto max-h-[7.5rem] w-auto max-w-[min(220px,88vw)] object-contain object-left" />
          </div>

          <p className="mb-6 max-w-[38ch] text-[0.98rem] leading-relaxed text-ink-muted">
            Dosya bazlı avans, masraf ve vekalet takibini düzenli yönetin. Çok kullanıcılı büro hesabı; kasa hareketleri için onay ve düzeltme
            akışı.
          </p>

          <ul className="flex flex-col gap-3">
            {FEATURES.map((f) => (
              <li
                key={f.label}
                className="flex items-center gap-3 rounded-[10px] border border-slate-400/35 bg-white/45 px-3 py-2.5 text-[0.88rem] font-semibold text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] backdrop-blur-md"
              >
                <span
                  className="flex h-[30px] w-[30px] flex-shrink-0 items-center justify-center rounded-lg text-[0.72rem] font-extrabold text-white shadow-md"
                  style={{
                    background: 'linear-gradient(135deg, #2563eb 0%, #0e7490 100%)',
                    boxShadow: '0 2px 8px rgba(37, 99, 235, 0.3)'
                  }}
                  aria-hidden
                >
                  {f.letter}
                </span>
                <span>{f.label}</span>
              </li>
            ))}
          </ul>

          <div className="mt-10 flex flex-wrap items-center gap-2.5 border-t border-slate-400/30 pt-4 lg:mt-auto">
            <img src={WOONTEGRA_MARK_SRC} alt="Woontegra" className="h-[22px] max-w-[148px] shrink-0 object-contain opacity-90" />
            <span className="text-[0.72rem] font-medium leading-snug tracking-wide text-ink-muted">tarafından geliştirildi</span>
          </div>
        </section>

        <div className="flex min-h-0 justify-center lg:items-center lg:justify-center lg:pt-2">
          <Outlet />
        </div>
      </div>
    </div>
  )
}
