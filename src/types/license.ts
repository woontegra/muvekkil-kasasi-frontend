export type LicenseWarningLevel = 'NORMAL' | 'YAKLASIYOR' | 'KRITIK' | 'BITTI' | 'PASIF' | 'BILGI_EKSIK'

export type TenantLicenseCurrent = {
  ok: true
  tenantId: string
  buroAdi: string
  lisansDurumu: 'DEMO' | 'AKTIF' | 'SURESI_DOLDU' | 'PASIF'
  lisansBaslangicTarihi: string | null
  lisansBitisTarihi: string | null
  demoMu: boolean
  demoBitisTarihi: string | null
  kalanGun: number | null
  uyariSeviyesi: LicenseWarningLevel
  bilgiMesaji?: string | null
  yazmaIzinli: boolean
  yillikUcret?: string | null
}
