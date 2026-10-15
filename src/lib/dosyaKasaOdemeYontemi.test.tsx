import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { DosyaKasaHareketTableRow } from '../components/kasa/DosyaKasaHareketTableRow'
import type { KasaHareketiDto } from '../types/kasa'
import { dosyaKasaOdemeLabel, MASRAF_ODEME_OPTIONS } from './dosyaKasaOdemeYontemi'

afterEach(() => cleanup())

const noop = () => undefined

describe('Masraf girişi ödeme yöntemleri', () => {
  it('Barokart seçeneği masraf listesinde, eski seçenekler aynı sırada', () => {
    expect(MASRAF_ODEME_OPTIONS.map((o) => o.value)).toEqual(['NAKIT', 'BANKA', 'KREDI_KARTI', 'BAROKART', 'DIGER'])
    expect(MASRAF_ODEME_OPTIONS.find((o) => o.value === 'BAROKART')?.label).toBe('Barokart')
  })

  it('etiketler: Barokart ve eski yöntemler; boş değer tire', () => {
    expect(dosyaKasaOdemeLabel('BAROKART')).toBe('Barokart')
    expect(dosyaKasaOdemeLabel('NAKIT')).toBe('Nakit')
    expect(dosyaKasaOdemeLabel('KREDI_KARTI')).toBe('Kredi kartı')
    expect(dosyaKasaOdemeLabel(null)).toBe('—')
  })

  it('dosya kasası listesinde Barokart masrafı “Barokart” olarak görünür', () => {
    const hareket = {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      tenantId: 't',
      dosyaId: 'd',
      muvekkilId: 'm',
      tip: 'MASRAF',
      tarih: '2026-10-15T00:00:00.000Z',
      tutar: '250.00',
      odemeYontemi: 'BAROKART',
      belgeNo: 'MSF-2026-000001',
      onayDurumu: 'ONAYSIZ',
      aciklama: null,
      masrafTuru: 'Harç',
      ozelMasrafAdi: null,
      masrafiYapanKisi: 'Av. Test',
      redSebebi: null,
      orijinalHareketId: null,
      orijinalBelgeNo: null,
      onaylayanId: null,
      onayTarihi: null,
      otomatikOnayMi: false,
      tahsilatiYapanUserId: null,
      tahsilatiYapanPersonelId: null,
      createdById: 'u',
      updatedById: null,
      deletedAt: null,
      createdAt: '2026-10-15T00:00:00.000Z',
      updatedAt: '2026-10-15T00:00:00.000Z'
    } satisfies KasaHareketiDto
    render(
      <table>
        <tbody>
          <DosyaKasaHareketTableRow
            hareket={hareket}
            role="AVUKAT_YONETICI"
            yonetici
            odemeLabel={dosyaKasaOdemeLabel}
            onayLabel={() => 'Onaysız'}
            aciklamaText="Harç"
            tipLabel="Masraf"
            signedAmount={-250}
            onApprove={noop}
            onReject={noop}
            onHardDelete={noop}
            onDuzeltme={noop}
            onGuvenliSil={noop}
          />
        </tbody>
      </table>
    )
    expect(screen.getByText('Barokart')).toBeTruthy()
  })
})
