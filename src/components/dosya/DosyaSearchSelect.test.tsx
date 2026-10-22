import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useState } from 'react'
import type { DosyaDto, DosyaListResponse } from '../../types/dosya'
import type { ListMuvekkilDosyalariParams } from '../../api/dosyalar'

const listMock = vi.hoisted(() => vi.fn())
vi.mock('../../api/dosyalar', () => ({ listMuvekkilDosyalari: listMock }))

import { DOSYA_SEARCH_PAGE_SIZE, DosyaSearchSelect, type DosyaSearchSelectValue } from './DosyaSearchSelect'

const NOW = '2026-10-20T10:00:00.000Z'

function dosya(i: number, muvekkilId: string, tenantId = 't1'): DosyaDto {
  return {
    id: `${muvekkilId}-d${i}`,
    tenantId,
    muvekkilId,
    konuBasligi: `Dosya ${i}`,
    mahkeme: i % 2 === 0 ? `İstanbul ${i}. İş Mahkemesi` : null,
    icraDairesi: i % 2 === 1 ? `Ankara ${i}. İcra Dairesi` : null,
    dosyaNo: `2026/${i}`,
    dosyaTuru: 'DAVA',
    durum: 'AKTIF',
    aciklama: null,
    aktifMi: true,
    createdById: 'u1',
    updatedById: null,
    createdAt: NOW,
    updatedAt: NOW
  } as DosyaDto
}

/** Backend sözleşmesini taklit eden sahte sunucu: tenant + müvekkil kapsamı, q araması, page/limit (≤100). */
const DB: DosyaDto[] = [
  ...Array.from({ length: 10_000 }, (_, i) => dosya(i + 1, 'm-buyuk')),
  ...Array.from({ length: 5 }, (_, i) => dosya(i + 1, 'm-baska-buro', 't2'))
]
const SESSION_TENANT = 't1'

function fakeServer(muvekkilId: string, params: ListMuvekkilDosyalariParams = {}): Promise<DosyaListResponse> {
  const limit = params.limit ?? 50
  const page = params.page ?? 1
  if (limit > 100) return Promise.reject(new Error('limit > 100'))
  const q = params.q?.trim().toLocaleLowerCase('tr') ?? ''
  const scoped = DB.filter((d) => d.tenantId === SESSION_TENANT && d.muvekkilId === muvekkilId)
  const filtered = q
    ? scoped.filter((d) =>
        [d.konuBasligi, d.mahkeme, d.icraDairesi, d.dosyaNo, d.aciklama].some((f) =>
          f?.toLocaleLowerCase('tr').includes(q)
        )
      )
    : scoped
  return Promise.resolve({
    ok: true,
    items: filtered.slice((page - 1) * limit, page * limit),
    total: filtered.length,
    page,
    limit
  })
}

function Harness({ muvekkilId, onValue }: { muvekkilId: string; onValue?: (v: DosyaSearchSelectValue) => void }) {
  const [value, setValue] = useState<DosyaSearchSelectValue>(null)
  return (
    <DosyaSearchSelect
      muvekkilId={muvekkilId}
      value={value}
      onChange={(v) => {
        setValue(v)
        onValue?.(v)
      }}
    />
  )
}

function renderSelect(muvekkilId: string, onValue?: (v: DosyaSearchSelectValue) => void) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <Harness muvekkilId={muvekkilId} onValue={onValue} />
    </QueryClientProvider>
  )
}

const options = () => screen.queryAllByRole('option')

describe('DosyaSearchSelect — sunucu taraflı arama ve sayfalama', () => {
  beforeEach(() => {
    listMock.mockReset()
    listMock.mockImplementation(fakeServer)
  })
  afterEach(cleanup)

  it('10.000 dosyalı müvekkilde tüm kayıtları yüklemez; sayfa sayfa getirir', async () => {
    const user = userEvent.setup()
    renderSelect('m-buyuk')
    expect(listMock).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Dosya' }))
    await waitFor(() => expect(options()).toHaveLength(DOSYA_SEARCH_PAGE_SIZE))
    expect(listMock).toHaveBeenCalledTimes(1)
    expect(listMock).toHaveBeenLastCalledWith('m-buyuk', { q: undefined, page: 1, limit: DOSYA_SEARCH_PAGE_SIZE })
    expect(screen.getByRole('button', { name: `Daha fazla göster (30 / 10000)` })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Daha fazla göster/ }))
    await waitFor(() => expect(options()).toHaveLength(DOSYA_SEARCH_PAGE_SIZE * 2))
    expect(listMock).toHaveBeenLastCalledWith('m-buyuk', { q: undefined, page: 2, limit: DOSYA_SEARCH_PAGE_SIZE })
    expect(screen.getByRole('button', { name: `Daha fazla göster (60 / 10000)` })).toBeInTheDocument()
    for (const call of listMock.mock.calls) expect(call[1].limit).toBeLessThanOrEqual(100)
  })

  it('dosya adı, esas/dosya no ve mahkeme ile sunucuda arar', async () => {
    const user = userEvent.setup()
    renderSelect('m-buyuk')
    await user.click(screen.getByRole('button', { name: 'Dosya' }))
    await waitFor(() => expect(options().length).toBeGreaterThan(0))

    const search = screen.getByRole('searchbox', { name: 'Dosya ara' })
    await user.type(search, '2026/9876')
    await waitFor(() => expect(listMock).toHaveBeenLastCalledWith('m-buyuk', { q: '2026/9876', page: 1, limit: 30 }))
    await waitFor(() => expect(options()).toHaveLength(1))
    expect(options()[0]).toHaveTextContent('Dosya 9876')

    await user.clear(search)
    await user.type(search, 'İstanbul 9998.')
    await waitFor(() => expect(listMock).toHaveBeenLastCalledWith('m-buyuk', { q: 'İstanbul 9998.', page: 1, limit: 30 }))
    await waitFor(() => expect(options()[0]).toHaveTextContent('Dosya 9998'))
    expect(options()).toHaveLength(1)

    await user.clear(search)
    await user.type(search, 'olmayan-dosya-xyz')
    await waitFor(() => expect(screen.getByText('Aramaya uyan dosya bulunamadı.')).toBeInTheDocument())
  })

  it('arama sonuçları içinde sayfalama yapar', async () => {
    const user = userEvent.setup()
    renderSelect('m-buyuk')
    await user.click(screen.getByRole('button', { name: 'Dosya' }))
    await user.type(screen.getByRole('searchbox', { name: 'Dosya ara' }), 'Dosya 1')
    await waitFor(() => expect(listMock).toHaveBeenLastCalledWith('m-buyuk', { q: 'Dosya 1', page: 1, limit: 30 }))
    await waitFor(() => expect(options()).toHaveLength(30))
    // "Dosya 1", "Dosya 10".."Dosya 19", … "Dosya 1000".."Dosya 1999" ve "Dosya 10000" → 1112 sonuç
    await user.click(await screen.findByRole('button', { name: /Daha fazla göster \(30 \/ 1112\)/ }))
    await waitFor(() => expect(listMock).toHaveBeenLastCalledWith('m-buyuk', { q: 'Dosya 1', page: 2, limit: 30 }))
    await waitFor(() => expect(options()).toHaveLength(60))
  })

  it('arama ve sayfa değişse de seçili dosya kaybolmaz', async () => {
    const user = userEvent.setup()
    const onValue = vi.fn()
    renderSelect('m-buyuk', onValue)
    await user.click(screen.getByRole('button', { name: 'Dosya' }))
    await waitFor(() => expect(options().length).toBeGreaterThan(0))
    await user.click(screen.getByText('Dosya 3', { selector: 'span' }))
    expect(onValue).toHaveBeenLastCalledWith({ id: 'm-buyuk-d3', konuBasligi: 'Dosya 3', detay: '2026/3 · Ankara 3. İcra Dairesi' })
    expect(screen.getByRole('button', { name: 'Dosya' })).toHaveTextContent('Dosya 3 (2026/3 · Ankara 3. İcra Dairesi)')

    await user.click(screen.getByRole('button', { name: 'Dosya' }))
    await user.type(screen.getByRole('searchbox', { name: 'Dosya ara' }), '2026/50')
    await waitFor(() => expect(listMock).toHaveBeenLastCalledWith('m-buyuk', { q: '2026/50', page: 1, limit: 30 }))
    await waitFor(() => expect(screen.getByText(/Seçili:/)).toBeInTheDocument())
    await user.click(screen.getByRole('button', { name: /Daha fazla göster/ }))
    await waitFor(() => expect(listMock).toHaveBeenLastCalledWith('m-buyuk', { q: '2026/50', page: 2, limit: 30 }))
    expect(screen.getByText(/Seçili:/)).toHaveTextContent('Seçili: Dosya 3')
    expect(screen.getByRole('button', { name: 'Dosya' })).toHaveTextContent('Dosya 3')
    expect(onValue).toHaveBeenCalledTimes(1)
  })

  it('müvekkil seçilmeden istek atmaz; yalnızca seçili müvekkilin kapsamında sorgular', async () => {
    const user = userEvent.setup()
    renderSelect('')
    expect(screen.getByRole('button', { name: 'Dosya' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Dosya' })).toHaveTextContent('Önce müvekkil seçin')
    expect(listMock).not.toHaveBeenCalled()
    cleanup()

    renderSelect('m-baska-buro')
    await user.click(screen.getByRole('button', { name: 'Dosya' }))
    await waitFor(() => expect(screen.getByText('Bu müvekkile ait aktif dosya yok.')).toBeInTheDocument())
    expect(listMock.mock.calls.every((c) => c[0] === 'm-baska-buro')).toBe(true)
  })

  it('API hatasında (ör. başka büroya ait müvekkil 404) hata gösterir, kayıt göstermez', async () => {
    listMock.mockImplementation(() => Promise.reject(new Error('NOT_FOUND')))
    const user = userEvent.setup()
    renderSelect('m-yabanci')
    await user.click(screen.getByRole('button', { name: 'Dosya' }))
    await waitFor(() => expect(screen.getByText('Dosyalar yüklenemedi.')).toBeInTheDocument())
    expect(options()).toHaveLength(0)
  })
})
