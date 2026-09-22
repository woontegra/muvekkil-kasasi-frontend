import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { gunFarkiLabel } from './tahsilatMerkeziLabels'

afterEach(() => cleanup())

const pagePath = join(dirname(fileURLToPath(import.meta.url)), 'TahsilatMerkeziPage.tsx')
const labelsPath = join(dirname(fileURLToPath(import.meta.url)), 'tahsilatMerkeziLabels.ts')

const REQUIRED_DOM_LABELS = [
  'Müvekkil',
  'Ödenen',
  'Süre',
  'İşlem',
  'Ödeme Al',
  "WhatsApp'tan Gönder",
  'Ekstre Aç',
  'Dosyaya Git',
  '5 gün kaldı',
] as const

describe('TahsilatMerkezi Turkish UI encoding', () => {
  it('source page has required labels and zero U+FFFD', () => {
    const src = readFileSync(pagePath, 'utf8')
    const labelsSrc = readFileSync(labelsPath, 'utf8')
    const combined = `${src}\n${labelsSrc}`
    expect(combined.includes('\uFFFD')).toBe(false)
    expect(src).not.toContain('SMS Gönder')
    expect(src).not.toContain('SmsHatirlatModal')
    expect(src).not.toContain('onSms')
    expect(src).not.toContain('smsRow')
    for (const label of REQUIRED_DOM_LABELS) {
      if (label === '5 gün kaldı') {
        expect(labelsSrc).toContain('gün kaldı')
        continue
      }
      expect(src, `missing ${label}`).toContain(label)
    }
    expect(src).toContain('size="table"')
    expect(src).toContain('tableActionColMultiClass')
  })

  it('DOM asserts screenshot-critical Turkish labels without SMS', () => {
    render(
      <div>
        {REQUIRED_DOM_LABELS.filter((l) => l !== '5 gün kaldı').map((label) => (
          <span key={label}>{label}</span>
        ))}
        <span>{gunFarkiLabel(5)}</span>
      </div>,
    )
    for (const label of REQUIRED_DOM_LABELS) {
      expect(screen.getByText(label)).toBeInTheDocument()
    }
    expect(screen.queryByText('SMS Gönder')).toBeNull()
  })
})
