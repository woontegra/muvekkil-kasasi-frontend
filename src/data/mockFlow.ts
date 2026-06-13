/** Masaüstü akışına uygun mock veri — API bağlanınca değiştirilecek. */

export type MuvekkilTuru = 'GERCEK_KISI' | 'TUZEL_KISI'

export type MockTuzelDetay = {
  yetkiliAdSoyad: string
  yetkiliTelefon: string
  mudurAdSoyad: string
  mudurTelefon: string
  muhasebeAdSoyad: string
  muhasebeTelefon: string
}

export type MockMuvekkil = {
  id: string
  tur: MuvekkilTuru
  adSoyad: string
  sirketUnvani: string | null
  telefon: string | null
  eposta: string | null
  not: string | null
  /** Tüzel müvekkil ek iletişim (mock UI). */
  tuzelDetay?: MockTuzelDetay | null
}

export type MockDosya = {
  id: string
  muvekkilId: string
  konuBasligi: string
  mahkemeAdi: string
  dosyaNumarasi: string
  durum: 'Açık' | 'Kapalı'
}

export type IslemTipi = 'AVANS_GIRISI' | 'MASRAF' | 'DUZELTME'
export type OnayDurumu = 'ONAYSIZ' | 'ONAYLI'

export type MockKasaHareket = {
  id: string
  dosyaId: string
  islemTipi: IslemTipi
  masrafTuru: string | null
  tutar: number
  tarih: string
  belgeNo: string | null
  onayDurumu: OnayDurumu
  aciklama: string | null
}

export type MockTaksit = {
  id: string
  dosyaId: string
  taksitNo: number
  tutar: number
  vadeTarihi: string | null
  odendiMi: boolean
  smmKesildiMi: boolean
}

export type MockOnayKuyrugu = {
  id: string
  dosyaId: string
  muvekkilId: string
  ozet: string
  tur: 'KASA' | 'OFIS_KASA' | 'DUZENLEME_TALEBI'
  tarih: string
  tutar: number | null
}

export const MOCK_SUMMARY = {
  vadesiGecmisTaksit: 3,
  smmBekleyenTahsilat: 2,
  onayBekleyenIslem: 3,
  ofisKasaBakiye: 42_350.75
} as const

export const MOCK_MUVEKKILLER: MockMuvekkil[] = [
  {
    id: '1',
    tur: 'GERCEK_KISI',
    adSoyad: 'Ayşe Yılmaz',
    sirketUnvani: null,
    telefon: '0532 000 00 01',
    eposta: 'ayse@ornek.com',
    not: 'İcra takipleri yoğun.'
  },
  {
    id: '2',
    tur: 'TUZEL_KISI',
    adSoyad: '',
    sirketUnvani: 'Örnek Lojistik A.Ş.',
    telefon: '0212 000 00 02',
    eposta: 'muhasebe@ornekas.com',
    not: null
  },
  {
    id: '3',
    tur: 'GERCEK_KISI',
    adSoyad: 'Mehmet Kaya',
    sirketUnvani: null,
    telefon: '0533 111 22 33',
    eposta: null,
    not: null
  }
]

export const MOCK_DOSYALAR: MockDosya[] = [
  {
    id: '101',
    muvekkilId: '1',
    konuBasligi: 'İcra takibi — ödeme emri',
    mahkemeAdi: 'İstanbul 12. İcra Dairesi',
    dosyaNumarasi: '2025/1234',
    durum: 'Açık'
  },
  {
    id: '102',
    muvekkilId: '1',
    konuBasligi: 'Boşanma davası',
    mahkemeAdi: 'Ankara 4. Aile Mahkemesi',
    dosyaNumarasi: '2024/987',
    durum: 'Açık'
  },
  {
    id: '201',
    muvekkilId: '2',
    konuBasligi: 'Ticari alacak davası',
    mahkemeAdi: 'İstanbul Asliye Ticaret 5.',
    dosyaNumarasi: '2025/55',
    durum: 'Açık'
  },
  {
    id: '301',
    muvekkilId: '3',
    konuBasligi: 'Kira tespit',
    mahkemeAdi: 'Bakırköy Sulh Hukuk',
    dosyaNumarasi: '2026/12',
    durum: 'Kapalı'
  }
]

export const MOCK_KASA: MockKasaHareket[] = [
  {
    id: 'k1',
    dosyaId: '101',
    islemTipi: 'AVANS_GIRISI',
    masrafTuru: null,
    tutar: 25_000,
    tarih: '2026-06-01',
    belgeNo: 'AVN-2026-000011',
    onayDurumu: 'ONAYLI',
    aciklama: 'Peşin avans'
  },
  {
    id: 'k2',
    dosyaId: '101',
    islemTipi: 'MASRAF',
    masrafTuru: 'Bilirkişi',
    tutar: 4200,
    tarih: '2026-06-10',
    belgeNo: 'MSF-2026-000014',
    onayDurumu: 'ONAYSIZ',
    aciklama: null
  },
  {
    id: 'k3',
    dosyaId: '101',
    islemTipi: 'DUZELTME',
    masrafTuru: null,
    tutar: -200,
    tarih: '2026-06-09',
    belgeNo: 'DZT-2026-000002',
    onayDurumu: 'ONAYSIZ',
    aciklama: 'KDV düzeltmesi talebi'
  }
]

export const MOCK_TAKSITLER: MockTaksit[] = [
  {
    id: 't1',
    dosyaId: '101',
    taksitNo: 1,
    tutar: 10_000,
    vadeTarihi: '2026-05-15',
    odendiMi: false,
    smmKesildiMi: false
  },
  {
    id: 't2',
    dosyaId: '101',
    taksitNo: 2,
    tutar: 10_000,
    vadeTarihi: '2026-07-01',
    odendiMi: true,
    smmKesildiMi: false
  }
]

export const MOCK_ONAY_KUYRUGU: MockOnayKuyrugu[] = [
  {
    id: 'o1',
    dosyaId: '101',
    muvekkilId: '1',
    tur: 'KASA',
    ozet: 'Bilirkişi ücreti — onaysız masraf',
    tarih: '2026-06-10',
    tutar: 4200
  },
  {
    id: 'o2',
    dosyaId: '201',
    muvekkilId: '2',
    tur: 'DUZENLEME_TALEBI',
    ozet: 'Onaylı avans satırı için düzeltme talebi (katip)',
    tarih: '2026-06-09',
    tutar: null
  },
  {
    id: 'o3',
    dosyaId: '201',
    muvekkilId: '2',
    tur: 'OFIS_KASA',
    ozet: 'Ofis kasası — kırtasiye gideri',
    tarih: '2026-06-08',
    tutar: 680
  }
]

export function gorunenAd(m: MockMuvekkil): string {
  if (m.tur === 'TUZEL_KISI' && (m.sirketUnvani ?? '').trim()) return (m.sirketUnvani ?? '').trim()
  return m.adSoyad.trim() || '—'
}

export function muvekkilById(id: string): MockMuvekkil | undefined {
  return MOCK_MUVEKKILLER.find((x) => x.id === id)
}

/** Dinamik liste (context) ile arama. */
export function filterMuvekkillerFromList(list: MockMuvekkil[], q: string): MockMuvekkil[] {
  const t = q.trim().toLowerCase()
  if (!t) return [...list]
  return list.filter((m) => {
    const parts = [gorunenAd(m), m.telefon ?? '', m.eposta ?? '', m.not ?? '', m.adSoyad, m.sirketUnvani ?? '']
    if (m.tuzelDetay) {
      const d = m.tuzelDetay
      parts.push(
        d.yetkiliAdSoyad,
        d.yetkiliTelefon,
        d.mudurAdSoyad,
        d.mudurTelefon,
        d.muhasebeAdSoyad,
        d.muhasebeTelefon
      )
    }
    const hay = parts.join(' ').toLowerCase()
    return hay.includes(t)
  })
}

export function dosyalarByMuvekkil(muvekkilId: string): MockDosya[] {
  return MOCK_DOSYALAR.filter((d) => d.muvekkilId === muvekkilId)
}

export function dosyaByIds(muvekkilId: string, dosyaId: string): MockDosya | undefined {
  return MOCK_DOSYALAR.find((d) => d.id === dosyaId && d.muvekkilId === muvekkilId)
}

export function kasaByDosya(dosyaId: string): MockKasaHareket[] {
  return MOCK_KASA.filter((k) => k.dosyaId === dosyaId)
}

export function taksitlerByDosya(dosyaId: string): MockTaksit[] {
  return MOCK_TAKSITLER.filter((t) => t.dosyaId === dosyaId)
}

export function masraflarByDosya(dosyaId: string): MockKasaHareket[] {
  return kasaByDosya(dosyaId).filter((k) => k.islemTipi === 'MASRAF')
}

export function smmBekleyenForDosya(dosyaId: string): MockTaksit[] {
  return taksitlerByDosya(dosyaId).filter((t) => t.odendiMi && !t.smmKesildiMi)
}

export function filterMuvekkiller(q: string): MockMuvekkil[] {
  return filterMuvekkillerFromList(MOCK_MUVEKKILLER, q)
}

export function islemTipiLabel(t: IslemTipi): string {
  if (t === 'AVANS_GIRISI') return 'Avans'
  if (t === 'MASRAF') return 'Masraf'
  return 'Düzeltme'
}

export function onayDurumuLabel(o: OnayDurumu): string {
  return o === 'ONAYLI' ? 'Onaylı' : 'Onaysız'
}

/** Ana sayfada “son işlem / son bakılan” satırı için (mock). */
export const SON_BAKILAN_MUVEKKIL_IDS = ['2', '1'] as const
