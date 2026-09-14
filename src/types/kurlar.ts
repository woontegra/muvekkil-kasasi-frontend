import type { ParaBirimi } from '../utils/paraBirimi'

export type KurKaynagiApi = 'TCMB' | 'MANUEL'

export type TcmbRateItemDto = {
  currency: 'USD' | 'EUR'
  buyingRate: string
  sellingRate: string
  effectiveDate: string
  fetchedAt: string
  source: 'TCMB'
  stale: boolean
}

export type TcmbRatesAvailableResponse = {
  ok: true
  available: true
  istenilenTarih: string
  bulunanTcmbKurTarihi: string
  effectiveDate: string
  fetchedAt: string
  source: 'TCMB'
  sourceLabel: string
  stale: boolean
  fallbackKullanildi: boolean
  usdDovizAlis: string
  usdDovizSatis: string
  eurDovizAlis: string
  eurDovizSatis: string
  usdEurCapraz: string
  eurUsdCapraz: string
  rates: TcmbRateItemDto[]
}

export type TcmbRatesUnavailableResponse = {
  ok: true
  available: false
  message: string
  rates: null
}

export type TcmbRatesResponse = TcmbRatesAvailableResponse | TcmbRatesUnavailableResponse

export type TcmbPairQuoteDto = {
  istenilenTarih: string
  bulunanTcmbKurTarihi: string
  bazParaBirimi: ParaBirimi
  karsiParaBirimi: ParaBirimi
  hesaplananCaprazKur: string
  dovizAlis: string
  dovizSatis: string | null
  kaynak: 'TCMB'
  fallbackKullanildi: boolean
  stale: boolean
  fetchedAt: string
}

export type TcmbCaprazAvailableResponse = {
  ok: true
  available: true
  istenilenTarih: string
  bulunanTcmbKurTarihi: string
  bazParaBirimi: ParaBirimi
  karsiParaBirimi: ParaBirimi
  hesaplananCaprazKur: string
  dovizAlis: string
  dovizSatis: string | null
  kaynak: 'TCMB'
  fallbackKullanildi: boolean
  stale: boolean
  fetchedAt: string
  quote: TcmbPairQuoteDto
}

export type TcmbCaprazUnavailableResponse = {
  ok: true
  available: false
  message: string
  quote: null
}

export type TcmbCaprazResponse = TcmbCaprazAvailableResponse | TcmbCaprazUnavailableResponse

export type CrossPaymentKurMeta = {
  kurKaynagi: KurKaynagiApi | null
  tcmbKurTarihi: string | null
  tcmbReferansKur: string | null
}

export type YaklasikTryItemDto = {
  key: string
  tutar: string
  yaklasikTry: string | null
  yaklasikTryGosterim: string | null
  satirEtiket: string | null
}

export type YaklasikTryBatchResponse = {
  ok: true
  available: boolean
  message: string | null
  paraBirimi: ParaBirimi
  kurAlis: string | null
  kurTarihi: string | null
  kurBilgiSatiri: string | null
  yaklasikAciklama: string
  items: YaklasikTryItemDto[]
}

export type CaprazHesapResponse =
  | {
      ok: true
      alacakParaBirimi: ParaBirimi
      odemeParaBirimi: ParaBirimi
      mahsupTutari: string
      kasaTutari: string
      uygulanacakKur: string
      onizlemeMetni: string
    }
  | { ok: false; error: string }
