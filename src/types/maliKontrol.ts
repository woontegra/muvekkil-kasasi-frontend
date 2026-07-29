export type UyariSeviyesi = 'KRITIK' | 'UYARI' | 'BILGI'

export type UyariTuru =
  | 'VADESI_GECMIS_TAKSIT'
  | 'KISMI_ODEME_KALAN'
  | 'VAKLAŞAN_VADE'
  | 'NEGATIF_AVANS'
  | 'KAPALI_DOSYA_AVANS'
  | 'KAPALI_DOSYA_ALACAK'
  | 'SMM_KESILMEMIS'
  | 'ONAY_BEKLEYEN_KASA'
  | 'MAKBUZ_EKSIK'
  | 'HAREKETSIZ_DOSYA'

export type MaliKontrolActionTarget =
  | 'VEKALET_TAKSIT'
  | 'DOSYA_VEKALET'
  | 'SMM_ODEME'
  | 'MAKBUZ_ODEME'
  | 'KASA_HAREKET'
  | 'DOSYA_MALI'
  | 'DOSYA_GENEL'

export type MaliKontrolActionPayload = {
  muvekkilId: string
  dosyaId: string
  tab: 'kasa' | 'vekalet' | 'smm' | 'makbuz' | 'hesap' | 'mali' | 'ekstre'
  taksitId?: string
  odemeId?: string
  kasaHareketiId?: string
  kasaFilter?: 'onaysiz'
}

export type MaliKontrolUyari = {
  id: string
  tur: UyariTuru
  seviye: UyariSeviyesi
  muvekkilId: string | null
  muvekkilAd: string
  dosyaId: string | null
  dosyaBaslik: string
  tutar: string | null
  tarih: string | null
  aciklama: string
  actionTarget: MaliKontrolActionTarget | null
  actionPayload: MaliKontrolActionPayload | null
}

export type MaliKontrolResponse = {
  ok: true
  toplamUyari: number
  kritikUyari: number
  uyariUyari: number
  bilgiUyari: number
  uyarilar: MaliKontrolUyari[]
}

export const UYARI_TUR_ETIKET: Record<UyariTuru, string> = {
  VADESI_GECMIS_TAKSIT: 'Vadesi geçmiş taksit',
  KISMI_ODEME_KALAN: 'Kısmi ödeme bakiyesi',
  'VAKLAŞAN_VADE': 'Yaklaşan vade',
  NEGATIF_AVANS: 'Negatif avans',
  KAPALI_DOSYA_AVANS: 'Kapalı dosya avansı',
  KAPALI_DOSYA_ALACAK: 'Kapalı dosya alacağı',
  SMM_KESILMEMIS: 'SMM kesilmemiş',
  ONAY_BEKLEYEN_KASA: 'Onay bekleyen',
  MAKBUZ_EKSIK: 'Makbuz eksik',
  HAREKETSIZ_DOSYA: 'Hareketsiz dosya'
}
