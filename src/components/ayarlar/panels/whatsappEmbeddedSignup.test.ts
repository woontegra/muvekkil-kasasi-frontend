import { describe, expect, it } from 'vitest'
import {
  BUSINESS_APP_FEATURE_TYPE,
  buildEmbeddedSignupLoginOptions,
  coexistenceReconnectGuidance
} from './whatsappEmbeddedSignup'

describe('buildEmbeddedSignupLoginOptions', () => {
  it('Coexistence için config_id, code yanıtı ve Business App featureType gönderir', () => {
    const opts = buildEmbeddedSignupLoginOptions('2160837464495443')
    expect(opts).toEqual({
      config_id: '2160837464495443',
      response_type: 'code',
      override_default_response_type: true,
      extras: {
        setup: {},
        featureType: 'whatsapp_business_app_onboarding',
        sessionInfoVersion: '3'
      }
    })
    expect(BUSINESS_APP_FEATURE_TYPE).toBe('whatsapp_business_app_onboarding')
  })

  it('extras.version göndermez (v4 sunulur; v5 waba_id döndürmez)', () => {
    const extras = buildEmbeddedSignupLoginOptions('cfg').extras as Record<string, unknown>
    expect(extras).not.toHaveProperty('version')
    expect(extras).not.toHaveProperty('features')
  })
})

describe('coexistenceReconnectGuidance', () => {
  it('numaranın elle yazılmasını ve QR adımını anlatır', () => {
    const t = coexistenceReconnectGuidance('+90 532 317 17 55')
    expect(t).toContain('WhatsApp telefon numaranızı ekleyin')
    expect(t).toContain('+90 532 317 17 55 ülke koduyla elle yazın')
    expect(t).toContain('QR kod')
  })

  it('SMS/sesli kod istenirse durdurur', () => {
    const t = coexistenceReconnectGuidance(null)
    expect(t).toContain('kayıtlı numaranızı ülke koduyla elle yazın')
    expect(t).toMatch(/SMS veya sesli arama.*devam etmeyin/)
  })
})
