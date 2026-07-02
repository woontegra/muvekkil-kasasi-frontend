import type { AuthUserDto } from '../types/auth'

export function isYoneticiRole(role: AuthUserDto['role'] | undefined): boolean {
  return role === 'BURO_SAHIBI' || role === 'AVUKAT_YONETICI'
}
