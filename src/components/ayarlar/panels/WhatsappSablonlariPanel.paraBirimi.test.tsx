import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { HazirSablonKatalogItem, OzelSablonDto } from '../../../api/whatsappBaglanti'

function katalog(
  libraryKey: string,
  paraBirimi: HazirSablonKatalogItem['paraBirimi'],
  statusCode: string,
  templateGroup: 'TAHSILAT' | 'RANDEVU' = 'TAHSILAT'
): HazirSablonKatalogItem {
  const ek = paraBirimi && paraBirimi !== 'TRY' ? ` (${paraBirimi})` : ''
  return {
    libraryKey,
    familyKey: libraryKey.replace(/_(USD|EUR)$/, ''),
    paraBirimi,
    displayName: `${templateGroup === 'RANDEVU' ? 'Randevu Hatırlatma' : 'Vade Günü Hatırlatma'}${ek}`,
    shortDescription: 'Açıklama',
    suggestedUse: 'Kullanım',
    category: 'UTILITY',
    language: 'tr',
    metaTemplateName: `mk_${libraryKey.toLowerCase()}_v1`,
    bodyPreview: 'Sayın {muvekkilAdi}, kalan {kalanTutar}.',
    variables: ['muvekkilAdi', 'kalanTutar'],
    suggestedKuralTuru: null,
    statusCode,
    statusLabel: statusCode === 'APPROVED' ? 'Onaylandı' : statusCode === 'PENDING' ? 'İnceleniyor' : 'Henüz gönderilmedi',
    rejectionReason: null,
    canSubmitToMeta: statusCode === 'NOT_CREATED',
    canUseInAutomation: statusCode === 'APPROVED',
    local: null,
    templateGroup
  }
}

function ozel(id: string, displayName: string, uyum: OzelSablonDto['paraBirimiUyumu']): OzelSablonDto {
  return {
    id,
    displayName,
    metaName: `ozel_${id}`,
    usageArea: 'VADE_GUNU',
    category: 'UTILITY',
    language: 'tr',
    bodyText: 'Sayın {{1}}, kalan {{2}} TL. Teşekkürler.',
    footerText: null,
    variables: [
      { index: 1, systemField: 'muvekkilAdi', exampleValue: 'Ahmet' },
      { index: 2, systemField: 'kalanTutar', exampleValue: '1.000,00' }
    ],
    statusNormalized: 'ONAYLANDI',
    rejectionReason: null,
    isEditable: false,
    isDeletable: false,
    canSubmitToMeta: false,
    paraBirimiUyumu: uyum
  }
}

const getHazir = vi.fn()
const getOzel = vi.fn()

vi.mock('../../../api/whatsappBaglanti', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../../api/whatsappBaglanti')>()
  return {
    ...actual,
    getHazirSablonKutuphanesi: () => getHazir(),
    getOzelWhatsAppSablonlari: () => getOzel(),
    metaOnayinaGonderHazirSablon: vi.fn(),
    senkronWhatsAppSablonlari: vi.fn()
  }
})
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({ session: { user: { role: 'BURO_SAHIBI' } } })
}))
vi.mock('../../../toast', () => ({ useToast: () => ({ success: vi.fn(), error: vi.fn() }) }))

const { WhatsappSablonlariPanel } = await import('./WhatsappSablonlariPanel')
const { ConfirmProvider } = await import('../../ui')

afterEach(() => {
  cleanup()
  getHazir.mockReset()
  getOzel.mockReset()
})

function renderPanel(): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  render(
    <QueryClientProvider client={client}>
      <ConfirmProvider>
        <WhatsappSablonlariPanel />
      </ConfirmProvider>
    </QueryClientProvider>
  )
}

describe('WhatsappSablonlariPanel — para birimi', () => {
  it('TL şablonları ayrı, USD/EUR sürümleri döviz bölümünde rozetle ve açıklamayla listelenir', async () => {
    getHazir.mockResolvedValue({
      ok: true,
      connectionReady: true,
      catalog: [
        katalog('TAHSILAT_VADE_GUNU', 'TRY', 'APPROVED'),
        katalog('TAHSILAT_VADE_GUNU_USD', 'USD', 'NOT_CREATED'),
        katalog('TAHSILAT_VADE_GUNU_EUR', 'EUR', 'PENDING'),
        katalog('RANDEVU_HATIRLATMA', null, 'APPROVED', 'RANDEVU')
      ]
    })
    getOzel.mockResolvedValue({ ok: true, templates: [] })
    renderPanel()

    const doviz = await screen.findByTestId('doviz-sablonlari')
    expect(within(doviz).getByText('Vade Günü Hatırlatma (USD)')).toBeTruthy()
    expect(within(doviz).getByText('Vade Günü Hatırlatma (EUR)')).toBeTruthy()
    expect(within(doviz).queryByText('Vade Günü Hatırlatma')).toBeNull()
    expect(within(doviz).getByText('USD')).toBeTruthy()
    expect(within(doviz).getByText('EUR')).toBeTruthy()
    expect(within(doviz).getByText(/yanlış para birimli mesaj gönderilmez, kredi düşülmez/)).toBeTruthy()
    expect(within(doviz).getByText('Henüz gönderilmedi')).toBeTruthy()
    expect(within(doviz).getByText('İnceleniyor')).toBeTruthy()
    expect(within(doviz).getByRole('button', { name: 'Meta Onayına Gönder' })).toBeTruthy()

    expect(screen.getByText('Vade Günü Hatırlatma')).toBeTruthy()
    expect(screen.getByText('TL')).toBeTruthy()
    expect(screen.getByText('Randevu Hatırlatma')).toBeTruthy()
  })

  it('döviz şablonu detayında para birimi gösterilir', async () => {
    getHazir.mockResolvedValue({
      ok: true,
      connectionReady: true,
      catalog: [katalog('TAHSILAT_VADE_GUNU_USD', 'USD', 'NOT_CREATED')]
    })
    getOzel.mockResolvedValue({ ok: true, templates: [] })
    renderPanel()
    const user = userEvent.setup()
    const doviz = await screen.findByTestId('doviz-sablonlari')
    await user.click(within(doviz).getByRole('button', { name: 'İncele' }))
    expect(await screen.findByText('USD taksitler için')).toBeTruthy()
  })

  it('büroya özel şablonların para birimi uyumu ve uyarısı gösterilir', async () => {
    getHazir.mockResolvedValue({ ok: true, connectionReady: true, catalog: [] })
    getOzel.mockResolvedValue({
      ok: true,
      templates: [
        ozel('a', 'TL sabit', { sabitParaBirimleri: ['TRY'], uyumluParaBirimleri: ['TRY'] }),
        ozel('b', 'Nötr', { sabitParaBirimleri: [], uyumluParaBirimleri: ['TRY', 'USD', 'EUR'] }),
        ozel('c', 'Karışık', { sabitParaBirimleri: ['TRY', 'USD'], uyumluParaBirimleri: [] })
      ]
    })
    renderPanel()

    const satirlar = await screen.findAllByTestId('ozel-sablon-para-birimi')
    expect(satirlar.map((s) => s.textContent)).toEqual([
      'Para birimi: Yalnızca TL taksitler',
      'Para birimi: Tüm para birimleri',
      'Para birimi: Para birimi karışık'
    ])
    expect(satirlar[0].getAttribute('title')).toMatch(/USD ve EUR taksitlerde bu şablonla mesaj gönderilmez/)
    expect(satirlar[1].getAttribute('title')).toBeNull()

    const user = userEvent.setup()
    await user.click(screen.getAllByRole('button', { name: 'İncele' })[0])
    expect(await screen.findByText('Yalnızca TL taksitler')).toBeTruthy()
    expect(screen.getByText(/Tutar TL olarak sabit yazılmış/)).toBeTruthy()
  })

  it('eski API (para birimi alanı yok) bozulmadan çalışır', async () => {
    const eski = katalog('TAHSILAT_VADE_GUNU', undefined, 'APPROVED')
    delete eski.paraBirimi
    getHazir.mockResolvedValue({ ok: true, connectionReady: true, catalog: [eski] })
    getOzel.mockResolvedValue({ ok: true, templates: [{ ...ozel('a', 'Eski', null), paraBirimiUyumu: undefined }] })
    renderPanel()
    expect(await screen.findByText('Vade Günü Hatırlatma')).toBeTruthy()
    expect(screen.queryByTestId('doviz-sablonlari')).toBeNull()
    expect(await screen.findByText('Eski')).toBeTruthy()
    expect(screen.queryByTestId('ozel-sablon-para-birimi')).toBeNull()
  })
})
