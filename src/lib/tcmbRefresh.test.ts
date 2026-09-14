import { describe, expect, it, vi, beforeEach } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { getTcmbRates, tcmbRatesQueryKey, TCMB_YAKLASIK_TRY_QUERY_KEY } from '../api/kurlar'
import {
  clearTcmbRefreshInflightForTests,
  refreshTcmbRatesManually,
  TCMB_REFRESH_FAILED_MESSAGE,
  TCMB_REFRESH_UNCHANGED_MESSAGE,
  TCMB_REFRESH_UPDATED_MESSAGE
} from './tcmbRefresh'
import type { TcmbRatesAvailableResponse } from '../types/kurlar'

vi.mock('../api/kurlar', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../api/kurlar')>()
  return {
    ...actual,
    getTcmbRates: vi.fn()
  }
})

const mockedGet = vi.mocked(getTcmbRates)

function sampleRates(overrides?: Partial<TcmbRatesAvailableResponse>): TcmbRatesAvailableResponse {
  return {
    ok: true,
    available: true,
    istenilenTarih: '2026-09-11',
    bulunanTcmbKurTarihi: '2026-09-11',
    effectiveDate: '2026-09-11',
    fetchedAt: '2026-09-11T12:00:00.000Z',
    lastCheckedAt: '2026-09-11T12:00:00.000Z',
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

describe('refreshTcmbRatesManually', () => {
  beforeEach(() => {
    mockedGet.mockReset()
    clearTcmbRefreshInflightForTests()
  })

  it('forceRefresh=true ile TCMB ister ve kur değişince updated mesajı verir', async () => {
    const qc = new QueryClient()
    const date = '2026-09-11'
    qc.setQueryData(tcmbRatesQueryKey(date), sampleRates({ usdDovizAlis: '30.00000000' }))
    const next = sampleRates({ usdDovizAlis: '34.80000000' })
    mockedGet.mockResolvedValueOnce(next)

    const invalidateSpy = vi.spyOn(qc, 'invalidateQueries')

    const outcome = await refreshTcmbRatesManually(qc, { date })
    expect(mockedGet).toHaveBeenCalledWith({ date, forceRefresh: true })
    expect(outcome.status).toBe('updated')
    expect(outcome.message).toBe(TCMB_REFRESH_UPDATED_MESSAGE)
    expect(qc.getQueryData(tcmbRatesQueryKey(date))).toEqual(next)
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: [...TCMB_YAKLASIK_TRY_QUERY_KEY] })
  })

  it('aynı kurda unchanged mesajı verir', async () => {
    const qc = new QueryClient()
    const date = '2026-09-11'
    const same = sampleRates()
    qc.setQueryData(tcmbRatesQueryKey(date), same)
    mockedGet.mockResolvedValueOnce(sampleRates())

    const outcome = await refreshTcmbRatesManually(qc, { date })
    expect(outcome.status).toBe('unchanged')
    expect(outcome.message).toBe(TCMB_REFRESH_UNCHANGED_MESSAGE)
  })

  it('TCMB hatasında önceki veriyi silmez', async () => {
    const qc = new QueryClient()
    const date = '2026-09-11'
    const prev = sampleRates()
    qc.setQueryData(tcmbRatesQueryKey(date), prev)
    mockedGet.mockRejectedValueOnce(new Error('network'))

    const outcome = await refreshTcmbRatesManually(qc, { date })
    expect(outcome.status).toBe('failed')
    expect(outcome.message).toBe(TCMB_REFRESH_FAILED_MESSAGE)
    expect(qc.getQueryData(tcmbRatesQueryKey(date))).toEqual(prev)
  })

  it('stale cevapta failed sayar ve cache’i bozmaz', async () => {
    const qc = new QueryClient()
    const date = '2026-09-11'
    const prev = sampleRates()
    qc.setQueryData(tcmbRatesQueryKey(date), prev)
    mockedGet.mockResolvedValueOnce(sampleRates({ stale: true, usdDovizAlis: '99.00000000' }))

    const outcome = await refreshTcmbRatesManually(qc, { date })
    expect(outcome.status).toBe('failed')
    expect(qc.getQueryData(tcmbRatesQueryKey(date))).toEqual(prev)
  })

  it('art arda çağrılarda tek uçuş kullanır', async () => {
    const qc = new QueryClient()
    const date = '2026-09-11'
    let resolveGet!: (v: TcmbRatesAvailableResponse) => void
    mockedGet.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveGet = resolve
        })
    )

    const p1 = refreshTcmbRatesManually(qc, { date })
    const p2 = refreshTcmbRatesManually(qc, { date })
    resolveGet(sampleRates())
    const [a, b] = await Promise.all([p1, p2])
    expect(mockedGet).toHaveBeenCalledTimes(1)
    expect(a.status).toBe('updated')
    expect(b.status).toBe('updated')
  })
})
