import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { DosyaKasaHareketTableRow } from './DosyaKasaHareketTableRow'
import type { KasaHareketiDto } from '../../types/kasa'

afterEach(() => cleanup())

function sample(overrides?: Partial<KasaHareketiDto>): KasaHareketiDto {
  return {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    tenantId: 't',
    dosyaId: 'd',
    muvekkilId: 'm',
    tip: 'MASRAF',
    tarih: '2026-09-11T00:00:00.000Z',
    tutar: '1500.00',
    odemeYontemi: 'NAKIT',
    belgeNo: 'MSF-2026-1',
    onayDurumu: 'ONAYLI',
    aciklama: 'Test',
    masrafTuru: 'Tebligat',
    ozelMasrafAdi: null,
    masrafiYapanKisi: null,
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
    createdAt: '2026-09-11T00:00:00.000Z',
    updatedAt: '2026-09-11T00:00:00.000Z',
    ...overrides
  }
}

const noop = () => undefined

describe('DosyaKasaHareketTableRow', () => {
  it('shows Düzeltildi badge on corrected parent', () => {
    render(
      <table>
        <tbody>
          <DosyaKasaHareketTableRow
            hareket={sample({ duzeltildi: true })}
            role="AVUKAT_YONETICI"
            yonetici
            odemeLabel={() => 'Nakit'}
            onayLabel={() => 'Onaylı'}
            aciklamaText="Masraf"
            tipLabel="Masraf"
            signedAmount={-1500}
            onApprove={noop}
            onReject={noop}
            onHardDelete={noop}
            onDuzeltme={noop}
            onGuvenliSil={noop}
          />
        </tbody>
      </table>
    )
    expect(screen.getByText('Düzeltildi')).toBeTruthy()
  })

  it('shows explicit +/− balance impact for positive correction', () => {
    render(
      <table>
        <tbody>
          <DosyaKasaHareketTableRow
            hareket={sample({
              tip: 'DUZELTME',
              tutar: '500.00',
              bakiyeEtkisi: '500',
              bakiyeEtkisiDisplay: '+500,00\u00A0₺',
              aciklama: 'Eksik tahsilat',
              duzeltenUserAd: 'Ayşe',
              orijinalBelgeNo: 'MSF-1'
            })}
            role="AVUKAT_YONETICI"
            yonetici
            odemeLabel={() => 'Nakit'}
            onayLabel={() => 'Onaylı'}
            aciklamaText="Düzeltme"
            tipLabel="Düzeltme"
            signedAmount={500}
            onApprove={noop}
            onReject={noop}
            onHardDelete={noop}
            onDuzeltme={noop}
            onGuvenliSil={noop}
          />
        </tbody>
      </table>
    )
    expect(screen.getByTestId('dosya-kasa-bakiye-etkisi').textContent).toContain('+')
    expect(screen.getByText(/Düzelten:/)).toBeTruthy()
    expect(screen.getByText(/Neden:/)).toBeTruthy()
  })

  it('shows orphan warning when parent missing', () => {
    render(
      <table>
        <tbody>
          <DosyaKasaHareketTableRow
            hareket={sample({
              tip: 'DUZELTME',
              tutar: '-200.00',
              bakiyeEtkisi: '-200',
              bakiyeEtkisiDisplay: '−200,00\u00A0₺',
              orphanWarning: true,
              bagliIslemUyari: 'Bağlı işlem bulunamadı'
            })}
            role="AVUKAT_YONETICI"
            yonetici
            odemeLabel={() => 'Nakit'}
            onayLabel={() => 'Onaylı'}
            aciklamaText="Düzeltme"
            tipLabel="Düzeltme"
            signedAmount={-200}
            onApprove={noop}
            onReject={noop}
            onHardDelete={noop}
            onDuzeltme={noop}
            onGuvenliSil={noop}
          />
        </tbody>
      </table>
    )
    expect(screen.getByText('Bağlı işlem bulunamadı')).toBeTruthy()
    expect(screen.getByTestId('dosya-kasa-bakiye-etkisi').textContent).toMatch(/[−-]/)
  })
})
