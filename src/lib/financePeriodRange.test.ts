import { describe, expect, it } from 'vitest'
import { formatBalanceImpact, balanceImpactTone } from '../utils/paraBirimi'
import {
  coercePresetForManualDates,
  resolveFinancePeriodRange
} from '../lib/financePeriodRange'
import { pickKarlilikPayload } from '../lib/karlilikPeriod'
import type { MuvekkilKarlilikPayload, MuvekkilKarlilikResponse } from '../types/maliOzet'

describe('formatBalanceImpact', () => {
  it('işaretli TRY/USD/EUR', () => {
    expect(formatBalanceImpact(500, 'TRY')).toBe('+500,00\u00A0₺')
    expect(formatBalanceImpact(-500, 'USD')).toBe('\u2212$500,00')
    expect(formatBalanceImpact(0, 'EUR')).toBe('€0,00')
    expect(balanceImpactTone(1)).toBe('positive')
    expect(balanceImpactTone(-1)).toBe('negative')
  })

  it('pozitif/negatif düzeltme bakiye etkisi', () => {
    expect(formatBalanceImpact(250.5, 'TRY')).toMatch(/^\+/)
    expect(formatBalanceImpact(-100, 'TRY')).toMatch(/^\u2212/)
    expect(balanceImpactTone(250.5)).toBe('positive')
    expect(balanceImpactTone(-100)).toBe('negative')
    expect(balanceImpactTone(0)).toBe('neutral')
  })
})

describe('financePeriodRange FE', () => {
  const now = new Date('2026-09-22T12:00:00+03:00')
  it('Bu Ay / Geçen Ay', () => {
    expect(resolveFinancePeriodRange('THIS_MONTH', { now }).bas).toBe('2026-09-01')
    expect(resolveFinancePeriodRange('LAST_MONTH', { now }).bit).toBe('2026-08-31')
  })
  it('manuel → CUSTOM', () => {
    expect(coercePresetForManualDates('2026-01-01', '2026-01-15', now)).toBe('CUSTOM')
  })
})

function emptyMoney() {
  return { TRY: '0.00', USD: '0.00', EUR: '0.00' }
}

function samplePayload(netTry: string): MuvekkilKarlilikPayload {
  return {
    toplamDosya: 1,
    kararlastirilanVekalet: emptyMoney(),
    tahsilEdilenVekalet: emptyMoney(),
    kalanAlacak: emptyMoney(),
    toplamAvansBakiye: '0.00',
    toplamDosyaMasrafi: '0.00',
    toplamMasrafAvansiIadesi: '0.00',
    ofisGeliri: emptyMoney(),
    gider: emptyMoney(),
    netKazanc: { TRY: netTry, USD: '0.00', EUR: '0.00' },
    kazancDagilimi: { TRY: null, USD: null, EUR: null }
  }
}

describe('pickKarlilikPayload period totals', () => {
  const tum = samplePayload('1000.00')
  const donem = samplePayload('250.00')
  const data: MuvekkilKarlilikResponse = {
    ok: true,
    tumZamanlar: tum,
    buDonem: donem,
    donemEtiketi: 'Bu Ay'
  }
  const now = new Date('2026-09-22T12:00:00+03:00')

  it('ALL_TIME → tumZamanlar', () => {
    const period = resolveFinancePeriodRange('ALL_TIME', { now })
    expect(pickKarlilikPayload(data, period).netKazanc.TRY).toBe('1000.00')
  })

  it('THIS_MONTH → buDonem', () => {
    const period = resolveFinancePeriodRange('THIS_MONTH', { now })
    expect(pickKarlilikPayload(data, period).netKazanc.TRY).toBe('250.00')
  })

  it('CUSTOM with dates → buDonem', () => {
    const period = resolveFinancePeriodRange('CUSTOM', {
      now,
      bas: '2026-08-01',
      bit: '2026-08-31'
    })
    expect(pickKarlilikPayload(data, period).netKazanc.TRY).toBe('250.00')
  })

  it('buDonem yoksa tumZamanlar fallback', () => {
    const noDonem: MuvekkilKarlilikResponse = { ...data, buDonem: null }
    const period = resolveFinancePeriodRange('THIS_MONTH', { now })
    expect(pickKarlilikPayload(noDonem, period).netKazanc.TRY).toBe('1000.00')
  })
})
