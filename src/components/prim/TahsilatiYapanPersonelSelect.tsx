import { useQuery } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useEffect } from 'react'
import { getBagliPrimPersonel, listAktifPrimPersonel } from '../../api/primPersonel'
import { useAuth } from '../../contexts/AuthContext'
import { isYoneticiRole } from '../../lib/isYonetici'
import { cn } from '../../lib/cn'
import { formControlClass, uiType } from '../../lib/uiDensity'

type Props = {
  value: string
  onChange: (personelId: string) => void
  disabled?: boolean
  className?: string
  /** Peşinat gibi zorunlu alanlarda etiket ve uyarı gösterir. */
  required?: boolean
  hint?: string
}

function ReadonlyAd(props: {
  label: string
  value: string
  className?: string
  hint?: string
}): ReactElement {
  return (
    <div>
      <label className={uiType.label}>{props.label}</label>
      <input
        type="text"
        readOnly
        disabled
        value={props.value}
        className={cn(formControlClass, 'bg-surface-muted text-ink-muted', props.className)}
      />
      {props.hint ? <p className={uiType.hint}>{props.hint}</p> : null}
    </div>
  )
}

export function TahsilatiYapanPersonelSelect(props: Props): ReactElement {
  const { value, onChange, disabled, className, required, hint } = props
  const { session } = useAuth()
  const yonetici = isYoneticiRole(session?.user.role)
  const oturumAd = session?.user.adSoyad?.trim() || session?.user.kullaniciAdi || '—'

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
  const personeller = aktifQ.data?.items ?? []

  // Bağlı prim personeli varsa otomatik seç (yönetici dahil).
  useEffect(() => {
    if (!bagliPersonel?.id || value) return
    onChange(bagliPersonel.id)
  }, [bagliPersonel?.id, value, onChange])

  const label = required ? 'Tahsilatı yapan personel *' : 'Tahsilatı yapan personel'

  if (!session?.user) {
    return (
      <div>
        <label className={uiType.label}>{label}</label>
        <p className={uiType.helper}>—</p>
      </div>
    )
  }

  const bagliEtiket = bagliPersonel
    ? `${bagliPersonel.adSoyad}${bagliPersonel.unvan ? ` · ${bagliPersonel.unvan}` : ''}`
    : null

  // Alt kullanıcı veya personel listesi yok: oturum açanın / bağlı personelin adı.
  if (!yonetici || (aktifQ.isSuccess && personeller.length === 0)) {
    return (
      <ReadonlyAd
        label={label}
        value={bagliEtiket ?? oturumAd}
        className={className}
        hint={hint}
      />
    )
  }

  return (
    <div>
      <label className={uiType.label}>{label}</label>
      <select
        className={cn(
          formControlClass,
          disabled && 'bg-surface-muted text-ink-muted',
          required && !value && 'border-amber-400',
          className
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled || aktifQ.isLoading}
      >
        <option value="">{oturumAd} (ben)</option>
        {personeller.map((p) => (
          <option key={p.id} value={p.id}>
            {p.adSoyad}
            {p.unvan ? ` · ${p.unvan}` : ''}
          </option>
        ))}
      </select>
      {hint ? <p className={uiType.hint}>{hint}</p> : null}
    </div>
  )
}
