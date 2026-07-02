export type SuperAdminRoleDto = 'SUPER_ADMIN' | 'DESTEK' | 'FINANS'

export type AdminUserDto = {
  id: string
  adSoyad: string
  kullaniciAdi: string
  eposta: string | null
  rol: SuperAdminRoleDto
  aktifMi: boolean
  sonGirisTarihi: string | null
  createdAt: string
  updatedAt: string
}

export type AdminLoginResponse = {
  ok: true
  adminAccessToken: string
  adminUser: AdminUserDto
}

export type AdminMeResponse = {
  ok: true
  adminUser: AdminUserDto
}

export type TenantLicenseStatusDto = 'DEMO' | 'AKTIF' | 'SURESI_DOLDU' | 'PASIF'

export type AdminTenantListItem = {
  id: string
  buroAdi: string
  slug: string
  eposta: string | null
  telefon: string | null
  aktifMi: boolean
  lisansDurumu: TenantLicenseStatusDto
  lisansBaslangicTarihi: string | null
  lisansBitisTarihi: string | null
  demoMu: boolean
  demoBitisTarihi: string | null
  lisansAnahtari: string | null
  musteriNo: string | null
  sahipAdSoyad: string | null
  sahipKullaniciAdi: string | null
  kalanGun: number | null
  toplamKullanici: number
  toplamMuvekkil: number
  toplamDosya: number
  createdAt: string
}

export type AdminTenantsListResponse = {
  ok: true
  items: AdminTenantListItem[]
  total: number
  page: number
  limit: number
}

export type AdminCreateTenantLicenseBirim = 'GUN' | 'AY' | 'YIL'
export type AdminCreateTenantLicenseTipi = 'DEMO' | 'AKTIF'
export type AdminCreateTenantLisansPaketi = 'DEMO' | 'AYLIK' | 'UC_AY' | 'ALTI_AY' | 'YILLIK' | 'OZEL'
export type AdminCreateTenantParolaModu = 'AKTIVASYON_MAIL' | 'MANUEL'

export type AdminCreateTenantPayload = {
  buroAdi: string
  slug?: string
  telefon?: string
  eposta?: string
  adres?: string
  vergiNo?: string
  vergiDairesi?: string
  ownerAdSoyad: string
  ownerKullaniciAdi?: string
  ownerEposta: string
  ownerTelefon?: string
  parolaModu: AdminCreateTenantParolaModu
  ownerSifre?: string
  lisansPaketi: AdminCreateTenantLisansPaketi
  lisansDurumu: 'AKTIF' | 'DEMO' | 'PASIF'
  demoMu?: boolean
  lisansBaslangicTarihi?: string
  lisansBitisTarihi?: string
  sonOdemeTarihi?: string | null
  yillikUcret?: number | null
  lisansNotlari?: string
  gonderAktivasyonMaili: boolean
  gonderHosgeldinMaili: boolean
}

export type AdminCreateTenantOwnerDto = {
  id: string
  adSoyad: string
  kullaniciAdi: string
  eposta: string | null
  telefon: string | null
  role: TenantUserRoleDto
  aktifMi: boolean
  sonGirisTarihi: string | null
  createdAt: string
}

export type AdminCreateTenantResponse = {
  ok: true
  tenant: AdminTenantDetailTenantDto
  ownerUser: AdminCreateTenantOwnerDto
  geciciSifre: string | null
  lisansAnahtari: string | null
  mailSent: boolean
  mailError?: string
  aktivasyonMailiGonderildi: boolean
  hosgeldinMailiGonderildi: boolean
}

export type TenantUserRoleDto = 'BURO_SAHIBI' | 'AVUKAT_YONETICI' | 'KATIP_PERSONEL'

export type AdminTenantDetailUserDto = {
  id: string
  adSoyad: string
  kullaniciAdi: string
  eposta: string | null
  telefon: string | null
  role: TenantUserRoleDto
  aktifMi: boolean
  sonGirisTarihi: string | null
  createdAt: string
}

export type AdminTenantDetailTenantDto = {
  id: string
  buroAdi: string
  slug: string
  telefon: string | null
  eposta: string | null
  adres: string | null
  vergiNo: string | null
  vergiDairesi: string | null
  aktifMi: boolean
  lisansBaslangicTarihi: string | null
  lisansBitisTarihi: string | null
  lisansDurumu: TenantLicenseStatusDto
  demoMu: boolean
  demoBitisTarihi: string | null
  sonOdemeTarihi: string | null
  yillikUcret: string | null
  lisansNotlari: string | null
  lisansAnahtari: string | null
  musteriNo: string | null
  createdAt: string
  updatedAt: string
}

export type AdminTenantDetailAuditDto = {
  id: string
  action: string
  entityType: string | null
  entityId: string | null
  createdAt: string
  userId: string | null
}

export type LicenseRenewalSourceDto = 'WOONTEGRA_WEBSITE' | 'SUPER_ADMIN'

export type AdminTenantLicenseRenewalDto = {
  id: string
  tarih: string
  kaynak: LicenseRenewalSourceDto
  eskiBitis: string
  yeniBitis: string
  gunSayisi: number
  tutar: string | null
  paraBirimi: string
  externalOrderId: string | null
  not: string | null
}

export type AdminTenantDetailResponse = {
  ok: true
  tenant: AdminTenantDetailTenantDto
  kullanicilar: AdminTenantDetailUserDto[]
  ozet: {
    toplamKullanici: number
    toplamMuvekkil: number
    toplamDosya: number
    kasaHareketi: number
    auditKayit: number
  }
  sonAuditLoglar: AdminTenantDetailAuditDto[]
  licenseRenewals: AdminTenantLicenseRenewalDto[]
}

export type AdminExpiringTenantRow = {
  id: string
  buroAdi: string
  slug: string
  eposta: string | null
  telefon: string | null
  lisansDurumu: TenantLicenseStatusDto
  lisansBitisTarihi: string | null
  yillikUcret: string | null
  aktifMi: boolean
  kalanGun: number | null
}

export type AdminDashboardBugunGirisRow = {
  id: string
  buroAdi: string
  slug: string
  eposta: string | null
  telefon: string | null
  lisansDurumu: TenantLicenseStatusDto
  aktifMi: boolean
}

export type AdminDashboardAuditRow = {
  id: string
  action: string
  entityType: string | null
  entityId: string | null
  createdAt: string
  adminAdSoyad: string | null
  adminKullaniciAdi: string | null
}

export type AdminDashboardResponse = {
  ok: true
  toplamBuro: number
  aktifBuro: number
  demoBuro: number
  suresiDolanBuro: number
  pasifBuro: number
  toplamKullanici: number
  toplamMuvekkil: number
  toplamDosya: number
  bugunGirisYapanBuro: number
  lisansi7GunIcindeBitecekler: AdminExpiringTenantRow[]
  sonKayitOlanBurolar: Array<{
    id: string
    buroAdi: string
    slug: string
    eposta: string | null
    lisansDurumu: TenantLicenseStatusDto
    createdAt: string
  }>
  bugunGirisYapanBurolar: AdminDashboardBugunGirisRow[]
  sonAdminAuditLoglar: AdminDashboardAuditRow[]
}

export type AdminExpiringTenantsResponse = {
  ok: true
  items: AdminExpiringTenantRow[]
  days: number
}

export type AdminSystemInfoResponse = {
  ok: true
  apiStatus: 'UP'
  frontendDomain: string
  backendDomain: string
  environment: string
  version: string
}
