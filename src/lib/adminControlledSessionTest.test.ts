import { describe, expect, it } from 'vitest'
import {
  CONTROLLED_SESSION_TEST_TEXT,
  controlledTestConfirmMessage,
  controlledTestErrorMessage,
  controlledTestShouldLock,
  maskControlledTestPhone,
  normalizeControlledTestPhone
} from './adminControlledSessionTest'

describe('kontrollü WhatsApp testi yardımcıları', () => {
  it('yalnızca TR cep numarasını kabul eder', () => {
    expect(normalizeControlledTestPhone('0532 515 85 07')).toBe('905325158507')
    expect(normalizeControlledTestPhone('+90 532 515 85 07')).toBe('905325158507')
    expect(normalizeControlledTestPhone('5325158507')).toBe('905325158507')
    expect(normalizeControlledTestPhone('0212 515 85 07')).toBeNull()
    expect(normalizeControlledTestPhone('12345')).toBeNull()
  })

  it('onay mesajı maskeli numarayı ve sabit metni gösterir, tam numarayı göstermez', () => {
    expect(maskControlledTestPhone('905325158507')).toBe('+90 532 *** ** 07')
    const m = controlledTestConfirmMessage('905325158507')
    expect(m).toContain('+90 532 *** ** 07')
    expect(m).toContain(CONTROLLED_SESSION_TEST_TEXT)
    expect(m).not.toContain('5158507')
  })

  it('409, 403, 429 ve Meta hatalarını Türkçe açıklar', () => {
    expect(controlledTestErrorMessage({ status: 409, code: 'OVERRIDE_ACTIVE_NOT_ALLOWED' })).toMatch(
      /webhook hedefi Müvekkil Kasa olarak doğrulanamadı/
    )
    expect(controlledTestErrorMessage({ status: 403, code: 'ADMIN_FORBIDDEN' })).toMatch(/SUPER_ADMIN/)
    expect(controlledTestErrorMessage({ status: 429 })).toMatch(/dakikada en fazla 3/)
    expect(controlledTestErrorMessage({ status: 502, code: 'META_131047' })).toMatch(/24 saatlik/)
    expect(controlledTestErrorMessage({ status: 502, code: 'META_999' })).toBe(
      'Meta gönderimi reddetti (Meta kodu 999).'
    )
    expect(controlledTestErrorMessage({ status: 502, code: 'NO_MESSAGE_ID' })).toMatch(/kabul edilmiş sayılmaz/)
    expect(controlledTestErrorMessage({ status: 0 })).toMatch(/yeniden denemeyin/)
  })

  it('yalnızca gönderimin denenmiş olabileceği durumlarda kilitler', () => {
    expect(controlledTestShouldLock({ status: 502, code: 'META_131047' })).toBe(true)
    expect(controlledTestShouldLock({ status: 0 })).toBe(true)
    expect(controlledTestShouldLock({ status: 409 })).toBe(false)
    expect(controlledTestShouldLock({ status: 403 })).toBe(false)
    expect(controlledTestShouldLock({ status: 429 })).toBe(false)
  })
})
