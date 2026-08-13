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
  updateTahsilatBildirimKural,
  updateTahsilatBildirimSablon
} from '../../../api/tahsilatBildirim'
import { getOnayliWhatsAppSablonlari } from '../../../api/whatsappBaglanti'
import { friendlyClientErrorMessage } from '../../../api/client'
import { APP_BASE } from '../../../config/appPaths'
import { useAuth } from '../../../contexts/AuthContext'
import { isYoneticiRole } from '../../../lib/isYonetici'
import { cn } from '../../../lib/cn'
import { useToast } from '../../../toast'
import type {
  BildirimKuralTuru,
  TahsilatBildirimKuraliDto,
  TahsilatBildirimSablonuDto
} from '../../../types/tahsilatBildirim'
import { bildirimKuralTuruLabel } from '../../../types/tahsilatBildirim'
import { AlertBox, Badge, Button, Input, Textarea, useConfirm } from '../../ui'
import { AyarlarPanelShell } from '../shared'

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

function templateMissingVars(metin: string): string[] {
  const missing: string[] = []
  if (!metin.includes('{kalanTutar}')) missing.push('Kalan tutar')
  if (!metin.includes('{muvekkilAdi}')) missing.push('Müvekkil adı')
  return missing
}

const KURAL_ORDER: BildirimKuralTuru[] = ['VADEDEN_ONCE', 'VADE_GUNU', 'VADE_SONRASI']

const KURAL_ACCORDION_TITLE: Record<BildirimKuralTuru, string> = {
  VADEDEN_ONCE: 'Vadesinden önce',
  VADE_GUNU: 'Vade günü',
  VADE_SONRASI: 'Vadesinden sonra'
}

const MESAJ_BILGILERI: Array<{ label: string; token: string }> = [
  { label: 'Müvekkil adı', token: '{muvekkilAdi}' },
  { label: 'Dosya bilgisi', token: '{dosyaBilgisi}' },
  { label: 'Vade tarihi', token: '{vadeTarihi}' },
  { label: 'Kalan tutar', token: '{kalanTutar}' },
  { label: 'Taksit tutarı', token: '{taksitTutari}' },
  { label: 'Ödenen tutar', token: '{odenenTutar}' },
  { label: 'Gecikme günü', token: '{gecikmeGunu}' },
  { label: 'Büro adı', token: '{buroAdi}' }
]

type RuleDraft = {
  aktifMi: boolean
  gunOffset: number
  gonderimSaati: string
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
  const sablonRefs = useRef<Record<string, HTMLTextAreaElement | null>>({})

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
  const [sablonDrafts, setSablonDrafts] = useState<Record<string, string>>({})
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
    const stamp = `${data.ayar.updatedAt}|${data.kurallar.map((k) => `${k.id}:${k.updatedAt}`).join(',')}|${data.sablonlar.map((s) => `${s.id}:${s.updatedAt}`).join(',')}`
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
    const sd: Record<string, string> = {}
    for (const s of data.sablonlar) {
      sd[s.id] = s.metin
    }
    setSablonDrafts(sd)
  }, [ayarlarQ.data])

  const kurallarSirali = useMemo(() => {
    const list = ayarlarQ.data?.kurallar ?? []
    return [...list].sort((a, b) => KURAL_ORDER.indexOf(a.kuralTuru) - KURAL_ORDER.indexOf(b.kuralTuru))
  }, [ayarlarQ.data?.kurallar])

  const sablonByKural = useMemo(() => {
    const map = new Map<BildirimKuralTuru, TahsilatBildirimSablonuDto>()
    for (const s of ayarlarQ.data?.sablonlar ?? []) {
      map.set(s.kuralTuru, s)
    }
    return map
  }, [ayarlarQ.data?.sablonlar])

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

      const templates = ayarlarQ.data?.sablonlar ?? []
      for (const s of templates) {
        const metin = (sablonDrafts[s.id] ?? s.metin).trim()
        if (metin !== s.metin.trim()) {
          await updateTahsilatBildirimSablon(s.id, { metin })
        }
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

  const insertToken = (sablonId: string, token: string): void => {
    markDirty()
    const el = sablonRefs.current[sablonId]
    const current = sablonDrafts[sablonId] ?? ''
    if (!el) {
      setSablonDrafts((prev) => ({ ...prev, [sablonId]: `${current}${token}` }))
      return
    }
    const start = el.selectionStart ?? current.length
    const end = el.selectionEnd ?? current.length
    const next = `${current.slice(0, start)}${token}${current.slice(end)}`
    setSablonDrafts((prev) => ({ ...prev, [sablonId]: next }))
    window.requestAnimationFrame(() => {
      el.focus()
      const pos = start + token.length
      el.setSelectionRange(pos, pos)
    })
  }

  const handleOtomasyonToggle = async (next: boolean): Promise<void> => {
    if (next && !otomasyonAktif) {
      const ok = await confirm({
        title: 'Otomatik hatırlatmaları açmak istiyor musunuz?',
        message:
          'Açıldığında sistem, kurallara göre tahsilat hatırlatmalarını planlar. Mesajları WhatsApp üzerinden siz gönderirsiniz.',
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
        message:
          'Otomatik hatırlatmalar açık olarak kaydedilecek. Kurallar ve mesaj metinleri de birlikte güncellenir.',
        confirmLabel: 'Kaydet ve aç',
        cancelLabel: 'Vazgeç'
      })
      if (!ok) return
    }
    saveMu.mutate()
  }

  const ruleTime = (tur: BildirimKuralTuru): string => {
    const k = kurallarSirali.find((r) => r.kuralTuru === tur)
    if (!k) return '—'
    return ruleDrafts[k.id]?.gonderimSaati ?? '—'
  }

  return (
    <AyarlarPanelShell
      title="WhatsApp Hatırlatmaları"
      description="Hatırlatma mesajları program tarafından hazırlanır. Mesajı göndermek için WhatsApp'ta Aç butonunu kullanabilirsiniz."
    >
      {ayarlarQ.isLoading ? <p className="text-sm text-ink-muted">Ayarlar yükleniyor…</p> : null}
      {ayarlarQ.isError ? (
        <AlertBox variant="warning" title="Ayarlar yüklenemedi">
          {friendlyClientErrorMessage(ayarlarQ.error, 'Bildirim ayarları alınamadı.')}
        </AlertBox>
      ) : null}

      <div className="space-y-4">
        <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
          <p className="text-sm font-semibold text-ink">Gönderim yöntemi</p>
          <p className="mt-1 text-sm font-medium text-ink">Manuel WhatsApp</p>
          <p className="mt-2 text-sm text-ink-muted">
            Hatırlatmalar program tarafından hazırlanır. Gönderim WhatsApp üzerinden sizin tarafınızdan tamamlanır.
          </p>
          <p className="mt-1 text-xs text-ink-subtle">Gönderim, sizin WhatsApp hesabınız üzerinden tamamlanır.</p>
        </div>

        <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-ink">Otomatik hatırlatmalar</p>
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

        <p className="text-sm leading-relaxed text-ink-muted">
          Mesajlar yalnızca açıkça izin verdiğiniz müvekkillere gönderilir. Detaylı liste için{' '}
          <Link to={`${APP_BASE}/bildirim-merkezi`} className="font-semibold text-primary hover:underline">
            Bildirim Merkezi
          </Link>
          .
        </p>

        <div className="rounded-lg border border-border bg-white p-4 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Gönderim saatleri</p>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
            <div className="flex items-center justify-between gap-2 rounded-md border border-border/70 bg-surface-muted/20 px-3 py-2">
              <span className="text-ink-muted">Vadesinden önce</span>
              <span className="font-mono font-semibold text-ink">{ruleTime('VADEDEN_ONCE')}</span>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-md border border-border/70 bg-surface-muted/20 px-3 py-2">
              <span className="text-ink-muted">Vade günü</span>
              <span className="font-mono font-semibold text-ink">{ruleTime('VADE_GUNU')}</span>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-md border border-border/70 bg-surface-muted/20 px-3 py-2">
              <span className="text-ink-muted">Vade sonrası</span>
              <span className="font-mono font-semibold text-ink">{ruleTime('VADE_SONRASI')}</span>
            </div>
          </div>
          <div className="mt-4 grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
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
            const sablon = sablonByKural.get(k.kuralTuru)
            const metin = sablon ? (sablonDrafts[sablon.id] ?? sablon.metin) : ''
            const missing = templateMissingVars(metin)
            const accordionTitle = KURAL_ACCORDION_TITLE[k.kuralTuru]
            const isOpen = openAccordions[k.kuralTuru]

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

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-ink-muted">Onaylı Meta şablon</label>
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
                    <option value="">Şablon seçilmedi (otomasyon Cloud göndermez)</option>
                    {(onayliSablonQ.data?.templates ?? []).map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.statusLabel}: {t.metaName} ({t.language})
                      </option>
                    ))}
                  </select>
                  <p className="text-[11px] text-ink-muted">
                    Yalnızca onaylı şablonlar listelenir. Onaylanmadan gerçek otomasyon Cloud gönderimi yapılmaz.
                  </p>
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

                {sablon ? (
                  <div className="space-y-2">
                    <Textarea
                      ref={(el) => {
                        sablonRefs.current[sablon.id] = el
                      }}
                      label="Gönderilecek mesaj"
                      rows={4}
                      value={metin}
                      onChange={(e) => {
                        markDirty()
                        setSablonDrafts((prev) => ({ ...prev, [sablon.id]: e.target.value }))
                      }}
                      disabled={saveMu.isPending}
                    />
                    <div>
                      <p className="mb-1.5 text-xs font-semibold text-ink-muted">Mesajda kullanabileceğiniz otomatik bilgiler</p>
                      <div className="flex flex-wrap gap-1.5">
                        {MESAJ_BILGILERI.map((item) => (
                          <button
                            key={item.token}
                            type="button"
                            className={cn(
                              'inline-flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1 text-left text-xs font-medium text-ink shadow-sm',
                              'hover:border-primary/40 hover:bg-primary-soft/40 disabled:opacity-50'
                            )}
                            disabled={saveMu.isPending}
                            title={`${item.label} ekle (${item.token})`}
                            onClick={() => insertToken(sablon.id, item.token)}
                          >
                            <span>{item.label}</span>
                            <span className="font-normal text-ink-subtle">{item.token}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                    {missing.length > 0 ? (
                      <p className="text-xs text-warning-ink">
                        Uyarı: mesajda {missing.join(' ve ')} bulunamadı. Bu bilgilerin mesajda kalması önerilir.
                      </p>
                    ) : null}
                  </div>
                ) : null}
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
