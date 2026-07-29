import type { ReactElement } from 'react'
import { useState } from 'react'
import type { MuvekkilEkstreDto } from '../../types/muvekkilEkstre'
import { formatCurrencyTR, formatDateTR } from '../../utils/formatters'
import { ReceiptPrintLayout } from '../receipt/ReceiptPrintLayout'
import { ReceiptSectionTable } from '../receipt/ReceiptSectionTable'

type Props = {
  ekstre: MuvekkilEkstreDto
  /** Ekran önizlemesinde ödeme detayı açılır; yazdırmada tümü görünür. */
  expandAllPayments?: boolean
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
  const parts = [ekstre.dosya.mahkeme, ekstre.dosya.icraDairesi].map((x) => x?.trim()).filter(Boolean)
  return parts.join(' / ')
}

/** Müvekkile gösterilecek ekstre — büro içi kârlılık / SMM / mali kontrol yok. */
export function MuvekkilEkstrePrintView(props: Props): ReactElement {
  const { ekstre, expandAllPayments } = props
  const v = ekstre.vekaletOzeti
  const a = ekstre.masrafAvansiOzeti
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({})

  const isOpen = (id: string): boolean => expandAllPayments === true || Boolean(openIds[id])

  return (
    <ReceiptPrintLayout
      title="Müvekkil Ekstresi"
      compact
      hideTitleBand
      belgeNo={ekstre.belgeRef}
      buro={{
        buroAdi: ekstre.buro.buroAdi,
        telefon: ekstre.buro.telefon,
        eposta: ekstre.buro.eposta,
        adres: ekstre.buro.adres
      }}
      duzenlemeTarihi={formatDateTR(`${ekstre.ekstreTarihi}T12:00:00+03:00`)}
      printedAt={`${ekstre.ekstreTarihi}T12:00:00.000Z`}
      footnote={ekstre.dipnot}
    >
      <p className="mb-2 text-center text-[10pt] font-semibold text-ink print:mb-1">
        {ekstre.itibariyleAciklama}
      </p>

      <div className="receipt-print__grid-2">
        <ReceiptSectionTable
          title="Müvekkil / dosya"
          rows={[
            { label: 'Müvekkil', value: ekstre.muvekkil.gorunenAd },
            { label: 'Dosya', value: ekstre.dosya.konuBasligi },
            { label: 'Dosya no', value: ekstre.dosya.dosyaNo, mono: true },
            { label: 'Mahkeme / icra', value: mahkemeIcra(ekstre) || null },
            {
              label: 'Ekstre tarihi',
              value: formatDateTR(`${ekstre.ekstreTarihi}T12:00:00+03:00`)
            }
          ]}
        />
        <ReceiptSectionTable
          title="Vekalet ücreti özeti"
          rows={[
            {
              label: 'Kararlaştırılan',
              value: formatCurrencyTR(Number(v.kararlastirilanToplam)),
              amount: true
            },
            {
              label: 'Tahsil edilen',
              value: formatCurrencyTR(Number(v.tahsilEdilenToplam)),
              amount: true
            },
            {
              label: 'Kalan',
              value: formatCurrencyTR(Number(v.kalanToplam)),
              amount: true,
              highlightAmount: true
            },
            { label: 'Tahsilat oranı', value: `%${v.tahsilatOrani.toLocaleString('tr-TR')}` },
            {
              label: 'Gecikmiş toplam',
              value: formatCurrencyTR(Number(v.gecikmisToplam)),
              amount: true
            },
            {
              label: 'Sonraki taksit',
              value:
                v.sonrakiTaksitVade && v.sonrakiTaksitTutar
                  ? `${formatDateTR(`${v.sonrakiTaksitVade}T12:00:00+03:00`)} · ${formatCurrencyTR(Number(v.sonrakiTaksitTutar))}`
                  : '—'
            }
          ]}
        />
      </div>

      <ReceiptSectionTable title="Taksitler">
        {ekstre.taksitler.length === 0 ? (
          <p className="receipt-section__empty">Taksit kaydı yok.</p>
        ) : (
          <div className="space-y-2">
            <table className="receipt-data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Vade</th>
                  <th className="num">Tutar</th>
                  <th className="num">Ödenen</th>
                  <th className="num">Kalan</th>
                  <th>Durum</th>
                </tr>
              </thead>
              <tbody>
                {ekstre.taksitler.map((t) => (
                  <tr key={t.id} className="receipt-ekstre-taksit-block">
                    <td>{t.taksitNo}</td>
                    <td>{formatDateTR(`${t.vadeTarihi}T12:00:00+03:00`)}</td>
                    <td className="num">{formatCurrencyTR(Number(t.taksitTutari))}</td>
                    <td className="num">{formatCurrencyTR(Number(t.odenenToplam))}</td>
                    <td className="num">{formatCurrencyTR(Number(t.kalanTutar))}</td>
                    <td>{t.durum}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {ekstre.taksitler.map((t) => {
              if (t.odemeler.length === 0) return null
              const open = isOpen(t.id)
              return (
                <div key={`od-${t.id}`} className="receipt-ekstre-taksit-block mt-1">
                  <button
                    type="button"
                    className="no-print mb-1 text-xs font-semibold text-primary underline"
                    onClick={() => setOpenIds((prev) => ({ ...prev, [t.id]: !prev[t.id] }))}
                  >
                    Taksit #{t.taksitNo} ödeme geçmişi ({t.odemeler.length})
                  </button>
                  <div className={open || expandAllPayments ? '' : 'hidden print:block'}>
                    <p className="mb-1 hidden text-[8pt] font-semibold print:block">
                      Taksit #{t.taksitNo} ödemeleri
                    </p>
                    <table className="receipt-data-table">
                      <thead>
                        <tr>
                          <th>Tarih</th>
                          <th className="num">Tutar</th>
                          <th>Yöntem</th>
                          <th>Makbuz</th>
                          <th>Açıklama</th>
                        </tr>
                      </thead>
                      <tbody>
                        {t.odemeler.map((o) => (
                          <tr key={o.id}>
                            <td>{formatDateTR(o.odemeTarihi)}</td>
                            <td className="num">{formatCurrencyTR(Number(o.tutar))}</td>
                            <td>{odemeYontemLabel(o.odemeYontemi)}</td>
                            <td className="value--mono">{o.makbuzNo}</td>
                            <td>{o.aciklama ?? '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </ReceiptSectionTable>

      <div className="receipt-print__grid-2">
        <ReceiptSectionTable
          title="Masraf avansı özeti"
          rows={[
            {
              label: 'Alınan avans',
              value: formatCurrencyTR(Number(a.toplamAlinanAvans)),
              amount: true
            },
            {
              label: 'Dosya masrafı',
              value: formatCurrencyTR(Number(a.toplamMasraf)),
              amount: true
            },
            {
              label: 'Pozitif düzeltme',
              value: formatCurrencyTR(Number(a.pozitifDuzeltme)),
              amount: true
            },
            {
              label: 'Müvekkile iade',
              value: formatCurrencyTR(Number(a.muvekkileIade)),
              amount: true
            },
            {
              label: 'Güncel avans bakiyesi',
              value: formatCurrencyTR(Number(a.guncelBakiye)),
              amount: true,
              highlightAmount: true
            }
          ]}
        />
        <ReceiptSectionTable
          title="Belge"
          rows={[
            { label: 'Referans', value: ekstre.belgeRef, mono: true },
            { label: 'İtibarıyla', value: formatDateTR(`${ekstre.itibariyleTarih}T12:00:00+03:00`) }
          ]}
        />
      </div>

      <ReceiptSectionTable title="Masraf avansı hareketleri">
        {ekstre.masrafHareketleri.length === 0 ? (
          <p className="receipt-section__empty">Onaylı avans/masraf hareketi yok.</p>
        ) : (
          <table className="receipt-data-table">
            <thead>
              <tr>
                <th>Tarih</th>
                <th>Belge</th>
                <th>Tür</th>
                <th>Açıklama</th>
                <th className="num">Giriş</th>
                <th className="num">Çıkış</th>
                <th className="num">Bakiye</th>
              </tr>
            </thead>
            <tbody>
              {ekstre.masrafHareketleri.map((h) => (
                <tr key={h.id}>
                  <td>{formatDateTR(h.tarih)}</td>
                  <td className="value--mono">{h.belgeNo}</td>
                  <td>{h.islemTuru}</td>
                  <td>{h.aciklama ?? '—'}</td>
                  <td className="num">
                    {Number(h.giris) > 0 ? formatCurrencyTR(Number(h.giris)) : '—'}
                  </td>
                  <td className="num">
                    {Number(h.cikis) > 0 ? formatCurrencyTR(Number(h.cikis)) : '—'}
                  </td>
                  <td className="num">{formatCurrencyTR(Number(h.bakiyeSonrasi))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ReceiptSectionTable>
    </ReceiptPrintLayout>
  )
}
