import type { FormEvent, ReactElement } from 'react'
import { useMemo, useState } from 'react'
import { AlertBox, Button, DraggablePanel, Input, MoneyInput } from '../ui'
import {
  bolKalanTaksitlereEsit,
  hesaplaSabitTaksitPlani,
  kurusBuyuktur,
  taksitPlaniToplamDurumu,
  taksitPlaniToplamMesaj,
  vadeEkleAyYmd,
  yuvarlaTaksitToplam
} from '../../lib/vekaletTaksitPlani'
import { formatCurrencyInputTR, formatCurrencyTR, formatDateTR, parsePosTutar } from '../../utils/formatters'
import type { CreateVekaletTaksitPlaniPayload } from '../../types/vekalet'
import { cn } from '../../lib/cn'

type PlanTipi = 'ESIT' | 'OZEL'

type OzelSatir = {
  key: string
  tutar: string
  vade: string
  aciklama: string
}

let ozelKeySeq = 0
function yeniKey(): string {
  ozelKeySeq += 1
  return `ozel-${ozelKeySeq}`
}

function ozelSatirOlustur(vade: string): OzelSatir {
  return { key: yeniKey(), tutar: '', vade, aciklama: '' }
}

function todayYmd(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type Props = {
  kalanTaksitlendirme: number
  onClose: () => void
  loading: boolean
  error: string | null
  onSubmit: (body: CreateVekaletTaksitPlaniPayload) => void
}

export function VekaletTaksitPlaniModal(props: Props): ReactElement {
  const { kalanTaksitlendirme, onClose, loading, error, onSubmit } = props
  const baslangicDefault = todayYmd()

  const [planTipi, setPlanTipi] = useState<PlanTipi>('ESIT')
  const [taksitTutari, setTaksitTutari] = useState('')
  const [adet, setAdet] = useState('10')
  const [baslangic, setBaslangic] = useState(baslangicDefault)
  const [ozelToplamTaksit, setOzelToplamTaksit] = useState('10')
  const [ozelSatirlar, setOzelSatirlar] = useState<OzelSatir[]>(() => [ozelSatirOlustur(baslangicDefault)])
  const [ozelUyari, setOzelUyari] = useState<string | null>(null)
  const [localErr, setLocalErr] = useState<string | null>(null)

  const adetSayi = Math.floor(Number(adet))
  const tutarSayi = parsePosTutar(taksitTutari)
  const tutarlar = useMemo(() => {
    if (tutarSayi == null) return null
    return hesaplaSabitTaksitPlani(tutarSayi, adetSayi)
  }, [tutarSayi, adetSayi])

  const esitPlanToplam = tutarlar && tutarlar.length > 0 ? yuvarlaTaksitToplam(tutarlar) : null

  const ozelParsed = useMemo(
    () =>
      ozelSatirlar.map((s) => ({
        key: s.key,
        tutar: parsePosTutar(s.tutar),
        vadeTarihi: s.vade.trim(),
        aciklama: s.aciklama.trim() || null,
        vadeGecerli: /^\d{4}-\d{2}-\d{2}$/.test(s.vade.trim())
      })),
    [ozelSatirlar]
  )

  const ozelToplamSayi = Math.floor(Number(ozelToplamTaksit))
  const ozelPlanToplam = useMemo(() => {
    const list = ozelParsed.map((s) => s.tutar).filter((t): t is number => t != null)
    if (list.length === 0) return null
    return yuvarlaTaksitToplam(list)
  }, [ozelParsed])

  const ozelManuelSayi = useMemo(
    () => ozelParsed.filter((s) => s.tutar != null && s.tutar > 0).length,
    [ozelParsed]
  )
  const ozelKalanTaksitAdedi =
    Number.isFinite(ozelToplamSayi) && ozelToplamSayi >= 1 ? Math.max(0, ozelToplamSayi - ozelManuelSayi) : 0

  const aktifToplam = planTipi === 'ESIT' ? esitPlanToplam : ozelPlanToplam
  const fark = aktifToplam != null ? Math.round((aktifToplam - kalanTaksitlendirme) * 100) / 100 : null
  const toplamDurum =
    aktifToplam != null ? taksitPlaniToplamDurumu(kalanTaksitlendirme, aktifToplam) : 'GECERSIZ'

  const toplamUyari =
    ozelUyari ??
    (planTipi === 'OZEL' &&
    ozelSatirlar.length > ozelToplamSayi &&
    Number.isFinite(ozelToplamSayi) &&
    ozelToplamSayi >= 1
      ? 'Manuel satır sayısı toplam taksit sayısını aşamaz.'
      : planTipi === 'OZEL' && ozelPlanToplam != null && kurusBuyuktur(ozelPlanToplam, kalanTaksitlendirme)
        ? 'Yeni taksitlerin toplamı, taksitlendirilebilir kalan tutarı aşamaz.'
        : planTipi === 'OZEL' && aktifToplam != null && toplamDurum !== 'UYGUN'
          ? taksitPlaniToplamMesaj(toplamDurum)
          : planTipi === 'ESIT' &&
              esitPlanToplam != null &&
              kurusBuyuktur(esitPlanToplam, kalanTaksitlendirme)
            ? 'Yeni taksitlerin toplamı, taksitlendirilebilir kalan tutarı aşamaz.'
            : null)

  const ozelToplamSayiGecerli = Number.isFinite(ozelToplamSayi) && ozelToplamSayi >= 1 && ozelToplamSayi <= 120
  const ozelSatirlarGecerli =
    planTipi !== 'OZEL' ||
    (ozelToplamSayiGecerli &&
      ozelSatirlar.length === ozelToplamSayi &&
      ozelParsed.length > 0 &&
      ozelParsed.every((s) => s.tutar != null && s.tutar > 0 && s.vadeGecerli) &&
      ozelPlanToplam != null &&
      toplamDurum === 'UYGUN' &&
      !ozelUyari)

  const esitGecerli =
    planTipi !== 'ESIT' ||
    (tutarSayi != null &&
      tutarlar != null &&
      tutarlar.length > 0 &&
      Number.isFinite(adetSayi) &&
      adetSayi >= 1 &&
      adetSayi <= 120 &&
      esitPlanToplam != null &&
      !kurusBuyuktur(esitPlanToplam, kalanTaksitlendirme))

  const olusturDisabled =
    loading ||
    kalanTaksitlendirme <= 0 ||
    (planTipi === 'ESIT' ? !esitGecerli : !ozelSatirlarGecerli)

  const onizleme =
    planTipi === 'ESIT' && tutarlar && tutarlar.length > 0 && tutarSayi != null
      ? `${tutarlar.length} taksit × ${formatCurrencyTR(tutarSayi)} · toplam ${formatCurrencyTR(esitPlanToplam ?? 0)} · ${formatDateTR(baslangic)} — ${formatDateTR(vadeEkleAyYmd(baslangic, tutarlar.length - 1))}`
      : null

  function baslangicDegistir(yeni: string): void {
    setBaslangic(yeni)
    setOzelUyari(null)
    if (planTipi === 'OZEL') {
      setOzelSatirlar((prev) =>
        prev.length === 0 ? [ozelSatirOlustur(yeni)] : prev.map((s, i) => (i === 0 ? { ...s, vade: yeni } : s))
      )
    }
  }

  function satirEkle(): void {
    if (ozelToplamSayiGecerli && ozelSatirlar.length >= ozelToplamSayi) return
    setOzelUyari(null)
    setOzelSatirlar((prev) => {
      const sonVade = prev.length > 0 ? prev[prev.length - 1].vade : baslangic
      const yeniVade = prev.length > 0 ? vadeEkleAyYmd(sonVade, 1) : baslangic
      return [...prev, ozelSatirOlustur(yeniVade)]
    })
  }

  function satirSil(key: string): void {
    setOzelUyari(null)
    setOzelSatirlar((prev) => (prev.length <= 1 ? prev : prev.filter((s) => s.key !== key)))
  }

  function kalanEsitBol(): void {
    ;(document.activeElement as HTMLElement | null)?.blur?.()
    const toplamSayi = Math.floor(Number(ozelToplamTaksit))
    if (!Number.isFinite(toplamSayi) || toplamSayi < 1) {
      setOzelUyari('Toplam taksit sayısı girin.')
      return
    }
    if (ozelSatirlar.length > toplamSayi) {
      setOzelUyari('Manuel satır sayısı toplam taksit sayısını aşamaz.')
      return
    }

    const manuel: { key: string; tutar: number; vade: string; aciklama: string }[] = []
    for (const s of ozelSatirlar) {
      const t = parsePosTutar(s.tutar)
      if (t != null && t > 0) manuel.push({ key: s.key, tutar: t, vade: s.vade.trim(), aciklama: s.aciklama })
    }

    const manuelToplam = yuvarlaTaksitToplam(manuel.map((m) => m.tutar))
    if (kurusBuyuktur(manuelToplam, kalanTaksitlendirme)) {
      setOzelUyari('Yeni taksitlerin toplamı, taksitlendirilebilir kalan tutarı aşamaz.')
      return
    }

    const kalanAdet = toplamSayi - manuel.length
    if (kalanAdet <= 0) {
      setOzelUyari(null)
      return
    }

    const kalanTutar = Math.round((kalanTaksitlendirme - manuelToplam) * 100) / 100
    const dagitim = bolKalanTaksitlereEsit(kalanTutar, kalanAdet)
    if (!dagitim) return

    const sonManuelVade =
      manuel.length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(manuel[manuel.length - 1].vade)
        ? manuel[manuel.length - 1].vade
        : baslangic

    const yeniSatirlar: OzelSatir[] = manuel.map((m, i) => ({
      key: m.key,
      tutar: formatCurrencyInputTR(m.tutar),
      vade: m.vade || (i === 0 ? baslangic : vadeEkleAyYmd(manuel[i - 1].vade, 1)),
      aciklama: m.aciklama
    }))

    for (let i = 0; i < kalanAdet; i++) {
      const vade = manuel.length > 0 ? vadeEkleAyYmd(sonManuelVade, i + 1) : vadeEkleAyYmd(baslangic, i)
      yeniSatirlar.push({
        key: yeniKey(),
        tutar: formatCurrencyInputTR(dagitim[i]),
        vade,
        aciklama: ''
      })
    }

    setOzelUyari(null)
    setOzelSatirlar(yeniSatirlar)
  }

  function submit(e: FormEvent): void {
    e.preventDefault()
    setLocalErr(null)
    if (olusturDisabled) return
    if (planTipi === 'ESIT') {
      if (tutarSayi == null || !tutarlar || tutarlar.length === 0) return
      onSubmit({
        tip: 'ESIT',
        taksitSayisi: adetSayi,
        ilkVadeTarihi: `${baslangic}T00:00:00.000Z`,
        taksitTutari: tutarSayi,
        aciklama: null
      })
      return
    }
    const satirlar = ozelParsed
      .filter((s) => s.tutar != null && s.vadeGecerli)
      .map((s) => ({
        tutar: s.tutar!,
        vadeTarihi: `${s.vadeTarihi}T00:00:00.000Z`,
        aciklama: s.aciklama
      }))
    onSubmit({ tip: 'OZEL', satirlar })
  }

  const kalanEsitBolDisabled =
    loading ||
    kalanTaksitlendirme <= 0 ||
    !ozelToplamSayiGecerli ||
    ozelKalanTaksitAdedi <= 0 ||
    (ozelPlanToplam != null && kurusBuyuktur(ozelPlanToplam, kalanTaksitlendirme)) ||
    (ozelToplamSayiGecerli && ozelSatirlar.length > ozelToplamSayi)

  const satirEkleDisabled =
    loading || (ozelToplamSayiGecerli && ozelSatirlar.length >= ozelToplamSayi)

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/45 p-4 pt-[4vh] backdrop-blur-[1px]">
      <DraggablePanel
        role="dialog"
        aria-modal="true"
        className={cn(
          'my-4 w-full overflow-hidden rounded-xl border border-border bg-white shadow-xl dark:bg-surface-elevated',
          planTipi === 'OZEL' ? 'max-w-4xl' : 'max-w-xl'
        )}
      >
        <div data-modal-drag-handle className="flex items-start justify-between gap-2 border-b border-border px-5 py-4">
          <h2 className="text-base font-bold text-ink">Taksit planı oluştur</h2>
          <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0" onClick={onClose} disabled={loading}>
            ✕
          </Button>
        </div>

        <form className="space-y-4 p-5" onSubmit={submit}>
          {error ? <AlertBox variant="danger" title="Hata">{error}</AlertBox> : null}
          {localErr ? <p className="text-xs text-danger">{localErr}</p> : null}

          {kalanTaksitlendirme <= 0 ? (
            <p className="text-sm text-danger">Taksitlendirilebilir tutar kalmadı.</p>
          ) : (
            <p className="text-sm text-ink-muted">
              Taksitlendirilebilir kalan:{' '}
              <strong className="tabular-nums text-ink">{formatCurrencyTR(kalanTaksitlendirme)}</strong>
            </p>
          )}

          <fieldset className="rounded-lg border border-border p-3">
            <legend className="px-1 text-xs font-semibold text-ink-muted">Plan tipi</legend>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="radio"
                  name="plan-tipi"
                  checked={planTipi === 'ESIT'}
                  onChange={() => setPlanTipi('ESIT')}
                  disabled={loading}
                />
                Eşit taksit
              </label>
              <label className="flex items-center gap-2 text-sm text-ink">
                <input
                  type="radio"
                  name="plan-tipi"
                  checked={planTipi === 'OZEL'}
                  onChange={() => setPlanTipi('OZEL')}
                  disabled={loading}
                />
                Özel dağılım
              </label>
            </div>
          </fieldset>

          {planTipi === 'ESIT' ? (
            <div className="space-y-3">
              <MoneyInput
                label="Taksit tutarı *"
                value={taksitTutari}
                onChange={setTaksitTutari}
                placeholder="ör. 5.000"
                disabled={kalanTaksitlendirme <= 0}
              />
              <Input
                label="Taksit sayısı *"
                value={adet}
                onChange={(e) => setAdet(e.target.value.replace(/[^\d]/g, '').slice(0, 3))}
                inputMode="numeric"
              />
              <Input
                label="Başlangıç tarihi *"
                type="date"
                value={baslangic}
                onChange={(e) => baslangicDegistir(e.target.value)}
              />
              {onizleme ? (
                <div className="rounded-md border border-border bg-surface-muted/40 px-3 py-2 text-xs text-ink">
                  <span className="font-semibold text-ink-muted">Önizleme · </span>
                  {onizleme}
                </div>
              ) : null}
              <p className="text-xs text-ink-muted">
                Her taksit aynı tutarda oluşturulur. Vadeler başlangıç tarihinden itibaren aylık ilerler.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  label="İlk vade tarihi *"
                  type="date"
                  value={baslangic}
                  onChange={(e) => baslangicDegistir(e.target.value)}
                />
                <Input
                  label="Toplam taksit sayısı *"
                  value={ozelToplamTaksit}
                  onChange={(e) => {
                    setOzelToplamTaksit(e.target.value.replace(/[^\d]/g, '').slice(0, 3))
                    setOzelUyari(null)
                  }}
                  inputMode="numeric"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="outline" onClick={satirEkle} disabled={satirEkleDisabled}>
                  Satır ekle
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={kalanEsitBol} disabled={kalanEsitBolDisabled}>
                  Kalanı eşit böl
                </Button>
              </div>

              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="min-w-full text-left text-xs">
                  <thead className="bg-surface-muted/50 text-[11px] uppercase tracking-wide text-ink-muted">
                    <tr>
                      <th className="px-2 py-2">No</th>
                      <th className="px-2 py-2">Vade</th>
                      <th className="px-2 py-2">Tutar</th>
                      <th className="px-2 py-2">Açıklama</th>
                      <th className="px-2 py-2">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ozelSatirlar.map((s, i) => (
                      <tr key={s.key} className="border-t border-border">
                        <td className="px-2 py-1.5 tabular-nums text-ink-muted">{i + 1}</td>
                        <td className="px-2 py-1.5">
                          <input
                            type="date"
                            className="h-8 w-full min-w-[9rem] rounded-md border border-border bg-white px-2 text-sm"
                            value={s.vade}
                            onChange={(e) =>
                              setOzelSatirlar((prev) =>
                                prev.map((r) => (r.key === s.key ? { ...r, vade: e.target.value } : r))
                              )
                            }
                          />
                        </td>
                        <td className="px-2 py-1.5 min-w-[8rem]">
                          <MoneyInput
                            value={s.tutar}
                            onChange={(v) => {
                              setOzelUyari(null)
                              setOzelSatirlar((prev) =>
                                prev.map((r) => (r.key === s.key ? { ...r, tutar: v } : r))
                              )
                            }}
                            disabled={kalanTaksitlendirme <= 0}
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <input
                            className="h-8 w-full min-w-[8rem] rounded-md border border-border bg-white px-2 text-sm"
                            value={s.aciklama}
                            onChange={(e) =>
                              setOzelSatirlar((prev) =>
                                prev.map((r) => (r.key === s.key ? { ...r, aciklama: e.target.value } : r))
                              )
                            }
                          />
                        </td>
                        <td className="px-2 py-1.5">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() => satirSil(s.key)}
                            disabled={ozelSatirlar.length <= 1}
                          >
                            Sil
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-ink-muted">
                İlk taksitleri elle girin; «Kalanı eşit böl» kalan tutarı toplam taksit sayısına göre dağıtır. Tüm
                satırları elle de girebilirsiniz.
              </p>
            </div>
          )}

          <div className="space-y-1 rounded-lg border border-border bg-surface-muted/30 px-3 py-2 text-sm">
            <div className="flex justify-between gap-2">
              <span className="text-ink-muted">Kalan taksitlendirilebilir</span>
              <strong className="tabular-nums">{formatCurrencyTR(kalanTaksitlendirme)}</strong>
            </div>
            <div className="flex justify-between gap-2">
              <span className="text-ink-muted">Taksit toplamı</span>
              <strong className="tabular-nums">{aktifToplam != null ? formatCurrencyTR(aktifToplam) : '—'}</strong>
            </div>
            <div
              className={cn(
                'flex justify-between gap-2',
                fark != null && Math.abs(fark) > 0.005 ? 'text-warning' : undefined
              )}
            >
              <span className="text-ink-muted">Fark</span>
              <strong className="tabular-nums">{fark != null ? formatCurrencyTR(fark) : '—'}</strong>
            </div>
          </div>

          {toplamUyari ? <p className="text-xs text-danger">{toplamUyari}</p> : null}

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={olusturDisabled}>
              {loading ? 'Oluşturuluyor…' : 'Taksit planı oluştur'}
            </Button>
          </div>
        </form>
      </DraggablePanel>
    </div>
  )
}
