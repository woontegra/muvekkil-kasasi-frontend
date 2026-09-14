import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState, type ReactElement } from 'react'
import { DosyaKasaHareketIslemCell } from './DosyaKasaHareketIslemCell'
import { MasrafGuvenliSilModal } from './MasrafGuvenliSilModal'
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

const noop = (): void => undefined

function cell(
  h: KasaHareketiDto,
  role: 'BURO_SAHIBI' | 'AVUKAT_YONETICI' = 'BURO_SAHIBI'
): ReactElement {
  return (
    <DosyaKasaHareketIslemCell
      hareket={h}
      role={role}
      yonetici
      onApprove={noop}
      onReject={noop}
      onHardDelete={noop}
      onDuzeltme={noop}
      onGuvenliSil={noop}
    />
  )
}

describe('DosyaKasaHareketIslemCell', () => {
  it('BURO_SAHIBI + onaylı AVANS → Düzeltme ekle + Sil', () => {
    render(cell(sample({ tip: 'AVANS_GIRISI', belgeNo: 'AVN-1', tutar: '5000.00' })))
    expect(screen.getByTestId('dosya-kasa-duzeltme-btn')).toHaveTextContent('Düzeltme ekle')
    expect(screen.getByTestId('dosya-kasa-guvenli-sil-btn')).toHaveTextContent('Sil')
    expect(screen.queryByText('Avansı sil')).not.toBeInTheDocument()
    expect(screen.queryByText('Masrafı sil')).not.toBeInTheDocument()
  })

  it('BURO_SAHIBI + onaylı MASRAF → Düzeltme ekle + Sil', () => {
    render(cell(sample({ tip: 'MASRAF', tutar: '3500.00' })))
    expect(screen.getByTestId('dosya-kasa-duzeltme-btn')).toHaveTextContent('Düzeltme ekle')
    expect(screen.getByTestId('dosya-kasa-guvenli-sil-btn')).toHaveTextContent('Sil')
    expect(screen.queryByText('Masraf sil')).not.toBeInTheDocument()
  })

  it('DUZELTME → Sil yok', () => {
    render(cell(sample({ tip: 'DUZELTME', belgeNo: 'DZT-1' })))
    expect(screen.queryByTestId('dosya-kasa-guvenli-sil-btn')).not.toBeInTheDocument()
    expect(screen.queryByTestId('dosya-kasa-duzeltme-sil-grid')).not.toBeInTheDocument()
  })

  it('AVUKAT_YONETICI + AVANS/MASRAF → Sil yok', () => {
    render(cell(sample({ tip: 'AVANS_GIRISI' }), 'AVUKAT_YONETICI'))
    expect(screen.getByTestId('dosya-kasa-duzeltme-btn')).toBeInTheDocument()
    expect(screen.queryByTestId('dosya-kasa-guvenli-sil-btn')).not.toBeInTheDocument()
    cleanup()
    render(cell(sample({ tip: 'MASRAF' }), 'AVUKAT_YONETICI'))
    expect(screen.queryByTestId('dosya-kasa-guvenli-sil-btn')).not.toBeInTheDocument()
  })

  it('Sil tıklanınca AVANS modal başlığı Avansı sil; şifre boş', async () => {
    const user = userEvent.setup()
    const h = sample({ tip: 'AVANS_GIRISI', belgeNo: 'AVN-9' })

    function Harness(): ReactElement {
      const [show, setShow] = useState(false)
      return (
        <>
          <DosyaKasaHareketIslemCell
            hareket={h}
            role="BURO_SAHIBI"
            yonetici
            onApprove={noop}
            onReject={noop}
            onHardDelete={noop}
            onDuzeltme={noop}
            onGuvenliSil={() => setShow(true)}
          />
          {show ? (
            <MasrafGuvenliSilModal
              ozet={{
                id: h.id,
                tarih: h.tarih,
                aciklama: h.aciklama ?? '—',
                tutar: h.tutar,
                odemeYontemiLabel: 'Nakit',
                belgeNo: h.belgeNo,
                mode: 'AVANS_SIL'
              }}
              onClose={() => setShow(false)}
              onSubmit={vi.fn()}
            />
          ) : null}
        </>
      )
    }

    render(<Harness />)
    await user.click(screen.getByTestId('dosya-kasa-guvenli-sil-btn'))
    expect(screen.getByRole('heading', { name: 'Avansı sil' })).toBeInTheDocument()
    expect(screen.getByLabelText(/mevcut giriş şifrenizi yeniden girin/i)).toHaveValue('')
  })
})
