export type HesapDonemiOzetResponse = {
  ok: true
  mode: 'MONTHLY' | 'YEARLY'
  period: { bas: string; bit: string; etiket: string }
  isCurrent: boolean
  canGoNext: boolean
  devredenBakiye: string
  donemGelir: string
  donemGider: string
  donemDuzeltmeEtkisi: string
  donemNetSonucu: string
  kasaBakiyesi: string
  bugunGider: string
}
