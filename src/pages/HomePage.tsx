import { useQuery } from '@tanstack/react-query'
import type { FormEvent, ReactElement } from 'react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { apiFetch } from '../api/client'
import { APP_BASE } from '../config/appPaths'
import {
  MOCK_MUVEKKILLER,
  MOCK_SUMMARY,
  SON_BAKILAN_MUVEKKIL_IDS,
  filterMuvekkiller,
  gorunenAd,
  muvekkilById
} from '../data/mockFlow'
import { AlertBox, Button, Card, CardBody, CardHeader, CardTitle, Input, StatCard, Table, TBody, TD, TH, THead, TR } from '../components/ui'
import { formatCurrencyTR } from '../utils/formatters'

type HealthResponse = { ok: boolean; db?: string }

export function HomePage(): ReactElement {
  const navigate = useNavigate()
  const [q, setQ] = useState('')

  const health = useQuery({
    queryKey: ['health'],
    queryFn: () => apiFetch<HealthResponse>('/health')
  })

  const rows = useMemo(() => filterMuvekkiller(q), [q])

  function onSearch(e: FormEvent): void {
    e.preventDefault()
  }

  const sonBakilan = SON_BAKILAN_MUVEKKIL_IDS.map((id) => muvekkilById(id)).filter(Boolean)

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-ink md:text-2xl">Ana Sayfa</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Programın giriş kapısı: müvekkil arayın veya listeden seçin. Dosya kasası ve taksit işlemleri dosya detayındadır.
        </p>
      </div>

      {health.isError || health.data?.ok === false ? (
        <AlertBox variant="warning" title="API / sağlık">
          Sunucu yanıt vermiyor veya sağlık kontrolü başarısız. Aşağıdaki liste mock veridir.
        </AlertBox>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Vadesi geçmiş taksit" value={String(MOCK_SUMMARY.vadesiGecmisTaksit)} sub="Dosya taksitleri" />
        <StatCard label="SMM bekleyen" value={String(MOCK_SUMMARY.smmBekleyenTahsilat)} sub="Ödenmiş, SMM kesilmemiş" />
        <StatCard label="Onay bekleyen" value={String(MOCK_SUMMARY.onayBekleyenIslem)} sub="Header’dan da açılır" />
        <StatCard label="Ofis kasa bakiyesi" value={formatCurrencyTR(MOCK_SUMMARY.ofisKasaBakiye)} sub="Özet" />
      </div>

      <div className="flex flex-wrap gap-2 rounded-lg border border-warning/30 bg-warning-soft/40 px-3 py-2.5 text-sm text-warning-ink">
        <span className="font-semibold">Uyarılar (mock):</span>
        <span>
          {MOCK_SUMMARY.vadesiGecmisTaksit > 0 ? `${MOCK_SUMMARY.vadesiGecmisTaksit} vadesi geçmiş taksit. ` : ''}
          {MOCK_SUMMARY.smmBekleyenTahsilat > 0 ? 'SMM bekleyen tahsilat var. ' : ''}
          {MOCK_SUMMARY.onayBekleyenIslem > 0 ? 'Onay bekleyen kasa / düzenleme kaydı var.' : ''}
        </span>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 border-b border-border sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle>Müvekkiller</CardTitle>
            <p className="mt-1 text-xs text-ink-muted">Kayıtlı {MOCK_MUVEKKILLER.length} müvekkil (mock). Satıra tıklayınca detaya gider.</p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
            <form onSubmit={onSearch} className="flex min-w-0 flex-1 gap-2 sm:max-w-md">
              <Input
                placeholder="Ad, şirket, telefon veya e-posta ara…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="min-w-0 flex-1"
                aria-label="Müvekkil ara"
              />
              <Button type="submit" variant="secondary">
                Ara
              </Button>
            </form>
            <Button
              type="button"
              variant="outline"
              onClick={() => window.alert('Mock: Yeni müvekkil formu API ile açılacak.')}
            >
              Yeni Müvekkil
            </Button>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Görünen ad</TH>
                  <TH>Tür</TH>
                  <TH>Telefon</TH>
                  <TH>E-posta</TH>
                </TR>
              </THead>
              <TBody>
                {rows.map((m) => (
                  <TR
                    key={m.id}
                    className="cursor-pointer hover:bg-surface-muted/80"
                    onClick={() => navigate(`${APP_BASE}/muvekkil/${m.id}`)}
                  >
                    <TD className="font-medium text-ink">{gorunenAd(m)}</TD>
                    <TD>{m.tur === 'TUZEL_KISI' ? 'Tüzel' : 'Gerçek'}</TD>
                    <TD className="text-ink-muted">{m.telefon ?? '—'}</TD>
                    <TD className="text-ink-muted">{m.eposta ?? '—'}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
          {rows.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-muted">Sonuç yok. Arama terimini değiştirin.</p>
          ) : null}
        </CardBody>
      </Card>

      {sonBakilan.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Son bakılan müvekkiller</CardTitle>
            <p className="mt-1 text-xs text-ink-muted">Mock sıra — oturum hafızası API ile gelecek.</p>
          </CardHeader>
          <CardBody className="flex flex-wrap gap-2">
            {sonBakilan.map((m) => (
              <Link
                key={m!.id}
                to={`${APP_BASE}/muvekkil/${m!.id}`}
                className="rounded-lg border border-border bg-panel px-3 py-2 text-sm font-semibold text-primary shadow-sm hover:bg-primary-soft"
              >
                {gorunenAd(m!)}
              </Link>
            ))}
          </CardBody>
        </Card>
      ) : null}

      {health.isSuccess && health.data?.ok ? (
        <p className="text-center text-[11px] text-ink-subtle">
          API bağlı{health.data.db ? ` (${health.data.db})` : ''}.
        </p>
      ) : null}
    </div>
  )
}
