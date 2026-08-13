import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { getOnayliWhatsAppSablonlari } from '../../api/whatsappBaglanti'
import {
  getTaksitHatirlatmaPlan,
  hhmmToMinutes,
  minutesToHHmm,
  setTaksitHatirlatmaPlan,
  type BildirimPlanModu,
  type TaksitPlanKuralInput
} from '../../api/bildirimPlan'
import { friendlyClientErrorMessage } from '../../api/client'
import { APP_BASE } from '../../config/appPaths'
import { useToast } from '../../toast'
import type { BildirimKuralTuru } from '../../types/tahsilatBildirim'
import { AlertBox, Button, Input, ModalScrim } from '../ui'

const KURAL_ORDER: BildirimKuralTuru[] = ['VADEDEN_ONCE', 'VADE_GUNU', 'VADE_SONRASI']
const KURAL_LABEL: Record<BildirimKuralTuru, string> = {
  VADEDEN_ONCE: 'Vadeden önce',
  VADE_GUNU: 'Vade günü',
  VADE_SONRASI: 'Vadeden sonra'
}

const DEFAULT_RULES: TaksitPlanKuralInput[] = [
  { kuralTuru: 'VADEDEN_ONCE', aktifMi: false, gunOffset: 3, gonderimSaatiDk: 600, metaSablonId: null },
  { kuralTuru: 'VADE_GUNU', aktifMi: false, gunOffset: 0, gonderimSaatiDk: 600, metaSablonId: null },
  { kuralTuru: 'VADE_SONRASI', aktifMi: false, gunOffset: 3, gonderimSaatiDk: 600, metaSablonId: null }
]

type Props = {
  taksitId: string
  taksitNo: number
  onClose: () => void
  onSaved: () => void
}

export function TaksitHatirlatmaPlanModal(props: Props): ReactElement {
  const toast = useToast()
  const qc = useQueryClient()
  const [mode, setMode] = useState<BildirimPlanModu>('VARSAYILAN')
  const [kurallar, setKurallar] = useState<TaksitPlanKuralInput[]>(DEFAULT_RULES)

  const planQ = useQuery({
    queryKey: ['taksit-hatirlatma-plan', props.taksitId],
    queryFn: () => getTaksitHatirlatmaPlan(props.taksitId)
  })

  const onayliQ = useQuery({
    queryKey: ['onayli-meta-sablonlar', 'taksit-plan'],
    queryFn: getOnayliWhatsAppSablonlari
  })

  useEffect(() => {
    if (!planQ.data) return
    setMode(planQ.data.mode)
    if (planQ.data.kurallar.length) {
      const map = new Map(planQ.data.kurallar.map((k) => [k.kuralTuru, k]))
      setKurallar(
        KURAL_ORDER.map((t) => map.get(t) ?? DEFAULT_RULES.find((d) => d.kuralTuru === t)!)
      )
    }
  }, [planQ.data])

  const saveMu = useMutation({
    mutationFn: () =>
      setTaksitHatirlatmaPlan(props.taksitId, {
        mode,
        kurallar: mode === 'OZEL' ? kurallar : undefined
      }),
    onSuccess: () => {
      toast.success('Hatırlatma planı kaydedildi.')
      void qc.invalidateQueries({ queryKey: ['vekalet'] })
      props.onSaved()
      props.onClose()
    },
    onError: (e) => toast.error(friendlyClientErrorMessage(e))
  })

  const approved = onayliQ.data?.templates ?? []

  function updateKural(kuralTuru: BildirimKuralTuru, patch: Partial<TaksitPlanKuralInput>): void {
    setKurallar((prev) => prev.map((k) => (k.kuralTuru === kuralTuru ? { ...k, ...patch } : k)))
  }

  return (
    <ModalScrim onClose={props.onClose} innerAsDialog>
      <div className="w-full max-w-lg rounded-xl border border-border bg-white p-5 shadow-xl">
        <h2 className="text-base font-bold text-ink">Taksit {props.taksitNo} — Hatırlatma</h2>
        <p className="mt-1 text-sm text-ink-muted">Bu taksit için WhatsApp hatırlatma planını belirleyin.</p>

        <div className="mt-4 space-y-2">
          {(['VARSAYILAN', 'OZEL', 'KAPALI'] as const).map((m) => (
            <label key={m} className="flex cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
              <input type="radio" name="mode" checked={mode === m} onChange={() => setMode(m)} />
              {m === 'VARSAYILAN' ? 'Büro ayarlarını kullan' : m === 'OZEL' ? 'Özel hatırlatma' : 'Hatırlatma gönderme'}
            </label>
          ))}
        </div>

        {mode === 'OZEL' ? (
          <div className="mt-4 space-y-3">
            {kurallar.map((k) => (
              <div key={k.kuralTuru} className="rounded-lg border border-border p-3">
                <label className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <input
                    type="checkbox"
                    checked={k.aktifMi}
                    onChange={(e) => updateKural(k.kuralTuru, { aktifMi: e.target.checked })}
                  />
                  {KURAL_LABEL[k.kuralTuru]}
                </label>
                {k.aktifMi ? (
                  <div className="mt-2 grid gap-2 sm:grid-cols-2">
                    {k.kuralTuru !== 'VADE_GUNU' ? (
                      <Input
                        label="Gün"
                        type="number"
                        min={1}
                        value={String(k.gunOffset)}
                        onChange={(e) => updateKural(k.kuralTuru, { gunOffset: Number(e.target.value) || 1 })}
                      />
                    ) : null}
                    <Input
                      label="Gönderim saati"
                      value={minutesToHHmm(k.gonderimSaatiDk)}
                      onChange={(e) =>
                        updateKural(k.kuralTuru, { gonderimSaatiDk: hhmmToMinutes(e.target.value) })
                      }
                    />
                    <div className="sm:col-span-2">
                      <label className="text-xs font-semibold text-ink-muted">WhatsApp şablonu</label>
                      {approved.length === 0 ? (
                        <p className="mt-1 text-xs text-ink-muted">
                          Onaylı şablon yok.{' '}
                          <Link to={`${APP_BASE}/ayarlar?bolum=whatsapp-sablonlari`} className="text-primary hover:underline">
                            Şablonlara Git
                          </Link>
                        </p>
                      ) : (
                        <select
                          className="mt-1 w-full rounded-md border border-border px-2 py-1.5 text-sm"
                          value={k.metaSablonId ?? ''}
                          onChange={(e) =>
                            updateKural(k.kuralTuru, { metaSablonId: e.target.value || null })
                          }
                        >
                          <option value="">Seçilmedi</option>
                          {approved.map((t) => (
                            <option key={t.id} value={t.id}>
                              {t.metaName}
                            </option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {planQ.isError ? (
          <AlertBox variant="warning" className="mt-3">
            {friendlyClientErrorMessage(planQ.error)}
          </AlertBox>
        ) : null}

        <div className="mt-5 flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={props.onClose}>
            Vazgeç
          </Button>
          <Button type="button" size="sm" disabled={saveMu.isPending} onClick={() => saveMu.mutate()}>
            {saveMu.isPending ? 'Kaydediliyor…' : 'Kaydet'}
          </Button>
        </div>
      </div>
    </ModalScrim>
  )
}
