import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useState } from 'react'
import { createPrimKurali, listPrimKurallari, pasifPrimKurali, updatePrimKurali } from '../../api/prim'
import { listAktifPrimPersonel } from '../../api/primPersonel'
import { AlertBox, Badge, Button, Card, CardBody, CardHeader, CardTitle, Input, ModalScrim } from '../ui'
import { kapsamLabel, hesaplamaTipiLabel } from './primLabels'
import type { CreatePrimKuralPayload, PrimHesaplamaTipiApi, PrimKuralDto, PrimKuralKapsamApi } from '../../types/prim'

type Props = {
  onClose: () => void
  prefillPrimPersonelId?: string | null
  onSaved?: () => void
}

export function PrimKuralManageModal(props: Props): ReactElement {
  const { onClose, prefillPrimPersonelId, onSaved } = props
  const qc = useQueryClient()
  const [edit, setEdit] = useState<PrimKuralDto | null | 'new'>(null)

  const q = useQuery({ queryKey: ['prim-kurallar'], queryFn: listPrimKurallari })
  const pasifMu = useMutation({
    mutationFn: pasifPrimKurali,
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['prim-kurallar'] })
      onSaved?.()
    }
  })

  if (edit) {
    return (
      <PrimKuralFormModal
        initial={edit === 'new' ? null : edit}
        prefillPrimPersonelId={prefillPrimPersonelId}
        onClose={() => setEdit(null)}
        onSaved={() => {
          setEdit(null)
          void qc.invalidateQueries({ queryKey: ['prim-kurallar'] })
          onSaved?.()
        }}
      />
    )
  }

  return (
    <ModalScrim onClose={onClose}>
      <Card className="mx-auto w-full max-w-lg max-h-[85dvh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <CardTitle>Prim kuralları</CardTitle>
          <Button type="button" size="sm" onClick={() => setEdit('new')}>
            Yeni kural
          </Button>
        </CardHeader>
        <CardBody className="space-y-2">
          {q.isError ? <AlertBox variant="danger" title="Hata">{(q.error as Error).message}</AlertBox> : null}
          {q.isLoading ? <p className="text-sm text-ink-muted">Yükleniyor…</p> : null}
          {(q.data?.items ?? []).length === 0 && !q.isLoading ? (
            <p className="text-sm text-ink-muted">Henüz prim kuralı yok.</p>
          ) : null}
          {(q.data?.items ?? []).map((k) => (
            <div key={k.id} className="rounded-lg border border-border px-3 py-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold">{k.ad}</p>
                  <p className="text-[11px] text-ink-muted">
                    {kapsamLabel(k.kapsam)}
                    {k.userAdSoyad ? ` · ${k.userAdSoyad}` : k.primPersonelAdSoyad ? ` · ${k.primPersonelAdSoyad}` : ''} · {hesaplamaTipiLabel(k.hesaplamaTipi)}
                  </p>
                </div>
                {k.aktifMi ? <Badge variant="success">Aktif</Badge> : <Badge variant="default">Pasif</Badge>}
              </div>
              <div className="mt-2 flex gap-2">
                <Button type="button" size="sm" variant="outline" onClick={() => setEdit(k)}>
                  Düzenle
                </Button>
                {k.aktifMi ? (
                  <Button type="button" size="sm" variant="outline" disabled={pasifMu.isPending} onClick={() => pasifMu.mutate(k.id)}>
                    Pasifleştir
                  </Button>
                ) : null}
              </div>
            </div>
          ))}
          <div className="flex justify-end pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Kapat
            </Button>
          </div>
        </CardBody>
      </Card>
    </ModalScrim>
  )
}

type KademeForm = { minTutar: string; maxTutar: string; oranYuzde: string }

function emptyKademe(): KademeForm {
  return { minTutar: '', maxTutar: '', oranYuzde: '' }
}

function PrimKuralFormModal(props: {
  initial: PrimKuralDto | null
  prefillPrimPersonelId?: string | null
  onClose: () => void
  onSaved: () => void
}): ReactElement {
  const { initial, prefillPrimPersonelId, onClose, onSaved } = props
  const [ad, setAd] = useState(initial?.ad ?? '')
  const [kapsam, setKapsam] = useState<PrimKuralKapsamApi>(
    initial?.kapsam ?? (prefillPrimPersonelId ? 'USER_SPECIFIC' : 'TENANT_DEFAULT')
  )
  const [primPersonelId, setPrimPersonelId] = useState(initial?.primPersonelId ?? prefillPrimPersonelId ?? '')
  const [hesaplamaTipi, setHesaplamaTipi] = useState<PrimHesaplamaTipiApi>(initial?.hesaplamaTipi ?? 'PROGRESSIVE')
  const [dosya, setDosya] = useState(initial?.dosyaTahsilatMi ?? true)
  const [vekalet, setVekalet] = useState(initial?.vekaletTahsilatMi ?? true)
  const [ofis, setOfis] = useState(initial?.ofisKasaGelirMi ?? true)
  const [icra, setIcra] = useState(initial?.icraTahsilatMi ?? false)
  const [kademeler, setKademeler] = useState<KademeForm[]>(
    initial?.kademeler.length
      ? initial.kademeler.map((k) => ({ minTutar: k.minTutar, maxTutar: k.maxTutar ?? '', oranYuzde: k.oranYuzde }))
      : []
  )
  const [err, setErr] = useState<string | null>(null)

  const personelQ = useQuery({
    queryKey: ['prim-personel', 'aktif', 'prim-kural'],
    queryFn: listAktifPrimPersonel
  })

  const saveMu = useMutation({
    mutationFn: async (body: CreatePrimKuralPayload) => {
      if (initial) return updatePrimKurali(initial.id, body)
      return createPrimKurali(body)
    },
    onSuccess: onSaved
  })

  const submit = (): void => {
    setErr(null)
    if (ad.trim().length < 2) {
      setErr('Kural adı en az 2 karakter olmalıdır.')
      return
    }
    if (kapsam === 'USER_SPECIFIC' && !primPersonelId) {
      setErr('Personel özel kural için personel seçin.')
      return
    }
    if (kademeler.length === 0) {
      setErr('En az bir prim kademesi eklemelisiniz.')
      return
    }
    const hasIncompleteRow = kademeler.some((k) => !k.minTutar.trim() || !k.oranYuzde.trim())
    if (hasIncompleteRow) {
      setErr('Kademe başlangıç, bitiş ve oran alanlarını kontrol edin.')
      return
    }
    try {
      const parsed = kademeler.map((k, i) => {
        const min = Number(k.minTutar.replace(',', '.'))
        const maxRaw = k.maxTutar.trim()
        const max = maxRaw ? Number(maxRaw.replace(',', '.')) : null
        const oran = Number(k.oranYuzde.replace(',', '.'))
        if (!Number.isFinite(min) || min < 0) throw new Error(`Kademe ${i + 1}: geçersiz başlangıç tutarı.`)
        if (max != null && (!Number.isFinite(max) || max <= min)) {
          throw new Error(`Kademe ${i + 1}: bitiş tutarı başlangıçtan büyük olmalıdır.`)
        }
        if (!Number.isFinite(oran) || oran < 0 || oran > 100) {
          throw new Error(`Kademe ${i + 1}: oran 0–100 arasında olmalıdır.`)
        }
        return { minTutar: min, maxTutar: max, oranYuzde: oran, siraNo: i }
      })
      saveMu.mutate({
        ad: ad.trim(),
        aktifMi: true,
        kapsam,
        primPersonelId: kapsam === 'USER_SPECIFIC' ? primPersonelId : null,
        userId: null,
        hesaplamaTipi,
        dosyaTahsilatMi: dosya,
        vekaletTahsilatMi: vekalet,
        ofisKasaGelirMi: ofis,
        icraTahsilatMi: icra,
        kademeler: parsed
      })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Geçersiz kademe.')
    }
  }

  return (
    <ModalScrim onClose={onClose}>
      <Card className="mx-auto w-full max-w-2xl max-h-[90dvh] overflow-y-auto">
        <CardHeader>
          <CardTitle>{initial ? 'Prim kuralını düzenle' : 'Yeni prim kuralı'}</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {err ? <p className="text-xs text-danger">{err}</p> : null}
          {saveMu.error ? <AlertBox variant="danger" title="Hata">{(saveMu.error as Error).message}</AlertBox> : null}
          <Input label="Kural adı" value={ad} onChange={(e) => setAd(e.target.value)} />
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">Kural tipi</label>
            <select className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm" value={kapsam} onChange={(e) => setKapsam(e.target.value as PrimKuralKapsamApi)}>
              <option value="TENANT_DEFAULT">Büro varsayılan</option>
              <option value="USER_SPECIFIC">Personel özel</option>
            </select>
          </div>
          {kapsam === 'USER_SPECIFIC' ? (
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">Personel</label>
              <select className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm" value={primPersonelId} onChange={(e) => setPrimPersonelId(e.target.value)}>
                <option value="">Seçin…</option>
                {(personelQ.data?.items ?? []).map((p) => (
                  <option key={p.id} value={p.id}>{p.adSoyad}{p.unvan ? ` · ${p.unvan}` : ''}</option>
                ))}
              </select>
            </div>
          ) : null}
          <div>
            <label className="mb-1 block text-xs font-semibold text-ink-muted">Hesaplama tipi</label>
            <select className="h-9 w-full rounded-md border border-border bg-white px-3 text-sm" value={hesaplamaTipi} onChange={(e) => setHesaplamaTipi(e.target.value as PrimHesaplamaTipiApi)}>
              <option value="TOTAL_BRACKET">Toplam tutara tek oran</option>
              <option value="PROGRESSIVE">Kademeli dilim</option>
            </select>
          </div>
          <fieldset className="space-y-1 rounded-md border border-border p-3 text-xs">
            <legend className="px-1 font-semibold text-ink-muted">Tahsilat türleri</legend>
            <label className="flex items-center gap-2"><input type="checkbox" checked={dosya} onChange={(e) => setDosya(e.target.checked)} /> Dosya avans</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={vekalet} onChange={(e) => setVekalet(e.target.checked)} /> Vekalet ücreti tahsilatı</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={ofis} onChange={(e) => setOfis(e.target.checked)} /> Manuel ofis geliri</label>
            <label className="flex items-center gap-2"><input type="checkbox" checked={icra} onChange={(e) => setIcra(e.target.checked)} /> İcra tahsilat</label>
          </fieldset>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink-muted">Kademeler</span>
              <Button type="button" size="sm" variant="outline" onClick={() => setKademeler((k) => [...k, emptyKademe()])}>
                Ekle
              </Button>
            </div>
            {kademeler.length === 0 ? (
              <p className="rounded-md border border-dashed border-border bg-surface-muted/30 px-3 py-2 text-xs text-ink-muted">
                Henüz kademe eklenmedi. Prim hesabı için kademe ekleyin.
              </p>
            ) : null}
            {kademeler.map((k, idx) => (
              <div key={idx} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-3">
                  <Input
                    label="Başlangıç"
                    placeholder="100000"
                    value={k.minTutar}
                    onChange={(e) => setKademeler((rows) => rows.map((r, i) => (i === idx ? { ...r, minTutar: e.target.value } : r)))}
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    label="Bitiş"
                    placeholder="200000"
                    value={k.maxTutar}
                    onChange={(e) => setKademeler((rows) => rows.map((r, i) => (i === idx ? { ...r, maxTutar: e.target.value } : r)))}
                  />
                </div>
                <div className="col-span-3">
                  <Input
                    label="%"
                    placeholder="4"
                    value={k.oranYuzde}
                    onChange={(e) => setKademeler((rows) => rows.map((r, i) => (i === idx ? { ...r, oranYuzde: e.target.value } : r)))}
                  />
                </div>
                <div className="col-span-3 pb-1">
                  <Button type="button" variant="outline" size="sm" onClick={() => setKademeler((rows) => rows.filter((_, i) => i !== idx))}>
                    Sil
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={saveMu.isPending}>Vazgeç</Button>
            <Button type="button" onClick={submit} disabled={saveMu.isPending}>{saveMu.isPending ? 'Kaydediliyor…' : 'Kaydet'}</Button>
          </div>
        </CardBody>
      </Card>
    </ModalScrim>
  )
}
