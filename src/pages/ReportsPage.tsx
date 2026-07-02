import { useMutation, useQuery } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useMemo, useState } from 'react'
import { fetchIcraTahsilatReport, fetchOfisKasaReport } from '../api/reports'
import { listPrimPersoneller } from '../api/primPersonel'
import { IcraTahsilatReportSheet } from '../components/reports/IcraTahsilatReportSheet'
import { OfisKasaReportSheet } from '../components/reports/OfisKasaReportSheet'
import { ReportPrintShell } from '../components/reports/ReportPrintShell'
import { AlertBox, Button, Card, CardBody, CardHeader, CardTitle, Input, PageHeader } from '../components/ui'
import { cn } from '../lib/cn'
import type { IcraTahsilatReportResponse, OfisKasaReportResponse } from '../types/reports'
import {
  OFIS_KASA_GELIR_KATEGORILERI,
  OFIS_KASA_GIDER_KATEGORILERI
} from '../types/ofisKasasi'

type ReportKind = 'ofis-kasa' | 'icra-tahsilat' | null

function todayInputDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function monthStartInputDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

function dateInputToIso(dateStr: string): string {
  return `${dateStr}T12:00:00.000Z`
}

function ReportCard(props: {
  title: string
  description: string
  active: boolean
  disabled?: boolean
  onClick: () => void
}): ReactElement {
  const { title, description, active, disabled, onClick } = props
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'rounded-lg border px-3 py-2.5 text-left transition',
        disabled && 'cursor-not-allowed opacity-55',
        !disabled && 'hover:border-primary/40 hover:bg-primary-soft/15',
        active ? 'border-primary/50 bg-primary-soft/20 ring-1 ring-primary/25' : 'border-border bg-panel'
      )}
    >
      <p className="text-sm font-bold text-ink">{title}</p>
      <p className="mt-0.5 text-xs text-ink-muted">{description}</p>
    </button>
  )
}

export function ReportsPage(): ReactElement {
  const [active, setActive] = useState<ReportKind>(null)
  const [ofisPreview, setOfisPreview] = useState<OfisKasaReportResponse | null>(null)
  const [icraPreview, setIcraPreview] = useState<IcraTahsilatReportResponse | null>(null)

  const [ofisBas, setOfisBas] = useState(monthStartInputDate())
  const [ofisBit, setOfisBit] = useState(todayInputDate())
  const [ofisTip, setOfisTip] = useState('')
  const [ofisKategori, setOfisKategori] = useState('')
  const [ofisOnay, setOfisOnay] = useState('')
  const [ofisQ, setOfisQ] = useState('')

  const [icraBas, setIcraBas] = useState(monthStartInputDate())
  const [icraBit, setIcraBit] = useState(todayInputDate())
  const [icraTur, setIcraTur] = useState('')
  const [icraDurum, setIcraDurum] = useState('')
  const [icraPersonel, setIcraPersonel] = useState('')
  const [icraQ, setIcraQ] = useState('')

  const kategoriOpts = useMemo(
    () => [...new Set([...OFIS_KASA_GELIR_KATEGORILERI, ...OFIS_KASA_GIDER_KATEGORILERI])],
    []
  )

  const personelQuery = useQuery({
    queryKey: ['prim-personel-aktif'],
    queryFn: () => listPrimPersoneller({ aktifMi: true }),
    staleTime: 60_000
  })

  const ofisMu = useMutation({
    mutationFn: () =>
      fetchOfisKasaReport({
        startDate: dateInputToIso(ofisBas),
        endDate: dateInputToIso(ofisBit),
        islemTipi: ofisTip || undefined,
        kategori: ofisKategori || undefined,
        onayDurumu: ofisOnay || undefined,
        q: ofisQ.trim() || undefined
      }),
    onSuccess: (data) => setOfisPreview(data)
  })

  const icraMu = useMutation({
    mutationFn: () =>
      fetchIcraTahsilatReport({
        startDate: dateInputToIso(icraBas),
        endDate: dateInputToIso(icraBit),
        alacakTuru: icraTur || undefined,
        durum: icraDurum || undefined,
        tahsilatiYapanPersonelId: icraPersonel || undefined,
        q: icraQ.trim() || undefined
      }),
    onSuccess: (data) => setIcraPreview(data)
  })

  return (
    <div className="w-full space-y-4">
      <div className="no-print space-y-4">
      <PageHeader
        title="Raporlar"
        description="Büro işlemleriniz için kasa, icra tahsilat ve dosya raporlarını görüntüleyin."
      />

      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
        <ReportCard
          title="Ofis Kasa Raporu"
          description="Gelir, gider ve düzeltmeler — tarih aralığına göre."
          active={active === 'ofis-kasa'}
          onClick={() => {
            setActive('ofis-kasa')
            setIcraPreview(null)
          }}
        />
        <ReportCard
          title="İcra Tahsilat Raporu"
          description="Alacaklar, tahsilatlar ve özet metrikler."
          active={active === 'icra-tahsilat'}
          onClick={() => {
            setActive('icra-tahsilat')
            setOfisPreview(null)
          }}
        />
        <ReportCard
          title="Dosya Hesap Özeti"
          description="Dosya detayı → Kasa sekmesinden alınır."
          active={false}
          disabled
          onClick={() => undefined}
        />
        <ReportCard
          title="Makbuzlar"
          description="Sonraki fazda rapor merkezine eklenecek."
          active={false}
          disabled
          onClick={() => undefined}
        />
      </div>

      {active === 'ofis-kasa' ? (
        <Card>
          <CardHeader className="border-b border-border py-3">
            <CardTitle className="text-base">Ofis Kasa Raporu — filtreler</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3 px-3 py-3 sm:px-4">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Input label="Başlangıç" type="date" value={ofisBas} onChange={(e) => setOfisBas(e.target.value)} />
              <Input label="Bitiş" type="date" value={ofisBit} onChange={(e) => setOfisBit(e.target.value)} />
              <label className="block text-xs">
                <span className="mb-1 block font-semibold text-ink-muted">İşlem tipi</span>
                <select
                  className="desk-input w-full rounded-md border border-border bg-panel px-2 py-1.5 text-sm"
                  value={ofisTip}
                  onChange={(e) => setOfisTip(e.target.value)}
                >
                  <option value="">Tümü</option>
                  <option value="GELIR">Gelir</option>
                  <option value="GIDER">Gider</option>
                  <option value="DUZELTME">Düzeltme</option>
                </select>
              </label>
              <label className="block text-xs">
                <span className="mb-1 block font-semibold text-ink-muted">Onay durumu</span>
                <select
                  className="desk-input w-full rounded-md border border-border bg-panel px-2 py-1.5 text-sm"
                  value={ofisOnay}
                  onChange={(e) => setOfisOnay(e.target.value)}
                >
                  <option value="">Tümü</option>
                  <option value="ONAYLI">Onaylı</option>
                  <option value="ONAYSIZ">Onaysız</option>
                  <option value="REDDEDILDI">Reddedildi</option>
                </select>
              </label>
              <label className="block text-xs sm:col-span-2">
                <span className="mb-1 block font-semibold text-ink-muted">Kategori</span>
                <select
                  className="desk-input w-full rounded-md border border-border bg-panel px-2 py-1.5 text-sm"
                  value={ofisKategori}
                  onChange={(e) => setOfisKategori(e.target.value)}
                >
                  <option value="">Tümü</option>
                  {kategoriOpts.map((k) => (
                    <option key={k} value={k}>
                      {k}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                className="sm:col-span-2"
                label="Arama"
                value={ofisQ}
                onChange={(e) => setOfisQ(e.target.value)}
                placeholder="Belge no, açıklama, kategori…"
              />
            </div>
            {ofisMu.error ? (
              <AlertBox variant="danger" title="Rapor">
                {ofisMu.error instanceof Error ? ofisMu.error.message : 'Rapor alınamadı.'}
              </AlertBox>
            ) : null}
            <Button type="button" disabled={ofisMu.isPending} onClick={() => ofisMu.mutate()}>
              {ofisMu.isPending ? 'Hazırlanıyor…' : 'Raporu hazırla'}
            </Button>
          </CardBody>
        </Card>
      ) : null}

      {active === 'icra-tahsilat' ? (
        <Card>
          <CardHeader className="border-b border-border py-3">
            <CardTitle className="text-base">İcra Tahsilat Raporu — filtreler</CardTitle>
          </CardHeader>
          <CardBody className="space-y-3 px-3 py-3 sm:px-4">
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              <Input label="Başlangıç" type="date" value={icraBas} onChange={(e) => setIcraBas(e.target.value)} />
              <Input label="Bitiş" type="date" value={icraBit} onChange={(e) => setIcraBit(e.target.value)} />
              <label className="block text-xs">
                <span className="mb-1 block font-semibold text-ink-muted">Alacak türü</span>
                <select
                  className="desk-input w-full rounded-md border border-border bg-panel px-2 py-1.5 text-sm"
                  value={icraTur}
                  onChange={(e) => setIcraTur(e.target.value)}
                >
                  <option value="">Tümü</option>
                  <option value="KARSI_TARAF_VEKALET">Karşı taraf vekalet</option>
                  <option value="ICRA_VEKALET">İcra vekalet</option>
                </select>
              </label>
              <label className="block text-xs">
                <span className="mb-1 block font-semibold text-ink-muted">Durum</span>
                <select
                  className="desk-input w-full rounded-md border border-border bg-panel px-2 py-1.5 text-sm"
                  value={icraDurum}
                  onChange={(e) => setIcraDurum(e.target.value)}
                >
                  <option value="">Tümü</option>
                  <option value="ACIK">Açık</option>
                  <option value="KISMI_ODENDI">Kısmi ödendi</option>
                  <option value="ODENDI">Ödendi</option>
                  <option value="GECIKTI">Gecikti</option>
                </select>
              </label>
              <label className="block text-xs sm:col-span-2">
                <span className="mb-1 block font-semibold text-ink-muted">Tahsilatı yapan personel</span>
                <select
                  className="desk-input w-full rounded-md border border-border bg-panel px-2 py-1.5 text-sm"
                  value={icraPersonel}
                  onChange={(e) => setIcraPersonel(e.target.value)}
                >
                  <option value="">Tümü</option>
                  {(personelQuery.data?.items ?? []).map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.adSoyad}
                    </option>
                  ))}
                </select>
              </label>
              <Input
                className="sm:col-span-2"
                label="Arama"
                value={icraQ}
                onChange={(e) => setIcraQ(e.target.value)}
                placeholder="Borçlu, müvekkil, dosya…"
              />
            </div>
            {icraMu.error ? (
              <AlertBox variant="danger" title="Rapor">
                {icraMu.error instanceof Error ? icraMu.error.message : 'Rapor alınamadı.'}
              </AlertBox>
            ) : null}
            <Button type="button" disabled={icraMu.isPending} onClick={() => icraMu.mutate()}>
              {icraMu.isPending ? 'Hazırlanıyor…' : 'Raporu hazırla'}
            </Button>
          </CardBody>
        </Card>
      ) : null}
      </div>

      {ofisPreview ? (
        <ReportPrintShell
          title="Ofis Kasa Raporu"
          printRootId="ofis-kasa-report-print"
          onClose={() => setOfisPreview(null)}
        >
          <OfisKasaReportSheet data={ofisPreview} />
        </ReportPrintShell>
      ) : null}

      {icraPreview ? (
        <ReportPrintShell
          title="İcra Tahsilat Raporu"
          printRootId="icra-tahsilat-report-print"
          onClose={() => setIcraPreview(null)}
        >
          <IcraTahsilatReportSheet data={icraPreview} />
        </ReportPrintShell>
      ) : null}
    </div>
  )
}
