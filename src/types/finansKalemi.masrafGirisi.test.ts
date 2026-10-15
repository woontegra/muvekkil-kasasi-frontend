import { describe, expect, it } from 'vitest'
import { filterMasrafGirisiKalemleri, type FinansKalemiDto } from './finansKalemi'

function kalem(ad: string, sira: number): FinansKalemiDto {
  return {
    id: `id-${sira}`,
    tur: 'GIDER',
    kod: null,
    ad,
    aktif: true,
    sistemMi: false,
    sira,
    archivedAt: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z'
  }
}

/** Varsayılan tenant gider kalemleri (ofis gideri + dosya masrafı birleşik). */
const VARSAYILAN = [
  'Ofis kirası',
  'Personel maaşı',
  'Kırtasiye',
  'Ulaşım',
  'Yemek',
  'Diğer gider',
  'Harç',
  'Gider Avansı',
  'Bilirkişi Ücreti',
  'Keşif-İcra, Haciz vs.',
  'Yol-Yemek vs.',
  'Diğer'
].map((ad, i) => kalem(ad, 10 + i))

describe('filterMasrafGirisiKalemleri', () => {
  it('yalnız altı masraf kalemini sabit sırayla bırakır; ofis gider kalemlerini çıkarır', () => {
    expect(filterMasrafGirisiKalemleri(VARSAYILAN).map((k) => k.ad)).toEqual([
      'Harç',
      'Gider Avansı',
      'Bilirkişi Ücreti',
      'Keşif-İcra, Haciz vs.',
      'Yol-Yemek vs.',
      'Diğer'
    ])
  })

  it('kalem kimliklerini korur ve büyük/küçük harf, boşluk farkını yok sayar', () => {
    const r = filterMasrafGirisiKalemleri([kalem('  harç ', 1), kalem('Diğer gider', 2), kalem('DİĞER', 3)])
    expect(r.map((k) => k.id)).toEqual(['id-1', 'id-3'])
  })

  it('kalemlerden biri pasifse/listede yoksa olanları gösterir', () => {
    expect(filterMasrafGirisiKalemleri([kalem('Yol-Yemek vs.', 1)]).map((k) => k.ad)).toEqual(['Yol-Yemek vs.'])
    expect(filterMasrafGirisiKalemleri([kalem('Ofis kirası', 1)])).toEqual([])
  })
})
