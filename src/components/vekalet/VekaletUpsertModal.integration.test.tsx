import { describe, expect, it, vi, afterEach } from 'vitest'
import { cleanup, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ReactElement } from 'react'
import { ConfirmProvider } from '../ui'
import { MotionProvider } from '../../motion/MotionProvider'
import {
  buildVekaletUpsertModalPropsFromDosya,
  VekaletUpsertModal
} from './VekaletUpsertModal'
import {
  resolveVekaletUpsertOpenIntent,
  VEKALET_PLACEHOLDER_INCONSISTENT_MESSAGE
} from '../../lib/vekaletParaBirimi'
import type { UpsertVekaletPayload } from '../../types/vekalet'

type FixtureVekalet = {
  id?: string
  paraBirimi?: string
  toplamTutar?: string
  aciklama?: string | null
}

/** Fixture — production dosya satırına dokunmaz; yalnız test state. */
function Harness(props: {
  vekaletUcreti?: FixtureVekalet | null
  odenenToplam?: string
  taksitler?: Array<{ tutar?: string; odemeDurumu?: string }>
  onSubmit?: (body: UpsertVekaletPayload & { targetId: string | null }) => void
}): ReactElement {
  const intent = resolveVekaletUpsertOpenIntent({
    vekaletUcreti: props.vekaletUcreti,
    odenenToplam: props.odenenToplam ?? '0',
    taksitler: props.taksitler ?? []
  })

  if (intent.mode === 'inconsistent') {
    return (
      <div data-testid="vekalet-inconsistent">
        <p>{intent.message}</p>
      </div>
    )
  }

  const modalProps = buildVekaletUpsertModalPropsFromDosya({
    mode: intent.mode,
    persistedVekaletUcretiId: intent.persistedVekaletUcretiId,
    vekaletUcreti: intent.mode === 'edit' ? props.vekaletUcreti ?? null : null,
    hasTahsilat: Number(props.odenenToplam ?? 0) > 0,
    onClose: () => undefined,
    onSubmit: (body) => {
      props.onSubmit?.({
        ...body,
        targetId: intent.mode === 'create' ? null : intent.persistedVekaletUcretiId
      })
    }
  })

  return (
    <MotionProvider>
      <ConfirmProvider>
        <VekaletUpsertModal {...modalProps} />
      </ConfirmProvider>
    </MotionProvider>
  )
}

function dialog() {
  const roots = screen.getAllByTestId('vekalet-upsert-modal')
  const root = roots[roots.length - 1]!
  return within(root).getByRole('dialog', { name: 'Vekalet ücreti' })
}

afterEach(() => {
  cleanup()
})

const PLACEHOLDER_ID = 'fixture-vek-placeholder-0001'
const REAL_ID = 'fixture-vek-real-10000-try'

describe('VekaletUpsertModal three-mode integration (fixture)', () => {
  it('initialize: persisted id + toplam 0 + ödeme yok + 10.000 USD — uyarı yok, mevcut id update', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <Harness
        vekaletUcreti={{
          id: PLACEHOLDER_ID,
          paraBirimi: 'TRY',
          toplamTutar: '0',
          aciklama: null
        }}
        odenenToplam="0"
        taksitler={[]}
        onSubmit={onSubmit}
      />
    )

    expect(screen.getByTestId('vekalet-upsert-modal')).toHaveAttribute('data-mode', 'initialize')
    expect(screen.getByText(/Vekalet ücreti ekle/i)).toBeInTheDocument()
    expect(screen.queryByText(/Kayıtlı vekalet düzenleniyor/i)).not.toBeInTheDocument()

    await user.click(within(dialog()).getByRole('button', { name: /USD/i }))
    const tutar = within(dialog()).getByRole('textbox', { name: /Toplam tutar \(USD\)/i })
    await user.clear(tutar)
    await user.type(tutar, '10000')
    await user.click(within(dialog()).getByRole('button', { name: 'Kaydet' }))

    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(screen.queryByText(/Para birimi değişikliği/i)).not.toBeInTheDocument()
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      toplamTutar: 10000,
      paraBirimi: 'USD',
      targetId: PLACEHOLDER_ID
    })
  })

  it('initialize: persisted id + toplam 0 + EUR — uyarı yok', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <Harness
        vekaletUcreti={{ id: PLACEHOLDER_ID, paraBirimi: 'TRY', toplamTutar: '0' }}
        onSubmit={onSubmit}
      />
    )
    await user.click(within(dialog()).getByRole('button', { name: /EUR/i }))
    await user.type(
      within(dialog()).getByRole('textbox', { name: /Toplam tutar \(EUR\)/i }),
      '5000'
    )
    await user.click(within(dialog()).getByRole('button', { name: 'Kaydet' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(screen.queryByRole('heading', { name: 'Para birimi değişikliği' })).toBeNull()
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      paraBirimi: 'EUR',
      targetId: PLACEHOLDER_ID
    })
  })

  it('edit: persisted 10.000 TRY + ödeme yok + USD — Kaydet’te doğru eski/yeni uyarı', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <Harness
        vekaletUcreti={{
          id: REAL_ID,
          paraBirimi: 'TRY',
          toplamTutar: '10000'
        }}
        onSubmit={onSubmit}
      />
    )

    expect(screen.getByTestId('vekalet-upsert-modal')).toHaveAttribute('data-mode', 'edit')
    expect(screen.getByText(/Kayıtlı vekalet düzenleniyor \(TRY\)/i)).toBeInTheDocument()

    await user.click(within(dialog()).getByRole('button', { name: /USD/i }))
    const tutar = within(dialog()).getByRole('textbox', { name: /Toplam tutar \(USD\)/i })
    await user.clear(tutar)
    await user.type(tutar, '12000')
    await user.click(within(dialog()).getByRole('button', { name: 'Kaydet' }))

    expect(await screen.findByText(/Para birimi değişikliği/i)).toBeInTheDocument()
    expect(
      screen.getByText(/Eski: 10\.000 TRY — Yeni: 12\.000 USD\. Otomatik kur dönüşümü yapılmayacaktır\./i)
    ).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Değiştir' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      paraBirimi: 'USD',
      toplamTutar: 12000,
      targetId: REAL_ID
    })
  })

  it('toplam 0 fakat ödeme var → engel (inconsistent)', () => {
    render(
      <Harness
        vekaletUcreti={{ id: PLACEHOLDER_ID, paraBirimi: 'TRY', toplamTutar: '0' }}
        odenenToplam="100"
        taksitler={[]}
      />
    )
    expect(screen.getByTestId('vekalet-inconsistent')).toBeInTheDocument()
    expect(screen.getByText(VEKALET_PLACEHOLDER_INCONSISTENT_MESSAGE)).toBeInTheDocument()
    expect(screen.queryByTestId('vekalet-upsert-modal')).not.toBeInTheDocument()
  })

  it('create: tamamen kayıtsız — uyarı yok', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<Harness vekaletUcreti={null} onSubmit={onSubmit} />)

    expect(screen.getByTestId('vekalet-upsert-modal')).toHaveAttribute('data-mode', 'create')
    expect(screen.getByText(/Vekalet ücreti ekle/i)).toBeInTheDocument()

    await user.click(within(dialog()).getByRole('button', { name: /USD/i }))
    await user.type(
      within(dialog()).getByRole('textbox', { name: /Toplam tutar \(USD\)/i }),
      '10000'
    )
    await user.click(within(dialog()).getByRole('button', { name: 'Kaydet' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalled())
    expect(screen.queryByText(/Para birimi değişikliği/i)).not.toBeInTheDocument()
    expect(onSubmit.mock.calls[0][0]).toMatchObject({
      toplamTutar: 10000,
      paraBirimi: 'USD',
      targetId: null
    })
  })
})
