import type { AuthUserDto } from '../types/auth'

/** Büro sahibi / ana kullanıcı — Primler modülü yalnızca bu role açıktır. */
export function isBuroSahibiRole(role: AuthUserDto['role'] | undefined): boolean {
  return role === 'BURO_SAHIBI'
}
