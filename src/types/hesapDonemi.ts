import type { ParaBirimi } from '../utils/paraBirimi'

export type HesapDonemiCurrencyOzetDto = {
  devredenBakiye: string
  donemGelir: string
  donemGider: string
  donemDuzeltmeEtkisi: string
  donemNetSonucu: string
  kasaBakiyesi: string
  bugunGider: string
}

export type HesapDonemiOzetResponse = {
  ok: true
  mode: 'MONTHLY' | 'YEARLY'
  period: { bas: string; bit: string; etiket: string }
  isCurrent: boolean
  canGoNext: boolean
  /** Legacy TRY */
  devredenBakiye: string
  donemGelir: string
  donemGider: string
  donemDuzeltmeEtkisi: string
  donemNetSonucu: string
  kasaBakiyesi: string
  bugunGider: string
  byCurrency?: Record<ParaBirimi, HesapDonemiCurrencyOzetDto>
  bakiyeler?: Record<ParaBirimi, string>
}
