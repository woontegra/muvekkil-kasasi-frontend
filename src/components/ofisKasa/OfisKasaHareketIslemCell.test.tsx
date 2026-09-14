import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState, type ReactElement } from 'react'
import { OfisKasaHareketIslemCell } from './OfisKasaHareketIslemCell'
import { OfisKasaHareketTableRow } from './OfisKasaHareketTableRow'
import { MasrafGuvenliSilModal } from '../kasa/MasrafGuvenliSilModal'
import type { OfisKasaHareketiDto } from '../../types/ofisKasasi'
import { ofisHareketAciklamaOzet, OFIS_KAYNAK_ICRA_TAHSILAT, OFIS_KAYNAK_VEKALET_TAHSILATI } from '../../lib/ofisKasaGuvenliSil'
import { OFIS_DUZELTME_VARIANT } from '../../lib/ofisKasaDuzeltmeStil'
import { formatSignedMoney } from '../../utils/formatters'

afterEach(() => cleanup())

function sample(overrides?: Partial<OfisKasaHareketiDto>): OfisKasaHareketiDto {
  return {
    id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    tenantId: 't',
    islemTipi: 'GIDER',
    tarih: '2026-09-11T00:00:00.000Z',
    kategori: 'Banka masrafı',
    ozelKategoriAdi: null,
    aciklama: 'EFT ücreti',
    tutar: '45.00',
    paraBirimi: 'TRY',
    dovizDonusumId: null,
    kur: null,
    kurBazParaBirimi: null,
    kurKarsiParaBirimi: null,
    odemeYontemi: 'BANKA',
    belgeNo: 'IMP-2024-000123',
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
    createdAt: '2026-09-11T10:00:00.000Z',
    updatedAt: '2026-09-11T10:00:00.000Z',
    ...overrides
  }
}

const noop = (): void => undefined

function cell(h: OfisKasaHareketiDto, role: 'BURO_SAHIBI' | 'AVUKAT_YONETICI' = 'BURO_SAHIBI') {
  return (
    <OfisKasaHareketIslemCell
      hareket={h}
      role={role}
      yonetici
      onApprove={noop}
      onReject={noop}
      onHardDelete={noop}
      onDuzeltme={noop}
      onDovizDelete={noop}
      onGuvenliSil={noop}
    />
  )
}

describe('OfisKasaHareketIslemCell — gelir/gider güvenli işlemler', () => {
  it('BURO_SAHIBI + manuel GELIR → Düzeltme + Sil (modal ayrımı gelir)', () => {
    render(cell(sample({ islemTipi: 'GELIR', belgeNo: 'OFK-G', kategori: 'Danışmanlık geliri' })))
    expect(screen.getByTestId('ofis-duzeltme-btn')).toBeInTheDocument()
    expect(screen.getByTestId('ofis-gelir-sil-btn')).toHaveTextContent('Sil')
    expect(screen.queryByText('Geliri sil')).not.toBeInTheDocument()
    expect(screen.queryByTestId('ofis-masraf-sil-btn')).not.toBeInTheDocument()
  })

  it('BURO_SAHIBI + vekalet/taksit geliri → Sil (tahsilat iptal modu)', () => {
    render(
      cell(
        sample({
          islemTipi: 'GELIR',
          kaynakTipi: OFIS_KAYNAK_VEKALET_TAHSILATI,
          kaynakId: 'odeme-1',
          kategori: 'Vekalet tahsilatı'
        })
      )
    )
    expect(screen.getByTestId('ofis-tahsilat-iptal-btn')).toHaveTextContent('Sil')
    expect(screen.queryByText('Tahsilatı iptal et')).not.toBeInTheDocument()
    expect(screen.queryByTestId('ofis-gelir-sil-btn')).not.toBeInTheDocument()
  })

  it('BURO_SAHIBI + icra tahsilatı → Sil', () => {
    render(
      cell(
        sample({
          islemTipi: 'GELIR',
          kaynakTipi: OFIS_KAYNAK_ICRA_TAHSILAT,
          kaynakId: 'icra-odeme-1'
        })
      )
    )
    expect(screen.getByTestId('ofis-tahsilat-iptal-btn')).toHaveTextContent('Sil')
  })

  it('BURO_SAHIBI + GIDER → Düzeltme + Sil', () => {
    render(cell(sample()))
    expect(screen.getByTestId('ofis-duzeltme-btn')).toBeInTheDocument()
    expect(screen.getByTestId('ofis-masraf-sil-btn')).toHaveTextContent('Sil')
    expect(screen.queryByText('Masrafı sil')).not.toBeInTheDocument()
  })

  it('AVUKAT_YONETICI → yalnız Düzeltme; Sil yeri tutucu ile hiza korunur', () => {
    render(cell(sample({ islemTipi: 'GELIR' }), 'AVUKAT_YONETICI'))
    expect(screen.queryByTestId('ofis-masraf-sil-btn')).not.toBeInTheDocument()
    expect(screen.queryByTestId('ofis-gelir-sil-btn')).not.toBeInTheDocument()
    expect(screen.queryByTestId('ofis-tahsilat-iptal-btn')).not.toBeInTheDocument()
    expect(screen.getByTestId('ofis-duzeltme-btn')).toBeInTheDocument()
    expect(screen.getByTestId('ofis-kasa-duzeltme-sil-grid')).toBeInTheDocument()
  })

  it('DUZELTME → silme/iptal yok; kırmızı satır varyantı', () => {
    render(
      <table>
        <tbody>
          <OfisKasaHareketTableRow
            hareket={sample({ islemTipi: 'DUZELTME', belgeNo: 'DZT-2026-000001', kategori: 'Düzeltme' })}
            role="BURO_SAHIBI"
            yonetici
            muvekkilAdi="—"
            signed={50}
            paraBirimi="TRY"
            formatSignedMoney={formatSignedMoney}
            odemeLabel={() => 'Banka'}
            onayLabel={() => 'Onaylı'}
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
    expect(screen.queryByTestId('ofis-masraf-sil-btn')).not.toBeInTheDocument()
    expect(screen.queryByTestId('ofis-gelir-sil-btn')).not.toBeInTheDocument()
    expect(screen.queryByTestId('ofis-tahsilat-iptal-btn')).not.toBeInTheDocument()
    expect(screen.queryByTestId('ofis-kasa-duzeltme-sil-grid')).not.toBeInTheDocument()
    expect(screen.getByTestId('ofis-hareket-row')).toHaveAttribute('data-ofis-row-variant', OFIS_DUZELTME_VARIANT)
    expect(screen.getByTestId('ofis-duzeltme-tip-badge')).toHaveTextContent('Düzeltme')
  })

  it('Sil tıklanınca modal başlığı Geliri sil olur', async () => {
    const user = userEvent.setup()
    const h = sample({ islemTipi: 'GELIR', kategori: 'Danışmanlık geliri' })

    function Harness(): ReactElement {
      const [show, setShow] = useState(false)
      return (
        <>
          <OfisKasaHareketIslemCell
            hareket={h}
            role="BURO_SAHIBI"
            yonetici
            onApprove={noop}
            onReject={noop}
            onHardDelete={noop}
            onDuzeltme={noop}
            onDovizDelete={noop}
            onGuvenliSil={() => setShow(true)}
          />
          {show ? (
            <MasrafGuvenliSilModal
              ozet={{
                id: h.id,
                tarih: h.tarih,
                aciklama: ofisHareketAciklamaOzet(h),
                tutar: h.tutar,
                odemeYontemiLabel: 'Banka',
                belgeNo: h.belgeNo,
                mode: 'GELIR_SIL',
                muvekkilAdi: '—',
                kategori: h.kategori,
                paraBirimi: 'TRY'
              }}
              onClose={() => setShow(false)}
              onSubmit={vi.fn()}
            />
          ) : null}
        </>
      )
    }

    render(<Harness />)
    expect(screen.getByTestId('ofis-gelir-sil-btn')).toHaveTextContent('Sil')
    await user.click(screen.getByTestId('ofis-gelir-sil-btn'))
    expect(screen.getByRole('heading', { name: 'Geliri sil' })).toBeInTheDocument()
    expect(screen.getByText(/mali toplamlardan çıkarılacak/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/mevcut giriş şifrenizi yeniden girin/i)).toHaveValue('')
  })

  it('Gider modal başlığı Masrafı sil; tahsilat modalı Tahsilatı iptal et', () => {
    render(
      <MasrafGuvenliSilModal
        ozet={{
          id: '1',
          tarih: '2026-09-11',
          aciklama: 'x',
          tutar: '10',
          odemeYontemiLabel: 'Banka',
          belgeNo: 'OFK-1',
          mode: 'GIDER_SIL',
          paraBirimi: 'TRY'
        }}
        onClose={noop}
        onSubmit={noop}
      />
    )
    expect(screen.getByRole('heading', { name: 'Masrafı sil' })).toBeInTheDocument()
    cleanup()
    render(
      <MasrafGuvenliSilModal
        ozet={{
          id: '2',
          tarih: '2026-09-11',
          aciklama: 'y',
          tutar: '20',
          odemeYontemiLabel: 'Banka',
          belgeNo: 'OFK-2',
          mode: 'TAHSILAT_IPTAL',
          paraBirimi: 'TRY'
        }}
        onClose={noop}
        onSubmit={noop}
      />
    )
    expect(screen.getByRole('heading', { name: 'Tahsilatı iptal et' })).toBeInTheDocument()
  })
})
