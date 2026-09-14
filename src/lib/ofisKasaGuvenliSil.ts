import type { AuthUserDto } from '../types/auth'
import type { OfisKasaHareketiDto, OfisKasaIslemTipiApi, OfisKasaOnayDurumuApi } from '../types/ofisKasasi'
import { isBuroSahibiRole } from './isBuroSahibi'

/** Backend `OFIS_KASA_KAYNAK_*` ile birebir. */
export const OFIS_KAYNAK_VEKALET_TAHSILATI = 'VEKALET_TAHSILATI'
export const OFIS_KAYNAK_ICRA_TAHSILAT = 'ICRA_TAHSILAT'

export type OfisGuvenliIslemMode = 'GIDER_SIL' | 'GELIR_SIL' | 'TAHSILAT_IPTAL'

export function resolveOfisGuvenliIslemMode(
  h: Pick<OfisKasaHareketiDto, 'islemTipi' | 'kaynakTipi' | 'kaynakId' | 'onayDurumu' | 'deletedAt'>
): OfisGuvenliIslemMode | null {
  if (h.deletedAt) return null
  if (h.onayDurumu !== 'ONAYLI') return null
  if (h.islemTipi === 'GIDER') return 'GIDER_SIL'
  if (h.islemTipi !== 'GELIR') return null
  const tip = h.kaynakTipi?.trim() || null
  const id = h.kaynakId?.trim() || null
  if (!tip && !id) return 'GELIR_SIL'
  if (
    tip === OFIS_KAYNAK_VEKALET_TAHSILATI ||
    tip === 'VEKALET_TAKSIT_ODEME' ||
    tip === OFIS_KAYNAK_ICRA_TAHSILAT ||
    tip === 'ICRA_TAHSILAT_ODEME'
  ) {
    return 'TAHSILAT_IPTAL'
  }
  // Bilinen otomatik kaynak ama UI yine de iptal dener; backend 409 verir.
  if (tip) return 'TAHSILAT_IPTAL'
  return 'GELIR_SIL'
}

export function canShowOfisGuvenliIslem(opts: {
  role: AuthUserDto['role'] | undefined
  hareket: Pick<OfisKasaHareketiDto, 'islemTipi' | 'kaynakTipi' | 'kaynakId' | 'onayDurumu' | 'deletedAt'>
}): boolean {
  if (!isBuroSahibiRole(opts.role)) return false
  return resolveOfisGuvenliIslemMode(opts.hareket) != null
}

/** @deprecated — `canShowOfisGuvenliIslem` kullanın */
export function canShowOfisGiderGuvenliSil(opts: {
  role: AuthUserDto['role'] | undefined
  islemTipi: OfisKasaIslemTipiApi
  onayDurumu: OfisKasaOnayDurumuApi
  deletedAt?: string | null
}): boolean {
  return canShowOfisGuvenliIslem({
    role: opts.role,
    hareket: {
      islemTipi: opts.islemTipi,
      onayDurumu: opts.onayDurumu,
      deletedAt: opts.deletedAt,
      kaynakTipi: null,
      kaynakId: null
    }
  }) && opts.islemTipi === 'GIDER'
}

/** Modal başlığı / onay butonu — tablo satırında değil. */
export function ofisGuvenliIslemLabel(mode: OfisGuvenliIslemMode): string {
  switch (mode) {
    case 'GIDER_SIL':
      return 'Masrafı sil'
    case 'GELIR_SIL':
      return 'Geliri sil'
    case 'TAHSILAT_IPTAL':
      return 'Tahsilatı iptal et'
  }
}

export function canShowOfisDuzeltme(opts: {
  onayDurumu: OfisKasaOnayDurumuApi
  islemTipi: OfisKasaIslemTipiApi
}): boolean {
  return (
    opts.onayDurumu === 'ONAYLI' &&
    opts.islemTipi !== 'DUZELTME' &&
    opts.islemTipi !== 'DOVIZ_CIKIS' &&
    opts.islemTipi !== 'DOVIZ_GIRIS'
  )
}

export function ofisHareketAciklamaOzet(h: Pick<OfisKasaHareketiDto, 'kategori' | 'ozelKategoriAdi' | 'aciklama'>): string {
  return [h.kategori, h.ozelKategoriAdi, h.aciklama].filter((x) => x?.trim()).join(' · ') || '—'
}
