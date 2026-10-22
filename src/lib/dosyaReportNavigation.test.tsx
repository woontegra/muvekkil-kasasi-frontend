import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { APP_BASE } from '../config/appPaths'
import { useDosyaDetailDeepLink, withDosyaTabParam, type KasaListeFiltre } from '../hooks/useDosyaDetailDeepLink'
import { buildDosyaReportUrl } from './dosyaReportNavigation'
import type { DosyaDetailTabKey } from './maliKontrolNavigation'

const TAB_READY: Record<DosyaDetailTabKey, boolean> = {
  kasa: true,
  vekalet: true,
  smm: true,
  makbuz: true,
  hesap: true,
  mali: true,
  ekstre: true
}

function TabHarness() {
  const [tab, setTab] = useState<DosyaDetailTabKey>('kasa')
  const [kasaFilter, setKasaFilter] = useState<KasaListeFiltre>('tum')
  const loc = useLocation()
  const { selectTab } = useDosyaDetailDeepLink({
    setTab,
    setKasaFilter,
    kasaFilter,
    tabReady: TAB_READY,
    onFocusNotFound: () => undefined
  })
  return (
    <div>
      <span data-testid="tab">{tab}</span>
      <span data-testid="search">{loc.search}</span>
      {(['kasa', 'vekalet', 'makbuz', 'hesap', 'ekstre'] as const).map((k) => (
        <button key={k} type="button" onClick={() => selectTab(k)}>
          {k}
        </button>
      ))}
      <HistoryButtons />
    </div>
  )
}

function HistoryButtons() {
  const navigate = useNavigate()
  return (
    <>
      <button type="button" onClick={() => navigate(-1)}>
        geri
      </button>
      <button type="button" onClick={() => navigate(1)}>
        ileri
      </button>
    </>
  )
}

function PathProbe() {
  const loc = useLocation()
  return <span data-testid="path">{loc.pathname + loc.search}</span>
}

function renderAt(url: string | string[], initialIndex?: number) {
  const entries = Array.isArray(url) ? url : [url]
  return render(
    <MemoryRouter initialEntries={entries} initialIndex={initialIndex ?? entries.length - 1}>
      <PathProbe />
      <Routes>
        <Route path={`${APP_BASE}/muvekkil/:id/dosya/:dosyaId`} element={<TabHarness />} />
        <Route
          path="*"
          element={
            <>
              <span data-testid="tab">baska-sayfa</span>
              <HistoryButtons />
            </>
          }
        />
      </Routes>
    </MemoryRouter>
  )
}

const tabText = () => screen.getByTestId('tab').textContent
const pathText = () => screen.getByTestId('path').textContent

describe('buildDosyaReportUrl', () => {
  afterEach(cleanup)

  it('Dosya Hesap Özeti seçilen dosyanın hesap sekmesine gider', () => {
    expect(buildDosyaReportUrl('dosya-hesap', 'm1', 'd1')).toBe(`${APP_BASE}/muvekkil/m1/dosya/d1?tab=hesap`)
  })

  it('Makbuzlar seçilen dosyanın makbuz sekmesine gider', () => {
    expect(buildDosyaReportUrl('dosya-makbuz', 'm1', 'd1')).toBe(`${APP_BASE}/muvekkil/m1/dosya/d1?tab=makbuz`)
  })

  it('ana sayfaya değil dosya detay route’una eşleşir ve doğru sekmeyi açar', () => {
    renderAt(buildDosyaReportUrl('dosya-hesap', 'm1', 'd1'))
    expect(screen.getByTestId('tab').textContent).toBe('hesap')
    cleanup()
    renderAt(buildDosyaReportUrl('dosya-makbuz', 'm1', 'd1'))
    expect(screen.getByTestId('tab').textContent).toBe('makbuz')
  })

  it('tab parametresi URL’de kalır (yenilemede aynı sekme açılır)', () => {
    renderAt(buildDosyaReportUrl('dosya-makbuz', 'm1', 'd1'))
    expect(screen.getByTestId('search').textContent).toBe('?tab=makbuz')
  })

  it('geçersiz veya eksik tab parametresinde varsayılan kasa sekmesi açılır', () => {
    renderAt(`${APP_BASE}/muvekkil/m1/dosya/d1?tab=xyz`)
    expect(screen.getByTestId('tab').textContent).toBe('kasa')
    cleanup()
    renderAt(`${APP_BASE}/muvekkil/m1/dosya/d1`)
    expect(screen.getByTestId('tab').textContent).toBe('kasa')
  })

  it('deep link sonrası diğer sekmelere geçiş çalışmaya devam eder', async () => {
    renderAt(buildDosyaReportUrl('dosya-hesap', 'm1', 'd1'))
    await userEvent.click(screen.getByRole('button', { name: 'vekalet' }))
    expect(screen.getByTestId('tab').textContent).toBe('vekalet')
  })
})

describe('Dosya detayı sekme–URL eşitlemesi', () => {
  afterEach(cleanup)
  const DOSYA = `${APP_BASE}/muvekkil/m1/dosya/d1`

  it('sekme değişince URL tab parametresi güncellenir; kasa varsayılanında parametre kaldırılır', async () => {
    const user = userEvent.setup()
    renderAt(`${DOSYA}?tab=hesap`)
    await user.click(screen.getByRole('button', { name: 'makbuz' }))
    expect(tabText()).toBe('makbuz')
    expect(pathText()).toBe(`${DOSYA}?tab=makbuz`)
    await user.click(screen.getByRole('button', { name: 'ekstre' }))
    expect(pathText()).toBe(`${DOSYA}?tab=ekstre`)
    await user.click(screen.getByRole('button', { name: 'kasa' }))
    expect(tabText()).toBe('kasa')
    expect(pathText()).toBe(DOSYA)
  })

  it('yenilemede en son seçilen sekme açılır', async () => {
    const user = userEvent.setup()
    renderAt(DOSYA)
    await user.click(screen.getByRole('button', { name: 'vekalet' }))
    const last = pathText()!
    expect(last).toBe(`${DOSYA}?tab=vekalet`)
    cleanup()
    renderAt(last)
    expect(tabText()).toBe('vekalet')
  })

  it('sekme seçimi geçmişe kayıt eklemez: geri önceki sayfaya, ileri son sekmeye döner', async () => {
    const user = userEvent.setup()
    renderAt([`${APP_BASE}/raporlar`, `${DOSYA}?tab=hesap`])
    await user.click(screen.getByRole('button', { name: 'makbuz' }))
    await user.click(screen.getByRole('button', { name: 'vekalet' }))
    expect(pathText()).toBe(`${DOSYA}?tab=vekalet`)

    await user.click(screen.getByRole('button', { name: 'geri' }))
    expect(pathText()).toBe(`${APP_BASE}/raporlar`)
    expect(tabText()).toBe('baska-sayfa')

    await user.click(screen.getByRole('button', { name: 'ileri' }))
    expect(pathText()).toBe(`${DOSYA}?tab=vekalet`)
    expect(tabText()).toBe('vekalet')
  })

  it('aynı dosyada mevcut geçmiş kayıtları arasında geri/ileri sekmeyi URL’ye göre değiştirir', async () => {
    const user = userEvent.setup()
    renderAt([`${DOSYA}?tab=hesap`, `${DOSYA}?tab=makbuz`])
    expect(tabText()).toBe('makbuz')
    await user.click(screen.getByRole('button', { name: 'geri' }))
    expect(tabText()).toBe('hesap')
    await user.click(screen.getByRole('button', { name: 'ileri' }))
    expect(tabText()).toBe('makbuz')
  })

  it('tab parametresiz geçmiş kaydına dönüldüğünde varsayılan kasa sekmesi açılır', async () => {
    const user = userEvent.setup()
    renderAt([DOSYA, `${DOSYA}?tab=makbuz`])
    expect(tabText()).toBe('makbuz')
    await user.click(screen.getByRole('button', { name: 'geri' }))
    expect(pathText()).toBe(DOSYA)
    expect(tabText()).toBe('kasa')
  })

  it('tab güncellenirken diğer URL parametreleri korunur', () => {
    const prev = new URLSearchParams('tab=kasa&focus=kasa:k1&kasaFilter=avans')
    expect(withDosyaTabParam(prev, 'hesap').toString()).toBe('tab=hesap&focus=kasa%3Ak1&kasaFilter=avans')
    expect(withDosyaTabParam(prev, 'kasa').toString()).toBe('focus=kasa%3Ak1&kasaFilter=avans')
    expect(prev.toString()).toBe('tab=kasa&focus=kasa%3Ak1&kasaFilter=avans')
  })
})
