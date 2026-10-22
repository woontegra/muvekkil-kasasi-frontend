import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { mutedOnTintClass } from '../../lib/uiDensity'
import { CurrencyBalanceCards } from './MultiCurrencyTotals'

afterEach(cleanup)

describe('CurrencyBalanceCards okunabilirlik', () => {
  it('tonlu kartta başlık ve döküm metinleri text-ink-muted yerine koyu ikincil tonu kullanır', () => {
    render(
      <CurrencyBalanceCards
        bakiyeler={{ TRY: '380000', USD: '51000', EUR: '60' }}
        breakdowns={{ TRY: { gelir: '520000', gider: '140000', duzeltme: '0' } }}
      />
    )
    const label = screen.getByText(/Güncel Net Kasa Bakiyesi\s*\(\s*TRY\s*\)/)
    expect(label.className).toContain(mutedOnTintClass.split(' ')[0])
    expect(label.className).not.toContain('text-ink-muted')
    const breakdown = screen.getByText('Toplam gelir').parentElement!.parentElement!
    expect(breakdown.className).toContain(mutedOnTintClass.split(' ')[0])
    expect(breakdown.className).not.toContain('text-ink-muted')
  })
})
