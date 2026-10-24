import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MotionProvider } from '../../motion/MotionProvider'
import { AdminApiError } from '../../api/adminClient'

const statusMock = vi.fn()
const testMock = vi.fn()

vi.mock('../../api/adminApi', () => ({
  adminWhatsAppWebhookOverrideStatusRequest: (...a: unknown[]) => statusMock(...a),
  adminWhatsAppControlledSessionTestRequest: (...a: unknown[]) => testMock(...a)
}))

const { AdminWhatsAppControlledTestPanel } = await import('./AdminWhatsAppControlledTestPanel')

const TENANT = 'c433539d-fae3-4419-a6d8-9f1b59464d61'

function renderPanel(enabled = true) {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return render(
    <MotionProvider>
      <QueryClientProvider client={qc}>
        <AdminWhatsAppControlledTestPanel tenantId={TENANT} enabled={enabled} />
      </QueryClientProvider>
    </MotionProvider>
  )
}

async function numaraGirVeOnayAc(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText('Alıcı telefon numarası'), '0532 515 85 07')
  await user.click(screen.getByRole('button', { name: 'Test mesajını gönder' }))
}

beforeEach(() => {
  statusMock.mockResolvedValue({ ok: true, tenantId: TENANT, uiDurum: 'PASIF' })
  testMock.mockReset()
})

afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

describe('AdminWhatsAppControlledTestPanel', () => {
  it('SUPER_ADMIN değilse hiçbir şey göstermez ve istek atmaz', () => {
    const { container } = renderPanel(false)
    expect(container).toBeEmptyDOMElement()
    expect(statusMock).not.toHaveBeenCalled()
    expect(testMock).not.toHaveBeenCalled()
  })

  it('bağlantı aktif değilse test alanını göstermez', async () => {
    statusMock.mockRejectedValue(new AdminApiError('x', 400, 'WHATSAPP_NOT_CONNECTED'))
    renderPanel()
    expect(await screen.findByText(/bağlantısı aktif olmadığı için test kullanılamaz/)).toBeInTheDocument()
    expect(screen.queryByLabelText('Alıcı telefon numarası')).not.toBeInTheDocument()
  })

  it('onay penceresinde maskeli numara ve sabit metin; çift tıklamada tek istek; kabul mesajı', async () => {
    let resolve!: (v: unknown) => void
    testMock.mockReturnValue(new Promise((r) => (resolve = r)))
    const user = userEvent.setup()
    renderPanel()
    await numaraGirVeOnayAc(user)

    expect(screen.getByText(/\+90 532 \*\*\* \*\* 07/)).toBeInTheDocument()
    expect(screen.getByText(/Müvekkil Kasa WhatsApp API bağlantı testi\./, { selector: 'p.whitespace-pre-line' })).toBeInTheDocument()
    expect(testMock).not.toHaveBeenCalled()

    await user.dblClick(screen.getByRole('button', { name: 'Onayla ve gönder' }))
    expect(testMock).toHaveBeenCalledTimes(1)
    expect(testMock).toHaveBeenCalledWith({ tenantId: TENANT, to: '905325158507' })

    resolve({ ok: true, idempotent: false, jobId: 'j1', durum: 'GONDERILDI', providerMessageId: 'wamid.1' })
    expect(await screen.findByText('Gönderim Meta tarafından kabul edildi')).toBeInTheDocument()
    expect(screen.getByText(/teslim edildiği veya okunduğu anlamına\s+gelmez/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Test mesajını gönder' })).toBeDisabled()
    expect(testMock).toHaveBeenCalledTimes(1)
  })

  it('vazgeçilirse istek atılmaz', async () => {
    const user = userEvent.setup()
    renderPanel()
    await numaraGirVeOnayAc(user)
    await user.click(screen.getByRole('button', { name: 'Vazgeç' }))
    expect(testMock).not.toHaveBeenCalled()
  })

  it('aynı gün önceki test varsa yeni gönderim yapılmadığını söyler', async () => {
    testMock.mockResolvedValue({ ok: true, idempotent: true, jobId: 'j1', durum: 'GONDERILDI', providerMessageId: 'w' })
    const user = userEvent.setup()
    renderPanel()
    await numaraGirVeOnayAc(user)
    await user.click(screen.getByRole('button', { name: 'Onayla ve gönder' }))
    expect(await screen.findByText('Yeni gönderim yapılmadı')).toBeInTheDocument()
    expect(screen.queryByText('Gönderim Meta tarafından kabul edildi')).not.toBeInTheDocument()
  })

  it('Meta hatasında Türkçe açıklama gösterir ve aynı numaraya tekrar gönderimi kilitler', async () => {
    testMock.mockRejectedValue(new AdminApiError('raw', 502, 'META_131047'))
    const user = userEvent.setup()
    renderPanel()
    await numaraGirVeOnayAc(user)
    await user.click(screen.getByRole('button', { name: 'Onayla ve gönder' }))
    expect(await screen.findByText(/24 saatlik müşteri hizmetleri penceresi kapalı/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Test mesajını gönder' })).toBeDisabled()
  })

  it('429 sonrası gönderim denenmediği için tekrar denemeye izin verir', async () => {
    testMock.mockRejectedValue(new AdminApiError('raw', 429, 'RATE_LIMIT'))
    const user = userEvent.setup()
    renderPanel()
    await numaraGirVeOnayAc(user)
    await user.click(screen.getByRole('button', { name: 'Onayla ve gönder' }))
    expect(await screen.findByText(/dakikada en fazla 3/)).toBeInTheDocument()
    await waitFor(() => expect(screen.getByRole('button', { name: 'Test mesajını gönder' })).toBeEnabled())
  })
})
