import { describe, expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import {
  invalidateFinancialQueries,
  MUVEKKIL_KARLILIK_QUERY_KEY,
  OFIS_KASASI_HAREKETLER_QUERY_KEY,
  OFIS_KASASI_OZET_QUERY_KEY
} from './financialQueryInvalidation'
import { DASHBOARD_SUMMARY_QUERY_KEY, TAKSIT_UYARILARI_QUERY_KEY } from '../api/dashboard'
import { MALI_KONTROL_QUERY_KEY } from '../api/maliKontrol'
import { SMM_BEKLEYEN_QUERY_KEY } from '../api/smm'

describe('invalidateFinancialQueries', () => {
  it('gerçek ofis-kasası ve mali key’leri invalidate eder; ofis-kasa kullanmaz', () => {
    const qc = new QueryClient()
    const spy = vi.spyOn(qc, 'invalidateQueries')
    invalidateFinancialQueries(qc, { dosyaId: 'd1', muvekkilId: 'm1' })
    const keys = spy.mock.calls.map((c) => JSON.stringify(c[0]?.queryKey))
    expect(keys).toContain(JSON.stringify([...OFIS_KASASI_OZET_QUERY_KEY]))
    expect(keys).toContain(JSON.stringify([...OFIS_KASASI_HAREKETLER_QUERY_KEY]))
    expect(keys).toContain(JSON.stringify([...MUVEKKIL_KARLILIK_QUERY_KEY, 'm1']))
    expect(keys).toContain(JSON.stringify([...DASHBOARD_SUMMARY_QUERY_KEY]))
    expect(keys).toContain(JSON.stringify([...TAKSIT_UYARILARI_QUERY_KEY]))
    expect(keys).toContain(JSON.stringify([...SMM_BEKLEYEN_QUERY_KEY]))
    expect(keys).toContain(JSON.stringify([...MALI_KONTROL_QUERY_KEY]))
    expect(keys).toContain(JSON.stringify(['vekalet', 'd1']))
    expect(keys.some((k) => k === JSON.stringify(['ofis-kasa']))).toBe(false)
  })
})
