import { describe, expect, it } from 'vitest'
import { bildirimKalanTutarLabel } from './tahsilatBildirim'

describe('bildirimKalanTutarLabel', () => {
  it('USD/EUR taksitte tutarı kendi para birimiyle gösterir, TL göstermez', () => {
    const usd = bildirimKalanTutarLabel({ kalanTutarSnapshot: '1250.50', paraBirimi: 'USD' })
    expect(usd).toBe('$1.250,50')
    expect(usd).not.toMatch(/₺|TL/)
    expect(bildirimKalanTutarLabel({ kalanTutarSnapshot: '99.00', paraBirimi: 'EUR' })).toBe('€99,00')
  })

  it('TRY taksitte eski TL gösterimini korur', () => {
    expect(bildirimKalanTutarLabel({ kalanTutarSnapshot: '1250.50', paraBirimi: 'TRY' })).toBe('1.250,50\u00A0₺')
  })

  it('para birimi bilinmiyorsa TL varsaymaz', () => {
    for (const paraBirimi of [undefined, null, '', 'GBP']) {
      const s = bildirimKalanTutarLabel({ kalanTutarSnapshot: '1250.50', paraBirimi })
      expect(s).toBe('1.250,50 (para birimi bilinmiyor)')
    }
  })
})
