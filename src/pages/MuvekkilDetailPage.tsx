import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FormEvent, ReactElement, ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { listMuvekkilDosyalari } from '../api/dosyalar'
import { getMuvekkil, listMuvekkilOfisGelirleri } from '../api/muvekkiller'
import { patchMuvekkilBildirimAyar } from '../api/bildirimAyar'
import { ApiError, friendlyClientErrorMessage } from '../api/client'
import { APP_BASE, HOME_PAGE_LABEL } from '../config/appPaths'
import { dosyaDurumuBadgeVariant, dosyaDurumuLabel, dosyaTuruLabel, mahkemeIcraSatir } from '../lib/dosyaLabels'
import { cn } from '../lib/cn'
import { OtomatikHatirlatmaSwitch } from '../components/bildirim/OtomatikHatirlatmaSwitch'
import { MuvekkilEditModal } from '../components/muvekkil/MuvekkilEditModal'
import { MuvekkilKarlilikTab } from '../components/mali/MuvekkilKarlilikTab'
import { MuvekkilRandevularSection } from '../pages/RandevularPage'
import { MobileRecordCard, ResponsiveDataView } from '../components/responsive'
import { AlertBox, Badge, Button, Card, CardBody, CardHeader, CardTitle, Input, Table, TBody, TD, TH, THead, TR, tableActionLinkAccentClass } from '../components/ui'
import { useToast } from '../toast'
import { formatCurrencyTR, formatDateTR } from '../utils/formatters'
import type { OfisKasaOdemeYontemiApi } from '../types/ofisKasasi'

const OFIS_ODEME_LABELS: Record<OfisKasaOdemeYontemiApi, string> = {
  NAKIT: 'Nakit',
  BANKA: 'Banka',
  KREDI_KARTI: 'Kredi kartı',
  DIGER: 'Diğer'
}

function ofisOdemeLabel(v: OfisKasaOdemeYontemiApi): string {
  return OFIS_ODEME_LABELS[v] ?? v
}

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
  const queryClient = useQueryClient()
  const toast = useToast()
  const [q, setQ] = useState('')
  const [debouncedQ, setDebouncedQ] = useState('')
  const [editOpen, setEditOpen] = useState(false)
  const [ofisGelirPage, setOfisGelirPage] = useState(1)
  const ofisGelirLimit = 20

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

  const ofisGelirQuery = useQuery({
    queryKey: ['muvekkil-ofis-gelirleri', id, ofisGelirPage, ofisGelirLimit],
    queryFn: () => listMuvekkilOfisGelirleri(id!, { page: ofisGelirPage, limit: ofisGelirLimit }),
    enabled: Boolean(id) && muvekkilQuery.isSuccess
  })

  const izinMu = useMutation({
    mutationFn: (next: boolean) => patchMuvekkilBildirimAyar(id!, next),
    onSuccess: async (res) => {
      await queryClient.invalidateQueries({ queryKey: ['muvekkil', id] })
      await queryClient.invalidateQueries({ queryKey: ['muvekkiller'] })
      toast.success(
        res.aktif
          ? 'Otomatik WhatsApp ödeme hatırlatmaları açıldı.'
          : 'Otomatik WhatsApp ödeme hatırlatmaları kapatıldı.'
      )
    },
    onError: (err) => {
      toast.error(friendlyClientErrorMessage(err, 'Hatırlatma izni güncellenemedi.'))
    }
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
  const ofisGelirler = ofisGelirQuery.data?.items ?? []
  const ofisGelirToplam = ofisGelirQuery.data?.total ?? 0
  const ofisGelirTotalPages = Math.max(1, Math.ceil(ofisGelirToplam / ofisGelirLimit))

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
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button type="button" variant="outline" className="shadow-sm" onClick={() => setEditOpen(true)}>
              Düzenle
            </Button>
            <Button
              type="button"
              variant="outline"
              className="shadow-sm"
              onClick={() => navigate(`${APP_BASE}/muvekkil/${id}/dosyalar/yeni`)}
            >
              Yeni Dosya
            </Button>
          </div>
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
              label="Otomatik WhatsApp hatırlatma"
              value={
                <span className={m.otomatikBildirimIzni ? 'text-emerald-700' : 'text-ink-muted'}>
                  {m.otomatikBildirimIzni ? 'Açık' : 'Kapalı'}
                </span>
              }
            />
            <ProfileStatCard
              label="Adres"
              className="sm:col-span-2 lg:col-span-3"
              value={
                m.adres?.trim() ? (
                  <span className="whitespace-pre-wrap break-words font-medium text-ink">{m.adres.trim()}</span>
                ) : (
                  <span className="font-medium text-ink-muted">Adres girilmemiş</span>
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

          <OtomatikHatirlatmaSwitch
            id={`muvekkil-detail-otomatik-whatsapp-${m.id}`}
            label="Bu müvekkile otomatik WhatsApp ödeme hatırlatmaları gönderilsin"
            description="Kapalıysa bu müvekkil için otomatik tahsilat hatırlatması planlanmaz."
            checked={Boolean(m.otomatikBildirimIzni)}
            disabled={izinMu.isPending}
            onChange={(next) => {
              if (next === Boolean(m.otomatikBildirimIzni) || izinMu.isPending) return
              izinMu.mutate(next)
            }}
            stateText={{ on: 'Açık', off: 'Kapalı' }}
          />

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
        <CardBody className="p-4">
          {dosyaQuery.isError ? (
            <AlertBox variant="danger" title="Dosya listesi">
              {dosyaQuery.error instanceof Error ? dosyaQuery.error.message : 'Liste alınamadı.'}
            </AlertBox>
          ) : (
            <ResponsiveDataView
              isLoading={dosyaQuery.isLoading}
              loading={<p className="py-10 text-center text-sm text-ink-muted">Dosyalar yükleniyor…</p>}
              isEmpty={!dosyaQuery.isLoading && dosyalar.length === 0}
              empty={
                <p className="py-10 text-center text-sm text-ink-muted">
                  Bu müvekkile bağlı dosya yok veya aramanıza uygun kayıt bulunamadı. Yeni dosya ekleyebilirsiniz.
                </p>
              }
              table={
                <div className="overflow-x-auto rounded-lg border border-border">
                  <Table>
                    <THead>
                      <TR>
                        <TH>Tür</TH>
                        <TH>Konu başlığı</TH>
                        <TH>Mahkeme / icra</TH>
                        <TH>Dosya no</TH>
                        <TH>Durum</TH>
                        <TH className="w-[1%] whitespace-nowrap text-right">İşlem</TH>
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
                          <TD className="text-right">
                            <Link
                              to={`${APP_BASE}/muvekkil/${id}/dosya/${d.id}`}
                              className={tableActionLinkAccentClass}
                              aria-label={`${d.konuBasligi}: dosyayı aç`}
                            >
                              Aç
                            </Link>
                          </TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </div>
              }
              cards={
                <>
                  {dosyalar.map((d) => {
                    const detailTo = `${APP_BASE}/muvekkil/${id}/dosya/${d.id}`
                    return (
                      <MobileRecordCard
                        key={d.id}
                        title={d.konuBasligi}
                        subtitle={dosyaTuruLabel(d.dosyaTuru)}
                        badge={<Badge variant={dosyaDurumuBadgeVariant(d.durum)}>{dosyaDurumuLabel(d.durum)}</Badge>}
                        fields={[
                          { label: 'Mahkeme / icra', value: mahkemeIcraSatir(d), full: true },
                          { label: 'Dosya no', value: d.dosyaNo?.trim() ? d.dosyaNo : '—' }
                        ]}
                        onClick={() => navigate(detailTo)}
                        actions={
                          <Link
                            to={detailTo}
                            className="inline-flex min-h-11 w-full items-center justify-center rounded-md border border-accent bg-accent px-3 text-sm font-semibold text-white shadow-sm"
                            onClick={(e) => e.stopPropagation()}
                            aria-label={`${d.konuBasligi}: dosyayı aç`}
                          >
                            Aç
                          </Link>
                        }
                      />
                    )
                  })}
                </>
              }
            />
          )}
        </CardBody>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="border-b border-border px-4 py-3">
          <CardTitle className="text-base">Dosya dışı ofis gelirleri</CardTitle>
          <p className="mt-1 text-xs text-ink-muted">
            Bu müvekkille ilişkilendirilmiş ofis kasası gelir kayıtları. Dosya kasası ve vekalet tahsilatlarından ayrıdır.
          </p>
        </CardHeader>
        <CardBody className="p-4">
          {ofisGelirQuery.isError ? (
            <AlertBox variant="danger" title="Ofis gelirleri">
              {ofisGelirQuery.error instanceof Error ? ofisGelirQuery.error.message : 'Liste alınamadı.'}
            </AlertBox>
          ) : (
            <ResponsiveDataView
              isLoading={ofisGelirQuery.isLoading}
              loading={<p className="py-10 text-center text-sm text-ink-muted">Ofis gelirleri yükleniyor…</p>}
              isEmpty={!ofisGelirQuery.isLoading && ofisGelirler.length === 0}
              empty={
                <p className="py-10 text-center text-sm text-ink-muted">
                  Bu müvekkille ilişkilendirilmiş dosya dışı ofis geliri kaydı yok.
                </p>
              }
              table={
                <div className="overflow-x-auto rounded-lg border border-border">
                  <Table>
                    <THead>
                      <TR>
                        <TH>Tarih</TH>
                        <TH>Belge no</TH>
                        <TH>Kategori</TH>
                        <TH>Açıklama</TH>
                        <TH>Ödeme</TH>
                        <TH>Personel</TH>
                        <TH className="text-right">Tutar</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {ofisGelirler.map((h) => (
                        <TR key={h.id}>
                          <TD className="whitespace-nowrap text-ink-muted">{formatDateTR(h.tarih)}</TD>
                          <TD className="font-mono text-xs">{h.belgeNo}</TD>
                          <TD className="max-w-[160px] text-sm">
                            {h.kategori}
                            {h.ozelKategoriAdi?.trim() ? (
                              <span className="mt-0.5 block text-[11px] text-ink-muted">({h.ozelKategoriAdi})</span>
                            ) : null}
                          </TD>
                          <TD className="max-w-[200px] text-sm text-ink-muted">{h.aciklama?.trim() || '—'}</TD>
                          <TD className="text-xs text-ink-muted">{ofisOdemeLabel(h.odemeYontemi)}</TD>
                          <TD className="text-sm text-ink-muted">{h.tahsilatiYapanPersonelAd?.trim() || '—'}</TD>
                          <TD className="text-right text-sm font-semibold tabular-nums">
                            {formatCurrencyTR(Number(h.tutar))}
                          </TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </div>
              }
              cards={
                <>
                  {ofisGelirler.map((h) => (
                    <MobileRecordCard
                      key={h.id}
                      title={h.belgeNo}
                      subtitle={h.kategori}
                      fields={[
                        { label: 'Tarih', value: formatDateTR(h.tarih) },
                        {
                          label: 'Tutar',
                          value: formatCurrencyTR(Number(h.tutar)),
                          numeric: true
                        },
                        { label: 'Ödeme', value: ofisOdemeLabel(h.odemeYontemi) },
                        {
                          label: 'Personel',
                          value: h.tahsilatiYapanPersonelAd?.trim() || '—'
                        },
                        { label: 'Açıklama', value: h.aciklama?.trim() || '—', full: true }
                      ]}
                    />
                  ))}
                </>
              }
            />
          )}
          {ofisGelirToplam > ofisGelirLimit ? (
            <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-ink-muted">
              <span>
                Toplam <strong>{ofisGelirToplam}</strong> kayıt · sayfa {ofisGelirPage}/{ofisGelirTotalPages}
              </span>
              <div className="flex w-full gap-2 sm:w-auto">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  disabled={ofisGelirPage <= 1}
                  onClick={() => setOfisGelirPage((p) => p - 1)}
                >
                  Önceki
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="flex-1 sm:flex-none"
                  disabled={ofisGelirPage >= ofisGelirTotalPages}
                  onClick={() => setOfisGelirPage((p) => p + 1)}
                >
                  Sonraki
                </Button>
              </div>
            </div>
          ) : null}
        </CardBody>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="border-b border-border px-4 py-3">
          <CardTitle className="text-base">Randevular</CardTitle>
        </CardHeader>
        <CardBody className="px-4 py-4">
          <MuvekkilRandevularSection muvekkilId={id} />
        </CardBody>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="border-b border-border px-4 py-3">
          <CardTitle className="text-base">Kârlılık Analizi</CardTitle>
          <p className="mt-1 text-xs text-ink-muted">Müvekkile ait tüm dosyaların toplam mali özeti.</p>
        </CardHeader>
        <CardBody className="px-4 py-4">
          <MuvekkilKarlilikTab muvekkilId={id} />
        </CardBody>
      </Card>

      {editOpen ? <MuvekkilEditModal muvekkil={m} onClose={() => setEditOpen(false)} /> : null}
    </div>
  )
}
