import type { ReactElement } from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { OfisKasaHareketTableRow } from './OfisKasaHareketTableRow'
import {
  OFIS_DUZELTME_ROW_CLASS,
  OFIS_DUZELTME_VARIANT,
  OFIS_NORMAL_VARIANT,
  isOfisDuzeltmeTipi
} from '../../lib/ofisKasaDuzeltmeStil'
import { formatSignedMoney } from '../../utils/formatters'
import type { OfisKasaHareketiDto } from '../../types/ofisKasasi'

afterEach(() => cleanup())

function sample(overrides?: Partial<OfisKasaHareketiDto>): OfisKasaHareketiDto {
  return {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    tenantId: 't',
    islemTipi: 'GIDER',
    tarih: '2026-07-27T12:00:00.000Z',
    kategori: 'Banka masrafı',
    ozelKategoriAdi: null,
    aciklama: 'Test',
    tutar: '100.00',
    paraBirimi: 'TRY',
    dovizDonusumId: null,
    kur: null,
    kurBazParaBirimi: null,
    kurKarsiParaBirimi: null,
    odemeYontemi: 'BANKA',
    belgeNo: 'OFK-2026-1',
    onayDurumu: 'ONAYLI',
    onaylayanId: null,
    onayTarihi: null,
    redSebebi: null,
    orijinalHareketId: null,
    orijinalBelgeNo: null,
    otomatikOnayMi: false,
    tahsilatiYapanUserId: null,
    tahsilatiYapanPersonelId: null,
    muvekkilId: null,
    muvekkilAdiSnapshot: null,
    muvekkil: null,
    kaynakTipi: null,
    kaynakId: null,
    createdById: 'u',
    updatedById: null,
    deletedAt: null,
    createdAt: '2026-07-27T10:00:00.000Z',
    updatedAt: '2026-07-27T10:00:00.000Z',
    ...overrides
  }
}

const noop = (): void => undefined

function mountRow(h: OfisKasaHareketiDto, role = 'BURO_SAHIBI'): ReactElement {
  const signed = h.islemTipi === 'GIDER' ? -Number(h.tutar) : Number(h.tutar)
  return (
    <table>
      <tbody>
        <OfisKasaHareketTableRow
          hareket={h}
          role={role}
          yonetici
          muvekkilAdi="—"
          signed={signed}
          paraBirimi="TRY"
          formatSignedMoney={formatSignedMoney}
          odemeLabel={() => 'Banka'}
          onayLabel={(o) => (o === 'ONAYLI' ? 'Onaylı' : o)}
          onApprove={noop}
          onReject={noop}
          onHardDelete={noop}
          onDuzeltme={noop}
          onDovizDelete={noop}
          onGuvenliSil={noop}
        />
      </tbody>
    </table>
  )
}

describe('OfisKasaHareketTableRow — DUZELTME kırmızı varyantı', () => {
  it('DUZELTME satırı kırmızı varyantı ve tip badge alır', () => {
    render(
      mountRow(
        sample({
          islemTipi: 'DUZELTME',
          belgeNo: 'DZT-2026-000001',
          tarih: '2026-07-27T12:00:00.000Z',
          kategori: 'Düzeltme',
          tutar: '50.00'
        })
      )
    )
    const row = screen.getByTestId('ofis-hareket-row')
    expect(row).toHaveAttribute('data-ofis-row-variant', OFIS_DUZELTME_VARIANT)
    expect(row.className).toContain('bg-rose-50')
    expect(row.className).toContain('border-l-rose-500')
    expect(row.className).toContain('hover:bg-rose-100')
    for (const token of OFIS_DUZELTME_ROW_CLASS.split(/\s+/)) {
      expect(row.className).toContain(token)
    }
    expect(screen.getByTestId('ofis-duzeltme-tip-badge')).toHaveTextContent('Düzeltme')
    expect(screen.getByText('Onaylı')).toBeInTheDocument()
  })

  it('GELIR kırmızı varyantı almaz', () => {
    render(mountRow(sample({ islemTipi: 'GELIR', belgeNo: 'OFK-G' })))
    const row = screen.getByTestId('ofis-hareket-row')
    expect(row).toHaveAttribute('data-ofis-row-variant', OFIS_NORMAL_VARIANT)
    expect(row.className).not.toContain('bg-rose-50')
    expect(screen.queryByTestId('ofis-duzeltme-tip-badge')).not.toBeInTheDocument()
    expect(screen.getByText('Gelir')).toBeInTheDocument()
  })

  it('GIDER kırmızı varyantı almaz', () => {
    render(mountRow(sample({ islemTipi: 'GIDER' })))
    const row = screen.getByTestId('ofis-hareket-row')
    expect(row).toHaveAttribute('data-ofis-row-variant', OFIS_NORMAL_VARIANT)
    expect(row.className).not.toContain('border-l-rose-500')
    expect(screen.queryByTestId('ofis-duzeltme-tip-badge')).not.toBeInTheDocument()
  })

  it('hover stili düzeltme vurgusunu kaldırmaz (rose hover sınıfı korunur)', () => {
    render(mountRow(sample({ islemTipi: 'DUZELTME', belgeNo: 'DZT-2026-000001' })))
    const row = screen.getByTestId('ofis-hareket-row')
    // TR varsayılan hover:bg-surface-muted/60; düzeltilmiş satırda rose hover sonradan gelir
    expect(row.className).toMatch(/hover:bg-rose-100/)
    expect(isOfisDuzeltmeTipi('DUZELTME')).toBe(true)
    expect(isOfisDuzeltmeTipi('GIDER')).toBe(false)
  })

  it('DUZELTME satırında güvenli Sil yok', () => {
    render(mountRow(sample({ islemTipi: 'DUZELTME', belgeNo: 'DZT-2026-000001' })))
    expect(screen.queryByTestId('ofis-masraf-sil-btn')).not.toBeInTheDocument()
  })

  it('1366px ve 1920px viewport’ta DUZELTME varyantı aynı kalır', () => {
    const assertAt = (width: number): void => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: width })
      window.dispatchEvent(new Event('resize'))
      cleanup()
      render(mountRow(sample({ islemTipi: 'DUZELTME', belgeNo: 'DZT-2026-000001' })))
      const row = screen.getByTestId('ofis-hareket-row')
      expect(row).toHaveAttribute('data-ofis-row-variant', OFIS_DUZELTME_VARIANT)
      expect(screen.getByTestId('ofis-duzeltme-tip-badge')).toBeInTheDocument()
      expect(row.className).toContain('bg-rose-50')
    }
    assertAt(1366)
    assertAt(1920)
  })

  it('renders signed TRY amount with trailing ₺ (5.000,00 ₺)', () => {
    render(
      mountRow(
        sample({
          islemTipi: 'GIDER',
          tutar: '5000.00',
          belgeNo: 'OFK-5000'
        })
      )
    )
    // RTL getByText / toHaveTextContent NBSP’yi eşlemez; textContent birebir
    expect(screen.getByText((_, el) => el?.textContent === '-5.000,00\u00A0₺')).toBeInTheDocument()
  })

  it('uzun açıklamayı iki satırla sınırlar ve tam metni title ile verir', () => {
    const long =
      'İcra tahsilat - 2024/123 Esas sayılı dosya üzerinden müvekkil adına yapılan tahsilat kaydı ve açıklama detayı'
    render(mountRow(sample({ aciklama: long, belgeNo: 'OFK-LONG' })))
    const cell = screen.getByTestId('ofis-aciklama-cell')
    const btn = cell.querySelector('button')
    expect(btn).toHaveAttribute('title', long)
    const clamped = btn?.querySelector('span')
    expect(clamped?.className).toMatch(/ofis-clamp-2/)
  })

  it('boş açıklamada — gösterir', () => {
    render(mountRow(sample({ aciklama: '   ', belgeNo: 'OFK-EMPTY' })))
    expect(screen.getByTestId('ofis-aciklama-cell')).toHaveTextContent('—')
  })
})
