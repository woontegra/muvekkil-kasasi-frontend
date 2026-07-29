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

export type MuvekkilKarlilikDosya = {
  dosyaId: string
  konuBasligi: string
  dosyaNo: string | null
  durum: string
  tahsilEdilenVekalet: number
  buroKarsiladigiGider: number
  netKazanc: number
}

export type MuvekkilKarlilikPayload = {
  toplamDosya: number
  kararlastirilanVekalet: string
  tahsilEdilenVekalet: string
  kalanAlacak: string
  toplamAvansBakiye: string
  toplamDosyaMasrafi: string
  toplamMasrafAvansiIadesi: string
  netKazanc: string
  enYuksekKazanc: MuvekkilKarlilikDosya | null
  enDusukKazanc: MuvekkilKarlilikDosya | null
}

export type MuvekkilKarlilikResponse = {
  ok: true
  tumZamanlar: MuvekkilKarlilikPayload
  buDonem: MuvekkilKarlilikPayload | null
  donemEtiketi: string | null
}
