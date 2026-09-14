import { describe, expect, it } from 'vitest'
import {
  formatApproxTryMoney,
  formatKurOzetiWithSymbols,
  formatMoney,
  formatMoneyWithCode,
  formatSignedMoney,
  MONEY_NBSP
} from './paraBirimi'

describe('formatMoney — ürün para gösterim sözleşmesi', () => {
  it('TRY pozitif: 5.000,00 ₺ (NBSP)', () => {
    expect(formatMoney(5000, 'TRY')).toBe(`5.000,00${MONEY_NBSP}₺`)
  })

  it('TRY negatif: -2.500,00 ₺', () => {
    expect(formatMoney(-2500, 'TRY')).toBe(`-2.500,00${MONEY_NBSP}₺`)
  })

  it('TRY sıfır: 0,00 ₺', () => {
    expect(formatMoney(0, 'TRY')).toBe(`0,00${MONEY_NBSP}₺`)
  })

  it('TRY yaklaşık: ≈ 121.076,25 ₺', () => {
    expect(formatApproxTryMoney(121076.25)).toBe(`≈${MONEY_NBSP}121.076,25${MONEY_NBSP}₺`)
  })

  it('USD pozitif/negatif', () => {
    expect(formatMoney(1000, 'USD')).toBe('$1.000,00')
    expect(formatMoney(-1000, 'USD')).toBe('-$1.000,00')
  })

  it('EUR pozitif/negatif', () => {
    expect(formatMoney(1000, 'EUR')).toBe('€1.000,00')
    expect(formatMoney(-1000, 'EUR')).toBe('-€1.000,00')
  })

  it('küsurat ve milyon', () => {
    expect(formatMoney(1500, 'TRY')).toBe(`1.500,00${MONEY_NBSP}₺`)
    expect(formatMoney(3500, 'TRY')).toBe(`3.500,00${MONEY_NBSP}₺`)
    expect(formatMoney(1_234_567.89, 'TRY')).toBe(`1.234.567,89${MONEY_NBSP}₺`)
  })

  it('satır bölünmeme: tutar ile ₺ arasında NBSP (normal space değil)', () => {
    const s = formatMoney(5000, 'TRY')
    expect(s.includes(`00${MONEY_NBSP}₺`)).toBe(true)
    expect(s.includes('00 ₺')).toBe(false)
    expect(/\d\s₺/.test(s.replace(MONEY_NBSP, ''))).toBe(false)
  })

  it('formatSignedMoney formatMoney ile aynı', () => {
    expect(formatSignedMoney(-100, 'TRY')).toBe(formatMoney(-100, 'TRY'))
    expect(formatSignedMoney(100, 'USD')).toBe(formatMoney(100, 'USD'))
  })

  it('formatMoneyWithCode kodları korur', () => {
    expect(formatMoneyWithCode(100, 'TRY')).toBe(`100,00${MONEY_NBSP}₺ TRY`)
    expect(formatMoneyWithCode(100, 'USD')).toBe('$100,00 USD')
  })

  it('kur satırı sembolle TRY', () => {
    expect(formatKurOzetiWithSymbols('USD', 'TRY', 48.4305, 4)).toBe(`1 USD = 48,4305${MONEY_NBSP}₺`)
  })

  it('eski ₺+rakam biçimi üretilmez', () => {
    expect(formatMoney(5000, 'TRY')).not.toMatch(/^₺/)
    expect(formatMoney(1500, 'TRY')).not.toMatch(/₺\d/)
  })
})
