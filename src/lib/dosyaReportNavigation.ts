import { APP_BASE } from '../config/appPaths'
import type { DosyaDetailTabKey } from './maliKontrolNavigation'

export type DosyaReportKind = 'dosya-hesap' | 'dosya-makbuz'

export const DOSYA_REPORT_TAB: Record<DosyaReportKind, DosyaDetailTabKey> = {
  'dosya-hesap': 'hesap',
  'dosya-makbuz': 'makbuz'
}

/** Dosya detayı mevcut `?tab=` deep link'i ile ilgili sekmede açılır (bkz. useDosyaDetailDeepLink). */
export function buildDosyaReportUrl(kind: DosyaReportKind, muvekkilId: string, dosyaId: string): string {
  const params = new URLSearchParams({ tab: DOSYA_REPORT_TAB[kind] })
  return `${APP_BASE}/muvekkil/${encodeURIComponent(muvekkilId)}/dosya/${encodeURIComponent(dosyaId)}?${params.toString()}`
}
