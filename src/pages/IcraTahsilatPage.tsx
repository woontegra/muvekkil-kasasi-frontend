import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FormEvent, ReactElement } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { listMuvekkilDosyalari } from '../api/dosyalar'
import {
  createIcraTahsilat,
  createIcraTaksitOdeme,
  deleteIcraTaksit,
  getIcraTahsilat,
  listIcraTahsilat,
  listIcraTaksitOdemeler,
  markIcraOdemeSmmKesildi,
  patchIcraTaksit
} from '../api/icraTahsilat'
import { listMuvekkiller } from '../api/muvekkiller'
import { getBagliPrimPersonel, listAktifPrimPersonel } from '../api/primPersonel'
import { TahsilatiYapanPersonelSelect } from '../components/prim/TahsilatiYapanPersonelSelect'
import {
  AlertBox,
  Badge,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Input,
  ModalScrim,
  StatCard,
  Table,
  TableEmptyRow,
  TBody,
  TD,
  TH,
  THead,
  TR,
  tableActionButtonShrinkClass,
  tableActionsFlexRow
} from '../components/ui'
import { useAuth } from '../contexts/AuthContext'
import type {
  IcraAlacakDurumApi,
  IcraAlacakTuruApi,
  IcraTahsilatDetayDto,
  IcraTahsilatTipiApi,
  IcraTahsilatListeSatirDto,
  IcraTahsilatTaksitDto
} from '../types/icraTahsilat'
import { ICRA_ALACAK_DURUM_LABEL, ICRA_ALACAK_TURU_LABEL } from '../types/icraTahsilat'
import type { OfisKasaOdemeYontemiApi } from '../types/ofisKasasi'
import { formatCurrencyTR, formatDateTR } from '../utils/formatters'

const ODEME_OPTIONS: { value: OfisKasaOdemeYontemiApi; label: string }[] = [
  { value: 'NAKIT', label: 'Nakit' },
  { value: 'BANKA', label: 'Banka' },
  { value: 'KREDI_KARTI', label: 'Kredi kartı' },
  { value: 'DIGER', label: 'Diğer' }
]

function todayInputDate(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function dateInputToIso(dateStr: string): string {
  return `${dateStr}T12:00:00.000Z`
}

function durumBadge(d: IcraAlacakDurumApi): 'default' | 'success' | 'warning' | 'danger' {
  if (d === 'ODENDI') return 'success'
  if (d === 'GECIKTI') return 'danger'
  if (d === 'KISMI_ODENDI') return 'warning'
  if (d === 'IPTAL') return 'default'
  return 'default'
}

function isYonetici(role: string | undefined): boolean {
  return role === 'BURO_SAHIBI' || role === 'AVUKAT_YONETICI'
}


export function IcraTahsilatPage(): ReactElement {
  const { session } = useAuth()
  const role = session?.user.role
  const qc = useQueryClient()
  const yonetici = isYonetici(role)

  const [q, setQ] = useState('')
  const [alacakTuru, setAlacakTuru] = useState<'' | IcraAlacakTuruApi>('')
  const [durum, setDurum] = useState<'' | IcraAlacakDurumApi>('')
  const [personelId, setPersonelId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [page, setPage] = useState(1)
  const limit = 50

  const [createOpen, setCreateOpen] = useState(false)
  const [detayId, setDetayId] = useState<string | null>(null)

  const listParams = useMemo(
    () => ({
      q: q.trim() || undefined,
      alacakTuru: alacakTuru || undefined,
      durum: durum || undefined,
      tahsilatiYapanPersonelId: personelId || undefined,
      startDate: startDate ? dateInputToIso(startDate) : undefined,
      endDate: endDate ? dateInputToIso(endDate) : undefined,
      page,
      limit
    }),
    [q, alacakTuru, durum, personelId, startDate, endDate, page, limit]
  )

  const listQ = useQuery({
    queryKey: ['icra-tahsilat', listParams],
    queryFn: () => listIcraTahsilat(listParams)
  })

  const personelQ = useQuery({ queryKey: ['prim-personel', 'aktif'], queryFn: listAktifPrimPersonel })

  const invalidate = (): void => {
    void qc.invalidateQueries({ queryKey: ['icra-tahsilat'] })
    void qc.invalidateQueries({ queryKey: ['ofis-kasasi-ozet'] })
    void qc.invalidateQueries({ queryKey: ['ofis-kasasi-hareketleri'] })
    void qc.invalidateQueries({ queryKey: ['prim-personel-ozet'] })
    void qc.invalidateQueries({ queryKey: ['prim-personel-panel'] })
  }

  const ozet = listQ.data?.ozet
  const items = listQ.data?.items ?? []
  const total = listQ.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  function onFilterSubmit(e: FormEvent): void {
    e.preventDefault()
    setPage(1)
    void listQ.refetch()
  }

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-ink md:text-2xl">İcra Tahsilat</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Karşı taraf ve icra vekalet ücreti alacakları. Tahsilatlar ofis kasasına gelir olarak işlenir; dosya avans kasası etkilenmez.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" onClick={() => setCreateOpen(true)}>
            Yeni icra tahsilat alacağı
          </Button>
          <Button type="button" variant="outline" disabled title="Rapor altyapısı henüz hazır değil">
            İcra tahsilat raporu yazdır
          </Button>
        </div>
      </div>

      {listQ.isError ? (
        <AlertBox variant="danger" title="Liste yüklenemedi">
          {listQ.error instanceof Error ? listQ.error.message : 'Hata'}
        </AlertBox>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="Toplam alacak" value={ozet ? formatCurrencyTR(Number(ozet.toplamAlacak)) : '—'} />
        <StatCard label="Tahsil edilen" value={ozet ? formatCurrencyTR(Number(ozet.tahsilEdilen)) : '—'} />
        <StatCard label="Kalan alacak" value={ozet ? formatCurrencyTR(Number(ozet.kalanAlacak)) : '—'} />
        <StatCard label="Vadesi geçmiş taksit" value={ozet ? String(ozet.vadesiGecmisTaksit) : '—'} />
        <StatCard label="Bu ay tahsilat" value={ozet ? formatCurrencyTR(Number(ozet.buAyTahsilat)) : '—'} />
        <StatCard label="SMM bekleyen" value={ozet ? String(ozet.smmBekleyen) : '—'} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtreler</CardTitle>
        </CardHeader>
        <CardBody>
          <form className="grid gap-3 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6" onSubmit={onFilterSubmit}>
            <Input label="Tarih başlangıç" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            <Input label="Tarih bitiş" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">Alacak türü</label>
              <select className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm" value={alacakTuru} onChange={(e) => setAlacakTuru(e.target.value as '' | IcraAlacakTuruApi)}>
                <option value="">Tümü</option>
                {(Object.keys(ICRA_ALACAK_TURU_LABEL) as IcraAlacakTuruApi[]).map((k) => (
                  <option key={k} value={k}>{ICRA_ALACAK_TURU_LABEL[k]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">Durum</label>
              <select className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm" value={durum} onChange={(e) => setDurum(e.target.value as '' | IcraAlacakDurumApi)}>
                <option value="">Tümü</option>
                {(Object.keys(ICRA_ALACAK_DURUM_LABEL) as IcraAlacakDurumApi[]).map((k) => (
                  <option key={k} value={k}>{ICRA_ALACAK_DURUM_LABEL[k]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">Tahsilatı yapan personel</label>
              <select className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm" value={personelId} onChange={(e) => setPersonelId(e.target.value)}>
                <option value="">Tümü</option>
                {(personelQ.data?.items ?? []).map((p) => (
                  <option key={p.id} value={p.id}>{p.adSoyad}</option>
                ))}
              </select>
            </div>
            <Input label="Arama" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Borçlu, müvekkil, dosya…" />
            <div className="flex items-end">
              <Button type="submit" variant="outline">Filtrele</Button>
            </div>
          </form>
        </CardBody>
      </Card>

      <Card>
        <CardBody className="p-0">
          <Table>
            <THead>
              <TR>
                <TH className="w-10">#</TH>
                <TH>Borçlu / karşı taraf</TH>
                <TH>İlgili müvekkil / dosya</TH>
                <TH>Alacak türü</TH>
                <TH className="text-right">Toplam</TH>
                <TH className="text-right">Ödenen</TH>
                <TH className="text-right">Kalan</TH>
                <TH>Son tahsilatı yapan</TH>
                <TH className="text-center">Taksit</TH>
                <TH>Son durum</TH>
                <TH className="w-20">İşlem</TH>
              </TR>
            </THead>
            <TBody>
              {listQ.isLoading ? (
                <TableEmptyRow colSpan={11}>Yükleniyor…</TableEmptyRow>
              ) : items.length === 0 ? (
                <TableEmptyRow colSpan={11}>Kayıt bulunamadı.</TableEmptyRow>
              ) : (
                items.map((row, idx) => (
                  <ListeRow key={row.id} row={row} index={(page - 1) * limit + idx + 1} onOpen={() => setDetayId(row.id)} />
                ))
              )}
            </TBody>
          </Table>
        </CardBody>
      </Card>

      {totalPages > 1 ? (
        <div className="flex items-center justify-center gap-2 text-sm">
          <Button type="button" size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Önceki</Button>
          <span className="text-ink-muted">{page} / {totalPages}</span>
          <Button type="button" size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage((p) => p + 1)}>Sonraki</Button>
        </div>
      ) : null}

      {createOpen ? (
        <CreateAlacakModal
          onClose={() => setCreateOpen(false)}
          onSaved={() => {
            setCreateOpen(false)
            invalidate()
          }}
        />
      ) : null}

      {detayId ? (
        <DetayModal
          id={detayId}
          yonetici={yonetici}
          onClose={() => setDetayId(null)}
          onChanged={invalidate}
        />
      ) : null}
    </div>
  )
}

function ListeRow(props: { row: IcraTahsilatListeSatirDto; index: number; onOpen: () => void }): ReactElement {
  const { row, index, onOpen } = props
  const ilgili = [row.muvekkilAd, row.dosyaBaslik].filter(Boolean).join(' · ') || '—'
  return (
    <TR>
      <TD className="text-ink-muted">{index}</TD>
      <TD className="font-medium">{row.borcluAd}</TD>
      <TD className="max-w-[200px] truncate text-sm" title={ilgili}>{ilgili}</TD>
      <TD className="text-sm">{row.alacakTuruLabel}</TD>
      <TD className="text-right tabular-nums">{formatCurrencyTR(Number(row.toplamTutar))}</TD>
      <TD className="text-right tabular-nums">{formatCurrencyTR(Number(row.odenenToplam))}</TD>
      <TD className="text-right tabular-nums">{formatCurrencyTR(Number(row.kalanTutar))}</TD>
      <TD className="text-sm">{row.sonTahsilatciAd ?? row.tahsilatiYapanAd ?? '—'}</TD>
      <TD className="text-center">{row.taksitSayisi}</TD>
      <TD><Badge variant={durumBadge(row.durum)}>{row.durumLabel}</Badge></TD>
      <TD>
        <Button type="button" size="sm" variant="outline" onClick={onOpen}>Aç</Button>
      </TD>
    </TR>
  )
}

function CreateAlacakModal(props: { onClose: () => void; onSaved: () => void }): ReactElement {
  const [alacakTuru, setAlacakTuru] = useState<IcraAlacakTuruApi>('KARSI_TARAF_VEKALET')
  const [borcluAd, setBorcluAd] = useState('')
  const [muvekkilId, setMuvekkilId] = useState('')
  const [dosyaId, setDosyaId] = useState('')
  const [toplamTutar, setToplamTutar] = useState('')
  const [tahsilatTipi, setTahsilatTipi] = useState<IcraTahsilatTipiApi>('SADECE_TAKSIT')
  const [pesinatTutar, setPesinatTutar] = useState('')
  const [taksitSayisi, setTaksitSayisi] = useState('3')
  const [ilkVade, setIlkVade] = useState(todayInputDate())
  const [tahsilatTarihi, setTahsilatTarihi] = useState(todayInputDate())
  const [odemeYontemi, setOdemeYontemi] = useState<OfisKasaOdemeYontemiApi>('NAKIT')
  const [personelId, setPersonelId] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [err, setErr] = useState<string | null>(null)

  const pesinMod = tahsilatTipi === 'PESIN_TAHSIL'
  const pesinatMod = tahsilatTipi === 'PESINAT_TAKSIT'
  const personelZorunlu = pesinMod || pesinatMod

  const muvekkilQ = useQuery({ queryKey: ['muvekkiller', 'icra'], queryFn: () => listMuvekkiller({ page: 1, limit: 100 }) })
  const dosyaQ = useQuery({
    queryKey: ['dosyalar', muvekkilId],
    queryFn: () => listMuvekkilDosyalari(muvekkilId, { page: 1, limit: 100 }),
    enabled: Boolean(muvekkilId)
  })

  const saveMu = useMutation({
    mutationFn: createIcraTahsilat,
    onSuccess: props.onSaved,
    onError: (e) => setErr(e instanceof Error ? e.message : 'Kayıt başarısız')
  })

  function submit(e: FormEvent): void {
    e.preventDefault()
    setErr(null)
    const toplam = Number(toplamTutar.replace(',', '.'))
    if (!Number.isFinite(toplam) || toplam <= 0) {
      setErr('Geçerli toplam tutar girin.')
      return
    }
    if (personelZorunlu && !personelId) {
      setErr('Tahsilatı yapan personel seçin.')
      return
    }
    if (pesinatMod) {
      const pesinat = Number(pesinatTutar.replace(',', '.'))
      if (!Number.isFinite(pesinat) || pesinat <= 0) {
        setErr('Peşinat tutarı zorunludur.')
        return
      }
      if (pesinat > toplam) {
        setErr('Peşinat toplam tutarı aşamaz.')
        return
      }
    }
    const taksit = pesinMod ? 0 : Number(taksitSayisi)
    if (!pesinMod && (!Number.isFinite(taksit) || taksit < 1)) {
      setErr('Taksit sayısı en az 1 olmalıdır.')
      return
    }
    saveMu.mutate({
      alacakTuru,
      borcluAd: borcluAd.trim(),
      muvekkilId: muvekkilId || null,
      dosyaId: dosyaId || null,
      toplamTutar: toplam,
      tahsilatTipi,
      pesinatVar: pesinatMod,
      pesinatTutar: pesinatMod ? Number(pesinatTutar.replace(',', '.')) : 0,
      taksitSayisi: taksit,
      ilkVadeTarihi: pesinMod ? undefined : dateInputToIso(ilkVade),
      tahsilatTarihi: personelZorunlu ? dateInputToIso(tahsilatTarihi) : undefined,
      odemeYontemi,
      tahsilatiYapanPersonelId: personelId || null,
      aciklama: aciklama.trim() || null
    })
  }

  return (
    <ModalScrim onClose={props.onClose} align="top" wide zIndexClass="z-[200]" className="bg-black/45" innerAsDialog>
      <Card>
        <CardHeader><CardTitle>Yeni icra tahsilat alacağı</CardTitle></CardHeader>
        <CardBody>
          <form className="grid gap-4 md:grid-cols-2" onSubmit={submit}>
            {err ? <p className="col-span-full text-sm text-danger">{err}</p> : null}
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">Alacak türü</label>
              <select className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm" value={alacakTuru} onChange={(e) => setAlacakTuru(e.target.value as IcraAlacakTuruApi)}>
                {(Object.keys(ICRA_ALACAK_TURU_LABEL) as IcraAlacakTuruApi[]).map((k) => (
                  <option key={k} value={k}>{ICRA_ALACAK_TURU_LABEL[k]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">Tahsilat tipi</label>
              <select
                className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm"
                value={tahsilatTipi}
                onChange={(e) => setTahsilatTipi(e.target.value as IcraTahsilatTipiApi)}
              >
                <option value="PESIN_TAHSIL">Peşin tahsil edildi</option>
                <option value="PESINAT_TAKSIT">Peşinat + taksit</option>
                <option value="SADECE_TAKSIT">Sadece taksit</option>
              </select>
            </div>
            <Input label="Borçlu / karşı taraf adı" value={borcluAd} onChange={(e) => setBorcluAd(e.target.value)} required />
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">İlgili müvekkil (isteğe bağlı)</label>
              <select className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm" value={muvekkilId} onChange={(e) => { setMuvekkilId(e.target.value); setDosyaId('') }}>
                <option value="">—</option>
                {(muvekkilQ.data?.items ?? []).map((m) => (
                  <option key={m.id} value={m.id}>{m.gorunenAd}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">İlgili dosya (isteğe bağlı)</label>
              <select className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm" value={dosyaId} onChange={(e) => setDosyaId(e.target.value)} disabled={!muvekkilId}>
                <option value="">—</option>
                {(dosyaQ.data?.items ?? []).map((d) => (
                  <option key={d.id} value={d.id}>{d.konuBasligi}</option>
                ))}
              </select>
            </div>
            <Input label="Toplam alacak tutarı" value={toplamTutar} onChange={(e) => setToplamTutar(e.target.value)} placeholder="30000" />
            {!pesinMod ? (
              <>
                <Input label="Taksit sayısı" type="number" min={1} value={taksitSayisi} onChange={(e) => setTaksitSayisi(e.target.value)} />
                <Input label="İlk vade tarihi" type="date" value={ilkVade} onChange={(e) => setIlkVade(e.target.value)} />
              </>
            ) : null}
            {pesinatMod ? (
              <Input label="Peşinat tutarı" value={pesinatTutar} onChange={(e) => setPesinatTutar(e.target.value)} />
            ) : null}
            {personelZorunlu ? (
              <Input label="Tahsilat tarihi" type="date" value={tahsilatTarihi} onChange={(e) => setTahsilatTarihi(e.target.value)} />
            ) : null}
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">Ödeme yöntemi</label>
              <select className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm" value={odemeYontemi} onChange={(e) => setOdemeYontemi(e.target.value as OfisKasaOdemeYontemiApi)}>
                {ODEME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <TahsilatiYapanPersonelSelect
              value={personelId}
              onChange={setPersonelId}
              hint={personelZorunlu ? undefined : 'Peşinatsız alacakta isteğe bağlıdır; taksit ödemelerinde zorunludur.'}
            />
            <div className="col-span-full">
              <label className="mb-1 block text-xs font-semibold text-ink-muted">Açıklama / not</label>
              <textarea className="min-h-[72px] w-full rounded-md border border-border px-3 py-2 text-sm" value={aciklama} onChange={(e) => setAciklama(e.target.value)} />
            </div>
            <div className="col-span-full flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={props.onClose}>Vazgeç</Button>
              <Button type="submit" disabled={saveMu.isPending || (personelZorunlu && !personelId)}>
                {saveMu.isPending ? 'Kaydediliyor…' : 'Kaydet'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </ModalScrim>
  )
}

function DetayModal(props: { id: string; yonetici: boolean; onClose: () => void; onChanged: () => void }): ReactElement {
  const detayQ = useQuery({ queryKey: ['icra-tahsilat', props.id], queryFn: () => getIcraTahsilat(props.id) })
  const alacak = detayQ.data?.alacak

  const [odemeTaksit, setOdemeTaksit] = useState<IcraTahsilatTaksitDto | null>(null)
  const [duzenleTaksit, setDuzenleTaksit] = useState<IcraTahsilatTaksitDto | null>(null)
  const [gecmisTaksit, setGecmisTaksit] = useState<IcraTahsilatTaksitDto | null>(null)

  const refresh = (): void => {
    void detayQ.refetch()
    props.onChanged()
  }

  if (detayQ.isLoading) {
    return (
      <ModalScrim onClose={props.onClose} align="top" wide zIndexClass="z-[200]" className="bg-black/45" innerAsDialog>
        <Card><CardBody><p className="text-sm text-ink-muted">Yükleniyor…</p></CardBody></Card>
      </ModalScrim>
    )
  }

  if (!alacak) {
    return (
      <ModalScrim onClose={props.onClose} align="top" wide zIndexClass="z-[200]" className="bg-black/45" innerAsDialog>
        <Card><CardBody><AlertBox variant="danger" title="Hata">Kayıt bulunamadı.</AlertBox></CardBody></Card>
      </ModalScrim>
    )
  }

  return (
    <ModalScrim onClose={props.onClose} align="top" wide zIndexClass="z-[200]" className="bg-black/45" innerAsDialog>
      <Card className="max-h-[90dvh] overflow-y-auto">
        <CardHeader className="flex flex-row items-start justify-between gap-2">
          <div>
            <CardTitle>{alacak.borcluAd}</CardTitle>
            <p className="mt-1 text-sm text-ink-muted">{alacak.alacakTuruLabel} · <Badge variant={durumBadge(alacak.durum)}>{alacak.durumLabel}</Badge></p>
          </div>
          <Button type="button" size="sm" variant="outline" onClick={props.onClose}>Kapat</Button>
        </CardHeader>
        <CardBody className="space-y-4">
          {!alacak.ozet.taksitToplamiEslesiyor ? (
            <AlertBox variant="warning" title="Uyarı">Taksit toplamı alacak tutarıyla eşleşmiyor.</AlertBox>
          ) : null}

          <div className="grid gap-2 sm:grid-cols-3 lg:grid-cols-6 text-sm">
            <div><span className="text-ink-muted">Toplam alacak</span><p className="font-semibold tabular-nums">{formatCurrencyTR(Number(alacak.ozet.toplamAlacak))}</p></div>
            <div><span className="text-ink-muted">Taksit toplamı</span><p className="font-semibold tabular-nums">{formatCurrencyTR(Number(alacak.ozet.taksitToplami))}</p></div>
            <div><span className="text-ink-muted">Tahsil edilen</span><p className="font-semibold tabular-nums">{formatCurrencyTR(Number(alacak.ozet.tahsilEdilen))}</p></div>
            <div><span className="text-ink-muted">Kalan</span><p className="font-semibold tabular-nums">{formatCurrencyTR(Number(alacak.ozet.kalan))}</p></div>
            <div><span className="text-ink-muted">Dağıtılmamış fark</span><p className="font-semibold tabular-nums">{formatCurrencyTR(alacak.ozet.dagitilmamisFark)}</p></div>
            <div><span className="text-ink-muted">Durum</span><p className="font-semibold">{alacak.durumLabel}</p></div>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Taksitler</h3>
            <Table>
              <THead>
                <TR>
                  <TH>No</TH>
                  <TH>Vade</TH>
                  <TH className="text-right">Tutar</TH>
                  <TH className="text-right">Ödenen</TH>
                  <TH className="text-right">Kalan</TH>
                  <TH>Durum</TH>
                  <TH>Son ödeme</TH>
                  <TH>SMM</TH>
                  <TH>İşlem</TH>
                </TR>
              </THead>
              <TBody>
                {alacak.taksitler.map((t) => (
                  <TR key={t.id}>
                    <TD>{t.taksitNo}</TD>
                    <TD>{formatDateTR(t.vadeTarihi)}</TD>
                    <TD className="text-right tabular-nums">{formatCurrencyTR(Number(t.tutar))}</TD>
                    <TD className="text-right tabular-nums">{formatCurrencyTR(Number(t.odenenToplam))}</TD>
                    <TD className="text-right tabular-nums">{formatCurrencyTR(Number(t.kalanTutar))}</TD>
                    <TD className="text-xs">{t.durum}</TD>
                    <TD className="text-xs">{t.sonOdemeTarihi ? formatDateTR(t.sonOdemeTarihi) : '—'}</TD>
                    <TD className="text-xs">{t.smmDurumu}</TD>
                    <TD>
                      <div className={tableActionsFlexRow}>
                        {Number(t.kalanTutar) > 0 && !alacak.iptalMi ? (
                          <button type="button" className={tableActionButtonShrinkClass} title="Ödeme al" onClick={() => setOdemeTaksit(t)}>₺</button>
                        ) : null}
                        <button type="button" className={tableActionButtonShrinkClass} title="Ödeme geçmişi" onClick={() => setGecmisTaksit(t)}>⏱</button>
                        {!alacak.iptalMi ? (
                          <button type="button" className={tableActionButtonShrinkClass} title="Taksit düzenle" onClick={() => setDuzenleTaksit(t)}>✎</button>
                        ) : null}
                        {props.yonetici && Number(t.odenenToplam) === 0 ? (
                          <TaksitSilBtn taksitId={t.id} onDone={refresh} />
                        ) : null}
                        {t.smmBekleyenOdemeId ? (
                          <button
                            type="button"
                            className={tableActionButtonShrinkClass}
                            title="SMM Kesildi"
                            onClick={() => void markIcraOdemeSmmKesildi(t.smmBekleyenOdemeId!).then(refresh)}
                          >
                            ✓
                          </button>
                        ) : null}
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Ödeme geçmişi</h3>
            <Table>
              <THead>
                <TR>
                  <TH>Tarih</TH>
                  <TH className="text-right">Tutar</TH>
                  <TH>Yöntem</TH>
                  <TH>Tahsilatı yapan</TH>
                  <TH>SMM</TH>
                  <TH>Açıklama</TH>
                </TR>
              </THead>
              <TBody>
                {alacak.odemeler.length === 0 ? (
                  <TableEmptyRow colSpan={6}>Ödeme yok.</TableEmptyRow>
                ) : (
                  alacak.odemeler.map((o) => (
                    <TR key={o.id}>
                      <TD>{formatDateTR(o.odemeTarihi)}</TD>
                      <TD className="text-right tabular-nums">{formatCurrencyTR(Number(o.tutar))}</TD>
                      <TD>{o.odemeYontemi}</TD>
                      <TD className="text-sm">{o.tahsilatiYapanAd ?? '—'}</TD>
                      <TD>{o.smmKesildiMi ? 'Kesildi' : 'Bekliyor'}</TD>
                      <TD className="max-w-[200px] truncate">{o.aciklama ?? '—'}</TD>
                    </TR>
                  ))
                )}
              </TBody>
            </Table>
          </div>
        </CardBody>
      </Card>

      {odemeTaksit ? (
        <OdemeModal alacak={alacak} taksit={odemeTaksit} onClose={() => setOdemeTaksit(null)} onSaved={() => { setOdemeTaksit(null); refresh() }} />
      ) : null}
      {duzenleTaksit ? (
        <TaksitDuzenleModal taksit={duzenleTaksit} onClose={() => setDuzenleTaksit(null)} onSaved={() => { setDuzenleTaksit(null); refresh() }} />
      ) : null}
      {gecmisTaksit ? (
        <GecmisModal alacakId={alacak.id} taksit={gecmisTaksit} onClose={() => setGecmisTaksit(null)} />
      ) : null}
    </ModalScrim>
  )
}

function TaksitSilBtn(props: { taksitId: string; onDone: () => void }): ReactElement {
  const mu = useMutation({ mutationFn: deleteIcraTaksit, onSuccess: props.onDone })
  return (
    <button type="button" className={tableActionButtonShrinkClass} title="Sil" disabled={mu.isPending} onClick={() => mu.mutate(props.taksitId)}>🗑</button>
  )
}

function OdemeModal(props: { alacak: IcraTahsilatDetayDto; taksit: IcraTahsilatTaksitDto; onClose: () => void; onSaved: () => void }): ReactElement {
  const { session } = useAuth()
  const yonetici = isYonetici(session?.user.role)
  const [tutar, setTutar] = useState(props.taksit.kalanTutar)
  const [tarih, setTarih] = useState(todayInputDate())
  const [odemeYontemi, setOdemeYontemi] = useState<OfisKasaOdemeYontemiApi>(props.alacak.varsayilanOdemeYontemi)
  const [personelId, setPersonelId] = useState('')
  const [aciklama, setAciklama] = useState('')
  const [err, setErr] = useState<string | null>(null)

  const bagliQ = useQuery({
    queryKey: ['prim-personel', 'bagli-ben', 'icra-odeme'],
    queryFn: getBagliPrimPersonel
  })

  useEffect(() => {
    if (personelId || !bagliQ.data?.personel?.id) return
    setPersonelId(bagliQ.data.personel.id)
  }, [bagliQ.data, personelId])

  const saveMu = useMutation({
    mutationFn: () =>
      createIcraTaksitOdeme(props.alacak.id, props.taksit.id, {
        tutar: Number(tutar.replace(',', '.')),
        odemeTarihi: dateInputToIso(tarih),
        odemeYontemi,
        tahsilatiYapanPersonelId: personelId || null,
        aciklama: aciklama.trim() || null
      }),
    onSuccess: props.onSaved,
    onError: (e) => setErr(e instanceof Error ? e.message : 'Hata')
  })

  return (
    <ModalScrim onClose={props.onClose} align="top" zIndexClass="z-[200]" className="bg-black/45" innerAsDialog>
      <Card>
        <CardHeader><CardTitle>Taksit ödemesi al — Taksit {props.taksit.taksitNo}</CardTitle></CardHeader>
        <CardBody className="space-y-3">
          {err ? <p className="text-sm text-danger">{err}</p> : null}
          <Input label="Tutar" value={tutar} onChange={(e) => setTutar(e.target.value)} />
          <Input label="Tarih" type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} />
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">Ödeme yöntemi</label>
            <select className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm" value={odemeYontemi} onChange={(e) => setOdemeYontemi(e.target.value as OfisKasaOdemeYontemiApi)}>
              {ODEME_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
          <TahsilatiYapanPersonelSelect value={personelId} onChange={setPersonelId} required />
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">Açıklama / not</label>
            <textarea className="min-h-[60px] w-full rounded-md border border-border px-3 py-2 text-sm" value={aciklama} onChange={(e) => setAciklama(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={props.onClose}>Vazgeç</Button>
            <Button type="button" disabled={saveMu.isPending || (yonetici && !personelId)} onClick={() => saveMu.mutate()}>Ödemeyi Kaydet</Button>
          </div>
        </CardBody>
      </Card>
    </ModalScrim>
  )
}

function TaksitDuzenleModal(props: { taksit: IcraTahsilatTaksitDto; onClose: () => void; onSaved: () => void }): ReactElement {
  const [vade, setVade] = useState(props.taksit.vadeTarihi.slice(0, 10))
  const [tutar, setTutar] = useState(props.taksit.tutar)
  const [aciklama, setAciklama] = useState(props.taksit.aciklama ?? '')
  const [err, setErr] = useState<string | null>(null)

  const saveMu = useMutation({
    mutationFn: () =>
      patchIcraTaksit(props.taksit.id, {
        vadeTarihi: dateInputToIso(vade),
        tutar: Number(tutar.replace(',', '.')),
        aciklama: aciklama.trim() || null
      }),
    onSuccess: props.onSaved,
    onError: (e) => setErr(e instanceof Error ? e.message : 'Hata')
  })

  const tamOdendi = Number(props.taksit.odenenToplam) >= Number(props.taksit.tutar) - 0.001

  return (
    <ModalScrim onClose={props.onClose} align="top" zIndexClass="z-[200]" className="bg-black/45" innerAsDialog>
      <Card>
        <CardHeader><CardTitle>Taksit düzenle — No {props.taksit.taksitNo}</CardTitle></CardHeader>
        <CardBody className="space-y-3">
          {err ? <p className="text-sm text-danger">{err}</p> : null}
          <Input label="Vade tarihi" type="date" value={vade} onChange={(e) => setVade(e.target.value)} />
          <Input label="Taksit tutarı" value={tutar} onChange={(e) => setTutar(e.target.value)} disabled={tamOdendi} />
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">Açıklama</label>
            <textarea className="min-h-[60px] w-full rounded-md border border-border px-3 py-2 text-sm" value={aciklama} onChange={(e) => setAciklama(e.target.value)} />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={props.onClose}>Vazgeç</Button>
            <Button type="button" disabled={saveMu.isPending} onClick={() => saveMu.mutate()}>Kaydet</Button>
          </div>
        </CardBody>
      </Card>
    </ModalScrim>
  )
}

function GecmisModal(props: { alacakId: string; taksit: IcraTahsilatTaksitDto; onClose: () => void }): ReactElement {
  const q = useQuery({
    queryKey: ['icra-odeme-gecmis', props.taksit.id],
    queryFn: () => listIcraTaksitOdemeler(props.alacakId, props.taksit.id)
  })

  return (
    <ModalScrim onClose={props.onClose} align="top" zIndexClass="z-[200]" className="bg-black/45" innerAsDialog>
      <Card>
        <CardHeader><CardTitle>Ödeme geçmişi — Taksit {props.taksit.taksitNo}</CardTitle></CardHeader>
        <CardBody>
          {q.isLoading ? <p className="text-sm text-ink-muted">Yükleniyor…</p> : null}
          {(q.data?.items ?? []).length === 0 ? <p className="text-sm text-ink-muted">Ödeme yok.</p> : (
            <ul className="space-y-2 text-sm">
              {q.data!.items.map((o) => (
                <li key={o.id} className="rounded border border-border px-3 py-2">
                  <div className="flex justify-between gap-2">
                    <span>{formatDateTR(o.odemeTarihi)}</span>
                    <span className="font-semibold tabular-nums">{formatCurrencyTR(Number(o.tutar))}</span>
                  </div>
                  <p className="text-xs text-ink-muted">
                    Tahsilatı yapan: {o.tahsilatiYapanAd ?? '—'} · SMM: {o.smmKesildiMi ? 'Kesildi' : 'Bekliyor'}
                  </p>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex justify-end">
            <Button type="button" variant="outline" onClick={props.onClose}>Kapat</Button>
          </div>
        </CardBody>
      </Card>
    </ModalScrim>
  )
}
