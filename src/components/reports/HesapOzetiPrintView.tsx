import type { ReactElement } from 'react'
import type { DosyaHesapOzetiResponse } from '../../types/hesapOzeti'
import { formatCurrencyTR, formatDateTR } from '../../utils/formatters'
import { dosyaDurumuLabel, mahkemeIcraSatir } from '../../lib/dosyaLabels'
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

/** Dosya hesap özeti — A4 yazdırmaya uygun tablo düzeni. */
export function HesapOzetiPrintView(props: Props): ReactElement {
  const { data, printedAtOverride, showKasaTable = true } = props
  const { tenant, dosya, muvekkil, kasaOzet, kasaHareketleri, vekalet, taksitler, smmBekleyenler, yazdirmaTarihi } =
    data
  const mahIcr = mahkemeIcraSatir(dosya)
  const footerTarih = printedAtOverride ?? yazdirmaTarihi
  const vergi = [tenant.vergiDairesi, tenant.vergiNo].filter(Boolean).join(' / ')

  return (
    <ReceiptPrintLayout
      title="Dosya Hesap Özeti"
      buro={{
        buroAdi: tenant.buroAdi,
        telefon: tenant.telefon,
        eposta: tenant.eposta,
        adres: tenant.adres
      }}
      duzenlemeTarihi={formatDateTR(footerTarih)}
      printedAt={footerTarih}
    >
      <ReceiptSectionTable
        title="Büro bilgileri"
        rows={[
          { label: 'Telefon', value: tenant.telefon },
          { label: 'E-posta', value: tenant.eposta },
          { label: 'Adres', value: tenant.adres },
          { label: 'Vergi dairesi / no', value: vergi || null }
        ]}
      />
      <ReceiptSectionTable
        title="Müvekkil / dosya bilgileri"
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
            label: 'Kalan avans (bakiye)',
            value: formatCurrencyTR(Number(kasaOzet.bakiye)),
            amount: true,
            highlightAmount: true
          },
          { label: 'Onaysız işlem sayısı', value: String(kasaOzet.onaysizIslemSayisi) }
        ]}
      />

      {showKasaTable ? (
        <ReceiptSectionTable title="Kasa hareketleri">
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
        </ReceiptSectionTable>
      ) : null}

      <ReceiptSectionTable
        title="Vekalet özeti"
        rows={[
          { label: 'Anlaşılan', value: formatCurrencyTR(Number(vekalet.ozet.anlasilan)), amount: true },
          { label: 'Ödenen toplam', value: formatCurrencyTR(Number(vekalet.ozet.odenenToplam)), amount: true },
          { label: 'Kalan vekalet', value: formatCurrencyTR(Number(vekalet.ozet.kalanVekalet)), amount: true },
          ...(vekalet.ucret?.aciklama?.trim()
            ? [{ label: 'Açıklama', value: vekalet.ucret.aciklama }]
            : [])
        ]}
      />

      <ReceiptSectionTable title="Taksitler">
        <table className="receipt-data-table">
          <thead>
            <tr>
              <th>No</th>
              <th>Vade</th>
              <th className="num">Tutar</th>
              <th>Durum</th>
              <th>Makbuz no</th>
            </tr>
          </thead>
          <tbody>
            {taksitler.map((t) => (
              <tr key={t.id}>
                <td>{t.taksitNo}</td>
                <td>{formatDateTR(t.vadeTarihi)}</td>
                <td className="num">{formatCurrencyTR(Number(t.tutar))}</td>
                <td>{t.odemeDurumu}</td>
                <td className="value--mono">{t.makbuzNo ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </ReceiptSectionTable>

      <ReceiptSectionTable title="SMM bekleyen tahsilatlar">
        {smmBekleyenler.length === 0 ? (
          <p className="receipt-section__empty">Kayıt yok.</p>
        ) : (
          <table className="receipt-data-table">
            <thead>
              <tr>
                <th>Taksit</th>
                <th className="num">Tutar</th>
                <th>Ödeme tarihi</th>
                <th>Makbuz no</th>
              </tr>
            </thead>
            <tbody>
              {smmBekleyenler.map((t) => (
                <tr key={t.id}>
                  <td>{t.taksitNo}</td>
                  <td className="num">{formatCurrencyTR(Number(t.tutar))}</td>
                  <td>{formatDateTR(t.odemeTarihi ?? undefined)}</td>
                  <td className="value--mono">{t.makbuzNo ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </ReceiptSectionTable>
    </ReceiptPrintLayout>
  )
}
