import type { ReactElement } from 'react'
import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { APP_BASE } from '../config/appPaths'
import {
  dosyaByIds,
  gorunenAd,
  islemTipiLabel,
  kasaByDosya,
  masraflarByDosya,
  muvekkilById,
  onayDurumuLabel,
  smmBekleyenForDosya,
  taksitlerByDosya
} from '../data/mockFlow'
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, EmptyState, Table, TBody, TD, TH, THead, TR } from '../components/ui'
import { cn } from '../lib/cn'
import { formatCurrencyTR, formatDateTR } from '../utils/formatters'

type TabKey = 'kasa' | 'masraf' | 'vekalet' | 'smm' | 'makbuz' | 'hesap'

const TABS: { key: TabKey; label: string }[] = [
  { key: 'kasa', label: 'Kasa Hareketleri' },
  { key: 'masraf', label: 'Masraflar' },
  { key: 'vekalet', label: 'Vekalet / Taksitler' },
  { key: 'smm', label: 'SMM Takibi' },
  { key: 'makbuz', label: 'Makbuzlar' },
  { key: 'hesap', label: 'Hesap Özeti' }
]

export function DosyaDetailPage(): ReactElement {
  const { id, dosyaId } = useParams<{ id: string; dosyaId: string }>()
  const [tab, setTab] = useState<TabKey>('kasa')

  const m = id ? muvekkilById(id) : undefined
  const d = id && dosyaId ? dosyaByIds(id, dosyaId) : undefined

  if (!id || !dosyaId || !m || !d) {
    return <Navigate to={APP_BASE} replace />
  }

  const kasa = useMemo(() => [...kasaByDosya(dosyaId)].sort((a, b) => b.tarih.localeCompare(a.tarih)), [dosyaId])
  const masraflar = masraflarByDosya(dosyaId)
  const taksitler = taksitlerByDosya(dosyaId)
  const smmBekleyen = smmBekleyenForDosya(dosyaId)

  const hesap = useMemo(() => {
    let avans = 0
    let masraf = 0
    let duzeltme = 0
    for (const k of kasa) {
      if (k.islemTipi === 'AVANS_GIRISI') avans += k.tutar
      else if (k.islemTipi === 'MASRAF') masraf += k.tutar
      else duzeltme += k.tutar
    }
    const vekaletToplam = taksitler.reduce((s, t) => s + t.tutar, 0)
    const vekaletOdenen = taksitler.filter((t) => t.odendiMi).reduce((s, t) => s + t.tutar, 0)
    return { avans, masraf, duzeltme, vekaletToplam, vekaletOdenen }
  }, [kasa, taksitler])

  const kasaOzeti = hesap.avans - hesap.masraf + hesap.duzeltme

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link to={APP_BASE} className="font-semibold text-primary hover:underline">
          Ana Sayfa
        </Link>
        <span className="text-ink-subtle">/</span>
        <Link to={`${APP_BASE}/muvekkil/${id}`} className="font-semibold text-primary hover:underline">
          {gorunenAd(m)}
        </Link>
        <span className="text-ink-subtle">/</span>
        <span className="font-medium text-ink">Dosya</span>
      </div>

      <Card>
        <CardHeader className="border-b border-border">
          <div className="flex flex-col gap-1">
            <CardTitle className="text-lg md:text-xl">{d.konuBasligi}</CardTitle>
            <p className="text-sm text-ink-muted">
              {d.mahkemeAdi} · <span className="tabular-nums">Dosya no: {d.dosyaNumarasi}</span> ·{' '}
              <Badge variant={d.durum === 'Açık' ? 'success' : 'default'}>{d.durum}</Badge>
            </p>
          </div>
        </CardHeader>
        <CardBody className="space-y-4 p-4">
          <div className="flex flex-wrap gap-1 border-b border-border pb-1">
            {TABS.map((t) => (
              <Button
                key={t.key}
                type="button"
                size="sm"
                variant={tab === t.key ? 'secondary' : 'ghost'}
                className={cn(tab === t.key && 'ring-2 ring-primary/25')}
                onClick={() => setTab(t.key)}
              >
                {t.label}
              </Button>
            ))}
          </div>

          {tab === 'kasa' ? (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH>Tarih</TH>
                    <TH>İşlem</TH>
                    <TH>Belge</TH>
                    <TH>Onay</TH>
                    <TH className="text-right">Tutar</TH>
                    <TH>Açıklama</TH>
                  </TR>
                </THead>
                <TBody>
                  {kasa.map((k) => (
                    <TR key={k.id}>
                      <TD className="whitespace-nowrap text-ink-muted">{formatDateTR(k.tarih)}</TD>
                      <TD>{islemTipiLabel(k.islemTipi)}</TD>
                      <TD className="tabular-nums text-sm text-ink-muted">{k.belgeNo ?? '—'}</TD>
                      <TD>
                        <Badge variant={k.onayDurumu === 'ONAYLI' ? 'success' : 'warning'}>{onayDurumuLabel(k.onayDurumu)}</Badge>
                      </TD>
                      <TD className="text-right font-medium tabular-nums">{formatCurrencyTR(k.tutar)}</TD>
                      <TD className="max-w-[200px] text-sm text-ink-muted">{k.aciklama ?? k.masrafTuru ?? '—'}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
          ) : null}

          {tab === 'masraf' ? (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH>Tarih</TH>
                    <TH>Masraf türü</TH>
                    <TH>Belge</TH>
                    <TH>Onay</TH>
                    <TH className="text-right">Tutar</TH>
                  </TR>
                </THead>
                <TBody>
                  {masraflar.map((k) => (
                    <TR key={k.id}>
                      <TD>{formatDateTR(k.tarih)}</TD>
                      <TD>{k.masrafTuru ?? '—'}</TD>
                      <TD className="tabular-nums text-sm">{k.belgeNo ?? '—'}</TD>
                      <TD>
                        <Badge variant={k.onayDurumu === 'ONAYLI' ? 'success' : 'warning'}>{onayDurumuLabel(k.onayDurumu)}</Badge>
                      </TD>
                      <TD className="text-right font-medium tabular-nums">{formatCurrencyTR(k.tutar)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
              {masraflar.length === 0 ? <p className="py-4 text-center text-sm text-ink-muted">Masraf kaydı yok.</p> : null}
            </div>
          ) : null}

          {tab === 'vekalet' ? (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH>Taksit</TH>
                    <TH>Vade</TH>
                    <TH>Ödendi</TH>
                    <TH>SMM</TH>
                    <TH className="text-right">Tutar</TH>
                  </TR>
                </THead>
                <TBody>
                  {taksitler.map((t) => (
                    <TR key={t.id}>
                      <TD>{t.taksitNo}</TD>
                      <TD>{formatDateTR(t.vadeTarihi)}</TD>
                      <TD>{t.odendiMi ? 'Evet' : 'Hayır'}</TD>
                      <TD>{t.smmKesildiMi ? 'Kesildi' : t.odendiMi ? 'Bekliyor' : '—'}</TD>
                      <TD className="text-right font-medium tabular-nums">{formatCurrencyTR(t.tutar)}</TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
              {taksitler.length === 0 ? <p className="py-4 text-center text-sm text-ink-muted">Taksit planı yok.</p> : null}
            </div>
          ) : null}

          {tab === 'smm' ? (
            <div className="space-y-3">
              <p className="text-sm text-ink-muted">
                SMM ana menüde değil; ödenmiş ve SMM kesilmemiş taksitler burada listelenir. Ana sayfada yalnızca özet uyarı gösterilir.
              </p>
              {smmBekleyen.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <THead>
                      <TR>
                        <TH>Taksit</TH>
                        <TH className="text-right">Tutar</TH>
                        <TH>Vade</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {smmBekleyen.map((t) => (
                        <TR key={t.id}>
                          <TD>{t.taksitNo}</TD>
                          <TD className="text-right font-medium tabular-nums">{formatCurrencyTR(t.tutar)}</TD>
                          <TD>{formatDateTR(t.vadeTarihi)}</TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </div>
              ) : (
                <EmptyState title="SMM bekleyen yok" description="Bu dosyada ödenmiş fakat SMM kesilmemiş taksit bulunmuyor (mock)." />
              )}
            </div>
          ) : null}

          {tab === 'makbuz' ? (
            <EmptyState
              title="Makbuzlar (mock)"
              description="Tahsilat makbuzu PDF listesi API ile dosya detayına bağlanacak. Şimdilik boş."
            />
          ) : null}

          {tab === 'hesap' ? (
            <dl className="grid max-w-lg gap-3 text-sm">
              <div className="flex justify-between gap-4 border-b border-border py-2">
                <dt className="text-ink-muted">Dosya kasası (avans − masraf ± düzeltme)</dt>
                <dd className="font-bold tabular-nums text-ink">{formatCurrencyTR(kasaOzeti)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border py-2">
                <dt className="text-ink-muted">Vekalet taksitleri (toplam)</dt>
                <dd className="font-semibold tabular-nums">{formatCurrencyTR(hesap.vekaletToplam)}</dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border py-2">
                <dt className="text-ink-muted">Ödenen taksit</dt>
                <dd className="font-semibold tabular-nums text-success-ink">{formatCurrencyTR(hesap.vekaletOdenen)}</dd>
              </div>
              <p className="text-xs text-ink-subtle">
                Mock özet; masaüstü ile birebir hesap kuralları API katmanında uygulanacaktır.
              </p>
            </dl>
          ) : null}
        </CardBody>
      </Card>
    </div>
  )
}
