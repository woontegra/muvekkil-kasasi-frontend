import type { CreateOzelSablonPayload, OzelSablonDegisken } from '../../../api/whatsappBaglanti'

export const SYSTEM_FIELDS: Array<{ key: OzelSablonDegisken['systemField']; label: string; sample: string }> = [
  { key: 'muvekkilAdi', label: 'Müvekkil adı', sample: 'Ahmet Yılmaz' },
  { key: 'dosyaNumarasi', label: 'Dosya numarası', sample: '2026/125' },
  { key: 'taksitTutari', label: 'Taksit tutarı', sample: '12.500,00 TL' },
  { key: 'kalanTutar', label: 'Kalan tutar', sample: '8.000,00 TL' },
  { key: 'vadeTarihi', label: 'Vade tarihi', sample: '25.08.2026' },
  { key: 'odenenTutar', label: 'Ödenen tutar', sample: '4.500,00 TL' },
  { key: 'odemeTarihi', label: 'Ödeme tarihi', sample: '20.08.2026' },
  { key: 'randevuTarihi', label: 'Randevu tarihi', sample: '27.08.2026' },
  { key: 'randevuSaati', label: 'Randevu saati', sample: '14:30' },
  { key: 'buroAdi', label: 'Büro adı', sample: 'Örnek Hukuk Bürosu' },
  { key: 'buroTelefon', label: 'Büro telefonu', sample: '0212 555 44 33' }
]

export const USAGE_AREA_LABELS: Record<string, string> = {
  VADEDEN_ONCE: 'Vadeden önce',
  VADE_GUNU: 'Vade günü',
  VADE_SONRASI: 'Vade sonrası',
  KISMI_ODEME_SONRASI: 'Kısmi ödeme sonrası',
  ODEME_ALINDI: 'Ödeme alındı',
  RANDEVU_HATIRLATMA: 'Randevu hatırlatma',
  MANUEL: 'Yalnızca manuel kullanım'
}

export type SablonFormValues = {
  displayName: string
  metaName: string
  usageArea: CreateOzelSablonPayload['usageArea']
  category: CreateOzelSablonPayload['category']
  bodyText: string
  footerText: string
  variables: OzelSablonDegisken[]
}

export function systemFieldLabel(key: string): string {
  return SYSTEM_FIELDS.find((f) => f.key === key)?.label ?? key
}

export function slugifyMetaName(value: string): string {
  const lower = value
    .trim()
    .toLocaleLowerCase('tr')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/ı/g, 'i')
  return lower.replace(/[^a-z0-9\s_]/g, '').trim().replace(/\s+/g, '_').replace(/_+/g, '_')
}

export const BODY_VARIABLE_EDGE_MESSAGE =
  'Mesaj metni bir değişkenle başlayamaz veya bitemez. Değişkenlerden önce ve sonra sabit bir açıklama ekleyin.'

function hasMeaningfulFixedText(segment: string): boolean {
  return /[\p{L}\p{N}]/u.test(segment)
}

/** Meta kuralı: BODY değişkenle başlayamaz/bitemez (frontend uyarı). */
export function validateBodyVariableEdges(bodyText: string): { ok: true } | { ok: false; message: string } {
  const trimmed = bodyText.trim()
  if (!trimmed) return { ok: true }

  if (/^\{\{\d+\}\}/.test(trimmed) || /\{\{\d+\}\}$/.test(trimmed)) {
    return { ok: false, message: BODY_VARIABLE_EDGE_MESSAGE }
  }

  const matches = [...trimmed.matchAll(/\{\{\d+\}\}/g)]
  if (matches.length === 0) return { ok: true }

  const first = matches[0]!
  const last = matches[matches.length - 1]!
  const before = trimmed.slice(0, first.index ?? 0)
  const after = trimmed.slice((last.index ?? 0) + last[0].length)

  if (!hasMeaningfulFixedText(before) || !hasMeaningfulFixedText(after)) {
    return { ok: false, message: BODY_VARIABLE_EDGE_MESSAGE }
  }

  return { ok: true }
}

export function emptySablonFormValues(): SablonFormValues {
  return {
    displayName: '',
    metaName: '',
    usageArea: 'VADEDEN_ONCE',
    category: 'UTILITY',
    bodyText: '',
    footerText: '',
    variables: []
  }
}

export const GUIDE_SAMPLE_VALUES: SablonFormValues = {
  displayName: 'Vade Günü Hatırlatmam',
  metaName: 'vade_gunu_hatirlatmam',
  usageArea: 'VADE_GUNU',
  category: 'UTILITY',
  bodyText:
    'Merhaba {{1}}, {{2}} numaralı dosyanıza ait ödemenizin son tarihi {{3}}’tür. Bilgi için {{4}} ile iletişime geçebilirsiniz.',
  footerText: 'Örnek Hukuk Bürosu',
  variables: [
    { index: 1, systemField: 'muvekkilAdi', exampleValue: 'Ahmet Yılmaz' },
    { index: 2, systemField: 'dosyaNumarasi', exampleValue: '2026/125' },
    { index: 3, systemField: 'vadeTarihi', exampleValue: '25.08.2026' },
    { index: 4, systemField: 'buroAdi', exampleValue: 'Örnek Hukuk Bürosu' }
  ]
}

export const GUIDE_STEP_COUNT = 8
