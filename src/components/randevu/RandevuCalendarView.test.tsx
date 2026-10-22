import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { RandevuDto } from '../../types/randevu'
import { CALENDAR_HOUR_START, CALENDAR_SLOT_HEIGHT_PX } from '../../lib/randevuCalendar'
import { mutedOnTintClass } from '../../lib/uiDensity'
import { appointmentCardLineCount, RandevuCalendarView } from './RandevuCalendarView'

const DAY = new Date(2026, 9, 20)

function randevu(id: string, baslik: string, sh: number, sm: number, dakika: number): RandevuDto {
  const start = new Date(2026, 9, 20, sh, sm)
  const end = new Date(start.getTime() + dakika * 60_000)
  return {
    id,
    tenantId: 't1',
    muvekkilId: 'm1',
    dosyaId: null,
    olusturanUserId: 'u1',
    sorumluUserId: null,
    baslik,
    baslangicAt: start.toISOString(),
    bitisAt: end.toISOString(),
    konum: null,
    aciklama: null,
    aktifMi: true,
    createdAt: start.toISOString(),
    updatedAt: start.toISOString(),
    muvekkilAd: 'Hakan Demir',
    dosyaBaslik: null,
    sorumluAdSoyad: null,
    olusturanAdSoyad: 'Kamil Sönmez',
    hatirlatmaOzet: '30 dk önce WhatsApp'
  }
}

const ITEMS = [
  randevu('r15', 'On beş dakika', 9, 0, 15),
  randevu('r30', 'Ön görüşme', 15, 30, 30),
  randevu('r45', 'Kırk beş', 11, 0, 45),
  randevu('r60', 'Bir saat', 13, 0, 60),
  randevu('r90', 'Doksan dakika', 17, 0, 90)
]

function renderView(view: 'day' | 'week', onAppointmentClick = vi.fn()) {
  render(
    <RandevuCalendarView
      view={view}
      anchor={DAY}
      items={ITEMS}
      onSlotClick={vi.fn()}
      onDayClick={vi.fn()}
      onAppointmentClick={onAppointmentClick}
    />
  )
  return onAppointmentClick
}

const card = (baslik: string) => screen.getByRole('button', { name: new RegExp(`^${baslik} · `) })
const visibleLines = (el: HTMLElement) => Array.from(el.querySelectorAll('p')).map((p) => p.textContent)

describe('RandevuCalendarView — kısa randevular kesilmeden görünür', () => {
  afterEach(cleanup)

  it('kart yüksekliğine göre sığan satır sayısı', () => {
    expect(appointmentCardLineCount(18)).toBe(1)
    expect(appointmentCardLineCount(28)).toBe(1)
    expect(appointmentCardLineCount(42)).toBe(2)
    expect(appointmentCardLineCount(56)).toBe(3)
    expect(appointmentCardLineCount(84)).toBe(4)
  })

  it.each(['week', 'day'] as const)('%s görünümünde 15:30 randevusu doğru konumda ve tek satırda saat + başlık', (view) => {
    renderView(view)
    const el = card('Ön görüşme')
    const pos = el.parentElement!
    expect(pos.style.top).toBe(`${Math.round((15.5 - CALENDAR_HOUR_START) * CALENDAR_SLOT_HEIGHT_PX)}px`)
    expect(pos.style.height).toBe(`${Math.round(0.5 * CALENDAR_SLOT_HEIGHT_PX)}px`)
    expect(visibleLines(el)).toEqual(['15:30Ön görüşme'])
  })

  it('süre arttıkça müvekkil ve hatırlatma satırları eklenir; hiçbir satır büzülmez', () => {
    renderView('week')
    expect(visibleLines(card('On beş dakika'))).toHaveLength(1)
    expect(visibleLines(card('Kırk beş'))).toEqual(['Kırk beş', '11:00 – 11:45'])
    expect(visibleLines(card('Bir saat'))).toEqual(['Bir saat', '13:00 – 14:00', 'Hakan Demir'])
    expect(visibleLines(card('Doksan dakika'))).toEqual(['Doksan dakika', '17:00 – 18:30', 'Hakan Demir', '30 dk önce WhatsApp'])
    for (const p of document.querySelectorAll('button p')) expect(p.className).toContain('shrink-0')
  })

  it('gizlenen bilgiler erişilebilir adda ve ipucunda korunur; tıklama detay açar', async () => {
    const onClick = renderView('week')
    const el = card('Ön görüşme')
    expect(el).toHaveAccessibleName('Ön görüşme · 15:30 – 16:00 · Hakan Demir · 30 dk önce WhatsApp')
    expect(el).toHaveAttribute('title', 'Ön görüşme · 15:30 – 16:00 · Hakan Demir · 30 dk önce WhatsApp')
    await userEvent.click(el)
    expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'r30', baslangicAt: ITEMS[1].baslangicAt }))
  })
})

describe('RandevuCalendarView — gün başlıkları okunabilir', () => {
  afterEach(cleanup)
  const tone = mutedOnTintClass.split(' ')[0]

  it.each(['week', 'day'] as const)('%s görünümünde gün adı tonlu zemin için koyu ikincil tonda', (view) => {
    renderView(view)
    const headers = screen.getAllByText(/^(pzt|sal|çar|per|cum|cmt|paz)\.?$/i)
    expect(headers.length).toBe(view === 'week' ? 7 : 1)
    for (const h of headers) {
      expect(h.className).toContain(tone)
      expect(h.className).not.toContain('text-ink-subtle')
    }
  })

  it('ay görünümünde gün adları satırı koyu ikincil tonda', () => {
    render(<RandevuCalendarView view="month" anchor={DAY} items={ITEMS} onSlotClick={vi.fn()} onDayClick={vi.fn()} onAppointmentClick={vi.fn()} />)
    const row = screen.getByText('Sal').parentElement!
    expect(row.className).toContain(tone)
    expect(row.className).not.toContain('text-ink-subtle')
  })
})
