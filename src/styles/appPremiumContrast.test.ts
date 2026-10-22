import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { formControlClass, mutedOnTintClass } from '../lib/uiDensity'

const css = readFileSync(resolve(__dirname, 'app-premium.css'), 'utf8')
const PAGE_BACKGROUNDS = ['#ffffff', '#f7f9fc', '#f3f5f9']

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

function contrast(a: string, b: string): number {
  const [x, y] = [luminance(a), luminance(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

/** Seçici parçasını içeren ilk kural bloğunun gövdesi. */
function ruleBody(selectorPart: string): string {
  const at = css.indexOf(selectorPart)
  expect(at, selectorPart).toBeGreaterThan(-1)
  const open = css.indexOf('{', at)
  return css.slice(open + 1, css.indexOf('}', open))
}

function prop(body: string, name: string): string {
  const m = body.match(new RegExp(`(?:^|[;\\s])${name}:\\s*([^;]+);`))
  expect(m, name).not.toBeNull()
  return m![1].trim()
}

describe('app-premium form kontrastı', () => {
  it('form kenarlığı tüm sayfa zeminlerinde ≥3:1', () => {
    const border = prop(ruleBody('.mk-form-control):not(.border-danger):not(.border-amber-400) {'), 'border-color')
    for (const bg of PAGE_BACKGROUNDS) expect(contrast(border, bg), `${border} / ${bg}`).toBeGreaterThanOrEqual(3)
  })

  it('hover kenarlığı varsayılandan koyu ve ≥3:1', () => {
    const base = prop(ruleBody('.mk-form-control):not(.border-danger):not(.border-amber-400) {'), 'border-color')
    const hover = prop(ruleBody(':not(:focus-within):hover {'), 'border-color')
    expect(luminance(hover)).toBeLessThan(luminance(base))
    expect(contrast(hover, '#ffffff')).toBeGreaterThanOrEqual(3)
  })

  it('odak: mavi kenarlık + 1px halka; tarih alanları :focus-within ile de', () => {
    const focus = ruleBody('.mk-form-control):not(.border-danger):focus {')
    expect(prop(focus, 'border-color')).toBe('var(--hp-blue)')
    expect(prop(focus, 'box-shadow')).toContain('0 0 0 1px var(--hp-blue)')
    expect(css).toMatch(/\[type='date'\][^{]*:focus-within/)
    for (const bg of PAGE_BACKGROUNDS) expect(contrast('#3a6df0', bg)).toBeGreaterThanOrEqual(3)
  })

  it('klavye odağı: buton/bağlantı/switch için outline (tema gölgeleri ring’i ezdiği için)', () => {
    const body = ruleBody(":not(input, select, textarea, .mk-form-control):focus-visible")
    expect(prop(body, 'outline')).toBe('2px solid var(--hp-blue)')
    expect(css).toContain("[role='switch']")
  })

  it('devre dışı alan ayırt edilir (dolgu + açık kenarlık)', () => {
    const body = ruleBody('.mk-form-control):disabled {')
    expect(prop(body, 'background-color')).not.toBe('#ffffff')
    expect(prop(body, 'cursor')).toBe('not-allowed')
  })

  it('rozet metinleri ≥4.5:1', () => {
    const pairs: [string, string][] = [
      ['.h-\\[21px\\].bg-accent-soft {', 'accent'],
      ['.h-\\[21px\\].bg-danger-soft {', 'danger'],
      ['.h-\\[21px\\].bg-primary-soft {', 'primary']
    ]
    for (const [sel] of pairs) {
      const body = ruleBody(sel)
      const color = prop(body, 'color').replace('var(--hp-blue-ink)', '#2f62e0')
      expect(contrast(color, prop(body, 'background-color')), sel).toBeGreaterThanOrEqual(4.5)
    }
    const muted = prop(ruleBody('.h-\\[21px\\].bg-surface-muted.text-ink-muted {'), 'color')
    expect(contrast(muted, '#f1f5f9')).toBeGreaterThanOrEqual(4.5)
  })

  it('formControlClass buton tetikleyicilere tema işaretini taşır', () => {
    expect(formControlClass.split(' ')).toContain('mk-form-control')
  })
})

function cssVar(name: string): string {
  const m = css.match(new RegExp(`${name}:\\s*(#[0-9a-f]{6})`, 'i'))
  expect(m, name).not.toBeNull()
  return m![1]
}

function toneBlock(tone: string): string {
  return ruleBody(`.min-h-\\[5\\.75rem\\].hp-tone-${tone} {`)
}

describe('app-premium metin kontrastı', () => {
  it('yeşil buton (Detay/Ara/Uygula): beyaz yazı normal ve hover durumunda ≥4.5:1', () => {
    expect(contrast('#ffffff', cssVar('--hp-green'))).toBeGreaterThanOrEqual(4.5)
    expect(contrast('#ffffff', cssVar('--hp-green-hover'))).toBeGreaterThanOrEqual(4.5)
    expect(luminance(cssVar('--hp-green-hover'))).toBeLessThan(luminance(cssVar('--hp-green')))
  })

  it('özet kartı başlıkları her tonda kendi zemininde ≥4.5:1', () => {
    expect(prop(ruleBody('.min-h-\\[5\\.75rem\\] .uppercase.tracking-wide {'), 'color')).toBe('var(--t-label, var(--t-ink))')
    for (const tone of ['red', 'amber', 'orange', 'green', 'teal']) {
      const body = toneBlock(tone)
      const label = body.includes('--t-label') ? prop(body, '--t-label') : prop(body, '--t-ink')
      const bg = prop(body, '--t-bg')
      expect(contrast(label, bg), `${tone} ${label} / ${bg}`).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('özet kartı ikincil metinleri ve kırmızı meta en koyu tonlu zeminde ≥4.5:1', () => {
    const muted = prop(ruleBody('.min-h-\\[5\\.75rem\\] :is(.text-ink-muted, .text-ink-subtle) {'), 'color')
    const danger = prop(ruleBody('.min-h-\\[5\\.75rem\\] .text-danger {'), 'color')
    for (const bg of ['#fff2f1', '#fff8ec', '#fff4ec', '#f8f5ff', '#f1fbf6', '#f3f7ff', '#effaf5']) {
      expect(contrast(muted, bg), `muted / ${bg}`).toBeGreaterThanOrEqual(4.5)
    }
    expect(contrast(danger, '#fff2f1')).toBeGreaterThanOrEqual(4.5)
  })

  it('ana sayfa taksit rozetleri ≥4.5:1', () => {
    for (const sel of ['.border-red-200 .bg-red-100 {', '.border-amber-200 .bg-amber-100 {', '.border-sky-200 .bg-sky-100 {']) {
      const body = ruleBody(sel)
      expect(contrast(prop(body, 'color'), prop(body, 'background-color')), sel).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('mutedOnTintClass pastel kart zeminlerinde ≥4.5:1', () => {
    const color = mutedOnTintClass.match(/text-\[(#[0-9a-f]{6})\]/i)![1]
    for (const bg of ['#fdf0f0', '#fff7e8', '#eff4ff', '#f1f9ff', '#f5f4ff', '#f0fbf6']) {
      expect(contrast(color, bg), bg).toBeGreaterThanOrEqual(4.5)
    }
    expect(mutedOnTintClass).not.toContain('text-ink-muted')
  })
})
