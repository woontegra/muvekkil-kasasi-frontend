import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactElement, ReactNode } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  assignTahsilatBildirimKuralMetaSablon,
  getTahsilatBildirimAyarlar,
  invalidateTahsilatBildirim,
  planlaTahsilatBildirimleri,
  TAHSILAT_BILDIRIM_QUERY_KEY,
  updateTahsilatBildirimAyarlar,
  updateTahsilatBildirimKural
} from '../../../api/tahsilatBildirim'
import { getOnayliWhatsAppSablonlari } from '../../../api/whatsappBaglanti'
import { friendlyClientErrorMessage } from '../../../api/client'
import { APP_BASE } from '../../../config/appPaths'
import { useAuth } from '../../../contexts/AuthContext'
import { isYoneticiRole } from '../../../lib/isYonetici'
import { useToast } from '../../../toast'
import type { BildirimKuralTuru, TahsilatBildirimKuraliDto } from '../../../types/tahsilatBildirim'
import { bildirimKuralTuruLabel } from '../../../types/tahsilatBildirim'
import { AlertBox, Badge, Button, Input, useConfirm } from '../../ui'
import { AyarlarPanelShell } from '../shared'

const SABLONLAR_PATH = `${APP_BASE}/ayarlar?bolum=whatsapp-sablonlari`

const KURAL_LIBRARY_KEYS: Record<BildirimKuralTuru, readonly string[]> = {
  VADEDEN_ONCE: ['TAHSILAT_VADE_ONCESI'],
  VADE_GUNU: ['TAHSILAT_VADE_GUNU'],
  VADE_SONRASI: ['TAHSILAT_GECIKMIS']
}

function minutesToHHmm(dk: number): string {
  const clamped = Math.max(0, Math.min(1439, Math.floor(dk)))
  const hh = String(Math.floor(clamped / 60)).padStart(2, '0')
  const mm = String(clamped % 60).padStart(2, '0')
  return `${hh}:${mm}`
}

function hhmmToMinutes(value: string): number | null {
  const m = /^(\d{1,2}):(\d{2})$/.exec(value.trim())
  if (!m) return null
  const h = Number(m[1])
  const min = Number(m[2])
  if (!Number.isFinite(h) || !Number.isFinite(min) || h < 0 || h > 23 || min < 0 || min > 59) return null
  return h * 60 + min
}

const KURAL_ORDER: BildirimKuralTuru[] = ['VADEDEN_ONCE', 'VADE_GUNU', 'VADE_SONRASI']

const KURAL_ACCORDION_TITLE: Record<BildirimKuralTuru, string> = {
  VADEDEN_ONCE: 'Vadesinden önce',
  VADE_GUNU: 'Vade günü',
  VADE_SONRASI: 'Vadesinden sonra'
}

type RuleDraft = {
  aktifMi: boolean
  gunOffset: number
  gonderimSaati: string
}

type OnayliSablon = {
  id: string
  libraryKey: string | null
  metaName: string
  language: string
  statusLabel: string
}

function kuralGunAlani(kuralTuru: BildirimKuralTuru): {
  showInput: boolean
  label?: string
  hint: string
} {
  if (kuralTuru === 'VADEDEN_ONCE') {
    return {
      showInput: true,
      label: 'Vade tarihinden kaç gün önce gönderilsin?',
      hint: 'Örneğin 3 yazarsanız mesaj, taksit vadesinden 3 gün önce hazırlanır.'
    }
  }
  if (kuralTuru === 'VADE_SONRASI') {
    return {
      showInput: true,
      label: 'Vade tarihinden kaç gün sonra gönderilsin?',
      hint: 'Örneğin 3 yazarsanız mesaj, taksit 3 gün geciktiğinde hazırlanır.'
    }
  }
  return {
    showInput: false,
    hint: 'Mesaj vade günü gönderilir.'
  }
}

function sablonlarForKural(templates: OnayliSablon[], kuralTuru: BildirimKuralTuru): OnayliSablon[] {
  const allowed = new Set(KURAL_LIBRARY_KEYS[kuralTuru])
  return templates.filter((t) => t.libraryKey != null && allowed.has(t.libraryKey))
}

function AccordionSection(props: {
  title: string
  subtitle?: string
  open: boolean
  onToggle: () => void
  children: ReactNode
}): ReactElement {
  return (
    <div className="rounded-lg border border-border bg-white shadow-sm">
      <button
        type="button"
        className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
        onClick={props.onToggle}
      >
        <div>
          <p className="text-sm font-semibold text-ink">{props.title}</p>
          {props.subtitle ? <p className="mt-0.5 text-xs text-ink-muted">{props.subtitle}</p> : null}
        </div>
        <span className="shrink-0 text-xs text-ink-muted">{props.open ? '▲' : '▼'}</span>
      </button>
      {props.open ? <div className="space-y-3 border-t border-border px-4 py-4">{props.children}</div> : null}
    </div>
  )
}

export function WhatsappHatirlatmalariPanel(): ReactElement | null {
  const { session } = useAuth()
  const isYonetici = isYoneticiRole(session?.user.role)
  const toast = useToast()
  const { confirm } = useConfirm()
  const qc = useQueryClient()

  const ayarlarQ = useQuery({
    queryKey: [...TAHSILAT_BILDIRIM_QUERY_KEY, 'ayarlar'],
    queryFn: getTahsilatBildirimAyarlar,
    enabled: isYonetici,
    staleTime: 30_000
  })

  const onayliSablonQ = useQuery({
    queryKey: [...TAHSILAT_BILDIRIM_QUERY_KEY, 'onayli-meta-sablonlar'],
    queryFn: getOnayliWhatsAppSablonlari,
    enabled: isYonetici,
    staleTime: 30_000
  })

  const assignMetaMu = useMutation({
    mutationFn: (input: { kuralId: string; metaSablonId: string | null }) =>
      assignTahsilatBildirimKuralMetaSablon(input.kuralId, input.metaSablonId),
    onSuccess: () => {
      invalidateTahsilatBildirim(qc)
      toast.success('Otomasyon şablonu güncellendi.')
    },
    onError: (err) => {
      toast.error(friendlyClientErrorMessage(err, 'Şablon atanamadı.'))
    }
  })

  const [otomasyonAktif, setOtomasyonAktif] = useState(false)
  const [izinliBas, setIzinliBas] = useState('10:00')
  const [izinliBit, setIzinliBit] = useState('20:00')
  const [ruleDrafts, setRuleDrafts] = useState<Record<string, RuleDraft>>({})
  const [openAccordions, setOpenAccordions] = useState<Record<BildirimKuralTuru, boolean>>({
    VADEDEN_ONCE: true,
    VADE_GUNU: false,
    VADE_SONRASI: false
  })
  const hydratedAyarUpdatedAtRef = useRef<string | null>(null)
  const dirtyRef = useRef(false)

  useEffect(() => {
    const data = ayarlarQ.data
    if (!data) return
    const stamp = `${data.ayar.updatedAt}|${data.kurallar.map((k) => `${k.id}:${k.updatedAt}`).join(',')}`
    if (hydratedAyarUpdatedAtRef.current === stamp) return
    if (dirtyRef.current && hydratedAyarUpdatedAtRef.current != null) return
    hydratedAyarUpdatedAtRef.current = stamp
    dirtyRef.current = false
    setOtomasyonAktif(data.ayar.otomasyonAktif)
    setIzinliBas(minutesToHHmm(data.ayar.izinliSaatBaslangic))
    setIzinliBit(minutesToHHmm(data.ayar.izinliSaatBitis))
    const rd: Record<string, RuleDraft> = {}
    for (const k of data.kurallar) {
      rd[k.id] = {
        aktifMi: k.aktifMi,
        gunOffset: k.kuralTuru === 'VADE_GUNU' ? 0 : k.gunOffset,
        gonderimSaati: minutesToHHmm(k.gonderimSaatiDk)
      }
    }
    setRuleDrafts(rd)
  }, [ayarlarQ.data])

  const kurallarSirali = useMemo(() => {
    const list = ayarlarQ.data?.kurallar ?? []
    return [...list].sort((a, b) => KURAL_ORDER.indexOf(a.kuralTuru) - KURAL_ORDER.indexOf(b.kuralTuru))
  }, [ayarlarQ.data?.kurallar])

  const onayliSablonlar = useMemo(
    () => (onayliSablonQ.data?.templates ?? []) as OnayliSablon[],
    [onayliSablonQ.data?.templates]
  )

  const saveMu = useMutation({
    mutationFn: async () => {
      const basDk = hhmmToMinutes(izinliBas)
      const bitDk = hhmmToMinutes(izinliBit)
      if (basDk == null || bitDk == null) {
        throw new Error('Mesaj saat aralığı SS:dd formatında olmalıdır.')
      }
      if (basDk >= bitDk) {
        throw new Error('Başlangıç saati, bitiş saatinden önce olmalıdır.')
      }

      await updateTahsilatBildirimAyarlar({
        otomasyonAktif,
        izinliSaatBaslangic: basDk,
        izinliSaatBitis: bitDk
      })

      const rules = ayarlarQ.data?.kurallar ?? []
      for (const k of rules) {
        const d = ruleDrafts[k.id]
        if (!d) continue
        const gonderimSaatiDk = hhmmToMinutes(d.gonderimSaati)
        if (gonderimSaatiDk == null) {
          throw new Error(`${bildirimKuralTuruLabel(k.kuralTuru)} için mesaj saati geçersiz.`)
        }
        await updateTahsilatBildirimKural(k.id, {
          aktifMi: d.aktifMi,
          gunOffset: k.kuralTuru === 'VADE_GUNU' ? 0 : d.gunOffset,
          gonderimSaatiDk
        })
      }
    },
    onSuccess: () => {
      dirtyRef.current = false
      hydratedAyarUpdatedAtRef.current = null
      invalidateTahsilatBildirim(qc)
      toast.success('Bildirim ayarları kaydedildi.')
    },
    onError: (err) => {
      toast.error(friendlyClientErrorMessage(err, 'Bildirim ayarları kaydedilemedi.'))
    }
  })

  const planlaMu = useMutation({
    mutationFn: planlaTahsilatBildirimleri,
    onSuccess: (res) => {
      invalidateTahsilatBildirim(qc)
      if (res.result.skipped) {
        toast.info(res.result.reason ?? 'Planlama atlandı.')
      } else {
        toast.success(`Planlama tamamlandı. Yeni: ${res.result.created}, iptal: ${res.result.cancelled}.`)
      }
    },
    onError: (err) => {
      toast.error(friendlyClientErrorMessage(err, 'Planlama çalıştırılamadı.'))
    }
  })

  if (!isYonetici) return null

  const markDirty = (): void => {
    dirtyRef.current = true
  }

  const updateRule = (id: string, patch: Partial<RuleDraft>): void => {
    markDirty()
    setRuleDrafts((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { aktifMi: false, gunOffset: 0, gonderimSaati: '10:00' }), ...patch }
    }))
  }

  const handleOtomasyonToggle = async (next: boolean): Promise<void> => {
    if (next && !otomasyonAktif) {
      const ok = await confirm({
        title: 'Otomatik hatırlatmaları açmak istiyor musunuz?',
        message:
          'Açıldığında sistem, kurallara göre tahsilat hatırlatmalarını planlar. Onaylı WhatsApp şablonu seçili kurallar Cloud üzerinden gönderilir.',
        confirmLabel: 'Hatırlatmaları aç',
        cancelLabel: 'Vazgeç'
      })
      if (!ok) return
    }
    markDirty()
    setOtomasyonAktif(next)
  }

  const handleKaydet = async (): Promise<void> => {
    if (otomasyonAktif && !ayarlarQ.data?.ayar.otomasyonAktif) {
      const ok = await confirm({
        title: 'Ayarları kaydetmek istiyor musunuz?',
        message: 'Otomatik hatırlatmalar açık olarak kaydedilecek. Kural zamanlamaları da birlikte güncellenir.',
        confirmLabel: 'Kaydet ve aç',
        cancelLabel: 'Vazgeç'
      })
      if (!ok) return
    }
    saveMu.mutate()
  }

  return (
    <AyarlarPanelShell
      title="Otomatik WhatsApp Hatırlatmaları"
      description="Vekalet taksitleri için otomatik hatırlatma kurallarını ve onaylı WhatsApp şablonlarını yönetin."
    >
      {ayarlarQ.isLoading ? <p className="text-sm text-ink-muted">Ayarlar yükleniyor…</p> : null}
      {ayarlarQ.isError ? (
        <AlertBox variant="warning" title="Ayarlar yüklenemedi">
          {friendlyClientErrorMessage(ayarlarQ.error, 'Bildirim ayarları alınamadı.')}
        </AlertBox>
      ) : null}

      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">Otomasyon</p>
              <p className="mt-1 text-sm text-ink-muted">
                Vekalet taksitleri için kurallara göre hatırlatma planlaması yapılır.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={otomasyonAktif ? 'success' : 'default'} className="normal-case tracking-normal">
                {otomasyonAktif ? 'Açık' : 'Kapalı'}
              </Badge>
              <Button
                type="button"
                size="sm"
                variant={otomasyonAktif ? 'outline' : 'primary'}
                disabled={saveMu.isPending || ayarlarQ.isLoading}
                onClick={() => void handleOtomasyonToggle(!otomasyonAktif)}
              >
                {otomasyonAktif ? 'Kapat' : 'Aç'}
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Gönderim saat aralığı</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Input
              label="Mesajların gönderilmeye başlayabileceği saat"
              value={izinliBas}
              onChange={(e) => {
                markDirty()
                setIzinliBas(e.target.value)
              }}
              placeholder="10:00"
              disabled={saveMu.isPending}
            />
            <Input
              label="Mesajların gönderilebileceği son saat"
              value={izinliBit}
              onChange={(e) => {
                markDirty()
                setIzinliBit(e.target.value)
              }}
              placeholder="20:00"
              disabled={saveMu.isPending}
            />
          </div>
        </div>

        <div className="space-y-2">
          {kurallarSirali.map((k: TahsilatBildirimKuraliDto) => {
            const d = ruleDrafts[k.id]
            if (!d) return null
            const gunAlani = kuralGunAlani(k.kuralTuru)
            const accordionTitle = KURAL_ACCORDION_TITLE[k.kuralTuru]
            const isOpen = openAccordions[k.kuralTuru]
            const kuralSablonlari = sablonlarForKural(onayliSablonlar, k.kuralTuru)

            return (
              <AccordionSection
                key={k.id}
                title={accordionTitle}
                subtitle={d.aktifMi ? 'Aktif' : 'Pasif'}
                open={isOpen}
                onToggle={() => setOpenAccordions((prev) => ({ ...prev, [k.kuralTuru]: !prev[k.kuralTuru] }))}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge variant={d.aktifMi ? 'success' : 'default'} className="normal-case tracking-normal">
                    {d.aktifMi ? 'Açık' : 'Kapalı'}
                  </Badge>
                  <label className="flex items-center gap-2 text-xs font-medium text-ink">
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded border-border"
                      checked={d.aktifMi}
                      onChange={(e) => updateRule(k.id, { aktifMi: e.target.checked })}
                      disabled={saveMu.isPending}
                    />
                    Bu hatırlatmayı kullan
                  </label>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {gunAlani.showInput ? (
                    <Input
                      label={gunAlani.label}
                      type="number"
                      min={1}
                      max={365}
                      value={String(d.gunOffset)}
                      onChange={(e) => updateRule(k.id, { gunOffset: Number(e.target.value) || 0 })}
                      disabled={saveMu.isPending}
                      hint={gunAlani.hint}
                    />
                  ) : (
                    <div className="rounded-md border border-border/70 bg-surface-muted/30 px-3 py-2">
                      <p className="text-xs font-semibold text-ink-muted">Zamanlama</p>
                      <p className="mt-1 text-sm text-ink">{gunAlani.hint}</p>
                    </div>
                  )}
                  <Input
                    label="Mesajın gönderileceği saat"
                    value={d.gonderimSaati}
                    onChange={(e) => updateRule(k.id, { gonderimSaati: e.target.value })}
                    placeholder="10:00"
                    disabled={saveMu.isPending}
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink-muted">WhatsApp şablonu</label>
                  {kuralSablonlari.length === 0 ? (
                    <div className="flex flex-wrap items-center gap-2 rounded-md border border-border/70 bg-surface-muted/20 px-3 py-2.5 text-sm text-ink-muted">
                      <span>Henüz onaylanmış WhatsApp şablonunuz bulunmuyor.</span>
                      <Link to={SABLONLAR_PATH} className="text-xs font-semibold text-primary hover:underline">
                        Şablonlara Git
                      </Link>
                    </div>
                  ) : (
                    <select
                      className="w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink"
                      value={k.metaSablonId ?? ''}
                      disabled={assignMetaMu.isPending || onayliSablonQ.isLoading}
                      onChange={(e) => {
                        const v = e.target.value
                        assignMetaMu.mutate({
                          kuralId: k.id,
                          metaSablonId: v ? v : null
                        })
                      }}
                    >
                      <option value="">Şablon seçilmedi</option>
                      {kuralSablonlari.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.metaName} ({t.language})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </AccordionSection>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border pt-2">
          <Button type="button" size="sm" disabled={saveMu.isPending || ayarlarQ.isLoading} onClick={() => void handleKaydet()}>
            {saveMu.isPending ? 'Kaydediliyor…' : 'Kaydet'}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={planlaMu.isPending || saveMu.isPending}
            onClick={() => planlaMu.mutate()}
          >
            {planlaMu.isPending ? 'Planlanıyor…' : 'Planlamayı şimdi çalıştır'}
          </Button>
        </div>
      </div>
    </AyarlarPanelShell>
  )
}
