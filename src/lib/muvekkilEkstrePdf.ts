import type { Content, TDocumentDefinitions, TableCell } from 'pdfmake/interfaces'
import type { MuvekkilEkstreDto } from '../types/muvekkilEkstre'
import { formatCurrencyTR, formatDateTR } from '../utils/formatters'

type PdfMakeBrowser = {
  addVirtualFileSystem: (vfs: unknown) => void
  createPdf: (doc: TDocumentDefinitions) => {
    download: (filename?: string) => Promise<void>
    getBlob: () => Promise<Blob>
  }
}

let pdfMakeReady: Promise<PdfMakeBrowser> | null = null

async function getPdfMake(): Promise<PdfMakeBrowser> {
  if (!pdfMakeReady) {
    pdfMakeReady = (async () => {
      const pdfMakeMod = await import('pdfmake/build/pdfmake')
      const fontsMod = await import('pdfmake/build/vfs_fonts')
      const pdfMake = (pdfMakeMod.default ?? pdfMakeMod) as PdfMakeBrowser
      const vfs = (fontsMod as { default?: unknown }).default ?? fontsMod
      pdfMake.addVirtualFileSystem(vfs)
      return pdfMake
    })()
  }
  return pdfMakeReady
}

function money(v: string): string {
  return formatCurrencyTR(Number(v))
}

function ymdToTr(ymd: string): string {
  return formatDateTR(`${ymd}T12:00:00+03:00`)
}

function odemeYontemLabel(v: string): string {
  switch (v) {
    case 'NAKIT':
      return 'Nakit'
    case 'BANKA':
      return 'Banka'
    case 'KREDI_KARTI':
      return 'Kredi kartı'
    case 'DIGER':
      return 'Diğer'
    default:
      return v
  }
}

function mahkemeIcra(ekstre: MuvekkilEkstreDto): string {
  return [ekstre.dosya.mahkeme, ekstre.dosya.icraDairesi]
    .map((x) => x?.trim())
    .filter(Boolean)
    .join(' / ')
}

function safeFilePart(raw: string, fallback: string): string {
  const cleaned = raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 40)
  return cleaned || fallback
}

/** Örn. MuvekkilAdi_DosyaNo_MuvekkilEkstresi_29-07-2026.pdf */
export function buildMuvekkilEkstrePdfFilename(ekstre: MuvekkilEkstreDto, when = new Date()): string {
  const ad = safeFilePart(ekstre.muvekkil.gorunenAd, 'Muvekkil')
  const dosyaNo = safeFilePart(ekstre.dosya.dosyaNo?.trim() || 'Dosya', 'Dosya')
  const d = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Istanbul',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }).format(when)
  const stamp = d.replace(/\//g, '-')
  return `${ad}_${dosyaNo}_MuvekkilEkstresi_${stamp}.pdf`
}

function kvTable(rows: Array<[string, string]>): Content {
  return {
    table: {
      widths: ['38%', '62%'],
      body: rows.map(([k, v]) => [
        { text: k, style: 'kvLabel', border: [false, false, false, true] },
        { text: v || '—', style: 'kvValue', border: [false, false, false, true] }
      ])
    },
    layout: {
      hLineWidth: () => 0.4,
      vLineWidth: () => 0,
      hLineColor: () => '#cccccc',
      paddingLeft: () => 0,
      paddingRight: () => 4,
      paddingTop: () => 3,
      paddingBottom: () => 3
    },
    margin: [0, 0, 0, 8] as [number, number, number, number]
  }
}

function sectionTitle(text: string): Content {
  return {
    text,
    style: 'sectionTitle',
    margin: [0, 8, 0, 4] as [number, number, number, number]
  }
}

function dataTable(headers: string[], body: TableCell[][], widths: Array<string | number>): Content {
  const head: TableCell[] = headers.map((h) => ({
    text: h,
    style: 'tableHeader',
    fillColor: '#f0f0f0'
  }))
  return {
    table: {
      headerRows: 1,
      dontBreakRows: true,
      widths,
      body: [head, ...body]
    },
    layout: {
      hLineWidth: () => 0.5,
      vLineWidth: () => 0.3,
      hLineColor: () => '#999999',
      vLineColor: () => '#bbbbbb',
      paddingLeft: () => 3,
      paddingRight: () => 3,
      paddingTop: () => 3,
      paddingBottom: () => 3
    },
    margin: [0, 0, 0, 6] as [number, number, number, number]
  }
}

/** Aynı `MuvekkilEkstreDto` ile metin tabanlı A4 PDF (ekran görüntüsü değil). */
export function buildMuvekkilEkstreDocDefinition(ekstre: MuvekkilEkstreDto): TDocumentDefinitions {
  const v = ekstre.vekaletOzeti
  const a = ekstre.masrafAvansiOzeti
  const contact = [ekstre.buro.telefon, ekstre.buro.eposta, ekstre.buro.adres]
    .map((x) => x?.trim())
    .filter(Boolean)
    .join(' · ')

  const content: Content[] = [
    {
      columns: [
        {
          width: '*',
          stack: [
            { text: ekstre.buro.buroAdi, style: 'buroTitle' },
            contact ? { text: contact, style: 'contact', margin: [0, 2, 0, 0] } : { text: '' }
          ]
        },
        {
          width: 160,
          table: {
            widths: ['40%', '60%'],
            body: [
              [
                { text: 'Belge', style: 'metaLabel' },
                { text: 'MÜVEKKİL EKSTRESİ', style: 'metaValue' }
              ],
              [
                { text: 'Referans', style: 'metaLabel' },
                { text: ekstre.belgeRef, style: 'metaValueMono' }
              ],
              [
                { text: 'Tarih', style: 'metaLabel' },
                { text: ymdToTr(ekstre.ekstreTarihi), style: 'metaValue' }
              ]
            ]
          },
          layout: {
            hLineWidth: () => 0.6,
            vLineWidth: () => 0.6,
            hLineColor: () => '#333333',
            vLineColor: () => '#333333',
            paddingLeft: () => 4,
            paddingRight: () => 4,
            paddingTop: () => 3,
            paddingBottom: () => 3
          }
        }
      ],
      columnGap: 12,
      margin: [0, 0, 0, 6] as [number, number, number, number]
    },
    {
      text: ekstre.itibariyleAciklama,
      alignment: 'center',
      style: 'itibar',
      margin: [0, 2, 0, 8] as [number, number, number, number]
    },
    {
      columns: [
        {
          width: '*',
          stack: [
            sectionTitle('Müvekkil / dosya'),
            kvTable([
              ['Müvekkil', ekstre.muvekkil.gorunenAd],
              ['Dosya', ekstre.dosya.konuBasligi],
              ['Dosya no', ekstre.dosya.dosyaNo ?? '—'],
              ['Mahkeme / icra', mahkemeIcra(ekstre) || '—'],
              ['Ekstre tarihi', ymdToTr(ekstre.ekstreTarihi)]
            ])
          ]
        },
        {
          width: '*',
          stack: [
            sectionTitle('Vekalet ücreti özeti'),
            kvTable([
              ['Kararlaştırılan', money(v.kararlastirilanToplam)],
              ['Tahsil edilen', money(v.tahsilEdilenToplam)],
              ['Kalan', money(v.kalanToplam)],
              ['Tahsilat oranı', `%${v.tahsilatOrani.toLocaleString('tr-TR')}`],
              ['Gecikmiş toplam', money(v.gecikmisToplam)],
              [
                'Sonraki taksit',
                v.sonrakiTaksitVade && v.sonrakiTaksitTutar
                  ? `${ymdToTr(v.sonrakiTaksitVade)} · ${money(v.sonrakiTaksitTutar)}`
                  : '—'
              ]
            ])
          ]
        }
      ],
      columnGap: 10
    },
    sectionTitle('Taksitler'),
    ekstre.taksitler.length === 0
      ? { text: 'Taksit kaydı yok.', style: 'muted' }
      : dataTable(
          ['#', 'Vade', 'Tutar', 'Ödenen', 'Kalan', 'Durum'],
          ekstre.taksitler.map((t) => [
            String(t.taksitNo),
            ymdToTr(t.vadeTarihi),
            { text: money(t.taksitTutari), alignment: 'right' },
            { text: money(t.odenenToplam), alignment: 'right' },
            { text: money(t.kalanTutar), alignment: 'right' },
            t.durum
          ]),
          [28, 70, '*', '*', '*', 70]
        )
  ]

  for (const t of ekstre.taksitler) {
    if (t.odemeler.length === 0) continue
    content.push({
      text: `Taksit #${t.taksitNo} ödemeleri`,
      style: 'subSection',
      margin: [0, 4, 0, 2] as [number, number, number, number]
    })
    content.push(
      dataTable(
        ['Tarih', 'Tutar', 'Yöntem', 'Makbuz', 'Açıklama'],
        t.odemeler.map((o) => [
          formatDateTR(o.odemeTarihi),
          { text: money(o.tutar), alignment: 'right' },
          odemeYontemLabel(o.odemeYontemi),
          o.makbuzNo,
          o.aciklama ?? '—'
        ]),
        [70, 70, 70, 80, '*']
      )
    )
  }

  content.push(
    {
      columns: [
        {
          width: '*',
          stack: [
            sectionTitle('Masraf avansı özeti'),
            kvTable([
              ['Alınan avans', money(a.toplamAlinanAvans)],
              ['Dosya masrafı', money(a.toplamMasraf)],
              ['Pozitif düzeltme', money(a.pozitifDuzeltme)],
              ['Müvekkile iade', money(a.muvekkileIade)],
              ['Güncel avans bakiyesi', money(a.guncelBakiye)]
            ])
          ]
        },
        {
          width: '*',
          stack: [
            sectionTitle('Belge'),
            kvTable([
              ['Referans', ekstre.belgeRef],
              ['İtibarıyla', ymdToTr(ekstre.itibariyleTarih)]
            ])
          ]
        }
      ],
      columnGap: 10
    },
    sectionTitle('Masraf avansı hareketleri'),
    ekstre.masrafHareketleri.length === 0
      ? { text: 'Onaylı avans/masraf hareketi yok.', style: 'muted' }
      : dataTable(
          ['Tarih', 'Belge', 'Tür', 'Açıklama', 'Giriş', 'Çıkış', 'Bakiye'],
          ekstre.masrafHareketleri.map((h) => [
            formatDateTR(h.tarih),
            h.belgeNo,
            h.islemTuru,
            h.aciklama ?? '—',
            { text: Number(h.giris) > 0 ? money(h.giris) : '—', alignment: 'right' },
            { text: Number(h.cikis) > 0 ? money(h.cikis) : '—', alignment: 'right' },
            { text: money(h.bakiyeSonrasi), alignment: 'right' }
          ]),
          [60, 55, 55, '*', 55, 55, 55]
        ),
    {
      text: ekstre.dipnot,
      style: 'footnote',
      margin: [0, 12, 0, 0] as [number, number, number, number]
    }
  )

  return {
    pageSize: 'A4',
    pageMargins: [36, 40, 36, 48],
    defaultStyle: {
      font: 'Roboto',
      fontSize: 9,
      lineHeight: 1.25
    },
    styles: {
      buroTitle: { fontSize: 13, bold: true },
      contact: { fontSize: 8, color: '#444444' },
      metaLabel: { fontSize: 7.5, bold: true, color: '#333333' },
      metaValue: { fontSize: 8, bold: true },
      metaValueMono: { fontSize: 7.5 },
      itibar: { fontSize: 10, bold: true },
      sectionTitle: { fontSize: 10, bold: true, color: '#111111' },
      subSection: { fontSize: 8.5, bold: true, color: '#333333' },
      kvLabel: { fontSize: 8, color: '#555555' },
      kvValue: { fontSize: 8.5 },
      tableHeader: { fontSize: 8, bold: true },
      muted: { fontSize: 8, color: '#666666', italics: true },
      footnote: { fontSize: 8, color: '#555555', italics: true }
    },
    footer: (currentPage, pageCount) => ({
      columns: [
        {
          text: 'Bu belge Woontegra Müvekkil Kasa sistemi üzerinden oluşturulmuştur.',
          style: 'muted',
          margin: [36, 0, 0, 0]
        },
        {
          text: `Sayfa ${currentPage} / ${pageCount}`,
          alignment: 'right',
          style: 'muted',
          margin: [0, 0, 36, 0]
        }
      ]
    }),
    info: {
      title: 'Müvekkil Ekstresi',
      author: ekstre.buro.buroAdi,
      subject: `${ekstre.muvekkil.gorunenAd} — ${ekstre.dosya.konuBasligi}`
    },
    content
  }
}

export async function downloadMuvekkilEkstrePdf(ekstre: MuvekkilEkstreDto): Promise<string> {
  const pdfMake = await getPdfMake()
  const filename = buildMuvekkilEkstrePdfFilename(ekstre)
  const def = buildMuvekkilEkstreDocDefinition(ekstre)

  try {
    // pdfmake 0.3+: getBlob/download Promise tabanlı (callback yok)
    const pdf = pdfMake.createPdf(def)
    const blob = await pdf.getBlob()
    if (!(blob instanceof Blob) || blob.size <= 0) {
      throw new Error('PDF boş üretildi.')
    }
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.rel = 'noopener'
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.setTimeout(() => URL.revokeObjectURL(url), 1500)
  } catch (err) {
    throw err instanceof Error ? err : new Error('PDF oluşturulamadı.')
  }

  return filename
}
