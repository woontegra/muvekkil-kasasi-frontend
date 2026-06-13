import type { ReactElement } from 'react'
import type { DosyaHesapOzetiResponse } from '../../types/hesapOzeti'
import { formatCurrencyTR, formatDateTR } from '../../utils/formatters'
import { dosyaDurumuLabel, mahkemeIcraSatir } from '../../lib/dosyaLabels'

function line(label: string, value: string): ReactElement {
  return (
    <div className="mb-1 flex justify-between gap-4 text-[13px]">
      <span className="text-neutral-600">{label}</span>
      <span className="text-right font-semibold tabular-nums text-neutral-900">{value}</span>
    </div>
  )
}

type Props = {
  data: DosyaHesapOzetiResponse
  /** Belirtilmezse API’deki yazdirmaTarihi kullanılır. */
  printedAtOverride?: string
  showKasaTable?: boolean
}

function tipEtiket(tip: string): string {
  if (tip === 'AVANS_GIRISI') return 'Avans'
  if (tip === 'MASRAF') return 'Masraf'
  if (tip === 'DUZELTME') return 'Düzeltme'
  return tip
}

/** Dosya hesap özeti — A4 yazdırmaya uygun sade düzen. */
export function HesapOzetiPrintView(props: Props): ReactElement {
  const { data, printedAtOverride, showKasaTable = true } = props
  const { tenant, dosya, muvekkil, kasaOzet, kasaHareketleri, vekalet, taksitler, smmBekleyenler, yazdirmaTarihi } = data
  const mahIcr = mahkemeIcraSatir(dosya)
  const footerTarih = printedAtOverride ?? yazdirmaTarihi

  return (
    <div className="font-serif text-neutral-900">
      <div className="mb-4 border-b-2 border-neutral-800 pb-2 text-center">
        <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-600">Dosya Hesap Özeti</p>
        <p className="mt-1 text-lg font-bold">{tenant.buroAdi}</p>
      </div>

      <section className="mb-4">
        <h3 className="mb-2 border-b border-neutral-300 pb-1 text-xs font-bold uppercase text-neutral-800">Büro</h3>
        {line('Telefon', tenant.telefon ?? '—')}
        {line('E-posta', tenant.eposta ?? '—')}
        {line('Adres', tenant.adres ?? '—')}
        {line('Vergi', [tenant.vergiDairesi, tenant.vergiNo].filter(Boolean).join(' / ') || '—')}
      </section>

      <section className="mb-4">
        <h3 className="mb-2 border-b border-neutral-300 pb-1 text-xs font-bold uppercase text-neutral-800">Müvekkil</h3>
        {line('Ad / ünvan', muvekkil.gorunenAd)}
        {line('Tür', muvekkil.tur === 'TUZEL' ? 'Tüzel' : 'Gerçek')}
        {line('Telefon', muvekkil.telefon ?? '—')}
      </section>

      <section className="mb-4">
        <h3 className="mb-2 border-b border-neutral-300 pb-1 text-xs font-bold uppercase text-neutral-800">Dosya</h3>
        {line('Konu', dosya.konuBasligi)}
        {line('Mahkeme / icra', mahIcr || '—')}
        {line('Dosya no', dosya.dosyaNo ?? '—')}
        {line('Durum', dosyaDurumuLabel(dosya.durum))}
      </section>

      <section className="mb-4">
        <h3 className="mb-2 border-b border-neutral-300 pb-1 text-xs font-bold uppercase text-neutral-800">Kasa özeti (onaylı)</h3>
        {line('Toplam avans', formatCurrencyTR(Number(kasaOzet.toplamAvans)))}
        {line('Toplam masraf', formatCurrencyTR(Number(kasaOzet.toplamMasraf)))}
        {line('Düzeltmeler', formatCurrencyTR(Number(kasaOzet.toplamDuzeltme)))}
        {line('Kalan avans (bakiye)', formatCurrencyTR(Number(kasaOzet.bakiye)))}
        {line('Onaysız işlem sayısı', String(kasaOzet.onaysizIslemSayisi))}
      </section>

      {showKasaTable ? (
        <section className="mb-4">
          <h3 className="mb-2 border-b border-neutral-300 pb-1 text-xs font-bold uppercase text-neutral-800">Kasa hareketleri</h3>
          <table className="w-full border-collapse text-[11px]">
            <thead>
              <tr className="border-b border-neutral-800 bg-neutral-100">
                <th className="p-1 text-left font-bold">Tarih</th>
                <th className="p-1 text-left font-bold">Belge</th>
                <th className="p-1 text-left font-bold">Tip</th>
                <th className="p-1 text-right font-bold">Tutar</th>
                <th className="p-1 text-left font-bold">Onay</th>
              </tr>
            </thead>
            <tbody>
              {kasaHareketleri.map((h) => {
                const v = Number(h.tutar)
                const signed = h.tip === 'MASRAF' ? -v : h.tip === 'DUZELTME' ? v : v
                return (
                  <tr key={h.id} className="border-b border-neutral-200">
                    <td className="p-1 whitespace-nowrap text-neutral-600">{formatDateTR(h.tarih)}</td>
                    <td className="p-1 font-mono text-[10px]">{h.belgeNo}</td>
                    <td className="p-1">{tipEtiket(h.tip)}</td>
                    <td className="p-1 text-right tabular-nums">{formatCurrencyTR(signed)}</td>
                    <td className="p-1 text-neutral-600">{h.onayDurumu}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>
      ) : null}

      <section className="mb-4">
        <h3 className="mb-2 border-b border-neutral-300 pb-1 text-xs font-bold uppercase text-neutral-800">Vekalet</h3>
        {line('Anlaşılan', formatCurrencyTR(Number(vekalet.ozet.anlasilan)))}
        {line('Ödenen toplam', formatCurrencyTR(Number(vekalet.ozet.odenenToplam)))}
        {line('Kalan vekalet', formatCurrencyTR(Number(vekalet.ozet.kalanVekalet)))}
        {vekalet.ucret?.aciklama?.trim() ? line('Açıklama', vekalet.ucret.aciklama) : null}
      </section>

      <section className="mb-4">
        <h3 className="mb-2 border-b border-neutral-300 pb-1 text-xs font-bold uppercase text-neutral-800">Taksitler</h3>
        <table className="w-full border-collapse text-[11px]">
          <thead>
            <tr className="border-b border-neutral-800 bg-neutral-100">
              <th className="p-1 text-left font-bold">No</th>
              <th className="p-1 text-left font-bold">Vade</th>
              <th className="p-1 text-right font-bold">Tutar</th>
              <th className="p-1 text-left font-bold">Durum</th>
              <th className="p-1 text-left font-bold">Makbuz</th>
            </tr>
          </thead>
          <tbody>
            {taksitler.map((t) => (
              <tr key={t.id} className="border-b border-neutral-200">
                <td className="p-1">{t.taksitNo}</td>
                <td className="p-1 whitespace-nowrap">{formatDateTR(t.vadeTarihi)}</td>
                <td className="p-1 text-right tabular-nums">{formatCurrencyTR(Number(t.tutar))}</td>
                <td className="p-1">{t.odemeDurumu}</td>
                <td className="p-1 font-mono text-[10px]">{t.makbuzNo ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section className="mb-4">
        <h3 className="mb-2 border-b border-neutral-300 pb-1 text-xs font-bold uppercase text-neutral-800">SMM bekleyen tahsilatlar</h3>
        {smmBekleyenler.length === 0 ? (
          <p className="text-[12px] text-neutral-600">Kayıt yok.</p>
        ) : (
          <ul className="list-inside list-disc text-[12px]">
            {smmBekleyenler.map((t) => (
              <li key={t.id}>
                Taksit {t.taksitNo} — {formatCurrencyTR(Number(t.tutar))} — ödeme {formatDateTR(t.odemeTarihi ?? undefined)} — makbuz{' '}
                {t.makbuzNo ?? '—'}
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-4 border-t border-neutral-300 pt-2 text-[11px] text-neutral-600">
        Yazdırma tarihi: {formatDateTR(footerTarih)}
      </div>
    </div>
  )
}
