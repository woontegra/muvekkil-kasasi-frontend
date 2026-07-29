import type { ReactElement } from 'react'
import type { DosyaHesapOzetiResponse } from '../../types/hesapOzeti'
import { formatCurrencyTR, formatDateTR } from '../../utils/formatters'
import { dosyaDurumuLabel, mahkemeIcraSatir } from '../../lib/dosyaLabels'
import { resolveTaksitRow } from '../../lib/vekaletTaksitOzet'
import { ReceiptPrintLayout } from '../receipt/ReceiptPrintLayout'
import { ReceiptSectionTable } from '../receipt/ReceiptSectionTable'

type Props = {
  data: DosyaHesapOzetiResponse
  /** Belirtilmezse API'deki yazdirmaTarihi kullanılır. */
  printedAtOverride?: string
  showKasaTable?: boolean
}

function tipEtiket(tip: string): string {
  if (tip === 'AVANS_GIRISI') return 'Avans'
  if (tip === 'MASRAF') return 'Masraf'
  if (tip === 'DUZELTME') return 'Düzeltme'
  return tip
}

function durumEtiket(d: string): string {
  switch (d) {
    case 'ODENMEDI':
      return 'Ödenmedi'
    case 'KISMI_ODENDI':
      return 'Kısmi ödendi'
    case 'ODENDI':
      return 'Ödendi'
    case 'GECIKTI':
      return 'Gecikti'
    case 'IPTAL':
      return 'İptal'
    default:
      return d
  }
}

/** Dosya hesap özeti — A4 tek sayfaya sığacak kompakt düzen. */
export function HesapOzetiPrintView(props: Props): ReactElement {
  const { data, printedAtOverride, showKasaTable = true } = props
  const { tenant, dosya, muvekkil, kasaOzet, kasaHareketleri, vekalet, taksitler, smmBekleyenler, yazdirmaTarihi } =
    data
  const mahIcr = mahkemeIcraSatir(dosya)
  const footerTarih = printedAtOverride ?? yazdirmaTarihi

  return (
    <ReceiptPrintLayout
      title="Dosya Hesap Özeti"
      compact
      hideTitleBand
      buro={{
        buroAdi: tenant.buroAdi,
        telefon: tenant.telefon,
        eposta: tenant.eposta,
        adres: tenant.adres
      }}
      duzenlemeTarihi={formatDateTR(footerTarih)}
      printedAt={footerTarih}
      footnote="Bu özet, dosyaya ait kayıtlı avans, masraf, düzeltme, vekalet ücreti ve taksit bilgilerine dayanmaktadır. Vekalet tahsilatı avans bakiyesine yansımaz."
    >
      <div className="receipt-print__grid-2">
        <ReceiptSectionTable
          title="Müvekkil / dosya"
          rows={[
            { label: 'Müvekkil', value: muvekkil.gorunenAd },
            { label: 'Tür', value: muvekkil.tur === 'TUZEL' ? 'Tüzel kişi' : 'Gerçek kişi' },
            { label: 'Telefon', value: muvekkil.telefon },
            { label: 'Dosya konusu', value: dosya.konuBasligi },
            { label: 'Mahkeme / icra', value: mahIcr || null },
            { label: 'Dosya no', value: dosya.dosyaNo, mono: true },
            { label: 'Durum', value: dosyaDurumuLabel(dosya.durum) }
          ]}
        />
        <ReceiptSectionTable
          title="Kasa özeti (onaylı)"
          rows={[
            { label: 'Toplam avans', value: formatCurrencyTR(Number(kasaOzet.toplamAvans)), amount: true },
            { label: 'Toplam masraf', value: formatCurrencyTR(Number(kasaOzet.toplamMasraf)), amount: true },
            { label: 'Düzeltmeler', value: formatCurrencyTR(Number(kasaOzet.toplamDuzeltme)), amount: true },
            {
              label: 'Kalan avans',
              value: formatCurrencyTR(Number(kasaOzet.bakiye)),
              amount: true,
              highlightAmount: true
            },
            { label: 'Onaysız işlem', value: String(kasaOzet.onaysizIslemSayisi) }
          ]}
        />
      </div>

      {showKasaTable ? (
        <ReceiptSectionTable title="Kasa hareketleri">
          {kasaHareketleri.length === 0 ? (
            <p className="receipt-section__empty">Kasa hareketi kaydı yok.</p>
          ) : (
            <table className="receipt-data-table">
              <thead>
                <tr>
                  <th>Tarih</th>
                  <th>Belge no</th>
                  <th>Tip</th>
                  <th className="num">Tutar</th>
                  <th>Onay</th>
                </tr>
              </thead>
              <tbody>
                {kasaHareketleri.map((h) => {
                  const v = Number(h.tutar)
                  const signed = h.tip === 'MASRAF' ? -v : v
                  return (
                    <tr key={h.id}>
                      <td>{formatDateTR(h.tarih)}</td>
                      <td className="value--mono">{h.belgeNo}</td>
                      <td>{tipEtiket(h.tip)}</td>
                      <td className="num">{formatCurrencyTR(signed)}</td>
                      <td>{h.onayDurumu}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </ReceiptSectionTable>
      ) : null}

      <div className="receipt-print__grid-2">
        <ReceiptSectionTable
          title="Vekalet özeti"
          rows={[
            { label: 'Anlaşılan', value: formatCurrencyTR(Number(vekalet.ozet.anlasilan)), amount: true },
            { label: 'Ödenen toplam', value: formatCurrencyTR(Number(vekalet.ozet.odenenToplam)), amount: true },
            {
              label: 'Kalan vekalet',
              value: formatCurrencyTR(Number(vekalet.ozet.kalanVekalet)),
              amount: true,
              highlightAmount: true
            },
            ...(vekalet.ucret?.aciklama?.trim()
              ? [{ label: 'Açıklama', value: vekalet.ucret.aciklama }]
              : [])
          ]}
        />
        <ReceiptSectionTable title="SMM bekleyen">
          {smmBekleyenler.length === 0 ? (
            <p className="receipt-section__empty">Kayıt yok.</p>
          ) : (
            <table className="receipt-data-table">
              <thead>
                <tr>
                  <th>Taksit</th>
                  <th className="num">Tutar</th>
                  <th>Ödeme</th>
                </tr>
              </thead>
              <tbody>
                {smmBekleyenler.map((t) => (
                  <tr key={t.id}>
                    <td>{t.taksitNo}</td>
                    <td className="num">{formatCurrencyTR(Number(t.tutar))}</td>
                    <td>{formatDateTR(t.odemeTarihi ?? undefined)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </ReceiptSectionTable>
      </div>

      <ReceiptSectionTable title="Taksitler">
        {taksitler.length === 0 ? (
          <p className="receipt-section__empty">Taksit kaydı yok.</p>
        ) : (
          <table className="receipt-data-table">
            <thead>
              <tr>
                <th>No</th>
                <th>Vade</th>
                <th className="num">Tutar</th>
                <th className="num">Ödenen</th>
                <th className="num">Kalan</th>
                <th>Durum</th>
                <th>Makbuz no</th>
              </tr>
            </thead>
            <tbody>
              {taksitler.map((t) => {
                const row = resolveTaksitRow(t)
                return (
                  <tr key={t.id}>
                    <td>{t.taksitNo}</td>
                    <td>{formatDateTR(t.vadeTarihi)}</td>
                    <td className="num">{formatCurrencyTR(Number(row.taksitTutari))}</td>
                    <td className="num">{formatCurrencyTR(Number(row.odenenToplam))}</td>
                    <td className="num">{formatCurrencyTR(Number(row.kalanTutar))}</td>
                    <td>{durumEtiket(row.durum)}</td>
                    <td className="value--mono">{row.sonMakbuzNo ?? '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </ReceiptSectionTable>

      <div className="receipt-print__sonuc">
        <p className="receipt-print__sonuc-line">
          <strong>Dosya avans bakiyesi:</strong> {formatCurrencyTR(Number(kasaOzet.bakiye))}
        </p>
        <p className="receipt-print__sonuc-line">
          <strong>Kalan vekalet ücreti:</strong> {formatCurrencyTR(Number(vekalet.ozet.kalanVekalet))}
        </p>
      </div>

      <div className="receipt-print__sign-row">
        <div className="receipt-print__sign-box">
          <div className="receipt-print__sign-lbl">Hazırlayan</div>
          <div className="receipt-print__sign-line" />
          <div className="receipt-print__sign-sub">Ad soyad · imza</div>
        </div>
        <div className="receipt-print__sign-box">
          <div className="receipt-print__sign-lbl">Müvekkil / Teslim alan</div>
          <div className="receipt-print__sign-line" />
          <div className="receipt-print__sign-sub">Ad soyad · imza</div>
        </div>
      </div>
    </ReceiptPrintLayout>
  )
}
