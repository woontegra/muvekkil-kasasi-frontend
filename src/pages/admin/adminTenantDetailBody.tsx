import type { FormEvent, ReactElement } from 'react'
import { Link } from 'react-router-dom'
import type { AdminTenantDetailResponse } from '../../types/admin'
import { AdminBreadcrumb } from '../../components/admin/AdminBreadcrumb'
import { AdminEmptyState } from '../../components/admin/AdminEmptyState'
import { AlertBox, Badge, Button, Card, CardBody, CardHeader, CardTitle, Input, Table, TBody, TD, TH, THead, TR } from '../../components/ui'
import { formatDateTimeTR, formatDateTR } from '../../utils/formatters'
import { lisansDurumuTr } from '../../utils/tenantLicenseDisplay'
import { AdminTenantUserRow } from './AdminTenantUserRow'

type ExtendTur = 'GUN' | 'AY' | 'YIL' | 'OZEL'

export type AdminTenantDetailBodyProps = {
  id: string
  d: AdminTenantDetailResponse
  ownerName: string
  ownerEmail: string
  effBitis: string | null
  kalanGunUst: number | null
  demoKalanGun: number | null
  mudahaleGerekli: boolean
  sonIslemTarihi: string
  lastLoginIso: string | null
  tab: string
  selectTab: (t: string) => void
  isSuper: boolean
  canManageTenantUsers: boolean
  banner: string | null
  copyOk: boolean
  copyLicenseKey: () => void
  noteModalOpen: boolean
  noteDraft: string
  setNoteDraft: (v: string) => void
  setNoteModalOpen: (v: boolean) => void
  notePending: boolean
  onSaveNote: () => void
  mailPending: boolean
  onResendMail: () => void
  onOpenNote: () => void
  onPresetDemo: (days: number) => void
  onTenantToggle: () => void
  tenantAktif: boolean
  extendTur: ExtendTur
  setExtendTur: (v: ExtendTur) => void
  extendMiktar: string
  setExtendMiktar: (v: string) => void
  extendBitisDate: string
  setExtendBitisDate: (v: string) => void
  extendDemo: boolean
  setExtendDemo: (v: boolean) => void
  extendAciklama: string
  setExtendAciklama: (v: string) => void
  extendFormErr: string | null
  extendPending: boolean
  onExtend: () => void
  editReady: boolean
  initEdit: () => void
  editForm: Record<string, string>
  setEditForm: React.Dispatch<React.SetStateAction<Record<string, string>>>
  updatePending: boolean
  onUpdateTenant: (e: FormEvent) => void
  resetResult: string | null
  onResetDone: (pwd: string) => void
  errorMessage?: string
}

function InfoRow(props: { label: string; value: React.ReactNode }): ReactElement {
  return (
    <div className="flex flex-col gap-0.5 border-b border-slate-100 py-2.5 sm:flex-row sm:gap-4">
      <dt className="w-40 shrink-0 text-xs font-semibold text-slate-500">{props.label}</dt>
      <dd className="text-sm text-slate-900">{props.value}</dd>
    </div>
  )
}

function SummaryCard(props: { title: string; children: React.ReactNode }): ReactElement {
  return (
    <Card className="border-slate-200/80 shadow-sm">
      <CardBody className="space-y-2 p-4">
        <p className="text-[10px] font-bold uppercase tracking-wide text-slate-500">{props.title}</p>
        {props.children}
      </CardBody>
    </Card>
  )
}

function renewalSourceTr(source: string): string {
  if (source === 'WOONTEGRA_WEBSITE') return 'Website'
  if (source === 'SUPER_ADMIN') return 'Super Admin'
  return source
}

function formatAmount(amount: string | null, currency: string): string {
  if (amount == null) return '—'
  return `${amount} ${currency === 'TRY' ? '₺' : currency}`
}

const TABS: { id: string; label: string }[] = [
  { id: 'genel', label: 'Genel' },
  { id: 'abonelikLisans', label: 'Abonelik & Lisans' },
  { id: 'kullanim', label: 'Kullanım Geçmişi' },
  { id: 'girisCihaz', label: 'Giriş & Cihaz' },
  { id: 'demoTakibi', label: 'Demo Takibi' },
  { id: 'islemGecmisi', label: 'İşlem Geçmişi' },
  { id: 'destek', label: 'Destek Talepleri' }
]

export function AdminTenantDetailBody(props: AdminTenantDetailBodyProps): ReactElement {
  const t = props.d.tenant
  const {
    id,
    d,
    ownerName,
    ownerEmail,
    effBitis,
    kalanGunUst,
    demoKalanGun,
    mudahaleGerekli,
    sonIslemTarihi,
    lastLoginIso,
    tab,
    selectTab,
    isSuper,
    canManageTenantUsers,
    banner,
    copyOk,
    copyLicenseKey,
    noteModalOpen,
    noteDraft,
    setNoteDraft,
    setNoteModalOpen,
    notePending,
    onSaveNote,
    mailPending,
    onResendMail,
    onOpenNote,
    onPresetDemo,
    onTenantToggle,
    tenantAktif,
    onResetDone
  } = props

  const renewals = d.licenseRenewals ?? []
  const lastRenewal = renewals[0] ?? null

  return (
    <div className="w-full max-w-none space-y-4">
      <AdminBreadcrumb
        items={[
          { label: 'Ana Sayfa', to: '/admin' },
          { label: 'Admin Paneli', to: '/admin' },
          { label: 'Kullanıcı Yönetimi', to: '/admin/burolar' },
          { label: t.buroAdi }
        ]}
      />

      {banner ? (
        <AlertBox variant="success" title="Tamamlandı">
          {banner}
        </AlertBox>
      ) : null}
      {props.errorMessage ? (
        <AlertBox variant="danger" title="Hata">
          {props.errorMessage}
        </AlertBox>
      ) : null}

      <div className="flex flex-wrap items-start gap-3">
        <Link
          to="/admin/burolar"
          className="inline-flex h-8 items-center rounded border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 hover:bg-slate-50"
        >
          ← Geri
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="text-lg font-semibold text-slate-900">{t.buroAdi}</h1>
          <p className="text-sm text-slate-600">
            {ownerName}
            {ownerEmail ? ` · ${ownerEmail}` : ''}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <Badge variant={t.aktifMi ? 'success' : 'warning'} className="!normal-case">
              {t.aktifMi ? 'Aktif' : 'Pasif'}
            </Badge>
            <Badge variant="default" className="!normal-case">
              {lisansDurumuTr(t.lisansDurumu)}
            </Badge>
            {kalanGunUst != null ? (
              <Badge variant={kalanGunUst <= 7 ? 'warning' : 'default'} className="!normal-case">
                {kalanGunUst} gün kaldı
              </Badge>
            ) : null}
            {lastLoginIso ? (
              <Badge variant="default" className="!normal-case">
                Son giriş: {formatDateTimeTR(lastLoginIso)}
              </Badge>
            ) : null}
            {mudahaleGerekli ? (
              <Badge variant="warning" className="!normal-case">
                Müdahale gerekli
              </Badge>
            ) : null}
          </div>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Abonelik / Lisans">
          <p className="text-sm font-semibold text-slate-900">{lisansDurumuTr(t.lisansDurumu)}</p>
          <p className="text-xs text-slate-600">
            Bitiş: {effBitis ? formatDateTR(effBitis) : '—'}
            {kalanGunUst != null ? ` · ${kalanGunUst} gün` : ''}
          </p>
          {lastRenewal ? (
            <p className="text-xs text-slate-500">
              Son yenileme: {formatDateTR(lastRenewal.tarih)}
              {lastRenewal.tutar != null ? ` · ${formatAmount(lastRenewal.tutar, lastRenewal.paraBirimi)}` : ''}
              {' · '}
              {renewalSourceTr(lastRenewal.kaynak)}
            </p>
          ) : null}
        </SummaryCard>
        <SummaryCard title="Lisans / Anahtar">
          <p className="break-all font-mono text-xs text-slate-800">{t.lisansAnahtari ?? '—'}</p>
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {t.lisansAnahtari ? (
              <Button type="button" size="sm" variant="secondary" onClick={() => void copyLicenseKey()}>
                {copyOk ? 'Kopyalandı' : 'Kopyala'}
              </Button>
            ) : null}
            <span className="text-xs text-slate-500">{t.demoMu ? 'Demo' : 'Aktif lisans'}</span>
          </div>
        </SummaryCard>
        <SummaryCard title="Kullanım">
          <p className="text-xs text-slate-600">
            Müvekkil: <strong className="text-slate-900">{d.ozet.toplamMuvekkil}</strong>
          </p>
          <p className="text-xs text-slate-600">
            Dosya: <strong className="text-slate-900">{d.ozet.toplamDosya}</strong>
          </p>
          <p className="text-xs text-slate-600">
            Kullanıcı: <strong className="text-slate-900">{d.ozet.toplamKullanici}</strong>
          </p>
        </SummaryCard>
        <SummaryCard title="Giriş">
          <p className="text-xs text-slate-600">
            Son giriş: <strong className="text-slate-900">{lastLoginIso ? formatDateTimeTR(lastLoginIso) : '—'}</strong>
          </p>
          <p className="text-xs text-slate-600">
            Son işlem: <strong className="text-slate-900">{formatDateTimeTR(sonIslemTarihi)}</strong>
          </p>
        </SummaryCard>
      </div>

      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader className="border-b border-slate-100 py-3">
          <CardTitle className="text-sm">Hızlı İşlemler</CardTitle>
        </CardHeader>
        <CardBody className="flex flex-wrap gap-2 p-3">
          {isSuper ? (
            <>
              <Button type="button" size="sm" variant="secondary" onClick={() => selectTab('abonelikLisans')}>
                Lisans Uzat
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => onPresetDemo(7)}>
                Demo Süresi Ver
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => void onResendMail()} disabled={mailPending}>
                {mailPending ? 'Gönderiliyor…' : 'Mail Gönder'}
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={onOpenNote}>
                Admin Notu Ekle
              </Button>
              <Button type="button" size="sm" variant={tenantAktif ? 'danger' : 'secondary'} onClick={onTenantToggle}>
                {tenantAktif ? 'Pasife Al' : 'Aktif Yap'}
              </Button>
            </>
          ) : (
            <p className="text-xs text-slate-500">Hızlı lisans işlemleri yalnızca SUPER_ADMIN için kullanılabilir.</p>
          )}
        </CardBody>
      </Card>

      <div className="flex w-full flex-wrap gap-1 rounded-lg border border-slate-200 bg-white p-1 shadow-sm">
        {TABS.map(({ id: tid, label }) => (
          <button
            key={tid}
            type="button"
            className={`rounded-md px-3 py-2 text-xs font-semibold transition ${
              tab === tid ? 'bg-primary text-white' : 'text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => selectTab(tid)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'genel' && (
        <Card className="border-slate-200/80 shadow-sm">
          <CardBody>
            <dl>
              <InfoRow label="Büro adı" value={t.buroAdi} />
              <InfoRow label="Sahip kullanıcı" value={ownerName} />
              <InfoRow label="E-posta" value={t.eposta ?? ownerEmail ?? '—'} />
              <InfoRow label="Telefon" value={t.telefon ?? '—'} />
              <InfoRow label="Vergi no" value={t.vergiNo ?? '—'} />
              <InfoRow label="Vergi dairesi" value={t.vergiDairesi ?? '—'} />
              <InfoRow label="Slug / büro kodu" value={t.slug} />
              <InfoRow label="Durum" value={t.aktifMi ? 'Aktif' : 'Pasif'} />
              <InfoRow label="Lisans durumu" value={lisansDurumuTr(t.lisansDurumu)} />
              <InfoRow label="Müdahale durumu" value={mudahaleGerekli ? 'Müdahale gerekli' : 'Normal'} />
            </dl>
          </CardBody>
        </Card>
      )}

      {tab === 'abonelikLisans' && (
        <div className="space-y-4">
          <Card className="border-slate-200/80 shadow-sm">
            <CardBody>
              <dl>
                <InfoRow label="Lisans anahtarı" value={<span className="font-mono text-xs">{t.lisansAnahtari ?? '—'}</span>} />
                <InfoRow label="Lisans durumu" value={lisansDurumuTr(t.lisansDurumu)} />
                <InfoRow label="Demo mu?" value={t.demoMu ? 'Evet' : 'Hayır'} />
                <InfoRow label="Lisans başlangıç" value={t.lisansBaslangicTarihi ? formatDateTR(t.lisansBaslangicTarihi) : '—'} />
                <InfoRow label="Lisans bitiş" value={effBitis ? formatDateTR(effBitis) : '—'} />
                <InfoRow label="Kalan gün" value={kalanGunUst != null ? String(kalanGunUst) : '—'} />
                <InfoRow label="Son ödeme tarihi" value={t.sonOdemeTarihi ? formatDateTR(t.sonOdemeTarihi) : '—'} />
                <InfoRow label="Yıllık ücret" value={t.yillikUcret != null ? `${t.yillikUcret} ₺` : '—'} />
                <InfoRow label="Lisans notları" value={t.lisansNotlari?.trim() ? t.lisansNotlari : '—'} />
              </dl>
            </CardBody>
          </Card>
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border-slate-200/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm">Lisans süresini uzat / demo ver</CardTitle>
              </CardHeader>
              <CardBody className="space-y-3">
                {!isSuper ? (
                  <p className="text-sm text-slate-500">Lisans uzatma yalnızca SUPER_ADMIN rolüyle yapılabilir.</p>
                ) : (
                  <>
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" size="sm" variant="secondary" onClick={() => onPresetDemo(3)}>
                        3 gün demo
                      </Button>
                      <Button type="button" size="sm" variant="secondary" onClick={() => onPresetDemo(7)}>
                        7 gün demo
                      </Button>
                      <Button type="button" size="sm" variant="secondary" onClick={() => onPresetDemo(14)}>
                        14 gün demo
                      </Button>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-500">Uzatma türü</label>
                      <select
                        className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm"
                        value={props.extendTur}
                        onChange={(e) => props.setExtendTur(e.target.value as ExtendTur)}
                      >
                        <option value="GUN">Gün</option>
                        <option value="AY">Ay</option>
                        <option value="YIL">Yıl</option>
                        <option value="OZEL">Özel tarih</option>
                      </select>
                    </div>
                    {props.extendTur === 'OZEL' ? (
                      <Input label="Bitiş tarihi" type="date" value={props.extendBitisDate} onChange={(e) => props.setExtendBitisDate(e.target.value)} />
                    ) : (
                      <Input label="Miktar" type="number" min={1} value={props.extendMiktar} onChange={(e) => props.setExtendMiktar(e.target.value)} />
                    )}
                    <label className="flex cursor-pointer items-center gap-2 text-sm">
                      <input type="checkbox" checked={props.extendDemo} onChange={(e) => props.setExtendDemo(e.target.checked)} className="rounded border-slate-300" />
                      Demo olarak işaretle
                    </label>
                    <Input label="Açıklama" value={props.extendAciklama} onChange={(e) => props.setExtendAciklama(e.target.value)} />
                    {props.extendFormErr ? <p className="text-sm text-danger">{props.extendFormErr}</p> : null}
                    <Button type="button" onClick={props.onExtend} disabled={props.extendPending}>
                      {props.extendPending ? 'Kaydediliyor…' : 'Lisansı güncelle'}
                    </Button>
                  </>
                )}
              </CardBody>
            </Card>
            <Card className="border-slate-200/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm">Büro & lisans düzenle</CardTitle>
              </CardHeader>
              <CardBody>
                {!props.editReady ? (
                  <Button type="button" variant="secondary" onClick={props.initEdit}>
                    Formu doldur
                  </Button>
                ) : (
                  <form className="space-y-3" onSubmit={props.onUpdateTenant}>
                    <Input label="Büro adı" value={props.editForm.buroAdi ?? ''} onChange={(e) => props.setEditForm((s) => ({ ...s, buroAdi: e.target.value }))} />
                    <Input label="E-posta" value={props.editForm.eposta ?? ''} onChange={(e) => props.setEditForm((s) => ({ ...s, eposta: e.target.value }))} />
                    <Input label="Telefon" value={props.editForm.telefon ?? ''} onChange={(e) => props.setEditForm((s) => ({ ...s, telefon: e.target.value }))} />
                    <div>
                      <label className="mb-1 block text-xs font-semibold text-slate-500">Lisans durumu</label>
                      <select
                        className="h-9 w-full rounded-md border border-slate-200 bg-white px-2 text-sm"
                        value={props.editForm.lisansDurumu ?? 'AKTIF'}
                        onChange={(e) => props.setEditForm((s) => ({ ...s, lisansDurumu: e.target.value }))}
                      >
                        <option value="AKTIF">AKTIF</option>
                        <option value="DEMO">DEMO</option>
                        <option value="SURESI_DOLDU">SURESI_DOLDU</option>
                        <option value="PASIF">PASIF</option>
                      </select>
                    </div>
                    <Input label="Lisans notları" value={props.editForm.lisansNotlari ?? ''} onChange={(e) => props.setEditForm((s) => ({ ...s, lisansNotlari: e.target.value }))} />
                    <Button type="submit" disabled={props.updatePending}>
                      Kaydet
                    </Button>
                  </form>
                )}
              </CardBody>
            </Card>
          </div>
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">Yenileme Geçmişi</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              {renewals.length === 0 ? (
                <p className="p-6 text-sm text-slate-500">Bu lisans için henüz yenileme kaydı yok.</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <THead>
                      <TR className="bg-slate-50/80">
                        <TH>Tarih</TH>
                        <TH>Kaynak</TH>
                        <TH>Gün</TH>
                        <TH>Eski Bitiş</TH>
                        <TH>Yeni Bitiş</TH>
                        <TH>Tutar</TH>
                        <TH>Sipariş No / External Order</TH>
                        <TH>Not</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {renewals.map((r) => (
                        <TR key={r.id}>
                          <TD className="whitespace-nowrap text-xs">{formatDateTimeTR(r.tarih)}</TD>
                          <TD className="text-xs">{renewalSourceTr(r.kaynak)}</TD>
                          <TD className="text-xs">{r.gunSayisi}</TD>
                          <TD className="whitespace-nowrap text-xs">{formatDateTR(r.eskiBitis)}</TD>
                          <TD className="whitespace-nowrap text-xs">{formatDateTR(r.yeniBitis)}</TD>
                          <TD className="text-xs">{formatAmount(r.tutar, r.paraBirimi)}</TD>
                          <TD className="max-w-[140px] truncate font-mono text-xs" title={r.externalOrderId ?? undefined}>
                            {r.externalOrderId ?? '—'}
                          </TD>
                          <TD className="max-w-[200px] truncate text-xs text-slate-600" title={r.not ?? undefined}>
                            {r.not ?? '—'}
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
      )}

      {tab === 'kullanim' && (
        <Card className="border-slate-200/80 shadow-sm">
          <CardBody>
            {d.ozet.toplamMuvekkil === 0 && d.ozet.toplamDosya === 0 && d.ozet.kasaHareketi === 0 ? (
              <AdminEmptyState description="Bu alanda henüz kayıt bulunmuyor." />
            ) : (
              <dl>
                <InfoRow label="Müvekkil sayısı" value={d.ozet.toplamMuvekkil} />
                <InfoRow label="Dosya sayısı" value={d.ozet.toplamDosya} />
                <InfoRow label="Kasa hareketi sayısı" value={d.ozet.kasaHareketi} />
                <InfoRow label="İcra tahsilat kaydı" value="—" />
                <InfoRow label="Makbuz sayısı" value="—" />
                <InfoRow label="Son işlem tarihi" value={formatDateTimeTR(sonIslemTarihi)} />
              </dl>
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'girisCihaz' && (
        <div className="space-y-4">
          <Card className="border-slate-200/80 shadow-sm">
            <CardBody className="space-y-3">
              <dl>
                <InfoRow label="Son giriş tarihi" value={lastLoginIso ? formatDateTimeTR(lastLoginIso) : '—'} />
                <InfoRow label="Son IP" value="—" />
              </dl>
              <p className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-xs text-slate-600">
                Bu SaaS sürümünde cihaz aktivasyonu kullanılmaz.
              </p>
            </CardBody>
          </Card>
          <Card className="border-slate-200/80 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm">Kullanıcı listesi</CardTitle>
            </CardHeader>
            <CardBody className="p-0">
              {d.kullanicilar.length === 0 ? (
                <div className="p-6">
                  <AdminEmptyState description="Bu alanda henüz kayıt bulunmuyor." />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <THead>
                      <TR className="bg-slate-50/80">
                        <TH>Ad Soyad</TH>
                        <TH>E-posta</TH>
                        <TH>Rol</TH>
                        <TH>Son giriş</TH>
                        <TH>Durum</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {d.kullanicilar.map((u) => (
                        <TR key={u.id}>
                          <TD>{u.adSoyad}</TD>
                          <TD className="text-sm">{u.eposta ?? '—'}</TD>
                          <TD className="text-xs">{u.role}</TD>
                          <TD className="whitespace-nowrap text-xs">{u.sonGirisTarihi ? formatDateTimeTR(u.sonGirisTarihi) : '—'}</TD>
                          <TD>
                            <Badge variant={u.aktifMi ? 'success' : 'warning'} className="!normal-case">
                              {u.aktifMi ? 'Aktif' : 'Pasif'}
                            </Badge>
                          </TD>
                        </TR>
                      ))}
                    </TBody>
                  </Table>
                </div>
              )}
            </CardBody>
          </Card>
          {canManageTenantUsers ? (
            <Card className="border-slate-200/80 shadow-sm">
              <CardHeader>
                <CardTitle className="text-sm">Kullanıcı yönetimi</CardTitle>
              </CardHeader>
              <CardBody className="p-0">
                <div className="overflow-x-auto">
                  <Table>
                    <THead>
                      <TR className="bg-slate-50/80">
                        <TH>Ad Soyad</TH>
                        <TH>E-posta</TH>
                        <TH>Rol</TH>
                        <TH>Hesap</TH>
                        <TH>İşlem</TH>
                      </TR>
                    </THead>
                    <TBody>
                      {d.kullanicilar.map((u) => (
                        <AdminTenantUserRow key={u.id} tenantId={id} user={u} canManage={canManageTenantUsers} onResetDone={onResetDone} />
                      ))}
                    </TBody>
                  </Table>
                </div>
                {props.resetResult ? (
                  <div className="border-t border-slate-100 p-4">
                    <AlertBox variant="warning" title="Yeni şifre (bir kez)">
                      {props.resetResult}
                    </AlertBox>
                  </div>
                ) : null}
              </CardBody>
            </Card>
          ) : null}
        </div>
      )}

      {tab === 'demoTakibi' && (
        <Card className="border-slate-200/80 shadow-sm">
          <CardBody>
            <dl>
              <InfoRow label="Demo mu?" value={t.demoMu ? 'Evet' : 'Hayır'} />
              <InfoRow label="Demo bitiş tarihi" value={t.demoBitisTarihi ? formatDateTR(t.demoBitisTarihi) : '—'} />
              <InfoRow label="Demo kalan gün" value={demoKalanGun != null ? String(demoKalanGun) : '—'} />
              <InfoRow label="Demo verildiği tarih" value="—" />
              <InfoRow label="Demo notu" value={t.demoMu && t.lisansNotlari ? t.lisansNotlari : '—'} />
            </dl>
          </CardBody>
        </Card>
      )}

      {tab === 'islemGecmisi' && (
        <Card className="border-slate-200/80 shadow-sm">
          <CardBody className="p-0">
            {d.sonAuditLoglar.length === 0 ? (
              <div className="p-6">
                <AdminEmptyState description="Bu alanda henüz kayıt bulunmuyor." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <THead>
                    <TR className="bg-slate-50/80">
                      <TH>Tarih</TH>
                      <TH>Aksiyon</TH>
                      <TH>Entity</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {d.sonAuditLoglar.map((a) => (
                      <TR key={a.id}>
                        <TD className="whitespace-nowrap text-xs">{formatDateTimeTR(a.createdAt)}</TD>
                        <TD className="text-xs">{a.action}</TD>
                        <TD className="text-xs text-slate-500">
                          {a.entityType ?? ''} {a.entityId ?? ''}
                        </TD>
                      </TR>
                    ))}
                  </TBody>
                </Table>
              </div>
            )}
          </CardBody>
        </Card>
      )}

      {tab === 'destek' && (
        <Card className="border-slate-200/80 shadow-sm">
          <CardBody>
            <AdminEmptyState description="Bu alanda henüz kayıt bulunmuyor." />
          </CardBody>
        </Card>
      )}

      {noteModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <Card className="w-full max-w-md border-slate-200 shadow-lg">
            <CardHeader>
              <CardTitle className="text-sm">Admin notu</CardTitle>
            </CardHeader>
            <CardBody className="space-y-3">
              <textarea
                className="min-h-[120px] w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
                value={noteDraft}
                onChange={(e) => setNoteDraft(e.target.value)}
                placeholder="Lisans / büro notu…"
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="secondary" onClick={() => setNoteModalOpen(false)}>
                  İptal
                </Button>
                <Button type="button" onClick={onSaveNote} disabled={notePending}>
                  {notePending ? 'Kaydediliyor…' : 'Kaydet'}
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      ) : null}
    </div>
  )
}
