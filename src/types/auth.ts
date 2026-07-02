/** API'den dönen kullanıcı (şifre yok). */
export type AuthUserDto = {
  id: string
  tenantId: string
  adSoyad: string
  kullaniciAdi: string
  eposta: string | null
  telefon: string | null
  role: 'BURO_SAHIBI' | 'AVUKAT_YONETICI' | 'KATIP_PERSONEL'
  aktifMi: boolean
  sonGirisTarihi: string | null
  createdAt: string
  updatedAt: string
}

export type AuthTenantDto = {
  id: string
  buroAdi: string
  slug: string
  musteriNo?: string | null
  telefon: string | null
  eposta: string | null
  adres: string | null
  vergiNo: string | null
  vergiDairesi: string | null
  aktifMi: boolean
  lisansBaslangicTarihi?: string | null
  lisansBitisTarihi?: string | null
  lisansDurumu?: 'DEMO' | 'AKTIF' | 'SURESI_DOLDU' | 'PASIF'
  demoMu?: boolean
  demoBitisTarihi?: string | null
  sonOdemeTarihi?: string | null
  yillikUcret?: string | null
  lisansNotlari?: string | null
  createdAt: string
  updatedAt: string
}

export type AuthSession = {
  user: AuthUserDto
  tenant: AuthTenantDto
}

export type AuthOnboardingState = {
  requiresLicenseActivation: boolean
  mustChangePassword: boolean
}

export type AuthLoginResponse = AuthOnboardingState & {
  ok: true
  accessToken: string
  user: AuthUserDto
  tenant: AuthTenantDto
}

export type MeResponse = AuthOnboardingState & {
  ok: true
  user: AuthUserDto
  tenant: AuthTenantDto
}
