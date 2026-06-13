import { useQuery } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { Link } from 'react-router-dom'
import { adminDashboardRequest } from '../../api/adminApi'
import { Card, CardBody, CardHeader, CardTitle, EmptyState, StatCard, Table, TBody, TD, TH, THead, TR } from '../../components/ui'
import { formatDateTimeTR, formatDateTR } from '../../utils/formatters'

export function AdminDashboardPage(): ReactElement {
  const q = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminDashboardRequest
  })

  const d = q.data

  return (
    <div className="w-full max-w-none space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Genel Bakış</h1>
          <p className="mt-1 text-sm text-slate-600">Kiracılar, lisanslar ve son operasyon özeti.</p>
        </div>
      </div>

      {q.isError ? (
        <p className="text-sm text-danger">{q.error instanceof Error ? q.error.message : 'Özet yüklenemedi.'}</p>
      ) : null}

      <div className="grid w-full gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <StatCard label="Toplam büro" value={d ? String(d.toplamBuro) : '…'} />
        <StatCard label="Aktif büro" value={d ? String(d.aktifBuro) : '…'} />
        <StatCard label="Demo büro" value={d ? String(d.demoBuro) : '…'} />
        <StatCard label="Lisansı biten" value={d ? String(d.suresiDolanBuro) : '…'} />
        <StatCard label="Pasif / kilit" value={d ? String(d.pasifBuro) : '…'} />
        <StatCard label="Toplam kullanıcı" value={d ? String(d.toplamKullanici) : '…'} />
        <StatCard label="Toplam müvekkil" value={d ? String(d.toplamMuvekkil) : '…'} />
        <StatCard label="Toplam dosya" value={d ? String(d.toplamDosya) : '…'} />
      </div>

      <div className="grid w-full gap-4 xl:grid-cols-2">
        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/80">
            <CardTitle className="text-base">Lisansı 7 gün içinde bitecekler</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {!d ? (
              <p className="px-4 py-8 text-sm text-ink-muted">Yükleniyor…</p>
            ) : d.lisansi7GunIcindeBitecekler.length === 0 ? (
              <div className="p-4">
                <EmptyState
                  title="Uyarı yok"
                  description="Önümüzdeki 7 gün içinde lisansı sona erecek aktif büro bulunmuyor."
                />
              </div>
            ) : (
              <div className="max-w-full overflow-x-auto">
                <Table className="min-w-[640px]">
                  <THead>
                    <TR>
                      <TH>Büro</TH>
                      <TH>Bitiş</TH>
                      <TH>Durum</TH>
                      <TH>Kalan gün</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {d.lisansi7GunIcindeBitecekler.map((t) => (
                      <TR key={t.id}>
                        <TD>
                          <Link className="font-semibold text-primary hover:underline" to={`/admin/burolar/${t.id}`}>
                            {t.buroAdi}
                          </Link>
                        </TD>
                        <TD className="whitespace-nowrap text-sm">{formatDateTR(t.lisansBitisTarihi)}</TD>
                        <TD className="text-xs">{t.lisansDurumu}</TD>
                        <TD className="tabular-nums text-sm">{t.kalanGun ?? '—'}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/80">
            <CardTitle className="text-base">Son kayıt olan bürolar</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {!d ? (
              <p className="px-4 py-8 text-sm text-ink-muted">Yükleniyor…</p>
            ) : d.sonKayitOlanBurolar.length === 0 ? (
              <div className="p-4">
                <EmptyState title="Kayıt yok" description="Henüz listelenecek yeni büro yok." />
              </div>
            ) : (
              <div className="max-w-full overflow-x-auto">
                <Table className="min-w-[520px]">
                  <THead>
                    <TR>
                      <TH>Büro</TH>
                      <TH>E-posta</TH>
                      <TH>Kayıt</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {d.sonKayitOlanBurolar.map((t) => (
                      <TR key={t.id}>
                        <TD>
                          <Link className="font-semibold text-primary hover:underline" to={`/admin/burolar/${t.id}`}>
                            {t.buroAdi}
                          </Link>
                        </TD>
                        <TD className="text-sm text-ink-muted">{t.eposta ?? '—'}</TD>
                        <TD className="whitespace-nowrap text-xs text-ink-muted">{formatDateTR(t.createdAt)}</TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/80">
            <CardTitle className="text-base">
              Bugün giriş yapan bürolar
              {d ? <span className="ml-2 text-sm font-normal text-slate-500">({d.bugunGirisYapanBuro})</span> : null}
            </CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {!d ? (
              <p className="px-4 py-8 text-sm text-ink-muted">Yükleniyor…</p>
            ) : d.bugunGirisYapanBurolar.length === 0 ? (
              <div className="p-4">
                <EmptyState title="Bugün giriş yok" description="Bugün en az bir kullanıcı oturumu açmış büro bulunmuyor." />
              </div>
            ) : (
              <div className="max-w-full overflow-x-auto">
                <Table className="min-w-[560px]">
                  <THead>
                    <TR>
                      <TH>Büro</TH>
                      <TH>E-posta</TH>
                      <TH>Telefon</TH>
                      <TH>Durum</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {d.bugunGirisYapanBurolar.map((t) => (
                      <TR key={t.id}>
                        <TD>
                          <Link className="font-semibold text-primary hover:underline" to={`/admin/burolar/${t.id}`}>
                            {t.buroAdi}
                          </Link>
                        </TD>
                        <TD className="text-sm text-ink-muted">{t.eposta ?? '—'}</TD>
                        <TD className="text-sm text-ink-muted">{t.telefon ?? '—'}</TD>
                        <TD className="text-xs">
                          {t.aktifMi ? 'Aktif' : 'Pasif'} · {t.lisansDurumu}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            )}
          </CardBody>
        </Card>

        <Card className="overflow-hidden border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/80">
            <CardTitle className="text-base">Son admin işlemleri</CardTitle>
          </CardHeader>
          <CardBody className="p-0">
            {!d ? (
              <p className="px-4 py-8 text-sm text-ink-muted">Yükleniyor…</p>
            ) : d.sonAdminAuditLoglar.length === 0 ? (
              <div className="p-4">
                <EmptyState title="Kayıt yok" description="Henüz admin denetim kaydı bulunmuyor." />
              </div>
            ) : (
              <div className="max-w-full overflow-x-auto">
                <Table className="min-w-[720px]">
                  <THead>
                    <TR>
                      <TH>Tarih</TH>
                      <TH>İşlem</TH>
                      <TH>Admin</TH>
                      <TH>Varlık</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {d.sonAdminAuditLoglar.map((a) => (
                      <TR key={a.id}>
                        <TD className="whitespace-nowrap text-xs text-ink-muted">{formatDateTimeTR(a.createdAt)}</TD>
                        <TD className="text-xs font-semibold text-ink">{a.action}</TD>
                        <TD className="text-xs text-ink-muted">{a.adminAdSoyad ?? a.adminKullaniciAdi ?? '—'}</TD>
                        <TD className="text-xs text-ink-muted">
                          {a.entityType ?? '—'} {a.entityId ? `· ${a.entityId.slice(0, 8)}…` : ''}
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
    </div>
  )
}
