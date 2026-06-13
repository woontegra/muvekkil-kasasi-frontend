import type { AuthUserDto } from './auth'

/** `GET/POST /api/v1/users` yanıtındaki kullanıcı (şifre hash yok). */
export type UserDto = AuthUserDto

export type StaffRole = 'AVUKAT_YONETICI' | 'KATIP_PERSONEL'

export type UserListResponse = {
  ok: true
  items: UserDto[]
  total: number
  page: number
  limit: number
}

export type UserOneResponse = {
  ok: true
  user: UserDto
}

export type UserCreateResponse = {
  ok: true
  user: UserDto
}

export type UserUpdateResponse = {
  ok: true
  user: UserDto
}

export type CreateUserPayload = {
  adSoyad: string
  kullaniciAdi: string
  eposta: string | null
  telefon: string | null
  rol: StaffRole
  sifre: string
}

export type UpdateUserPayload = {
  adSoyad: string
  eposta: string | null
  telefon: string | null
  rol: AuthUserDto['role']
  aktifMi: boolean
}

export type ResetUserPasswordPayload = {
  yeniSifre: string
}
