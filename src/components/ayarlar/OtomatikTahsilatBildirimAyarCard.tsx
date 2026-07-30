import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  getTahsilatBildirimAyarlar,
  invalidateTahsilatBildirim,
  planlaTahsilatBildirimleri,
  TAHSILAT_BILDIRIM_QUERY_KEY,
  updateTahsilatBildirimAyarlar,
  updateTahsilatBildirimKural,
  updateTahsilatBildirimSablon
} from '../../api/tahsilatBildirim'
import { friendlyClientErrorMessage } from '../../api/client'
import {
  AlertBox,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
  useConfirm
} from '../ui'
import { APP_BASE } from '../../config/appPaths'
import { useAuth } from '../../contexts/AuthContext'
import { isYoneticiRole } from '../../lib/isYonetici'
import { useToast } from '../../toast'
import type {
  BildirimKuralTuru,
  TahsilatBildirimKuraliDto,
  TahsilatBildirimSablonuDto
} from '../../types/tahsilatBildirim'
import { bildirimKuralTuruLabel } from '../../types/tahsilatBildirim'

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

export function OtomatikTahsilatBildirimAyarCard(): ReactElement | null {
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

  const [otomasyonAktif, setOtomasyonAktif] = useState(false)
  const [testModu, setTestModu] = useState(true)
  const [izinliBas, setIzinliBas] = useState('10:00')
  const [izinliBit, setIzinliBit] = useState('20:00')
  const [ruleDrafts, setRuleDrafts] = useState<Record<string, RuleDraft>>({})
  const [sablonDrafts, setSablonDrafts] = useState<Record<string, string>>({})
  /** Query refetch sırasında yazmayı ezmemek için son hydrate edilen ayar sürümü */
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
    setTestModu(data.ayar.testModu)
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
    return [...list].sort(
      (a, b) => KURAL_ORDER.indexOf(a.kuralTuru) - KURAL_ORDER.indexOf(b.kuralTuru)
    )
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
        testModu,
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
        toast.success(
          `Planlama tamamlandı. Yeni: ${res.result.created}, iptal: ${res.result.cancelled}.`
        )
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
          'Açıldığında sistem, kurallara göre tahsilat hatırlatmalarını planlar. Test modu açıkken müvekkillere gerçek mesaj gönderilmez.',
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

  return (
    <Card className="min-w-0 lg:col-span-2">
      <CardHeader className="border-b border-border">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">WhatsApp Otomatik Hatırlatmalar</CardTitle>
          <div className="flex flex-wrap gap-1.5">
            {testModu ? (
              <Badge variant="warning" className="normal-case tracking-normal">
                Test modu
              </Badge>
            ) : null}
            <Badge variant={otomasyonAktif ? 'success' : 'default'} className="normal-case tracking-normal">
              {otomasyonAktif ? 'Açık' : 'Kapalı'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardBody className="space-y-4 px-4 py-4 sm:px-5">
        {ayarlarQ.isLoading ? <p className="text-sm text-ink-muted">Ayarlar yükleniyor…</p> : null}
        {ayarlarQ.isError ? (
          <AlertBox variant="warning" title="Ayarlar yüklenemedi">
            {friendlyClientErrorMessage(ayarlarQ.error, 'Bildirim ayarları alınamadı.')}
          </AlertBox>
        ) : null}

        {testModu ? (
          <AlertBox variant="info" title="Test modu açık">
            Test modu açık. Bildirimler planlanır ve önizlenir ancak müvekkillere gerçek mesaj
            gönderilmez.
          </AlertBox>
        ) : null}

        <AlertBox variant="info" title="WhatsApp bildirimi">
          {ayarlarQ.data?.whatsapp?.bilgi ??
            'Bildirimler WhatsApp üzerinden, kendi WhatsApp hesabınız kullanılarak gönderilir.'}
        </AlertBox>

        <p className="text-sm leading-relaxed text-ink-muted">
          Program, vekalet ücreti taksitleri yaklaşınca, vade günü geldiğinde veya ödeme geciktiğinde
          müvekkile gönderilecek WhatsApp hatırlatmalarını otomatik olarak planlar. Mesajlar yalnızca
          açıkça izin verdiğiniz müvekkillere gönderilir. Detaylı liste için{' '}
          <Link to={`${APP_BASE}/bildirim-merkezi`} className="font-semibold text-primary hover:underline">
            Bildirim Merkezi
          </Link>
          .
        </p>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              checked={otomasyonAktif}
              onChange={(e) => {
                void handleOtomasyonToggle(e.target.checked)
              }}
              disabled={saveMu.isPending || ayarlarQ.isLoading}
            />
            <span className="font-medium text-ink">Otomatik hatırlatma planlamasını aç</span>
          </label>
          <label className="flex items-center gap-2 rounded-lg border border-border px-3 py-2.5 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-border"
              checked={testModu}
              onChange={(e) => {
                markDirty()
                setTestModu(e.target.checked)
              }}
              disabled={saveMu.isPending || ayarlarQ.isLoading}
            />
            <span className="font-medium text-ink">Test modu — mesaj gönderilmez</span>
          </label>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
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

        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Hatırlatma kuralları</p>
          {kurallarSirali.map((k: TahsilatBildirimKuraliDto) => {
            const d = ruleDrafts[k.id]
            if (!d) return null
            const gunAlani = kuralGunAlani(k.kuralTuru)
            const sablon = sablonByKural.get(k.kuralTuru)
            const metin = sablon ? (sablonDrafts[sablon.id] ?? sablon.metin) : ''
            const missing = templateMissingVars(metin)
            return (
              <div key={k.id} className="space-y-3 rounded-lg border border-border p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-ink">{bildirimKuralTuruLabel(k.kuralTuru)}</p>
                    <Badge
                      variant={d.aktifMi ? 'success' : 'default'}
                      className="normal-case tracking-normal"
                    >
                      {d.aktifMi ? 'Açık' : 'Kapalı'}
                    </Badge>
                  </div>
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
                      <p className="mb-1.5 text-xs font-semibold text-ink-muted">
                        Mesajda kullanabileceğiniz otomatik bilgiler
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {MESAJ_BILGILERI.map((item) => (
                          <button
                            key={item.token}
                            type="button"
                            className="inline-flex items-center gap-1 rounded-md border border-border bg-white px-2 py-1 text-left text-xs font-medium text-ink shadow-sm hover:border-primary/40 hover:bg-primary-soft/40 disabled:opacity-50"
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
                        Uyarı: mesajda {missing.join(' ve ')} bulunamadı. Bu bilgilerin mesajda
                        kalması önerilir.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        <div className="flex flex-wrap gap-2 pt-1">
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
      </CardBody>
    </Card>
  )
}
