import type { ReactElement, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { getCurrentLicense } from '../api/license'
import { APP_BASE } from '../config/appPaths'
import { useAuth } from '../contexts/AuthContext'
import { cn } from '../lib/cn'
import { roleLabel } from '../lib/roleLabel'
import { AlertBox, Button, Card, CardBody, CardHeader, CardTitle, Input, PageHeader } from '../components/ui'

import type { AuthUserDto } from '../types/auth'
import type { LicenseWarningLevel, TenantLicenseCurrent } from '../types/license'
import { formatDateTR } from '../utils/formatters'

function lisansDurumuLabel(d: TenantLicenseCurrent['lisansDurumu']): string {
  switch (d) {
    case 'AKTIF':
      return 'Aktif'
    case 'DEMO':
      return 'Demo'
    case 'SURESI_DOLDU':
      return 'Süresi doldu'
    case 'PASIF':
      return 'Pasif'
    default:
      return d
  }
}

function licenseCardClass(level: LicenseWarningLevel): string {
  switch (level) {
    case 'NORMAL':
      return 'border-emerald-200/90 bg-gradient-to-br from-emerald-50/90 to-white shadow-sm'
    case 'YAKLASIYOR':
      return 'border-amber-300 bg-gradient-to-br from-amber-50 to-white shadow-sm'
    case 'KRITIK':
      return 'border-orange-400 bg-gradient-to-br from-orange-50 to-amber-50/80 shadow-md'
    case 'BITTI':
      return 'border-red-400 bg-gradient-to-br from-red-50 to-white shadow-md'
    case 'PASIF':
      return 'border-slate-400 bg-slate-100/80 shadow-sm'
    case 'BILGI_EKSIK':
      return 'border-sky-300 bg-gradient-to-br from-sky-50 to-white shadow-sm'
    default:
      return 'border-border bg-panel'
  }
}

function licenseLeadText(lic: TenantLicenseCurrent, role?: AuthUserDto['role']): string {
  const katip = role === 'KATIP_PERSONEL'
  if (katip && (lic.uyariSeviyesi === 'YAKLASIYOR' || lic.uyariSeviyesi === 'KRITIK')) {
    return 'Lisans süresi yaklaşıyor. Yenileme için büro yöneticiniz veya Woontegra ile iletişime geçin.'
  }
  switch (lic.uyariSeviyesi) {
    case 'NORMAL':
      return 'Lisansınız aktif.'
    case 'YAKLASIYOR':
      return `Lisansınızın bitmesine ${lic.kalanGun ?? '—'} gün kaldı.`
    case 'KRITIK':
      return `Lisansınızın bitmesine ${lic.kalanGun ?? '—'} gün kaldı. Yenileme için Woontegra ile iletişime geçin.`
    case 'BITTI':
      return 'Lisans süreniz sona erdi. Yeni kayıt oluşturma işlemleri kısıtlanabilir.'
    case 'PASIF':
      return 'Büro erişimi pasif durumda.'
    case 'BILGI_EKSIK':
      return lic.bilgiMesaji ?? 'Lisans bitiş tarihi henüz tanımlanmamış.'
    default:
      return ''
  }
}

function displayLicenseDate(iso: string | null | undefined): string {
  return iso ? formatDateTR(iso) : 'Tanımlanmamış'
}

function displayKalanGun(lic: TenantLicenseCurrent): string {
  if (lic.uyariSeviyesi === 'BILGI_EKSIK') return 'Bitiş tarihi tanımlanmamış'
  if (lic.kalanGun != null) return `${lic.kalanGun} gün`
  return 'Hesaplanamadı'
}

function AyarlarLicenseCard(): ReactElement {
  const { session } = useAuth()
  const role = session?.user.role
  const showFullLicenseDetail = role === 'BURO_SAHIBI' || role === 'AVUKAT_YONETICI'

  const q = useQuery({
    queryKey: ['tenant-license-current'],
    queryFn: getCurrentLicense,
    staleTime: 60_000,
    refetchOnWindowFocus: true
  })
  const lic = q.data

  return (
    <Card className={cn('min-w-0 overflow-hidden', lic ? licenseCardClass(lic.uyariSeviyesi) : 'border-border')}>
      <CardHeader className="border-b border-black/5 bg-white/40">
        <CardTitle className="text-base">Lisans ve kullanım durumu</CardTitle>
      </CardHeader>
      <CardBody className="space-y-3 px-4 py-4 sm:px-5">
        {q.isLoading ? <p className="text-sm text-ink-muted">Lisans bilgisi yükleniyor…</p> : null}
        {q.isError ? (
          <p className="text-sm text-danger">{q.error instanceof Error ? q.error.message : 'Lisans bilgisi alınamadı.'}</p>
        ) : null}
        {lic ? (
          <>
            <p className="text-sm font-medium leading-snug text-ink">{licenseLeadText(lic, role)}</p>
            <div className="space-y-0 rounded-lg border border-black/5 bg-white/60 px-3 py-1">
              <SettingRow label="Büro adı" value={lic.buroAdi} />
              <SettingRow label="Lisans durumu" value={lisansDurumuLabel(lic.lisansDurumu)} />
              {showFullLicenseDetail ? (
                <>
                  <SettingRow label="Lisans başlangıç" value={displayLicenseDate(lic.lisansBaslangicTarihi)} />
                  <SettingRow label="Lisans bitiş" value={displayLicenseDate(lic.lisansBitisTarihi)} />
                  <SettingRow label="Kalan gün" value={displayKalanGun(lic)} />
                </>
              ) : null}
              <SettingRow label="Demo" value={lic.demoMu ? 'Evet' : 'Hayır'} />
              {showFullLicenseDetail && lic.demoMu && lic.demoBitisTarihi ? (
                <SettingRow label="Demo bitiş" value={formatDateTR(lic.demoBitisTarihi)} />
              ) : null}
              {lic.yillikUcret != null ? <SettingRow label="Yıllık ücret" value={`${lic.yillikUcret} TL`} /> : null}
            </div>
          </>
        ) : null}
      </CardBody>
    </Card>
  )
}

function SettingRow(props: { label: string; value: ReactNode; mono?: boolean }): ReactElement {
  const { label, value, mono } = props
  return (
    <div className="flex flex-col gap-0.5 border-b border-border py-2.5 last:border-b-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
      <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-ink-muted">{label}</span>
      <span className={`min-w-0 text-sm text-ink ${mono ? 'font-mono text-[13px]' : ''}`}>{value ?? '—'}</span>
    </div>
  )
}

function ModalShell(props: { title: string; onClose: () => void; children: ReactNode }): ReactElement {
  const { title, onClose, children } = props
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4 backdrop-blur-[1px]">
      <div
        role="dialog"
        aria-modal="true"
        className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl border border-border bg-white p-5 shadow-xl dark:bg-surface-elevated"
      >
        <div className="mb-4 flex items-start justify-between gap-2">
          <h2 className="text-base font-bold text-ink">{title}</h2>
          <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0" onClick={onClose}>
            ✕
          </Button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function AyarlarPage(): ReactElement {
  const { session } = useAuth()
  const [officeModalOpen, setOfficeModalOpen] = useState(false)
  const isBuroSahibi = session?.user.role === 'BURO_SAHIBI'

  const tenant = session?.tenant
  const user = session?.user

  const [draftBuroAdi, setDraftBuroAdi] = useState('')
  const [draftTelefon, setDraftTelefon] = useState('')
  const [draftEposta, setDraftEposta] = useState('')
  const [draftAdres, setDraftAdres] = useState('')
  const [draftVergiNo, setDraftVergiNo] = useState('')
  const [draftVergiDairesi, setDraftVergiDairesi] = useState('')

  useEffect(() => {
    if (!officeModalOpen || !tenant) return
    setDraftBuroAdi(tenant.buroAdi ?? '')
    setDraftTelefon(tenant.telefon ?? '')
    setDraftEposta(tenant.eposta ?? '')
    setDraftAdres(tenant.adres ?? '')
    setDraftVergiNo(tenant.vergiNo ?? '')
    setDraftVergiDairesi(tenant.vergiDairesi ?? '')
  }, [officeModalOpen, tenant])

  return (
    <div className="w-full max-w-none space-y-5">
      <PageHeader
        title="Ayarlar"
        description="Büro bilgileri, kullanıcı tercihleri, veri aktarımı ve sistem ayarları."
      />

      <AyarlarLicenseCard />

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="min-w-0">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base">Büro bilgileri</CardTitle>
          </CardHeader>
          <CardBody className="space-y-0 px-4 py-1 sm:px-5">
            <SettingRow label="Büro adı" value={tenant?.buroAdi} />
            <SettingRow label="Telefon" value={tenant?.telefon} />
            <SettingRow label="E-posta" value={tenant?.eposta} />
            <SettingRow label="Adres" value={tenant?.adres} />
            <SettingRow label="Vergi no" value={tenant?.vergiNo} />
            <SettingRow label="Vergi dairesi" value={tenant?.vergiDairesi} />
            <div className="py-2.5">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Büro kodu</p>
              <p className="mt-0.5 font-mono text-xs text-ink-subtle">{tenant?.slug ?? '—'}</p>
              <p className="mt-1 text-[11px] leading-snug text-ink-subtle">
                Teknik tanımlayıcıdır; değiştirilemez.
              </p>
            </div>
            <div className="pt-2 pb-4">
              <Button type="button" variant="outline" size="sm" onClick={() => setOfficeModalOpen(true)}>
                Büro bilgilerini düzenle
              </Button>
            </div>
          </CardBody>
        </Card>

        <Card className="min-w-0">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base">Kullanıcı ve yetki</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3 px-4 py-4 sm:px-5">
            <SettingRow label="Kullanıcı adı" value={user?.kullaniciAdi} mono />
            <SettingRow label="Ad soyad" value={user?.adSoyad} />
            <SettingRow label="Rol" value={user ? roleLabel(user.role) : null} />
            <p className="rounded-lg bg-surface-muted/60 px-3 py-2 text-xs leading-relaxed text-ink-muted">
              Şifre değiştirme ve hesap güvenliği seçenekleri bir sonraki sürümde bu ekrandan yönetilebilecek.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link
                to={`${APP_BASE}/kullanicilar`}
                className="inline-flex h-8 items-center justify-center rounded-md border border-border-strong bg-white px-3 text-xs font-semibold text-ink shadow-sm hover:bg-surface-muted dark:bg-surface-elevated"
              >
                Kullanıcıları yönet
              </Link>
            </div>
          </CardBody>
        </Card>

        {isBuroSahibi ? (
          <Card className="min-w-0">
            <CardHeader className="border-b border-border">
              <CardTitle className="text-base">Veri ve aktarım</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3 px-4 py-4 sm:px-5">
              <div>
                <p className="text-sm font-semibold text-ink">Masaüstünden içe aktar</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-muted">
                  Masaüstü Kasa Defteri uygulamasından aldığınız <strong className="text-ink">.sqlite</strong> yedeğini
                  bu SaaS bürosuna aktarabilirsiniz. Mevcut verileriniz silinmez; yedek satırları eklenir. Aynı yedeğin
                  tekrar aktarılması parmak izi ile engellenir.
                </p>
              </div>
              <Link
                to={`${APP_BASE}/ayarlar/masaustu-ice-aktar`}
                className="inline-flex h-8 items-center justify-center rounded-md border border-primary bg-primary px-3 text-xs font-semibold text-primary-fg shadow-sm hover:bg-primary-hover"
              >
                Masaüstünden içe aktar
              </Link>
            </CardBody>
          </Card>
        ) : null}

        <Card className={cn('min-w-0', !isBuroSahibi && 'lg:col-span-2')}>
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base">Güvenlik ve denetim</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3 px-4 py-4 text-sm leading-relaxed text-ink-muted sm:px-5">
            <ul className="list-inside list-disc space-y-1.5">
              <li>Onaylı dosya kasası ve ofis kasası hareketleri doğrudan değiştirilmez.</li>
              <li>Düzeltmeler ayrı kayıt olarak tutulur ve onay akışından geçer.</li>
              <li>Önemli işlemler denetim (audit) günlüğüne yazılır.</li>
            </ul>
            <Button type="button" size="sm" variant="outline" disabled title="Denetim listesi API üzerinden eklenecek">
              Denetim kayıtları
            </Button>
          </CardBody>
        </Card>

        <Card className="min-w-0 lg:col-span-2">
          <CardHeader className="border-b border-border">
            <CardTitle className="text-base">Sistem bilgisi</CardTitle>
          </CardHeader>
          <CardBody className="grid gap-4 px-4 py-4 sm:grid-cols-2 sm:px-5 lg:grid-cols-4">
            <div>
              <p className="text-xs font-semibold uppercase text-ink-muted">Ürün</p>
              <p className="mt-1 text-sm font-medium text-ink">Müvekkil Kasa Defteri SaaS</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-ink-muted">Firma</p>
              <p className="mt-1 text-sm font-medium text-ink">Woontegra Teknoloji Yazılım ve Dijital Hizmetler Ltd. Şti.</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-ink-muted">Sürüm</p>
              <p className="mt-1 text-sm font-medium tabular-nums text-ink">1.0</p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase text-ink-muted">Ortam</p>
              <p className="mt-1 text-sm font-medium text-ink">Web SaaS</p>
            </div>
          </CardBody>
        </Card>
      </div>

      {officeModalOpen && tenant ? (
        <ModalShell title="Büro bilgilerini düzenle" onClose={() => setOfficeModalOpen(false)}>
          <p className="mb-3 text-xs leading-relaxed text-ink-muted">
            Aşağıdaki alanlar oturumdaki büro bilgisinden doldurulur. Kayıt için backend uç noktası bağlandığında bu
            form etkinleştirilecek.
          </p>
          <div className="space-y-3">
            <Input label="Büro adı" value={draftBuroAdi} onChange={(e) => setDraftBuroAdi(e.target.value)} readOnly />
            <Input label="Telefon" value={draftTelefon} onChange={(e) => setDraftTelefon(e.target.value)} readOnly />
            <Input label="E-posta" value={draftEposta} onChange={(e) => setDraftEposta(e.target.value)} readOnly />
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">Adres</label>
              <textarea
                readOnly
                className="min-h-[72px] w-full rounded-md border border-border bg-surface-muted/40 px-3 py-2 text-sm text-ink"
                value={draftAdres}
                onChange={(e) => setDraftAdres(e.target.value)}
              />
            </div>
            <Input label="Vergi no" value={draftVergiNo} onChange={(e) => setDraftVergiNo(e.target.value)} readOnly />
            <Input
              label="Vergi dairesi"
              value={draftVergiDairesi}
              onChange={(e) => setDraftVergiDairesi(e.target.value)}
              readOnly
            />
          </div>
          <AlertBox variant="warning" title="Kayıt" className="mt-4">
            Bu sürümde büro bilgisi güncellemesi sunucuya gönderilmez; alanlar yalnızca gösterim ve form iskeleti içindir.
          </AlertBox>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOfficeModalOpen(false)}>
              Kapat
            </Button>
            <Button type="button" size="sm" disabled title="API hazır olduğunda etkinleşecek">
              Kaydet
            </Button>
          </div>
        </ModalShell>
      ) : null}
    </div>
  )
}
