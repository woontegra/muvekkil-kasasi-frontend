import { useQuery } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useEffect } from 'react'
import { getBagliPrimPersonel, listAktifPrimPersonel } from '../../api/primPersonel'
import { useAuth } from '../../contexts/AuthContext'
import { isYoneticiRole } from '../../lib/isYonetici'
import { cn } from '../../lib/cn'

type Props = {
  value: string
  onChange: (personelId: string) => void
  disabled?: boolean
  className?: string
  /** Peşinat gibi zorunlu alanlarda etiket ve uyarı gösterir. */
  required?: boolean
  hint?: string
}

export function TahsilatiYapanPersonelSelect(props: Props): ReactElement {
  const { value, onChange, disabled, className, required, hint } = props
  const { session } = useAuth()
  const yonetici = isYoneticiRole(session?.user.role)

  const aktifQ = useQuery({
    queryKey: ['prim-personel', 'aktif'],
    queryFn: listAktifPrimPersonel,
    enabled: yonetici
  })

  const bagliQ = useQuery({
    queryKey: ['prim-personel', 'bagli-ben'],
    queryFn: getBagliPrimPersonel,
    enabled: Boolean(session?.user)
  })

  const bagliPersonel = bagliQ.data?.personel ?? null

  useEffect(() => {
    if (!bagliPersonel?.id || value) return
    if (!yonetici) {
      onChange(bagliPersonel.id)
    }
  }, [bagliPersonel?.id, value, yonetici, onChange])

  const locked = !yonetici || disabled
  const label = required ? 'Tahsilatı yapan personel *' : 'Tahsilatı yapan personel'

  if (!session?.user) {
    return (
      <div>
        <label className="mb-1 block text-xs font-semibold text-ink-muted">{label}</label>
        <p className="text-xs text-ink-muted">—</p>
      </div>
    )
  }

  if (!yonetici) {
    return (
      <div>
        <label className="mb-1 block text-xs font-semibold text-ink-muted">{label}</label>
        <input
          type="text"
          readOnly
          disabled
          value={
            bagliPersonel
              ? `${bagliPersonel.adSoyad}${bagliPersonel.unvan ? ` · ${bagliPersonel.unvan}` : ''}`
              : 'Bağlı personel tanımlı değil'
          }
          className={cn(
            'h-9 w-full rounded-md border border-border bg-surface-muted px-3 text-sm text-ink-muted',
            className
          )}
        />
        {required && !bagliPersonel ? (
          <p className="mt-1 text-xs text-danger">Peşinat için bağlı prim personeli zorunludur.</p>
        ) : null}
        {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
      </div>
    )
  }

  const personeller = aktifQ.data?.items ?? []

  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-ink-muted">{label}</label>
      <select
        className={cn(
          'h-9 w-full rounded-md border bg-white px-3 text-sm text-ink shadow-inner outline-none transition',
          'border-border focus:border-primary focus:ring-2 focus:ring-primary/15',
          locked && 'bg-surface-muted text-ink-muted',
          required && !value && 'border-amber-400',
          className
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={locked || aktifQ.isLoading}
      >
        <option value="">Seçin…</option>
        {personeller.length === 0 ? (
          <option value="" disabled>
            Aktif personel yok
          </option>
        ) : (
          personeller.map((p) => (
            <option key={p.id} value={p.id}>
              {p.adSoyad}
              {p.unvan ? ` · ${p.unvan}` : ''}
            </option>
          ))
        )}
      </select>
      {required && !value ? (
        <p className="mt-1 text-xs text-amber-700">Peşinat için tahsilatı yapan personel zorunludur.</p>
      ) : null}
      {hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </div>
  )
}
