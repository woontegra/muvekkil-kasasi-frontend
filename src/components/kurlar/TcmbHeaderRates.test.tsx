import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactElement, ReactNode } from 'react'
import { TcmbHeaderRatesMobile } from './TcmbHeaderRates'
import { getTcmbRates, tcmbRatesQueryKey } from '../../api/kurlar'
import type { TcmbRatesAvailableResponse } from '../../types/kurlar'
import { istanbulTodayYmd } from '../../utils/tcmbFormat'
import { ToastProvider } from '../../toast'
import { clearTcmbRefreshInflightForTests } from '../../lib/tcmbRefresh'

vi.mock('../../api/kurlar', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../../api/kurlar')>()
  return {
    ...actual,
    getTcmbRates: vi.fn()
  }
})

const mockedGet = vi.mocked(getTcmbRates)

function sampleRates(overrides?: Partial<TcmbRatesAvailableResponse>): TcmbRatesAvailableResponse {
  const today = istanbulTodayYmd()
  return {
    ok: true,
    available: true,
    istenilenTarih: today,
    bulunanTcmbKurTarihi: today,
    effectiveDate: today,
    fetchedAt: new Date().toISOString(),
    lastCheckedAt: new Date().toISOString(),
    fromCache: false,
    source: 'TCMB',
    sourceLabel: 'TCMB Döviz Alış',
    stale: false,
    fallbackKullanildi: false,
    usdDovizAlis: '34.80000000',
    usdDovizSatis: '34.90000000',
    eurDovizAlis: '37.50000000',
    eurDovizSatis: '37.60000000',
    usdEurCapraz: '0.92800000',
    eurUsdCapraz: '1.07758621',
    rates: [],
    ...overrides
  }
}

function wrapper(qc: QueryClient) {
  return function W({ children }: { children: ReactNode }): ReactElement {
    return (
      <QueryClientProvider client={qc}>
        <ToastProvider>{children}</ToastProvider>
      </QueryClientProvider>
    )
  }
}

afterEach(() => {
  cleanup()
  mockedGet.mockReset()
  clearTcmbRefreshInflightForTests()
})

describe('TcmbHeaderRates refresh button', () => {
  beforeEach(() => {
    mockedGet.mockResolvedValue(sampleRates())
  })

  it('kur bilgisinin solunda yenile butonu gösterir', async () => {
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const date = istanbulTodayYmd()
    qc.setQueryData(tcmbRatesQueryKey(date), sampleRates())

    render(<TcmbHeaderRatesMobile />, { wrapper: wrapper(qc) })

    const btn = await screen.findByRole('button', { name: 'TCMB kurlarını yenile' })
    expect(btn).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Kurlar' })).toBeInTheDocument()
    // Yenile, Kurlar düğmesinden önce (solunda)
    expect(btn.compareDocumentPosition(screen.getByRole('button', { name: 'Kurlar' }))).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    )
  })

  it('tıklamada forceRefresh gönderir ve disabled olur', async () => {
    const user = userEvent.setup()
    const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } })
    const date = istanbulTodayYmd()
    qc.setQueryData(tcmbRatesQueryKey(date), sampleRates())

    render(<TcmbHeaderRatesMobile />, { wrapper: wrapper(qc) })
    const btn = await screen.findByRole('button', { name: 'TCMB kurlarını yenile' })

    // Mount refetchOnMount: 'always' tamamlandıktan sonra manuel yenilemeyi geciktir.
    await waitFor(() => expect(mockedGet).toHaveBeenCalled())
    mockedGet.mockClear()

    let resolveFetch!: (v: TcmbRatesAvailableResponse) => void
    mockedGet.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveFetch = resolve
        })
    )

    await user.click(btn)

    expect(btn).toBeDisabled()
    expect(mockedGet).toHaveBeenCalledWith({ date, forceRefresh: true })

    resolveFetch(sampleRates())
    await waitFor(() => expect(btn).not.toBeDisabled())
  })
})
