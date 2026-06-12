import type { ReactElement } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { APP_BASE } from '../config/appPaths'
import { dosyalarByMuvekkil, gorunenAd, muvekkilById } from '../data/mockFlow'
import { Badge, Button, Card, CardBody, CardHeader, CardTitle, Table, TBody, TD, TH, THead, TR } from '../components/ui'

export function MuvekkilDetailPage(): ReactElement {
  const { id } = useParams<{ id: string }>()
  const m = id ? muvekkilById(id) : undefined

  if (!id || !m) {
    return <Navigate to={APP_BASE} replace />
  }

  const dosyalar = dosyalarByMuvekkil(id)

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link to={APP_BASE} className="font-semibold text-primary hover:underline">
          ← Ana Sayfa
        </Link>
        <span className="text-ink-subtle">/</span>
        <span className="font-medium text-ink">Müvekkil</span>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 border-b border-border sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg md:text-xl">{gorunenAd(m)}</CardTitle>
              <Badge variant={m.tur === 'TUZEL_KISI' ? 'accent' : 'primary'}>{m.tur === 'TUZEL_KISI' ? 'Tüzel kişi' : 'Gerçek kişi'}</Badge>
            </div>
            <dl className="grid gap-1 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-bold uppercase text-ink-muted">Telefon</dt>
                <dd className="text-ink">{m.telefon ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-bold uppercase text-ink-muted">E-posta</dt>
                <dd className="text-ink">{m.eposta ?? '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-[11px] font-bold uppercase text-ink-muted">Not</dt>
                <dd className="text-ink-muted">{m.not?.trim() ? m.not : '—'}</dd>
              </div>
            </dl>
          </div>
          <Button type="button" variant="outline" onClick={() => window.alert('Mock: Yeni dosya sihirbazı API ile açılacak.')}>
            Yeni Dosya
          </Button>
        </CardHeader>
        <CardBody className="p-0">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-sm font-bold text-ink">Dosyalar</h2>
            <p className="text-xs text-ink-muted">Dosya satırından kasa, vekalet, SMM ve makbuz işlemlerine geçilir.</p>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <THead>
                <TR>
                  <TH>Konu başlığı</TH>
                  <TH>Mahkeme / icra</TH>
                  <TH>Dosya no</TH>
                  <TH>Durum</TH>
                  <TH>İşlem</TH>
                </TR>
              </THead>
              <TBody>
                {dosyalar.map((d) => (
                  <TR key={d.id}>
                    <TD className="max-w-[220px] font-medium text-ink">{d.konuBasligi}</TD>
                    <TD className="text-ink-muted">{d.mahkemeAdi}</TD>
                    <TD className="tabular-nums text-ink-muted">{d.dosyaNumarasi}</TD>
                    <TD>
                      <Badge variant={d.durum === 'Açık' ? 'success' : 'default'}>{d.durum}</Badge>
                    </TD>
                    <TD>
                      <Link
                        to={`${APP_BASE}/muvekkil/${id}/dosya/${d.id}`}
                        className="text-sm font-semibold text-primary hover:underline"
                      >
                        Aç
                      </Link>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
          {dosyalar.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-ink-muted">Bu müvekkile bağlı dosya yok (mock).</p>
          ) : null}
        </CardBody>
      </Card>
    </div>
  )
}
