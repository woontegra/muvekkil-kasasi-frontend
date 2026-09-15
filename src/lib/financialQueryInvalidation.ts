import type { QueryClient } from '@tanstack/react-query'
import { DASHBOARD_SUMMARY_QUERY_KEY, TAKSIT_UYARILARI_QUERY_KEY } from '../api/dashboard'
import { MALI_KONTROL_QUERY_KEY } from '../api/maliKontrol'
import { SMM_BEKLEYEN_QUERY_KEY } from '../api/smm'

/** Gerçek React Query anahtarlarıyla uyumlu finansal invalidate. */
export const OFIS_KASASI_OZET_QUERY_KEY = ['ofis-kasasi-ozet'] as const
export const OFIS_KASASI_HAREKETLER_QUERY_KEY = ['ofis-kasasi-hareketleri'] as const
export const MUVEKKIL_KARLILIK_QUERY_KEY = ['muvekkil-karlilik'] as const

export type FinancialInvalidateScope = {
  dosyaId?: string | null
  muvekkilId?: string | null
  taksitId?: string | null
  ofisKasa?: boolean
  dashboard?: boolean
  karlilik?: boolean
  vekalet?: boolean
  kasa?: boolean
  maliKontrol?: boolean
}

/**
 * Başarılı finansal mutation sonrası — yalnız ilgili prefix’ler.
 * Eski hatalı `['ofis-kasa']` anahtarı kullanılmaz.
 */
export function invalidateFinancialQueries(
  queryClient: QueryClient,
  scope: FinancialInvalidateScope = {}
): void {
  const {
    dosyaId,
    muvekkilId,
    taksitId,
    ofisKasa = true,
    dashboard = true,
    karlilik = true,
    vekalet = true,
    kasa = true,
    maliKontrol = true
  } = scope

  if (ofisKasa) {
    void queryClient.invalidateQueries({ queryKey: [...OFIS_KASASI_OZET_QUERY_KEY] })
    void queryClient.invalidateQueries({ queryKey: [...OFIS_KASASI_HAREKETLER_QUERY_KEY] })
  }
  if (dashboard) {
    void queryClient.invalidateQueries({ queryKey: [...DASHBOARD_SUMMARY_QUERY_KEY] })
    void queryClient.invalidateQueries({ queryKey: [...TAKSIT_UYARILARI_QUERY_KEY] })
    void queryClient.invalidateQueries({ queryKey: [...SMM_BEKLEYEN_QUERY_KEY] })
    void queryClient.invalidateQueries({ queryKey: ['tahsilat-merkezi'] })
  }
  if (karlilik) {
    if (muvekkilId) {
      void queryClient.invalidateQueries({ queryKey: [...MUVEKKIL_KARLILIK_QUERY_KEY, muvekkilId] })
    } else {
      void queryClient.invalidateQueries({ queryKey: [...MUVEKKIL_KARLILIK_QUERY_KEY] })
    }
  }
  if (maliKontrol) {
    void queryClient.invalidateQueries({ queryKey: [...MALI_KONTROL_QUERY_KEY] })
  }
  if (vekalet && dosyaId) {
    void queryClient.invalidateQueries({ queryKey: ['vekalet', dosyaId] })
    void queryClient.invalidateQueries({ queryKey: ['dosya-mali-ozet', dosyaId] })
    void queryClient.invalidateQueries({ queryKey: ['dosya-hesap-ozeti', dosyaId] })
    void queryClient.invalidateQueries({ queryKey: ['dosya-makbuzlar', dosyaId] })
  }
  if (kasa && dosyaId) {
    void queryClient.invalidateQueries({ queryKey: ['kasa-hareketleri', dosyaId] })
    void queryClient.invalidateQueries({ queryKey: ['kasa-ozet', dosyaId] })
  }
  if (taksitId) {
    void queryClient.invalidateQueries({ queryKey: ['taksit-odemeler', taksitId] })
  }
}
