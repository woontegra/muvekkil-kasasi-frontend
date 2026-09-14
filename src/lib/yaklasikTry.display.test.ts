import { describe, expect, it } from 'vitest'
import { yaklasikByKey } from '../hooks/useYaklasikTryBatch'
import type { YaklasikTryBatchResponse } from '../types/kurlar'
import { MONEY_NBSP } from '../utils/paraBirimi'

describe('yaklasikTry display contract', () => {
  it('gosterim TRY sağda (₺ önek yok)', () => {
    const data: YaklasikTryBatchResponse = {
      ok: true,
      available: true,
      message: null,
      paraBirimi: 'USD',
      kurAlis: '48.43050000',
      kurTarihi: '2026-09-11',
      kurBilgiSatiri: `1 USD = 48,4305${MONEY_NBSP}₺ · Kur tarihi: 11.09.2026`,
      yaklasikAciklama: 'Bugünkü TCMB Döviz Alış kuruna göre yaklaşık',
      items: [
        {
          key: 'ozet.anlasilan',
          tutar: '10000.00',
          yaklasikTry: '484305.00',
          yaklasikTryGosterim: `484.305,00${MONEY_NBSP}₺`,
          satirEtiket: `Bugünkü TCMB Döviz Alış kuruna göre yaklaşık 484.305,00${MONEY_NBSP}₺`
        },
        {
          key: 'taksit.a.tutar',
          tutar: '2500.00',
          yaklasikTry: '121076.25',
          yaklasikTryGosterim: `121.076,25${MONEY_NBSP}₺`,
          satirEtiket: `Bugünkü TCMB Döviz Alış kuruna göre yaklaşık 121.076,25${MONEY_NBSP}₺`
        },
        {
          key: 'taksit.b.tutar',
          tutar: '625.00',
          yaklasikTry: '30269.06',
          yaklasikTryGosterim: `30.269,06${MONEY_NBSP}₺`,
          satirEtiket: `Bugünkü TCMB Döviz Alış kuruna göre yaklaşık 30.269,06${MONEY_NBSP}₺`
        }
      ]
    }
    expect(yaklasikByKey(data, 'ozet.anlasilan').gosterim).toBe(`484.305,00${MONEY_NBSP}₺`)
    expect(yaklasikByKey(data, 'taksit.a.tutar').gosterim).toBe(`121.076,25${MONEY_NBSP}₺`)
    expect(yaklasikByKey(data, 'taksit.b.tutar').gosterim).toBe(`30.269,06${MONEY_NBSP}₺`)
    expect(yaklasikByKey(data, 'ozet.anlasilan').gosterim).not.toMatch(/^₺/)
  })
})
