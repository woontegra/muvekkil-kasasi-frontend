import { useQuery } from '@tanstack/react-query'
import type { FormEvent, ReactElement, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { listMuvekkilDosyalari } from '../api/dosyalar'
import { getMuvekkil } from '../api/muvekkiller'
import { ApiError } from '../api/client'
import { APP_BASE, HOME_PAGE_LABEL } from '../config/appPaths'
import { dosyaDurumuBadgeVariant, dosyaDurumuLabel, dosyaTuruLabel, mahkemeIcraSatir } from '../lib/dosyaLabels'
import { cn } from '../lib/cn'
import { AlertBox, Badge, Button, Card, CardBody, CardHeader, CardTitle, Input, Table, TBody, TD, TH, THead, TR } from '../components/ui'

function ProfileStatCard({ label, value, className }: { label: string; value: ReactNode; className?: string }): ReactElement {
  return (
    <div
      className={cn(
        'rounded-lg border border-border bg-panel p-3.5 shadow-sm ring-1 ring-ink/[0.04] dark:ring-white/[0.06]',
        className
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
      <div className="mt-1.5 min-h-[1.25rem] break-words text-sm font-semibold leading-snug text-ink">{value}</div>
    </div>
  )
}

export function MuvekkilDetailPage(): ReactElement {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(q.trim()), 350)
    return () => window.clearTimeout(t)
  }, [q])

  const muvekkilQuery = useQuery({
    queryKey: ['muvekkil', id],
    queryFn: () => getMuvekkil(id!),
    enabled: Boolean(id)
  })

  const dosyaQuery = useQuery({
    queryKey: ['muvekkil-dosyalar', id, debouncedQ],
    queryFn: () => listMuvekkilDosyalari(id!, { q: debouncedQ || undefined, page: 1, limit: 100 }),
    enabled: Boolean(id) && muvekkilQuery.isSuccess
  })

  if (!id) {
    return <Navigate to={APP_BASE} replace />
  }

  if (muvekkilQuery.isLoading) {
    return (
      <div className="w-full space-y-5">
        <p className="text-sm text-ink-muted">Yükleniyor…</p>
      </div>
    )
  }

  if (muvekkilQuery.isError) {
    const err = muvekkilQuery.error
    if (err instanceof ApiError && err.status === 404) {
      return <Navigate to={APP_BASE} replace />
    }
    return (
      <div className="w-full space-y-5">
        <AlertBox variant="danger" title="Müvekkil">
          {err instanceof Error ? err.message : 'Yüklenemedi.'}
        </AlertBox>
        <Link to={APP_BASE} className="text-sm font-semibold text-primary hover:underline">
          ← {HOME_PAGE_LABEL}
        </Link>
      </div>
    )
  }

  if (!muvekkilQuery.data) {
    return (
      <div className="w-full space-y-5">
        <p className="text-sm text-ink-muted">Veri bekleniyor…</p>
      </div>
    )
  }

  const m = muvekkilQuery.data
  const tuzelKutu =
    m.tur === 'TUZEL' &&
    (m.yetkiliAdSoyad.trim() ||
      m.yetkiliTelefon.trim() ||
      m.mudurAdSoyad.trim() ||
      m.mudurTelefon.trim() ||
      m.muhasebeAdSoyad.trim() ||
      m.muhasebeTelefon.trim())

  function onSearch(e: FormEvent): void {
    e.preventDefault()
  }

  const dosyalar = dosyaQuery.data?.items ?? []
  const dosyaToplam = dosyaQuery.isSuccess ? dosyaQuery.data.total : dosyaQuery.isLoading ? null : dosyalar.length

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link to={APP_BASE} className="font-semibold text-primary hover:underline">
          ← {HOME_PAGE_LABEL}
        </Link>
        <span className="text-ink-subtle">/</span>
        <span className="font-medium text-ink">Müvekkil</span>
      </div>

      <Card className="overflow-hidden shadow-card">
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-3 border-b border-border bg-gradient-to-br from-surface-muted/80 via-panel to-panel px-4 py-3.5">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg font-bold tracking-tight text-ink md:text-xl lg:text-2xl">{m.gorunenAd}</CardTitle>
              <Badge variant={m.tur === 'TUZEL' ? 'accent' : 'primary'} className="!normal-case">
                {m.tur === 'TUZEL' ? 'Tüzel kişi' : 'Gerçek kişi'}
              </Badge>
            </div>
            {m.tur === 'TUZEL' && m.sirketUnvani?.trim() ? (
              <p className="text-sm font-medium text-ink-muted">{m.sirketUnvani.trim()}</p>
            ) : null}
            {m.tur === 'GERCEK' && m.adSoyad.trim() && m.adSoyad.trim() !== m.gorunenAd.trim() ? (
              <p className="text-sm text-ink-muted">
                <span className="font-semibold text-ink-muted">Ad soyad:</span> {m.adSoyad.trim()}
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            className="shrink-0 shadow-sm"
            onClick={() => navigate(`${APP_BASE}/muvekkil/${id}/dosyalar/yeni`)}
          >
            Yeni Dosya
          </Button>
        </CardHeader>
        <CardBody className="space-y-4 pt-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <ProfileStatCard label="Telefon" value={m.telefon?.trim() || '—'} />
            <ProfileStatCard label="E-posta" value={m.eposta?.trim() || '—'} />
            <ProfileStatCard
              label="Toplam dosya"
              value={
                dosyaQuery.isLoading ? (
                  <span className="text-ink-muted">…</span>
                ) : dosyaQuery.isError ? (
                  '—'
                ) : (
                  String(dosyaToplam ?? 0)
                )
              }
            />
            <ProfileStatCard
              label="Not"
              className="sm:col-span-2 lg:col-span-3"
              value={
                m.not?.trim() ? (
                  <span className="whitespace-pre-wrap break-words font-medium text-ink">{m.not.trim()}</span>
                ) : (
                  <span className="font-medium text-ink-muted">Not girilmemiş</span>
                )
              }
            />
          </div>

          {tuzelKutu ? (
            <div className="border-t border-border pt-4">
              <h3 className="mb-3 text-[11px] font-bold uppercase tracking-wide text-ink-muted">Tüzel iletişim kişileri</h3>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <ProfileStatCard
                  label="Yetkili"
                  value={
                    <div className="space-y-0.5">
                      <div>{m.yetkiliAdSoyad.trim() || '—'}</div>
                      <div className="text-xs font-medium text-ink-muted">{m.yetkiliTelefon.trim() || '—'}</div>
                    </div>
                  }
                />
                <ProfileStatCard
                  label="Müdür"
                  value={
                    <div className="space-y-0.5">
                      <div>{m.mudurAdSoyad.trim() || '—'}</div>
                      <div className="text-xs font-medium text-ink-muted">{m.mudurTelefon.trim() || '—'}</div>
                    </div>
                  }
                />
                <ProfileStatCard
                  label="Muhasebe"
                  value={
                    <div className="space-y-0.5">
                      <div>{m.muhasebeAdSoyad.trim() || '—'}</div>
                      <div className="text-xs font-medium text-ink-muted">{m.muhasebeTelefon.trim() || '—'}</div>
                    </div>
                  }
                />
              </div>
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="flex flex-col gap-3 border-b border-border px-4 py-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <CardTitle className="text-base">Dosyalar</CardTitle>
            <p className="mt-1 text-xs text-ink-muted">
              Dosya satırından kasa, vekalet, SMM ve makbuz işlemlerine geçilir (alt sekmeler şimdilik örnek veri).
            </p>
          </div>
          <form onSubmit={onSearch} className="flex w-full max-w-md gap-2 sm:w-auto">
            <Input
              placeholder="Dosya ara…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="min-w-0 flex-1"
              aria-label="Dosya ara"
            />
            <Button type="submit" variant="secondary" size="sm">
              Ara
            </Button>
          </form>
        </CardHeader>
        <CardBody className="p-0">
          {dosyaQuery.isLoading ? (
            <p className="px-4 py-10 text-center text-sm text-ink-muted">Dosyalar yükleniyor…</p>
          ) : dosyaQuery.isError ? (
            <div className="px-4 py-6">
              <AlertBox variant="danger" title="Dosya listesi">
                {dosyaQuery.error instanceof Error ? dosyaQuery.error.message : 'Liste alınamadı.'}
              </AlertBox>
            </div>
          ) : dosyalar.length === 0 ? (
            <p className="px-4 py-10 text-center text-sm text-ink-muted">
              Bu müvekkile bağlı dosya yok veya aramanıza uygun kayıt bulunamadı. Yeni dosya ekleyebilirsiniz.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <THead>
                  <TR>
                    <TH>Tür</TH>
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
                      <TD className="whitespace-nowrap text-xs font-medium text-ink-muted">{dosyaTuruLabel(d.dosyaTuru)}</TD>
                      <TD className="max-w-[220px] font-medium text-ink">{d.konuBasligi}</TD>
                      <TD className="text-ink-muted">{mahkemeIcraSatir(d)}</TD>
                      <TD className="tabular-nums text-ink-muted">{d.dosyaNo?.trim() ? d.dosyaNo : '—'}</TD>
                      <TD>
                        <Badge variant={dosyaDurumuBadgeVariant(d.durum)}>{dosyaDurumuLabel(d.durum)}</Badge>
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
          )}
        </CardBody>
      </Card>
    </div>
  )
}
