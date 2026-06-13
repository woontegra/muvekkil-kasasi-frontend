import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { FormEvent, ReactElement } from 'react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { adminCreateTenantRequest } from '../../api/adminApi'
import type { AdminCreateTenantPayload, AdminCreateTenantResponse } from '../../types/admin'
import { getPublicLoginUrl } from '../../config/publicLoginUrl'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { PasswordGenerator } from '../../components/auth/PasswordGenerator'
import { AlertBox, Button, Card, CardBody, CardHeader, CardTitle, Input } from '../../components/ui'
import { formatDateTR } from '../../utils/formatters'
import { suggestKullaniciAdi } from '../../lib/suggestKullaniciAdi'

type SureTipi = 'GUN' | 'AY' | 'YIL' | 'OZEL'

function previewBitis(baslangic: Date, miktar: number, birim: 'GUN' | 'AY' | 'YIL'): Date {
  const next = new Date(baslangic.getTime())
  if (birim === 'GUN') next.setDate(next.getDate() + miktar)
  else if (birim === 'AY') next.setMonth(next.getMonth() + miktar)
  else next.setFullYear(next.getFullYear() + miktar)
  return next
}

function gunSayisiBugundenBitise(ymd: string): number {
  const [y, m, d] = ymd.split('-').map(Number)
  if (!y || !m || !d) return 1
  const end = new Date(y, m - 1, d, 23, 59, 59, 999)
  const start = new Date()
  start.setHours(0, 0, 0, 0)
  const g = Math.ceil((end.getTime() - start.getTime()) / 86_400_000)
  return Math.max(1, g)
}

function lisansEtiket(tip: 'DEMO' | 'AKTIF', miktar: number, birim: 'GUN' | 'AY' | 'YIL'): string {
  if (tip === 'DEMO') return `${miktar} günlük demo`
  if (birim === 'GUN') return `${miktar} gün aktif`
  if (birim === 'AY') return `${miktar} ay aktif`
  return `${miktar} yıl aktif`
}

function buildClientMail(r: AdminCreateTenantResponse, loginUrl: string): string {
  const bitis = r.tenant.lisansBitisTarihi ? formatDateTR(r.tenant.lisansBitisTarihi) : '—'
  const ld = r.tenant.lisansDurumu === 'DEMO' ? 'Demo' : 'Aktif yıllık lisans'
  return `Merhaba,
Müvekkil Kasa Defteri hesabınız oluşturulmuştur.

Giriş adresi: ${loginUrl}
Kullanıcı adı: ${r.ownerUser.kullaniciAdi}
Şifre: ${r.geciciSifre}

Lisans durumu: ${ld}
Bitiş tarihi: ${bitis}

İyi çalışmalar.
`
}

export function AdminCreateTenantPage(): ReactElement {
  const { admin } = useAdminAuth()
  const isSuper = admin?.rol === 'SUPER_ADMIN'
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [buroAdi, setBuroAdi] = useState('')
  const [yetkiliAdSoyad, setYetkiliAdSoyad] = useState('')
  const [telefon, setTelefon] = useState('')
  const [eposta, setEposta] = useState('')
  const [kullaniciAdi, setKullaniciAdi] = useState('')
  const [kullaniciAdiManuel, setKullaniciAdiManuel] = useState(false)
  const [sifre, setSifre] = useState('')
  const [lisansTipi, setLisansTipi] = useState<'DEMO' | 'AKTIF'>('DEMO')
  const [sureTipi, setSureTipi] = useState<SureTipi>('GUN')
  const [sureMiktar, setSureMiktar] = useState('7')
  const [ozelBitis, setOzelBitis] = useState('')
  const [adres, setAdres] = useState('')
  const [vergiNo, setVergiNo] = useState('')
  const [vergiDairesi, setVergiDairesi] = useState('')
  const [yillikUcret, setYillikUcret] = useState('')
  const [notlar, setNotlar] = useState('')
  const [formErr, setFormErr] = useState<string | null>(null)
  const [copyHint, setCopyHint] = useState<string | null>(null)
  const [success, setSuccess] = useState<AdminCreateTenantResponse | null>(null)

  useEffect(() => {
    if (kullaniciAdiManuel) return
    const next = suggestKullaniciAdi(yetkiliAdSoyad.trim() || buroAdi.trim())
    setKullaniciAdi(next)
  }, [yetkiliAdSoyad, buroAdi, kullaniciAdiManuel])

  const [previewBase] = useState(() => new Date())

  const previewMiktarBirim = useMemo((): { miktar: number; birim: 'GUN' | 'AY' | 'YIL' } => {
    if (sureTipi === 'OZEL') {
      if (!ozelBitis.trim()) return { miktar: 7, birim: 'GUN' }
      return { miktar: gunSayisiBugundenBitise(ozelBitis.trim()), birim: 'GUN' }
    }
    const n = Math.max(1, parseInt(sureMiktar, 10) || 1)
    return { miktar: n, birim: sureTipi }
  }, [sureTipi, sureMiktar, ozelBitis])

  const previewBitisTarihi = useMemo(() => {
    return previewBitis(previewBase, previewMiktarBirim.miktar, previewMiktarBirim.birim)
  }, [previewBase, previewMiktarBirim])

  const ozetLisans = useMemo(
    () => lisansEtiket(lisansTipi, previewMiktarBirim.miktar, previewMiktarBirim.birim),
    [lisansTipi, previewMiktarBirim]
  )

  const loginUrl = getPublicLoginUrl()

  const createM = useMutation({
    mutationFn: (body: AdminCreateTenantPayload) => adminCreateTenantRequest(body),
    onMutate: () => setFormErr(null),
    onSuccess: (data) => {
      setSuccess(data)
      void qc.invalidateQueries({ queryKey: ['admin-tenants'] })
      void qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
      window.scrollTo({ top: 0, behavior: 'smooth' })
    },
    onError: (e: unknown) => {
      setFormErr(e instanceof Error ? e.message : 'Oluşturulamadı.')
    }
  })

  const resetForm = useCallback(() => {
    setBuroAdi('')
    setYetkiliAdSoyad('')
    setTelefon('')
    setEposta('')
    setKullaniciAdi('')
    setKullaniciAdiManuel(false)
    setSifre('')
    setLisansTipi('DEMO')
    setSureTipi('GUN')
    setSureMiktar('7')
    setOzelBitis('')
    setAdres('')
    setVergiNo('')
    setVergiDairesi('')
    setYillikUcret('')
    setNotlar('')
    setFormErr(null)
    setCopyHint(null)
    setSuccess(null)
  }, [])

  function applyPreset(miktar: number, birim: 'GUN' | 'AY', tip: 'DEMO' | 'AKTIF'): void {
    setLisansTipi(tip)
    setSureTipi(birim)
    setSureMiktar(String(miktar))
    setFormErr(null)
  }

  function validateEmail(s: string): boolean {
    const t = s.trim()
    if (!t) return true
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)
  }

  function buildPayload(): AdminCreateTenantPayload | null {
    setFormErr(null)
    if (!buroAdi.trim()) {
      setFormErr('Büro adı zorunludur.')
      return null
    }
    if (!yetkiliAdSoyad.trim()) {
      setFormErr('Yetkili ad soyad zorunludur.')
      return null
    }
    if (!kullaniciAdi.trim()) {
      setFormErr('Kullanıcı adı zorunludur.')
      return null
    }
    if (!sifre || sifre.length < 8) {
      setFormErr('Şifre en az 8 karakter olmalıdır.')
      return null
    }
    if (!validateEmail(eposta)) {
      setFormErr('Geçerli bir e-posta girin veya alanı boş bırakın.')
      return null
    }

    let miktar: number
    let birim: 'GUN' | 'AY' | 'YIL'
    if (sureTipi === 'OZEL') {
      if (!ozelBitis.trim()) {
        setFormErr('Özel tarih için bitiş tarihi seçin.')
        return null
      }
      const [y, m, d] = ozelBitis.trim().split('-').map(Number)
      const endDay = new Date(y, m - 1, d)
      endDay.setHours(0, 0, 0, 0)
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (endDay.getTime() < today.getTime()) {
        setFormErr('Bitiş tarihi bugünden önce olamaz.')
        return null
      }
      miktar = gunSayisiBugundenBitise(ozelBitis.trim())
      birim = 'GUN'
    } else {
      miktar = Math.max(1, parseInt(sureMiktar, 10) || 1)
      birim = sureTipi
    }

    const yu = yillikUcret.trim()
    const yillikUcretVal = yu === '' ? null : Number.isFinite(Number(yu)) ? Number(yu) : null
    if (yu !== '' && yillikUcretVal == null) {
      setFormErr('Yıllık ücret geçerli bir sayı olmalı veya boş bırakılmalıdır.')
      return null
    }

    const tel = telefon.trim()
    const ep = eposta.trim()

    return {
      buroAdi: buroAdi.trim(),
      telefon: tel || undefined,
      eposta: ep || undefined,
      adres: adres.trim() || undefined,
      vergiNo: vergiNo.trim() || undefined,
      vergiDairesi: vergiDairesi.trim() || undefined,
      ownerAdSoyad: yetkiliAdSoyad.trim(),
      ownerKullaniciAdi: kullaniciAdi.trim().toLowerCase(),
      ownerTelefon: tel || undefined,
      ownerEposta: ep || undefined,
      ownerSifre: sifre,
      lisansTipi,
      lisansSuresiMiktar: miktar,
      lisansSuresiBirim: birim,
      notlar: notlar.trim() || undefined,
      yillikUcret: yillikUcretVal
    }
  }

  function onSubmit(e: FormEvent): void {
    e.preventDefault()
    const payload = buildPayload()
    if (payload) void createM.mutateAsync(payload)
  }

  async function copyBilgi(r: AdminCreateTenantResponse): Promise<void> {
    try {
      await navigator.clipboard.writeText(buildClientMail(r, loginUrl))
      setCopyHint('Panoya kopyalandı.')
    } catch {
      setCopyHint('Kopyalanamadı; metni elle seçin.')
    }
  }

  if (!isSuper) {
    return <Navigate to="/admin/burolar" replace />
  }

  if (success) {
    const bitis = success.tenant.lisansBitisTarihi ? formatDateTR(success.tenant.lisansBitisTarihi) : '—'
    const ld = success.tenant.lisansDurumu === 'DEMO' ? 'Demo' : 'Aktif lisans'
    return (
      <div className="w-full max-w-3xl space-y-6">
        <nav className="text-xs text-slate-500">
          <Link to="/admin" className="text-primary hover:underline">
            Ana Sayfa
          </Link>
          <span> / </span>
          <span>Admin Panel</span>
          <span> / </span>
          <Link to="/admin/burolar" className="text-primary hover:underline">
            Bürolar
          </Link>
          <span> / </span>
          <span className="font-semibold text-slate-800">Yeni Büro</span>
        </nav>
        <Link to="/admin/burolar" className="inline-flex text-sm font-semibold text-primary hover:underline">
          ← Geri
        </Link>
        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Büro hesabı oluşturuldu</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4 text-sm">
            <dl className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 p-4">
              <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
                <dt className="font-semibold text-slate-600">Büro adı</dt>
                <dd>{success.tenant.buroAdi}</dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
                <dt className="font-semibold text-slate-600">Giriş adresi</dt>
                <dd className="break-all font-mono text-xs text-primary">{loginUrl}</dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
                <dt className="font-semibold text-slate-600">Kullanıcı adı</dt>
                <dd className="font-mono">{success.ownerUser.kullaniciAdi}</dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
                <dt className="font-semibold text-slate-600">Şifre</dt>
                <dd className="font-mono">{success.geciciSifre}</dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
                <dt className="font-semibold text-slate-600">Lisans durumu</dt>
                <dd>{ld}</dd>
              </div>
              <div className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
                <dt className="font-semibold text-slate-600">Lisans bitiş</dt>
                <dd>{bitis}</dd>
              </div>
            </dl>
            {copyHint ? <p className="text-xs text-ink-muted">{copyHint}</p> : null}
            <div className="flex flex-wrap gap-2">
              <Button type="button" variant="secondary" onClick={() => void copyBilgi(success)}>
                Bilgileri kopyala
              </Button>
              <Button type="button" onClick={() => navigate(`/admin/burolar/${success.tenant.id}`)}>
                Büro detayına git
              </Button>
              <Button type="button" variant="outline" onClick={resetForm}>
                Yeni büro oluştur
              </Button>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-none space-y-5">
      <nav className="text-xs text-slate-500">
        <Link to="/admin" className="text-primary hover:underline">
          Ana Sayfa
        </Link>
        <span> / </span>
        <span>Admin Panel</span>
        <span> / </span>
        <Link to="/admin/burolar" className="text-primary hover:underline">
          Bürolar
        </Link>
        <span> / </span>
        <span className="font-semibold text-slate-800">Yeni Büro</span>
      </nav>

      <div>
        <Link to="/admin/burolar" className="inline-flex text-sm font-semibold text-primary hover:underline">
          ← Geri
        </Link>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900">Yeni Büro Oluştur</h1>
        <p className="mt-1 text-sm text-slate-600">Müşteri adına büro hesabı ve ilk büro sahibi kullanıcısını oluşturun.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr,minmax(280px,360px)] lg:items-start">
        <Card className="border-slate-200 shadow-sm">
          <CardBody className="p-5 sm:p-6">
            <form className="space-y-8" onSubmit={onSubmit}>
              {formErr ? (
                <AlertBox variant="danger" title="Hata">
                  {formErr}
                </AlertBox>
              ) : null}
              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">A) Temel bilgiler</h2>
                <Input label="Büro adı *" value={buroAdi} onChange={(e) => setBuroAdi(e.target.value)} disabled={createM.isPending} />
                <Input label="Yetkili ad soyad *" value={yetkiliAdSoyad} onChange={(e) => setYetkiliAdSoyad(e.target.value)} disabled={createM.isPending} />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Telefon" value={telefon} onChange={(e) => setTelefon(e.target.value)} disabled={createM.isPending} />
                  <Input label="E-posta" type="email" value={eposta} onChange={(e) => setEposta(e.target.value)} disabled={createM.isPending} />
                </div>
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">B) Giriş bilgileri</h2>
                <Input
                  label="Kullanıcı adı *"
                  hint="Öneri otomatik; isterseniz değiştirin."
                  value={kullaniciAdi}
                  onChange={(e) => {
                    setKullaniciAdiManuel(true)
                    setKullaniciAdi(e.target.value)
                  }}
                  disabled={createM.isPending}
                />
                <Input label="Şifre *" type="password" autoComplete="new-password" value={sifre} onChange={(e) => setSifre(e.target.value)} disabled={createM.isPending} />
                <PasswordGenerator disabled={createM.isPending} onApply={(pwd) => setSifre(pwd)} />
              </section>

              <section className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">C) Lisans / demo</h2>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Lisans tipi *</label>
                  <div className="flex flex-wrap gap-3">
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input type="radio" name="lt" checked={lisansTipi === 'DEMO'} onChange={() => setLisansTipi('DEMO')} disabled={createM.isPending} />
                      Demo
                    </label>
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input type="radio" name="lt" checked={lisansTipi === 'AKTIF'} onChange={() => setLisansTipi('AKTIF')} disabled={createM.isPending} />
                      Aktif lisans
                    </label>
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-600">Süre tipi *</label>
                  <select
                    className="h-10 w-full max-w-md rounded-md border border-slate-200 bg-white px-3 text-sm"
                    value={sureTipi}
                    onChange={(e) => setSureTipi(e.target.value as SureTipi)}
                    disabled={createM.isPending}
                  >
                    <option value="GUN">Gün</option>
                    <option value="AY">Ay</option>
                    <option value="YIL">Yıl</option>
                    <option value="OZEL">Özel tarih (bugünden bitişe gün)</option>
                  </select>
                </div>
                {sureTipi === 'OZEL' ? (
                  <Input label="Bitiş tarihi *" type="date" value={ozelBitis} onChange={(e) => setOzelBitis(e.target.value)} disabled={createM.isPending} />
                ) : (
                  <Input label="Süre miktarı *" type="number" min={1} value={sureMiktar} onChange={(e) => setSureMiktar(e.target.value)} disabled={createM.isPending} />
                )}
                <div>
                  <p className="mb-2 text-xs font-semibold text-slate-600">Hızlı seçim</p>
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" size="sm" variant="secondary" disabled={createM.isPending} onClick={() => applyPreset(3, 'GUN', 'DEMO')}>
                      3 gün demo
                    </Button>
                    <Button type="button" size="sm" variant="secondary" disabled={createM.isPending} onClick={() => applyPreset(7, 'GUN', 'DEMO')}>
                      7 gün demo
                    </Button>
                    <Button type="button" size="sm" variant="secondary" disabled={createM.isPending} onClick={() => applyPreset(14, 'GUN', 'DEMO')}>
                      14 gün demo
                    </Button>
                    <Button type="button" size="sm" variant="secondary" disabled={createM.isPending} onClick={() => applyPreset(12, 'AY', 'AKTIF')}>
                      12 ay aktif
                    </Button>
                  </div>
                </div>
              </section>

              <details className="rounded-xl border border-slate-200 bg-white shadow-sm">
                <summary className="cursor-pointer select-none px-4 py-3 text-sm font-semibold text-slate-800">Gelişmiş büro bilgileri</summary>
                <div className="space-y-3 border-t border-slate-100 px-4 py-4">
                  <Input label="Adres" value={adres} onChange={(e) => setAdres(e.target.value)} disabled={createM.isPending} />
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Input label="Vergi no" value={vergiNo} onChange={(e) => setVergiNo(e.target.value)} disabled={createM.isPending} />
                    <Input label="Vergi dairesi" value={vergiDairesi} onChange={(e) => setVergiDairesi(e.target.value)} disabled={createM.isPending} />
                  </div>
                  <Input label="Yıllık ücret (TL)" type="number" value={yillikUcret} onChange={(e) => setYillikUcret(e.target.value)} disabled={createM.isPending} />
                  <Input label="Notlar" value={notlar} onChange={(e) => setNotlar(e.target.value)} disabled={createM.isPending} />
                </div>
              </details>

              <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-4">
                <Button type="button" variant="outline" disabled={createM.isPending} onClick={() => navigate('/admin/burolar')}>
                  Vazgeç
                </Button>
                <Button type="submit" disabled={createM.isPending}>
                  {createM.isPending ? 'Oluşturuluyor…' : 'Büroyu oluştur'}
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>

        <Card className="sticky top-4 border-slate-200 shadow-sm lg:top-6">
          <CardHeader className="border-b border-slate-100 bg-slate-50/90 py-3">
            <CardTitle className="text-base">Canlı özet</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3 text-sm text-slate-700">
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Büro</p>
              <p className="font-semibold text-slate-900">{buroAdi.trim() || '—'}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Büro sahibi</p>
              <p className="font-semibold text-slate-900">{yetkiliAdSoyad.trim() || '—'}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Giriş kullanıcı adı</p>
              <p className="font-mono text-slate-900">{kullaniciAdi.trim() || '—'}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Lisans</p>
              <p className="font-semibold text-slate-900">{buroAdi.trim() || yetkiliAdSoyad.trim() ? ozetLisans : '—'}</p>
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase text-slate-500">Bitiş (önizleme)</p>
              <p className="font-semibold text-slate-900">{formatDateTR(previewBitisTarihi.toISOString())}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50/80 p-3">
              <p className="text-[11px] font-bold uppercase text-slate-500">Müşteri giriş adresi</p>
              <p className="mt-1 break-all font-mono text-xs text-primary">{loginUrl}</p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  )
}
