import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MasrafGuvenliSilModal } from './MasrafGuvenliSilModal'

afterEach(() => cleanup())

describe('MasrafGuvenliSilModal', () => {
  it('shows summary and resets password when opened for a hareket', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    const ozet = {
      id: '11111111-1111-1111-1111-111111111111',
      tarih: '2026-09-11T00:00:00.000Z',
      aciklama: 'Tebligat harcı',
      tutar: '250.00',
      odemeYontemiLabel: 'Nakit',
      belgeNo: 'MSF-2026-000001'
    }
    const { rerender } = render(
      <MasrafGuvenliSilModal ozet={ozet} onClose={() => undefined} onSubmit={onSubmit} />
    )

    expect(screen.getByText(/listeden ve mali toplamlardan çıkarılacak/i)).toBeInTheDocument()
    expect(screen.getByText(/Tebligat harcı/)).toBeInTheDocument()
    expect(screen.getByText(/Nakit/)).toBeInTheDocument()

    const pwd = screen.getByLabelText(/mevcut giriş şifrenizi yeniden girin/i)
    await user.type(pwd, 'secret')
    expect(pwd).toHaveValue('secret')

    rerender(
      <MasrafGuvenliSilModal
        ozet={{ ...ozet, id: '22222222-2222-2222-2222-222222222222' }}
        onClose={() => undefined}
        onSubmit={onSubmit}
      />
    )
    expect(screen.getByLabelText(/mevcut giriş şifrenizi yeniden girin/i)).toHaveValue('')
  })
})
