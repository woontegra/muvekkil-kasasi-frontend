import type { SuperAdminRoleDto } from '../types/admin'

export const PLATFORM_ADMIN_ROLES: SuperAdminRoleDto[] = ['SUPER_ADMIN', 'DESTEK', 'FINANS']

export function isPlatformAdminRole(rol: string | undefined | null): rol is SuperAdminRoleDto {
  return rol === 'SUPER_ADMIN' || rol === 'DESTEK' || rol === 'FINANS'
}

export function isSuperAdminRole(rol: string | undefined | null): boolean {
  return rol === 'SUPER_ADMIN'
}
