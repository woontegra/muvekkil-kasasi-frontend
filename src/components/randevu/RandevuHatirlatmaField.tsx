import { useQuery } from '@tanstack/react-query'
import { useEffect, useState, type ReactElement } from 'react'
import { getRandevuHatirlatmaPlan } from '../../api/bildirimPlan'
import type { BildirimPlanModu } from '../../api/bildirimPlan'
import { RandevuFormField } from './RandevuModalChrome'

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
        <p className="text-xs text-ink-muted">Müvekkil seçildiğinde hatırlatma planı ayarlanabilir.</p>
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
        className="w-full rounded-md border border-border px-3 py-2 text-sm"
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
        <div className="mt-2 space-y-2 rounded-md border border-border/70 bg-surface-muted/20 p-3">
          {PRESETS.map((p) => {
            const active = value.kurallar?.find((k) => k.offsetDk === p.offsetDk)?.aktifMi ?? false
            return (
              <label key={p.offsetDk} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => togglePreset(p.offsetDk, p.ruleKey, e.target.checked)}
                />
                {p.label}
              </label>
            )
          })}
          <div className="flex flex-wrap items-end gap-2 border-t border-border/60 pt-2">
            <label className="text-xs text-ink-muted">
              Özel zaman
              <div className="mt-1 flex gap-1">
                <input
                  type="number"
                  min={1}
                  className="w-16 rounded border border-border px-2 py-1 text-sm"
                  value={customDk}
                  onChange={(e) => setCustomDk(e.target.value)}
                />
                <select
                  className="rounded border border-border px-2 py-1 text-sm"
                  value={customUnit}
                  onChange={(e) => setCustomUnit(e.target.value as 'dk' | 'saat' | 'gun')}
                >
                  <option value="dk">dk</option>
                  <option value="saat">saat</option>
                  <option value="gun">gün</option>
                </select>
              </div>
            </label>
            <button type="button" className="text-xs font-semibold text-primary hover:underline" onClick={addCustom}>
              Ekle
            </button>
          </div>
          {(value.kurallar ?? []).filter((k) => k.aktifMi && k.ruleKey === 'CUSTOM').length > 0 ? (
            <p className="text-[10px] text-ink-muted">
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
        <p className="mt-1 text-[10px] text-ink-muted">Ayarlar → WhatsApp → Randevu Hatırlatmaları uygulanır.</p>
      ) : null}
    </RandevuFormField>
  )
}
