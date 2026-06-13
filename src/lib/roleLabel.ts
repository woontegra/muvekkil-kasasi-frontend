import type { AuthUserDto } from '../types/auth'

const labels: Record<AuthUserDto['role'], string> = {
  BURO_SAHIBI: 'Büro Sahibi',
  AVUKAT_YONETICI: 'Avukat / Yönetici',
  KATIP_PERSONEL: 'Katip / Personel'
}

export function roleLabel(role: AuthUserDto['role']): string {
  return labels[role] ?? role
}
