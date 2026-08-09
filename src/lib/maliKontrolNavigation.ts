import { APP_BASE } from '../config/appPaths'
import type { MaliKontrolActionPayload, MaliKontrolActionTarget, MaliKontrolUyari } from '../types/maliKontrol'

export type DosyaDetailTabKey = MaliKontrolActionPayload['tab']

export type DosyaFocusKind = 'taksit' | 'odeme' | 'kasa'

/** DOM id: dosya-focus-{kind}-{uuid} */
export function dosyaFocusElementId(kind: DosyaFocusKind, id: string): string {
  return `dosya-focus-${kind}-${id}`
}

export function parseDosyaFocusParam(focus: string): { kind: DosyaFocusKind; id: string } | null {
  const m = /^(taksit|odeme|kasa):(.+)$/.exec(focus.trim())
  if (!m) return null
  const kind = m[1] as DosyaFocusKind
  const id = m[2]
  if (!id) return null
  return { kind, id }
}

export function buildDosyaFocusParam(kind: DosyaFocusKind, id: string): string {
  return `${kind}:${id}`
}

export function canNavigateMaliKontrolUyari(
  u: MaliKontrolUyari
): u is MaliKontrolUyari & { actionPayload: MaliKontrolActionPayload } {
  const p = u.actionPayload
  return Boolean(p?.muvekkilId && p?.dosyaId)
}

export function buildMaliKontrolNavigateUrl(payload: MaliKontrolActionPayload): string {
  const params = new URLSearchParams()
  params.set('tab', payload.tab)
  if (payload.taksitId) {
    params.set('focus', buildDosyaFocusParam('taksit', payload.taksitId))
  } else if (payload.odemeId) {
    params.set('focus', buildDosyaFocusParam('odeme', payload.odemeId))
  } else if (payload.kasaHareketiId) {
    params.set('focus', buildDosyaFocusParam('kasa', payload.kasaHareketiId))
  }
  if (payload.kasaFilter) {
    params.set('kasaFilter', payload.kasaFilter)
  }
  return `${APP_BASE}/muvekkil/${payload.muvekkilId}/dosya/${payload.dosyaId}?${params.toString()}`
}

export function focusElementIdFromPayload(payload: MaliKontrolActionPayload): string | null {
  if (payload.taksitId) return dosyaFocusElementId('taksit', payload.taksitId)
  if (payload.odemeId) return dosyaFocusElementId('odeme', payload.odemeId)
  if (payload.kasaHareketiId) return dosyaFocusElementId('kasa', payload.kasaHareketiId)
  return null
}

export const ACTION_TARGET_TAB: Record<MaliKontrolActionTarget, DosyaDetailTabKey> = {
  VEKALET_TAKSIT: 'vekalet',
  DOSYA_VEKALET: 'vekalet',
  SMM_ODEME: 'smm',
  MAKBUZ_ODEME: 'makbuz',
  KASA_HAREKET: 'kasa',
  DOSYA_MALI: 'mali',
  DOSYA_GENEL: 'kasa'
}

export const DOSYA_FOCUS_HIGHLIGHT_CLASS =
  'ring-2 ring-inset ring-primary/45 bg-primary-soft/25 transition-colors duration-300 motion-safe:animate-pulse'
