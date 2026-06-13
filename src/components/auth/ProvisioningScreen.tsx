import type { ReactElement } from 'react'
import { PROGRAM_LOGO_SRC, WOONTEGRA_MARK_SRC } from '../../branding'
import { cn } from '../../lib/cn'

export const PROVISIONING_STEP_LABELS = [
  'Büronuz oluşturuluyor...',
  'Kullanıcı hesabınız hazırlanıyor...',
  'Veritabanı alanınız yapılandırılıyor...',
  'Güvenlik ve yetki ayarları tamamlanıyor...',
  'Müvekkil Kasa Defteri açılıyor...'
] as const

export type ProvisioningScreenProps = {
  buroAdi: string
  /** 0–4: aktif adım; tamamlananlar bundan küçük indeksler. */
  activeStepIndex: number
  /** Tüm adımlar tamam, yönlendirme öncesi mesaj */
  showSuccess: boolean
}

function StepRow(props: { label: string; state: 'done' | 'active' | 'pending' }): ReactElement {
  const { label, state } = props
  return (
    <li
      className={cn(
        'flex items-start gap-3 rounded-xl border px-3 py-2.5 text-left text-sm transition-colors',
        state === 'done' && 'border-emerald-300/60 bg-emerald-50/50 text-emerald-950',
        state === 'active' && 'border-primary/40 bg-primary-soft/90 font-semibold text-ink shadow-sm',
        state === 'pending' && 'border-slate-200/80 bg-white/40 text-ink-muted'
      )}
    >
      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center" aria-hidden>
        {state === 'done' ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-[11px] font-bold text-white">✓</span>
        ) : state === 'active' ? (
          <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-primary bg-white text-primary">
            <span className="inline-block h-2.5 w-2.5 animate-pulse rounded-full bg-primary" />
          </span>
        ) : (
          <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-slate-300 bg-white text-[10px] text-slate-400">○</span>
        )}
      </span>
      <span className="min-w-0 leading-snug">{label}</span>
    </li>
  )
}

export function ProvisioningScreen(props: ProvisioningScreenProps): ReactElement {
  const { buroAdi, activeStepIndex, showSuccess } = props
  const safeIndex = Math.min(4, Math.max(0, activeStepIndex))

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto overscroll-contain bg-slate-900/25 px-4 py-10 backdrop-blur-[2px]"
      role="dialog"
      aria-modal="true"
      aria-labelledby="provisioning-title"
      aria-busy={!showSuccess}
    >
      <div
        className="relative w-full max-w-lg animate-[fadeIn_0.35s_ease-out] rounded-2xl border border-slate-300/50 bg-white/95 p-6 shadow-2xl shadow-slate-900/15 backdrop-blur-xl sm:p-8"
        style={{
          background: 'linear-gradient(165deg, rgba(255,255,255,0.98) 0%, rgba(240,249,255,0.96) 45%, rgba(255,255,255,0.97) 100%)'
        }}
      >
        <div className="mb-6 flex flex-col items-center gap-3 border-b border-slate-200/80 pb-5">
          <img src={PROGRAM_LOGO_SRC} alt="Müvekkil Kasa Defteri" className="h-auto max-h-16 w-auto max-w-[200px] object-contain" />
          <div className="flex items-center gap-2 opacity-90">
            <img src={WOONTEGRA_MARK_SRC} alt="" className="h-4 object-contain" />
            <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-slate-500">Woontegra</span>
          </div>
        </div>

        <h2 id="provisioning-title" className="text-center text-xl font-extrabold tracking-tight text-ink sm:text-[1.35rem]">
          Büronuz hazırlanıyor
        </h2>
        <p className="mt-2 text-center text-[0.95rem] leading-relaxed text-ink-muted">
          <span className="font-semibold text-primary">{buroAdi.trim() || 'Büronuz'}</span> için güvenli çalışma alanı oluşturuluyor.
        </p>

        <div className="mx-auto mt-6 flex justify-center">
          <div
            className="h-11 w-11 rounded-full border-[3px] border-primary/25 border-t-primary animate-spin"
            style={{ animationDuration: '0.85s' }}
            aria-hidden
          />
        </div>

        <ul className="mt-6 space-y-2">
          {PROVISIONING_STEP_LABELS.map((label, i) => {
            const state: 'done' | 'active' | 'pending' = showSuccess ? 'done' : i < safeIndex ? 'done' : i === safeIndex ? 'active' : 'pending'
            return <StepRow key={label} label={label} state={state} />
          })}
        </ul>

        {showSuccess ? (
          <p className="mt-5 rounded-xl border border-emerald-400/50 bg-emerald-50/90 px-4 py-3 text-center text-sm font-semibold text-emerald-950">
            Hazır! Büro panelinize yönlendiriliyorsunuz.
          </p>
        ) : (
          <p className="mt-5 text-center text-xs font-medium text-ink-muted">Kısa süre içinde panelinize yönlendirileceksiniz.</p>
        )}
      </div>
      <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
    </div>
  )
}
