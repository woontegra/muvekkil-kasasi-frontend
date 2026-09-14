import { describe, expect, it } from 'vitest'
import { TAKSIT_SIL_UYARI } from './VekaletSatirGuvenliSilFlow'

describe('VekaletSatirGuvenliSilFlow', () => {
  it('ödemesiz taksit uyarı metni anlaşılan ücreti korur', () => {
    expect(TAKSIT_SIL_UYARI).toMatch(/anlaşılan vekalet ücreti değişmeyecektir/i)
  })
})
