import { useQuery } from '@tanstack/react-query'
import { useEffect, useState, type ReactElement } from 'react'
import { getRandevuHatirlatmaPlan } from '../../api/bildirimPlan'
import type { BildirimPlanModu } from '../../api/bildirimPlan'
import { formControlClass, uiType } from '../../lib/uiDensity'
import { RandevuFormField, randevuFormSelectClass } from './RandevuModalChrome'

const PRESETS = [
  { ruleKey: 'OFFSET_30', offsetDk: 30, label: '30 dk önce' },
  { ruleKey: 'OFFSET_60', offsetDk: 60, label: '1 saat önce' },
  { ruleKey: 'OFFSET_120', offsetDk: 120, label: '2 saat önce' },
  { ruleKey: 'OFFSET_1440', offsetDk: 1440, label: '1 gün önce' }
] as const

export type RandevuHatirlatmaPlanInput = {
  mode: BildirimPlanModu
  kurallar?: Array<{ ruleKey: string; aktifMi: boolean; offsetDk: number; metaSablonId: string | null }>
}

type Props = {
  muvekkilSecili: boolean
  randevuId?: string
  value: RandevuHatirlatmaPlanInput
  onChange: (next: RandevuHatirlatmaPlanInput) => void
}

export function RandevuHatirlatmaField({ muvekkilSecili, randevuId, value, onChange }: Props): ReactElement {
  const [customDk, setCustomDk] = useState('120')
  const [customUnit, setCustomUnit] = useState<'dk' | 'saat' | 'gun'>('dk')

  const planQ = useQuery({
    queryKey: ['randevu-hatirlatma-plan', randevuId],
    queryFn: () => getRandevuHatirlatmaPlan(randevuId!),
    enabled: Boolean(randevuId)
  })

  useEffect(() => {
    if (!planQ.data) return
    onChange({
      mode: planQ.data.mode,
      kurallar: planQ.data.kurallar.map((k) => ({
        ruleKey: k.ruleKey,
        aktifMi: k.aktifMi,
        offsetDk: k.offsetDk,
        metaSablonId: k.metaSablonId
      }))
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps -- yalnızca ilk yükleme
  }, [planQ.data?.mode])

  if (!muvekkilSecili) {
    return (
      <RandevuFormField label="WhatsApp Hatırlatması">
        <p className={uiType.helper}>Müvekkil seçildiğinde hatırlatma planı ayarlanabilir.</p>
      </RandevuFormField>
    )
  }

  function presetKurallar(): Array<{
    ruleKey: string
    aktifMi: boolean
    offsetDk: number
    metaSablonId: string | null
  }> {
    return PRESETS.map((p) => {
      const existing = value.kurallar?.find((k) => k.offsetDk === p.offsetDk)
      return {
        ruleKey: p.ruleKey,
        aktifMi: existing?.aktifMi ?? false,
        offsetDk: p.offsetDk,
        metaSablonId: existing?.metaSablonId ?? null
      }
    })
  }

  function togglePreset(offsetDk: number, ruleKey: string, checked: boolean): void {
    const base = presetKurallar()
    onChange({
      mode: 'OZEL',
      kurallar: base.map((k) => (k.offsetDk === offsetDk ? { ...k, aktifMi: checked, ruleKey } : k))
    })
  }

  function addCustom(): void {
    const n = Number(customDk)
    if (!Number.isFinite(n) || n < 1) return
    const mult = customUnit === 'gun' ? 1440 : customUnit === 'saat' ? 60 : 1
    const offsetDk = Math.round(n * mult)
    const existing = value.kurallar ?? []
    if (existing.some((k) => k.offsetDk === offsetDk)) return
    onChange({
      mode: 'OZEL',
      kurallar: [
        ...presetKurallar().filter((k) => existing.some((e) => e.offsetDk === k.offsetDk && e.aktifMi) || k.aktifMi),
        { ruleKey: 'CUSTOM', aktifMi: true, offsetDk, metaSablonId: null }
      ]
    })
  }

  return (
    <RandevuFormField label="WhatsApp Hatırlatması">
      <select
        className={randevuFormSelectClass}
        value={value.mode}
        onChange={(e) => {
          const mode = e.target.value as BildirimPlanModu
          if (mode === 'OZEL') {
            onChange({ mode, kurallar: presetKurallar() })
          } else {
            onChange({ mode })
          }
        }}
      >
        <option value="VARSAYILAN">Büro ayarlarını kullan</option>
        <option value="OZEL">Özel hatırlatma</option>
        <option value="KAPALI">Hatırlatma gönderme</option>
      </select>

      {value.mode === 'OZEL' ? (
        <div className="mt-1.5 space-y-1.5 rounded-md border border-border/70 bg-surface-muted/20 px-2.5 py-2">
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-4">
            {PRESETS.map((p) => {
              const active = value.kurallar?.find((k) => k.offsetDk === p.offsetDk)?.aktifMi ?? false
              return (
                <label key={p.offsetDk} className="inline-flex items-center gap-1.5">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => togglePreset(p.offsetDk, p.ruleKey, e.target.checked)}
                  />
                  <span className={uiType.helper}>{p.label}</span>
                </label>
              )
            })}
          </div>
          <div className="flex flex-wrap items-center gap-2 border-t border-border/60 pt-1.5">
            <span className={uiType.helper}>Özel</span>
            <input
              type="number"
              min={1}
              className={`${formControlClass} !h-7 w-14`}
              value={customDk}
              onChange={(e) => setCustomDk(e.target.value)}
              aria-label="Özel hatırlatma süresi"
            />
            <select
              className={`${formControlClass} !h-7 w-auto`}
              value={customUnit}
              onChange={(e) => setCustomUnit(e.target.value as 'dk' | 'saat' | 'gun')}
              aria-label="Özel hatırlatma birimi"
            >
              <option value="dk">dk</option>
              <option value="saat">saat</option>
              <option value="gun">gün</option>
            </select>
            <button type="button" className="text-[10px] font-semibold text-primary hover:underline" onClick={addCustom}>
              Ekle
            </button>
          </div>
          {(value.kurallar ?? []).filter((k) => k.aktifMi && k.ruleKey === 'CUSTOM').length > 0 ? (
            <p className={uiType.helper}>
              Özel:{' '}
              {(value.kurallar ?? [])
                .filter((k) => k.aktifMi && k.ruleKey === 'CUSTOM')
                .map((k) => `${k.offsetDk} dk önce`)
                .join(', ')}
            </p>
          ) : null}
        </div>
      ) : null}

      {value.mode === 'VARSAYILAN' ? (
        <p className={`mt-1 ${uiType.helper}`}>Ayarlar → WhatsApp → Randevu Hatırlatmaları uygulanır.</p>
      ) : null}
    </RandevuFormField>
  )
}
