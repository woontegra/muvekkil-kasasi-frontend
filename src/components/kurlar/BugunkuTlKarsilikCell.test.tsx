import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { BugunkuTlKarsilikCell } from './BugunkuTlKarsilikCell'
import { formatMoney } from '../../utils/paraBirimi'

afterEach(() => cleanup())

describe('BugunkuTlKarsilikCell — TRY sağda', () => {
  it('₺ önekli değil; 121.076,25 ₺ gösterir', () => {
    const v = formatMoney(121076.25, 'TRY')
    render(<BugunkuTlKarsilikCell value={v} />)
    const el = screen.getByTestId('bugunku-tl-karsilik')
    // toHaveTextContent NBSP’yi normalize eder; textContent ile birebir doğrula
    expect(el.textContent).toBe(v)
    expect(el.textContent).toContain('\u00A0')
    expect(el.textContent).toBe('121.076,25\u00A0₺')
    expect(el.textContent).not.toMatch(/^₺/)
  })

  it('1.500,00 ₺ ve 3.500,00 ₺', () => {
    render(<BugunkuTlKarsilikCell value={formatMoney(1500, 'TRY')} />)
    expect(screen.getByTestId('bugunku-tl-karsilik').textContent).toBe('1.500,00\u00A0₺')
    cleanup()
    render(<BugunkuTlKarsilikCell value={formatMoney(3500, 'TRY')} />)
    expect(screen.getByTestId('bugunku-tl-karsilik').textContent).toBe('3.500,00\u00A0₺')
  })
})
