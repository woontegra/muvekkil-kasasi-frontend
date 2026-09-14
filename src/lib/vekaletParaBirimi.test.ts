import { describe, expect, it } from 'vitest'
import {
  buildVekaletParaBirimiDegisimOnayMesaji,
  resolveVekaletUpsertOpenIntent,
  shouldConfirmVekaletParaBirimiDegisimi,
  VEKALET_PLACEHOLDER_INCONSISTENT_MESSAGE
} from './vekaletParaBirimi'

describe('SaaS vekalet three-mode helpers', () => {
  it('create: no record', () => {
    const intent = resolveVekaletUpsertOpenIntent({ vekaletUcreti: null })
    expect(intent).toMatchObject({ mode: 'create', persistedVekaletUcretiId: null })
    expect(
      shouldConfirmVekaletParaBirimiDegisimi({
        mode: 'create',
        persistedVekaletUcretiId: null,
        persistedParaBirimi: 'TRY',
        selectedParaBirimi: 'USD'
      })
    ).toBe(false)
  })

  it('initialize: id + total 0 + no payment', () => {
    const intent = resolveVekaletUpsertOpenIntent({
      vekaletUcreti: { id: 'fix-1', toplamTutar: '0', paraBirimi: 'TRY' },
      odenenToplam: 0,
      taksitler: []
    })
    expect(intent).toMatchObject({
      mode: 'initialize',
      persistedVekaletUcretiId: 'fix-1',
      isFirstTimeSetup: true
    })
    expect(
      shouldConfirmVekaletParaBirimiDegisimi({
        mode: 'initialize',
        persistedVekaletUcretiId: 'fix-1',
        persistedParaBirimi: 'TRY',
        selectedParaBirimi: 'USD'
      })
    ).toBe(false)
  })

  it('edit confirms only on PB change', () => {
    const intent = resolveVekaletUpsertOpenIntent({
      vekaletUcreti: { id: 'fix-2', toplamTutar: '10000', paraBirimi: 'TRY' }
    })
    expect(intent.mode).toBe('edit')
    expect(
      shouldConfirmVekaletParaBirimiDegisimi({
        mode: 'edit',
        persistedVekaletUcretiId: 'fix-2',
        persistedParaBirimi: 'TRY',
        selectedParaBirimi: 'USD'
      })
    ).toBe(true)
  })

  it('inconsistent when total 0 but payment exists', () => {
    const intent = resolveVekaletUpsertOpenIntent({
      vekaletUcreti: { id: 'fix-3', toplamTutar: 0 },
      odenenToplam: 50
    })
    expect(intent).toEqual({
      mode: 'inconsistent',
      message: VEKALET_PLACEHOLDER_INCONSISTENT_MESSAGE
    })
  })

  it('confirm message uses distinct old/new amounts from snapshot', () => {
    expect(
      buildVekaletParaBirimiDegisimOnayMesaji({
        eskiTutar: 10000,
        eskiParaBirimi: 'TRY',
        yeniTutar: 12000,
        yeniParaBirimi: 'USD'
      })
    ).toBe(
      'Eski: 10.000 TRY — Yeni: 12.000 USD. Otomatik kur dönüşümü yapılmayacaktır.'
    )
  })
})
