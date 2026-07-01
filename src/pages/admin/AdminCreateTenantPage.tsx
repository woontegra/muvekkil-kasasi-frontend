import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { FormEvent, ReactElement } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { adminCreateTenantRequest } from '../../api/adminApi'
import type { AdminCreateTenantLisansPaketi, AdminCreateTenantPayload } from '../../types/admin'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb'
import { PasswordGenerator } from '../../components/auth/PasswordGenerator'
import { AlertBox, Button, Card, CardBody, CardHeader, CardTitle, Input } from '../../components/ui'
import { formatDateTR } from '../../utils/formatters'
import { suggestKullaniciAdi } from '../../lib/suggestKullaniciAdi'
import { normalizeKullaniciAdi } from '../../lib/normalizeKullaniciAdi'

function todayYmd(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function addMonths(base: Date, months: number): Date {
  const n = new Date(base)
  n.setMonth(n.getMonth() + months)
  return n
}

function addDays(base: Date, days: number): Date {
  const n = new Date(base)
  n.setDate(n.getDate() + days)
  return n
}

function ymdToDate(ymd: string): Date {
  const [y, m, d] = ymd.split('-').map(Number)
  return new Date(y, m - 1, d)
}

function dateToYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

function computeBitisYmd(paket: AdminCreateTenantLisansPaketi, baslangicYmd: string, ozelBitis: string): string {
  if (paket === 'OZEL') return ozelBitis
  const base = ymdToDate(baslangicYmd)
  switch (paket) {
    case 'DEMO':
      return dateToYmd(addDays(base, 14))
    case 'AYLIK':
      return dateToYmd(addMonths(base, 1))
    case 'UC_AY':
      return dateToYmd(addMonths(base, 3))
    case 'ALTI_AY':
      return dateToYmd(addMonths(base, 6))
    case 'YILLIK':
      return dateToYmd(addMonths(base, 12))
    default:
      return ozelBitis
  }
}

function suggestFromOwner(eposta: string, adSoyad: string, buroAdi: string): string {
  const fromEmail = eposta.split('@')[0] ?? ''
  return suggestKullaniciAdi(fromEmail || adSoyad || buroAdi)
}

const PAKET_LABELS: Record<AdminCreateTenantLisansPaketi, string> = {
  DEMO: 'Deneme / Demo',
  AYLIK: 'Aylık',
  UC_AY: '3 Aylık',
  ALTI_AY: '6 Aylık',
  YILLIK: 'Yıllık',
  OZEL: 'Özel tarih'
}

export function AdminCreateTenantPage(): ReactElement {
  const { admin } = useAdminAuth()
  const isSuper = admin?.rol === 'SUPER_ADMIN'
  const navigate = useNavigate()
  const qc = useQueryClient()

  const [buroAdi, setBuroAdi] = useState('')
  const [slug, setSlug] = useState('')
  const [telefon, setTelefon] = useState('')
  const [eposta, setEposta] = useState('')
  const [adres, setAdres] = useState('')
  const [vergiNo, setVergiNo] = useState('')
  const [vergiDairesi, setVergiDairesi] = useState('')

  const [ownerAdSoyad, setOwnerAdSoyad] = useState('')
  const [ownerEposta, setOwnerEposta] = useState('')
  const [ownerTelefon, setOwnerTelefon] = useState('')
  const [kullaniciAdi, setKullaniciAdi] = useState('')
  const [kullaniciAdiManuel, setKullaniciAdiManuel] = useState(false)
  const [parolaModu, setParolaModu] = useState<'AKTIVASYON_MAIL' | 'MANUEL'>('AKTIVASYON_MAIL')
  const [ownerSifre, setOwnerSifre] = useState('')

  const [lisansPaketi, setLisansPaketi] = useState<AdminCreateTenantLisansPaketi>('DEMO')
  const [lisansDurumu, setLisansDurumu] = useState<'AKTIF' | 'DEMO' | 'PASIF'>('DEMO')
  const [demoMu, setDemoMu] = useState(true)
  const [lisansBaslangic, setLisansBaslangic] = useState(todayYmd())
  const [lisansBitis, setLisansBitis] = useState('')
  const [yillikUcret, setYillikUcret] = useState('')
  const [sonOdeme, setSonOdeme] = useState('')
  const [lisansNotu, setLisansNotu] = useState('')

  const [gonderAktivasyon, setGonderAktivasyon] = useState(true)
  const [gonderHosgeldin, setGonderHosgeldin] = useState(true)

  const [formErr, setFormErr] = useState<string | null>(null)

  useEffect(() => {
    if (kullaniciAdiManuel) return
    setKullaniciAdi(suggestFromOwner(ownerEposta, ownerAdSoyad, buroAdi))
  }, [ownerEposta, ownerAdSoyad, buroAdi, kullaniciAdiManuel])

  useEffect(() => {
    if (lisansPaketi === 'DEMO') {
      setLisansDurumu('DEMO')
      setDemoMu(true)
    }
  }, [lisansPaketi])

  const autoBitis = useMemo(() => {
    if (lisansPaketi === 'OZEL') return lisansBitis
    return computeBitisYmd(lisansPaketi, lisansBaslangic, lisansBitis)
  }, [lisansPaketi, lisansBaslangic, lisansBitis])

  useEffect(() => {
    if (lisansPaketi === 'OZEL') return
    setLisansBitis(computeBitisYmd(lisansPaketi, lisansBaslangic, ''))
  }, [lisansPaketi, lisansBaslangic])

  const normalizedUsernamePreview = normalizeKullaniciAdi(kullaniciAdi)

  const createM = useMutation({
    mutationFn: (body: AdminCreateTenantPayload) => adminCreateTenantRequest(body),
    onMutate: () => setFormErr(null),
    onSuccess: (data) => {
      void qc.invalidateQueries({ queryKey: ['admin-tenants'] })
      void qc.invalidateQueries({ queryKey: ['admin-dashboard'] })
      const toast = 'Üyelik oluşturuldu. Lisans anahtarı üretildi.'
      const mailWarning =
        !data.mailSent && (gonderAktivasyon || gonderHosgeldin)
          ? `Kayıt oluşturuldu ancak mail gönderilemedi${data.mailError ? `: ${data.mailError}` : '.'}`
          : undefined
      navigate(`/admin/burolar/${data.tenant.id}`, {
        state: { toast: mailWarning ? `${toast} ${mailWarning}` : toast }
      })
    },
    onError: (e: unknown) => {
      setFormErr(e instanceof Error ? e.message : 'Oluşturulamadı.')
    }
  })

  function validateEmail(s: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim())
  }

  function buildPayload(): AdminCreateTenantPayload | null {
    setFormErr(null)
    if (!buroAdi.trim()) {
      setFormErr('Büro adı zorunludur.')
      return null
    }
    if (!ownerAdSoyad.trim()) {
      setFormErr('Sahip kullanıcı ad soyad zorunludur.')
      return null
    }
    if (!ownerEposta.trim()) {
      setFormErr('Sahip e-posta zorunludur.')
      return null
    }
    if (!validateEmail(ownerEposta)) {
      setFormErr('Geçerli bir sahip e-postası girin.')
      return null
    }
    if (eposta.trim() && !validateEmail(eposta)) {
      setFormErr('Geçerli bir büro e-postası girin.')
      return null
    }
    if (!lisansPaketi) {
      setFormErr('Lisans tipi zorunludur.')
      return null
    }
    const bitis = lisansPaketi === 'OZEL' ? lisansBitis.trim() : autoBitis
    if (!bitis) {
      setFormErr('Lisans bitiş tarihi zorunludur.')
      return null
    }
    const bitisDay = ymdToDate(bitis)
    bitisDay.setHours(0, 0, 0, 0)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (bitisDay.getTime() < today.getTime()) {
      setFormErr('Bitiş tarihi bugünden önce olamaz.')
      return null
    }
    if (parolaModu === 'MANUEL' && (!ownerSifre || ownerSifre.length < 8)) {
      setFormErr('Manuel parola en az 8 karakter olmalıdır.')
      return null
    }

    const yu = yillikUcret.trim()
    const yillikUcretVal = yu === '' ? null : Number.isFinite(Number(yu)) ? Number(yu) : null
    if (yu !== '' && yillikUcretVal == null) {
      setFormErr('Yıllık ücret geçerli bir sayı olmalı veya boş bırakılmalıdır.')
      return null
    }

    const username = normalizeKullaniciAdi(kullaniciAdi)
    if (username.length < 3) {
      setFormErr('Kullanıcı adı en az 3 karakter olmalı (otomatik öneri kullanılabilir).')
      return null
    }

    return {
      buroAdi: buroAdi.trim(),
      slug: slug.trim() || undefined,
      telefon: telefon.trim() || undefined,
      eposta: eposta.trim() || undefined,
      adres: adres.trim() || undefined,
      vergiNo: vergiNo.trim() || undefined,
      vergiDairesi: vergiDairesi.trim() || undefined,
      ownerAdSoyad: ownerAdSoyad.trim(),
      ownerKullaniciAdi: username,
      ownerEposta: ownerEposta.trim(),
      ownerTelefon: ownerTelefon.trim() || telefon.trim() || undefined,
      parolaModu,
      ownerSifre: parolaModu === 'MANUEL' ? ownerSifre : undefined,
      lisansPaketi,
      lisansDurumu,
      demoMu,
      lisansBaslangicTarihi: lisansBaslangic,
      lisansBitisTarihi: bitis,
      sonOdemeTarihi: sonOdeme.trim() || null,
      yillikUcret: yillikUcretVal,
      lisansNotlari: lisansNotu.trim() || undefined,
      gonderAktivasyonMaili: gonderAktivasyon,
      gonderHosgeldinMaili: gonderHosgeldin
    }
  }

  function onSubmit(e: FormEvent): void {
    e.preventDefault()
    const payload = buildPayload()
    if (payload) void createM.mutateAsync(payload)
  }

  if (!isSuper) {
    return <Navigate to="/admin/burolar" replace />
  }

  return (
    <div className="w-full max-w-none space-y-4">
      <AdminBreadcrumb
        items={[
          { label: 'Ana Sayfa', to: '/admin' },
          { label: 'Super Admin', to: '/admin' },
          { label: 'Büro / Lisans Yönetimi', to: '/admin/burolar' },
          { label: 'Yeni Üyelik Aç' }
        ]}
      />

      <div className="flex flex-wrap items-start gap-3">
        <Link
          to="/admin/burolar"
          className="inline-flex h-8 items-center rounded border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          ← Geri
        </Link>
        <div>
          <h1 className="text-lg font-semibold text-slate-900">Yeni Üyelik Aç</h1>
          <p className="mt-1 text-sm text-slate-600">Yeni büro, owner kullanıcı ve SaaS lisansı oluşturun.</p>
        </div>
      </div>

      <form onSubmit={onSubmit}>
        <div className="grid gap-4 xl:grid-cols-2">
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="border-b border-slate-100 py-3">
              <CardTitle className="text-sm">Büro / Şirket Bilgisi</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 p-4">
              <Input label="Büro adı / şirket adı *" value={buroAdi} onChange={(e) => setBuroAdi(e.target.value)} disabled={createM.isPending} />
              <Input
                label="Büro kısa kodu / slug"
                hint="Boş bırakılırsa büro adından otomatik üretilir."
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                disabled={createM.isPending}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input label="Telefon" value={telefon} onChange={(e) => setTelefon(e.target.value)} disabled={createM.isPending} />
                <Input label="E-posta" type="email" value={eposta} onChange={(e) => setEposta(e.target.value)} disabled={createM.isPending} />
              </div>
              <Input label="Vergi no" value={vergiNo} onChange={(e) => setVergiNo(e.target.value)} disabled={createM.isPending} />
              <Input label="Vergi dairesi" value={vergiDairesi} onChange={(e) => setVergiDairesi(e.target.value)} disabled={createM.isPending} />
              <Input label="Adres" value={adres} onChange={(e) => setAdres(e.target.value)} disabled={createM.isPending} />
            </CardBody>
          </Card>

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="border-b border-slate-100 py-3">
              <CardTitle className="text-sm">Owner Kullanıcı Bilgisi</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 p-4">
              <Input label="Ad soyad *" value={ownerAdSoyad} onChange={(e) => setOwnerAdSoyad(e.target.value)} disabled={createM.isPending} />
              <Input label="E-posta *" type="email" value={ownerEposta} onChange={(e) => setOwnerEposta(e.target.value)} disabled={createM.isPending} />
              <Input label="Telefon" value={ownerTelefon} onChange={(e) => setOwnerTelefon(e.target.value)} disabled={createM.isPending} />
              <Input
                label="Kullanıcı adı"
                hint={`Boş bırakılırsa e-posta veya ad soyaddan üretilir. Teknik kullanıcı adı: ${normalizedUsernamePreview || '—'}`}
                value={kullaniciAdi}
                onChange={(e) => {
                  setKullaniciAdiManuel(true)
                  setKullaniciAdi(normalizeKullaniciAdi(e.target.value))
                }}
                onBlur={() => setKullaniciAdi((v) => normalizeKullaniciAdi(v))}
                disabled={createM.isPending}
              />
              <div>
                <p className="mb-2 text-xs font-semibold text-slate-600">Parola oluşturma yöntemi</p>
                <div className="space-y-2 text-sm">
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="parolaModu"
                      checked={parolaModu === 'AKTIVASYON_MAIL'}
                      onChange={() => setParolaModu('AKTIVASYON_MAIL')}
                      disabled={createM.isPending}
                    />
                    Otomatik aktivasyon maili gönder
                  </label>
                  <label className="flex cursor-pointer items-center gap-2">
                    <input
                      type="radio"
                      name="parolaModu"
                      checked={parolaModu === 'MANUEL'}
                      onChange={() => setParolaModu('MANUEL')}
                      disabled={createM.isPending}
                    />
                    Manuel geçici parola belirle
                  </label>
                </div>
              </div>
              {parolaModu === 'MANUEL' ? (
                <>
                  <Input
                    label="Geçici parola *"
                    type="password"
                    autoComplete="new-password"
                    value={ownerSifre}
                    onChange={(e) => setOwnerSifre(e.target.value)}
                    disabled={createM.isPending}
                  />
                  <PasswordGenerator disabled={createM.isPending} onApply={(pwd) => setOwnerSifre(pwd)} />
                </>
              ) : (
                <p className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                  Kullanıcı ilk girişte aktivasyon bağlantısı ile şifresini belirleyebilir.
                </p>
              )}
            </CardBody>
          </Card>

          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader className="border-b border-slate-100 py-3">
              <CardTitle className="text-sm">Lisans / Abonelik Bilgisi</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 p-4">
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Lisans tipi *</label>
                <select
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm"
                  value={lisansPaketi}
                  onChange={(e) => setLisansPaketi(e.target.value as AdminCreateTenantLisansPaketi)}
                  disabled={createM.isPending}
                >
                  {Object.entries(PAKET_LABELS).map(([k, label]) => (
                    <option key={k} value={k}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold text-slate-600">Lisans durumu *</label>
                <select
                  className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm"
                  value={lisansDurumu}
                  onChange={(e) => setLisansDurumu(e.target.value as 'AKTIF' | 'DEMO' | 'PASIF')}
                  disabled={createM.isPending}
                >
                  <option value="AKTIF">AKTIF</option>
                  <option value="DEMO">DEMO</option>
                  <option value="PASIF">PASIF</option>
                </select>
              </div>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={demoMu} onChange={(e) => setDemoMu(e.target.checked)} disabled={createM.isPending} />
                Demo mu?
              </label>
              <Input
                label="Lisans başlangıç tarihi"
                type="date"
                value={lisansBaslangic}
                onChange={(e) => setLisansBaslangic(e.target.value)}
                disabled={createM.isPending}
              />
              {lisansPaketi === 'OZEL' ? (
                <Input
                  label="Lisans bitiş tarihi *"
                  type="date"
                  value={lisansBitis}
                  onChange={(e) => setLisansBitis(e.target.value)}
                  disabled={createM.isPending}
                />
              ) : (
                <div>
                  <p className="mb-1 text-xs font-semibold text-slate-600">Lisans bitiş tarihi</p>
                  <p className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-900">
                    {autoBitis ? formatDateTR(ymdToDate(autoBitis).toISOString()) : '—'}
                  </p>
                </div>
              )}
              <Input label="Yıllık ücret / satış tutarı" type="number" value={yillikUcret} onChange={(e) => setYillikUcret(e.target.value)} disabled={createM.isPending} />
              <Input label="Son ödeme tarihi" type="date" value={sonOdeme} onChange={(e) => setSonOdeme(e.target.value)} disabled={createM.isPending} />
              <Input label="Lisans notu" value={lisansNotu} onChange={(e) => setLisansNotu(e.target.value)} disabled={createM.isPending} />
            </CardBody>
          </Card>

          <div className="space-y-4">
            <Card className="border-slate-200/80 shadow-sm">
              <CardHeader className="border-b border-slate-100 py-3">
                <CardTitle className="text-sm">Lisans Anahtarı</CardTitle>
              </CardHeader>
              <CardBody className="p-4">
                <p className="text-sm text-slate-700">
                  Lisans anahtarı otomatik oluşturulacak. Oluşturma sonrası büro detay sayfasında görüntülenip kopyalanabilir.
                </p>
              </CardBody>
            </Card>

            <Card className="border-slate-200/80 shadow-sm">
              <CardHeader className="border-b border-slate-100 py-3">
                <CardTitle className="text-sm">Mail Seçenekleri</CardTitle>
              </CardHeader>
              <CardBody className="space-y-2 p-4 text-sm">
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={gonderAktivasyon} onChange={(e) => setGonderAktivasyon(e.target.checked)} disabled={createM.isPending || parolaModu === 'MANUEL'} />
                  Aktivasyon maili gönder
                </label>
                <label className="flex cursor-pointer items-center gap-2">
                  <input type="checkbox" checked={gonderHosgeldin} onChange={(e) => setGonderHosgeldin(e.target.checked)} disabled={createM.isPending || parolaModu === 'MANUEL'} />
                  Hoş geldin maili gönder
                </label>
                {parolaModu === 'MANUEL' ? (
                  <p className="text-xs text-slate-500">Manuel parola modunda aktivasyon maili gönderilmez; geçici parolayı kullanıcıya iletin.</p>
                ) : null}
              </CardBody>
            </Card>

            {formErr ? (
              <AlertBox variant="danger" title="Hata">
                {formErr}
              </AlertBox>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2 border-t border-slate-100 pt-2">
              <Button type="button" variant="outline" disabled={createM.isPending} onClick={() => navigate('/admin/burolar')}>
                İptal
              </Button>
              <Button type="submit" disabled={createM.isPending}>
                {createM.isPending ? 'Oluşturuluyor…' : 'Üyelik Oluştur'}
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
