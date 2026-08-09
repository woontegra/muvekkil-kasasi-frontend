import { useQuery } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { getCurrentLicense } from '../../../api/license'
import { useAuth } from '../../../contexts/AuthContext'
import { cn } from '../../../lib/cn'
import { Badge } from '../../ui'
import type { AuthUserDto } from '../../../types/auth'
import type { LicenseWarningLevel, TenantLicenseCurrent } from '../../../types/license'
import { formatDateTR } from '../../../utils/formatters'
import { AyarlarPanelShell, SettingRow } from '../shared'

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

function statusBadgeVariant(d: TenantLicenseCurrent['lisansDurumu']): 'success' | 'warning' | 'danger' | 'default' {
  if (d === 'AKTIF') return 'success'
  if (d === 'DEMO') return 'warning'
  if (d === 'SURESI_DOLDU') return 'danger'
  return 'default'
}

function licenseAccentClass(level: LicenseWarningLevel): string {
  switch (level) {
    case 'NORMAL':
      return 'border-emerald-200/80 bg-emerald-50/50'
    case 'YAKLASIYOR':
      return 'border-amber-200/80 bg-amber-50/50'
    case 'KRITIK':
      return 'border-orange-300/80 bg-orange-50/50'
    case 'BITTI':
      return 'border-red-300/80 bg-red-50/50'
    case 'PASIF':
      return 'border-slate-300 bg-slate-50'
    default:
      return 'border-border bg-surface-muted/20'
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
      return 'Lisans süreniz sona ermiştir. Yeni kayıt ve düzenleme işlemleri kapatılmıştır.'
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

export function LisansKullanimPanel(): ReactElement {
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
    <AyarlarPanelShell title="Lisans & Kullanım" description="Büro lisans durumu ve kullanım bilgileri.">
      {q.isLoading ? <p className="text-sm text-ink-muted">Lisans bilgisi yükleniyor…</p> : null}
      {q.isError ? (
        <p className="text-sm text-danger">{q.error instanceof Error ? q.error.message : 'Lisans bilgisi alınamadı.'}</p>
      ) : null}

      {lic ? (
        <div className="space-y-4">
          {lic.demoMu ? (
            <div className="rounded-lg border border-amber-300/80 bg-amber-50 px-4 py-3 text-sm text-amber-950">
              <p className="font-semibold">Demo hesap</p>
              <p className="mt-1 text-amber-900/90">
                {lic.demoBitisTarihi
                  ? `Demo bitiş: ${formatDateTR(lic.demoBitisTarihi)}`
                  : 'Demo süresi tanımlı değil.'}
              </p>
            </div>
          ) : null}

          <div className={cn('rounded-lg border p-4 shadow-sm', licenseAccentClass(lic.uyariSeviyesi))}>
            <p className="text-sm font-medium text-ink">{licenseLeadText(lic, role)}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">Lisans durumu</p>
                <div className="mt-1">
                  <Badge variant={statusBadgeVariant(lic.lisansDurumu)} className="normal-case tracking-normal">
                    {lisansDurumuLabel(lic.lisansDurumu)}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">Bitiş</p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-ink">{displayLicenseDate(lic.lisansBitisTarihi)}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-ink-muted">Kalan</p>
                <p className="mt-1 text-sm font-semibold tabular-nums text-ink">{displayKalanGun(lic)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-lg border border-border bg-white px-4 py-1 shadow-sm sm:px-5">
            <SettingRow label="Büro adı" value={lic.buroAdi} />
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
        </div>
      ) : null}
    </AyarlarPanelShell>
  )
}
