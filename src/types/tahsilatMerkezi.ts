import type { TaksitComputedDurumApi, VekaletTaksitiDto } from './vekalet'

export type TahsilatMerkeziGorunumFilter =
  | 'GECIKENLER'
  | 'BUGUN'
  | 'YAKLASANLAR'
  | 'KISMI_ODENENLER'
  | 'TUMU'

export type TahsilatMerkeziSatirDto = {
  id: string
  muvekkilId: string
  muvekkilAd: string
  muvekkilTelefonVar: boolean
  dosyaId: string
  dosyaBaslik: string
  dosyaNo: string | null
  taksitNo: number
  taksitAciklama: string | null
  taksitTutari: string
  odenenToplam: string
  kalanTutar: string
  vadeTarihi: string
  durum: TaksitComputedDurumApi
  gunFarki: number
  gorunumler: ('GECIKMIS' | 'BUGUN' | 'YAKLASAN' | 'KISMI')[]
  taksit: VekaletTaksitiDto
}

export type TahsilatMerkeziOzetDto = {
  gecikmisToplam: string
  gecikmisAdet: number
  bugunToplam: string
  bugunAdet: number
  yakin7GunToplam: string
  yakin7GunAdet: number
  kismiToplam: string
  kismiAdet: number
  yaklasanAdet: number
}

export type ListTahsilatMerkeziParams = {
  gorunum?: TahsilatMerkeziGorunumFilter
  muvekkilId?: string
  dosyaId?: string
  vadeBas?: string
  vadeBit?: string
  durum?: TaksitComputedDurumApi
  personelId?: string
  q?: string
  page?: number
  limit?: number
}

export type TahsilatMerkeziListResponse = {
  ok: true
  items: TahsilatMerkeziSatirDto[]
  total: number
  page: number
  limit: number
  ozet: TahsilatMerkeziOzetDto
}

export type TahsilatMerkeziOzetResponse = {
  ok: true
  ozet: TahsilatMerkeziOzetDto
}

export const TAKSILAT_MERKEZI_GORUNUM_LABEL: Record<TahsilatMerkeziGorunumFilter, string> = {
  GECIKENLER: 'Gecikenler',
  BUGUN: 'Bugün',
  YAKLASANLAR: 'Yaklaşanlar',
  KISMI_ODENENLER: 'Kısmi Ödenenler',
  TUMU: 'Tümü'
}
