export type DosyaMaliOzetPayload = {
  kararlastirilanVekalet: string
  tahsilEdilenVekalet: string
  kalanVekalet: string
  tahsilatOrani: number
  alinanMasrafAvansi: string
  toplamMasraf: string
  duzeltmeEtkisi: string
  masrafAvansiIadesi: string
  kalanMasrafAvansi: string
  buroKarsiladigiGider: string
  netKazanc: string
}

export type DosyaMaliOzetResponse = {
  ok: true
  tumZamanlar: DosyaMaliOzetPayload
  buDonem: DosyaMaliOzetPayload | null
  donemEtiketi: string | null
}

export type MoneyByCurrency = {
  TRY: string
  USD: string
  EUR: string
}

export type MuvekkilKarlilikDosya = {
  dosyaId: string
  konuBasligi: string
  dosyaNo: string | null
  durum: string
  paraBirimi: 'TRY' | 'USD' | 'EUR'
  tahsilEdilenVekalet: string
  buroKarsiladigiGider: string
  netKazanc: string
}

export type MuvekkilKarlilikDagilim = {
  enYuksekKazanc: MuvekkilKarlilikDosya | null
  enDusukKazanc: MuvekkilKarlilikDosya | null
}

export type MuvekkilKarlilikPayload = {
  toplamDosya: number
  kararlastirilanVekalet: MoneyByCurrency
  tahsilEdilenVekalet: MoneyByCurrency
  kalanAlacak: MoneyByCurrency
  toplamAvansBakiye: string
  toplamDosyaMasrafi: string
  toplamMasrafAvansiIadesi: string
  ofisGeliri: MoneyByCurrency
  netKazanc: MoneyByCurrency
  kazancDagilimi: {
    TRY: MuvekkilKarlilikDagilim | null
    USD: MuvekkilKarlilikDagilim | null
    EUR: MuvekkilKarlilikDagilim | null
  }
}

export type MuvekkilKarlilikResponse = {
  ok: true
  tumZamanlar: MuvekkilKarlilikPayload
  buDonem: MuvekkilKarlilikPayload | null
  donemEtiketi: string | null
}
