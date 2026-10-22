import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { OtomatikHatirlatmaSwitch } from './OtomatikHatirlatmaSwitch'

const LABEL = 'Bu müvekkile otomatik WhatsApp ödeme hatırlatmaları gönderilsin'

function Harness({ initial = false }: { initial?: boolean }) {
  const [checked, setChecked] = useState(initial)
  return <OtomatikHatirlatmaSwitch id="sw" label={LABEL} checked={checked} onChange={setChecked} stateText={{ on: 'Açık', off: 'Kapalı' }} />
}

afterEach(cleanup)

describe('OtomatikHatirlatmaSwitch', () => {
  it('kapalı durumda ray dolu ve koyu gri, durum metni "Kapalı"', () => {
    render(<Harness />)
    const sw = screen.getByRole('switch', { name: LABEL })
    expect(sw.getAttribute('aria-checked')).toBe('false')
    expect(sw.className).toContain('bg-[#7d8a9f]')
    expect(sw.className).not.toContain('bg-surface-muted')
    expect(screen.getByText('Kapalı')).toBeTruthy()
  })

  it('açık durumda birincil renk ve "Açık" metni; çerçeve tonlanır', () => {
    render(<Harness initial />)
    const sw = screen.getByRole('switch', { name: LABEL })
    expect(sw.getAttribute('aria-checked')).toBe('true')
    expect(sw.className).toContain('bg-primary')
    expect(sw.parentElement?.className).toContain('bg-[#f5f8ff]')
    expect(screen.getByText('Açık')).toBeTruthy()
  })

  it('klavye: Tab ile odaklanır, Space ve Enter ile aç/kapa', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    const sw = screen.getByRole('switch', { name: LABEL })
    await user.tab()
    expect(document.activeElement).toBe(sw)
    expect(sw.className).toContain('focus-visible:outline-2')
    await user.keyboard(' ')
    expect(sw.getAttribute('aria-checked')).toBe('true')
    await user.keyboard('{Enter}')
    expect(sw.getAttribute('aria-checked')).toBe('false')
  })

  it('etikete tıklamak durumu değiştirir', async () => {
    const user = userEvent.setup()
    render(<Harness />)
    await user.click(screen.getByText('Kapalı'))
    expect(screen.getByRole('switch', { name: LABEL }).getAttribute('aria-checked')).toBe('true')
  })

  it('busy: değişiklik yok sayılır ama düğme odakta kalır', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<OtomatikHatirlatmaSwitch id="sw" label={LABEL} checked={false} busy onChange={onChange} />)
    const sw = screen.getByRole('switch', { name: LABEL }) as HTMLButtonElement
    expect(sw.disabled).toBe(false)
    expect(sw.getAttribute('aria-disabled')).toBe('true')
    expect(sw.getAttribute('aria-busy')).toBe('true')
    await user.tab()
    expect(document.activeElement).toBe(sw)
    await user.keyboard(' ')
    await user.click(sw)
    expect(onChange).not.toHaveBeenCalled()
    expect(document.activeElement).toBe(sw)
    expect(sw.className).not.toContain('hover:bg-[#5f6c82]')
  })

  it('disabled: native disabled, tıklama çalışmaz', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<OtomatikHatirlatmaSwitch id="sw" label={LABEL} checked={false} disabled onChange={onChange} />)
    const sw = screen.getByRole('switch', { name: LABEL }) as HTMLButtonElement
    expect(sw.disabled).toBe(true)
    await user.click(sw)
    expect(onChange).not.toHaveBeenCalled()
    expect(sw.parentElement?.className).toContain('opacity-60')
  })
})
