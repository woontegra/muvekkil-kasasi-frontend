import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getRandevuBildirimAyarlar,
  updateRandevuBildirimAyarlar
} from '../../../api/bildirimPlan'
import { getOnayliWhatsAppSablonlari } from '../../../api/whatsappBaglanti'
import { friendlyClientErrorMessage } from '../../../api/client'
import { APP_BASE } from '../../../config/appPaths'
import { useAuth } from '../../../contexts/AuthContext'
import { isYoneticiRole } from '../../../lib/isYonetici'
import { useToast } from '../../../toast'
import { Badge, Button } from '../../ui'
import { AyarlarPanelShell } from '../shared'

export function WhatsappRandevuHatirlatmalariPanel(): ReactElement | null {
  const { session } = useAuth()
  const canManage = isYoneticiRole(session?.user.role)
  const toast = useToast()
  const qc = useQueryClient()

  const ayarQ = useQuery({
    queryKey: ['randevu-bildirim-ayarlar'],
    queryFn: getRandevuBildirimAyarlar,
    enabled: canManage
  })

  const onayliQ = useQuery({
    queryKey: ['onayli-meta-sablonlar', 'randevu'],
    queryFn: getOnayliWhatsAppSablonlari,
    enabled: canManage
  })

  const [otomasyonAktif, setOtomasyonAktif] = useState(false)
  const [kurallar, setKurallar] = useState<
    Array<{ offsetDk: number; aktifMi: boolean; metaSablonId: string | null; label: string }>
  >([])

  useEffect(() => {
    if (!ayarQ.data) return
    setOtomasyonAktif(ayarQ.data.otomasyonAktif)
    setKurallar(ayarQ.data.varsayilanKurallar)
  }, [ayarQ.data])

  const saveMu = useMutation({
    mutationFn: () =>
      updateRandevuBildirimAyarlar({
        otomasyonAktif,
        varsayilanKurallar: kurallar.map((k) => ({
          offsetDk: k.offsetDk,
          aktifMi: k.aktifMi,
          metaSablonId: k.metaSablonId
        }))
      }),
    onSuccess: () => {
      toast.success('Randevu hatırlatma ayarları kaydedildi.')
      void qc.invalidateQueries({ queryKey: ['randevu-bildirim-ayarlar'] })
    },
    onError: (e) => toast.error(friendlyClientErrorMessage(e))
  })

  if (!canManage) return null

  const approvedAll = onayliQ.data?.templates ?? []
  const approved = approvedAll.filter(
    (t) =>
      t.libraryKey === 'RANDEVU_HATIRLATMA' ||
      t.usageArea === 'RANDEVU_HATIRLATMA' ||
      t.metaName.toLowerCase().includes('randevu')
  )

  return (
    <AyarlarPanelShell
      title="Randevu Hatırlatmaları"
      description="Büro genel randevu WhatsApp hatırlatma varsayılanları. Tekil randevularda özelleştirilebilir."
    >
      <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-semibold text-ink">Otomatik randevu hatırlatmaları</p>
            <p className="mt-1 text-sm text-ink-muted">Müvekkile bağlı randevular için varsayılan hatırlatmalar.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={otomasyonAktif ? 'success' : 'default'} className="normal-case tracking-normal">
              {otomasyonAktif ? 'Açık' : 'Kapalı'}
            </Badge>
            <Button
              type="button"
              size="sm"
              variant={otomasyonAktif ? 'outline' : 'primary'}
              onClick={() => setOtomasyonAktif(!otomasyonAktif)}
            >
              {otomasyonAktif ? 'Kapat' : 'Aç'}
            </Button>
          </div>
        </div>

        <div className="mt-4 space-y-2">
          {kurallar.map((k) => (
            <label
              key={k.offsetDk}
              className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/70 px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={k.aktifMi}
                  onChange={(e) =>
                    setKurallar((prev) =>
                      prev.map((r) => (r.offsetDk === k.offsetDk ? { ...r, aktifMi: e.target.checked } : r))
                    )
                  }
                />
                {k.label}
              </span>
              <select
                className="rounded-md border border-border px-2 py-1 text-xs"
                value={k.metaSablonId ?? ''}
                onChange={(e) =>
                  setKurallar((prev) =>
                    prev.map((r) =>
                      r.offsetDk === k.offsetDk ? { ...r, metaSablonId: e.target.value || null } : r
                    )
                  )
                }
              >
                <option value="">Şablon seç</option>
                {(approved.length ? approved : approvedAll).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.metaName}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </div>

        {approvedAll.length === 0 ? (
          <p className="mt-2 text-xs text-ink-muted">
            Onaylı randevu şablonu yok.{' '}
            <Link to={`${APP_BASE}/ayarlar?bolum=whatsapp-sablonlari`} className="text-primary hover:underline">
              Şablonlara Git
            </Link>
          </p>
        ) : null}

        <div className="mt-4">
          <Button type="button" size="sm" disabled={saveMu.isPending} onClick={() => saveMu.mutate()}>
            {saveMu.isPending ? 'Kaydediliyor…' : 'Kaydet'}
          </Button>
        </div>
      </div>
    </AyarlarPanelShell>
  )
}
