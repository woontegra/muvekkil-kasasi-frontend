import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useMemo, useState } from 'react'
import {
  createWhatsAppPaketTalebi,
  getWhatsAppMesajKredisi,
  listWhatsAppPaketTalepleri,
  WHATSAPP_MESAJ_KREDI_QUERY_KEY,
  WHATSAPP_MESAJ_TALEP_QUERY_KEY,
  type WhatsAppKrediDurum,
  type WhatsAppMesajPaketiDto,
  type WhatsAppMesajPaketTalepDto
} from '../../../api/whatsappMesajKredi'
import { friendlyClientErrorMessage } from '../../../api/client'
import {
  WHATSAPP_PAKET_ODEME_BILGI_METNI,
  WHATSAPP_PAKET_ODEME_REFERANS_BILGI_METNI
} from '../../../config/whatsappPaketOdemeHesaplari'
import { useToast } from '../../../toast'
import { Badge, Button } from '../../ui'
import { ModalShell } from '../shared'
import { formatDateTimeTR } from '../../../utils/formatters'
import {
  WhatsappPaketOdemeHesaplariListesi,
  WhatsappPaketOdemeReferansiKutusu
} from './WhatsappPaketOdemeBilgileri'

function durumTone(durum: WhatsAppKrediDurum): string {
  if (durum === 'TUKENDI') return 'border-danger/40 bg-danger-soft/70'
  if (durum === 'KRITIK') return 'border-warning/40 bg-warning-soft/80'
  if (durum === 'DUSUK') return 'border-warning/30 bg-warning-soft/40'
  return 'border-border bg-white'
}

function durumMesaji(durum: WhatsAppKrediDurum): string | null {
  if (durum === 'TUKENDI') {
    return 'WhatsApp mesaj hakkınız tükendi. Otomatik gönderimler beklemeye alındı.'
  }
  if (durum === 'KRITIK') return 'Mesaj hakkınız kritik seviyede.'
  if (durum === 'DUSUK') return 'Mesaj hakkınız azalıyor.'
  return null
}

function formatFiyat(tl: number): string {
  return `${tl.toLocaleString('tr-TR')} TL`
}

function talepDurumLabel(durum: string): string {
  if (durum === 'BEKLIYOR') return 'Bekliyor'
  if (durum === 'ONAYLANDI') return 'Onaylandı'
  if (durum === 'REDDEDILDI') return 'Reddedildi'
  if (durum === 'IPTAL') return 'İptal edildi'
  return durum
}

function talepDurumBadge(durum: string): ReactElement {
  const variant =
    durum === 'BEKLIYOR'
      ? 'warning'
      : durum === 'ONAYLANDI'
        ? 'success'
        : durum === 'REDDEDILDI'
          ? 'danger'
          : 'default'
  return (
    <Badge variant={variant} className="normal-case tracking-normal">
      {talepDurumLabel(durum)}
    </Badge>
  )
}

function SecilenPaketOzeti(props: { mesajAdedi: number; fiyatTL: number }): ReactElement {
  return (
    <div className="rounded-lg border border-border bg-surface-muted/40 px-3.5 py-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Seçilen Paket</p>
      <p className="mt-1 text-base font-semibold text-ink">
        {props.mesajAdedi.toLocaleString('tr-TR')} Mesaj
        <span className="font-normal text-ink-muted"> · </span>
        <span className="font-semibold">{formatFiyat(props.fiyatTL)}</span>
      </p>
    </div>
  )
}

function OdemeOzetiPanel(props: {
  title: string
  mesajAdedi: number
  fiyatTL: number
  paymentReference: string
  onCopied: (msg: string) => void
}): ReactElement {
  return (
    <div className="space-y-3.5">
      <div>
        <p className="text-base font-semibold text-ink">{props.title}</p>
        <p className="mt-2 text-sm text-ink">
          Paket: {props.mesajAdedi.toLocaleString('tr-TR')} mesaj
        </p>
        <p className="text-sm text-ink">Ödenecek Tutar: {formatFiyat(props.fiyatTL)}</p>
      </div>
      <WhatsappPaketOdemeReferansiKutusu
        paymentReference={props.paymentReference}
        bilgilendirme={WHATSAPP_PAKET_ODEME_REFERANS_BILGI_METNI}
        onCopied={props.onCopied}
      />
      <p className="text-sm leading-relaxed text-ink-muted">{WHATSAPP_PAKET_ODEME_BILGI_METNI}</p>
      <WhatsappPaketOdemeHesaplariListesi onCopied={props.onCopied} />
    </div>
  )
}

function TalepGecmisiSatiri(props: {
  talep: WhatsAppMesajPaketTalepDto
  onShowDetail: (t: WhatsAppMesajPaketTalepDto) => void
}): ReactElement {
  const t = props.talep
  return (
    <li className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-surface-muted/60 px-2.5 py-2 text-sm">
      <div className="min-w-0">
        <p className="font-medium text-ink">
          {t.mesajAdedi.toLocaleString('tr-TR')} mesaj — {formatFiyat(t.fiyatTL)}
        </p>
        <p className="text-xs text-ink-muted">
          Ref: <span className="font-mono">{t.paymentReference}</span>
          {' · '}
          {formatDateTimeTR(t.createdAt)}
        </p>
        {t.durum === 'BEKLIYOR' ? (
          <button
            type="button"
            className="mt-1 text-xs font-medium text-primary underline-offset-2 hover:underline"
            onClick={() => props.onShowDetail(t)}
          >
            Ödeme bilgilerini göster
          </button>
        ) : null}
      </div>
      {talepDurumBadge(t.durum)}
    </li>
  )
}

function TalepGecmisiModal(props: {
  open: boolean
  talepler: WhatsAppMesajPaketTalepDto[]
  onClose: () => void
  onShowDetail: (t: WhatsAppMesajPaketTalepDto) => void
}): ReactElement | null {
  if (!props.open) return null
  return (
    <ModalShell
      title="WhatsApp Mesaj Paketi Talep Geçmişi"
      onClose={props.onClose}
      overlayClassName="z-[60]"
      panelClassName="max-w-lg"
      bodyClassName="py-4"
    >
      {props.talepler.length === 0 ? (
        <p className="text-sm text-ink-muted">Henüz talep kaydınız yok.</p>
      ) : (
        <ul className="max-h-[min(55dvh,22rem)] space-y-1.5 overflow-y-auto overscroll-contain pr-0.5">
          {props.talepler.map((t) => (
            <TalepGecmisiSatiri key={t.id} talep={t} onShowDetail={props.onShowDetail} />
          ))}
        </ul>
      )}
      <div className="mt-3 flex justify-end">
        <Button type="button" size="sm" variant="ghost" onClick={props.onClose}>
          Kapat
        </Button>
      </div>
    </ModalShell>
  )
}

function PaketModal(props: {
  open: boolean
  onClose: () => void
  paketler: WhatsAppMesajPaketiDto[]
  bekleyenPackageIds: string[]
  submittingId: string | null
  onRequest: (paket: WhatsAppMesajPaketiDto) => void
  successTalep: WhatsAppMesajPaketTalepDto | null
  detailTalep: WhatsAppMesajPaketTalepDto | null
  onShowDetail: (t: WhatsAppMesajPaketTalepDto) => void
  onClearSuccess: () => void
  onClearDetail: () => void
  onOpenHistory: () => void
  selectedPackageId: string | null
  onSelectPackage: (id: string | null) => void
  onCopied: (msg: string) => void
}): ReactElement | null {
  if (!props.open) return null
  const bekleyen = new Set(props.bekleyenPackageIds)
  const selected = props.paketler.find((p) => p.id === props.selectedPackageId) ?? null

  if (props.successTalep) {
    return (
      <ModalShell
        title="Ek Mesaj Paketi Satın Al"
        onClose={props.onClose}
        panelClassName="max-w-xl"
        bodyClassName="py-5"
      >
        <OdemeOzetiPanel
          title="Talebiniz oluşturuldu"
          mesajAdedi={props.successTalep.mesajAdedi}
          fiyatTL={props.successTalep.fiyatTL}
          paymentReference={props.successTalep.paymentReference}
          onCopied={props.onCopied}
        />
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => {
              props.onClearSuccess()
            }}
          >
            Paket listesine dön
          </Button>
          <Button type="button" size="sm" onClick={props.onClose}>
            Kapat
          </Button>
        </div>
      </ModalShell>
    )
  }

  if (props.detailTalep) {
    return (
      <ModalShell
        title="Ödeme Bilgileri"
        onClose={props.onClose}
        panelClassName="max-w-xl"
        bodyClassName="py-5"
      >
        <OdemeOzetiPanel
          title="Bekleyen talep — ödeme bilgileri"
          mesajAdedi={props.detailTalep.mesajAdedi}
          fiyatTL={props.detailTalep.fiyatTL}
          paymentReference={props.detailTalep.paymentReference}
          onCopied={props.onCopied}
        />
        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <Button type="button" variant="ghost" size="sm" onClick={props.onClearDetail}>
            Geri
          </Button>
          <Button type="button" size="sm" onClick={props.onClose}>
            Kapat
          </Button>
        </div>
      </ModalShell>
    )
  }

  return (
    <ModalShell
      title="Ek Mesaj Paketi Satın Al"
      onClose={props.onClose}
      panelClassName="max-w-xl sm:max-h-[min(90dvh,42rem)]"
      bodyClassName="py-5"
    >
      <p className="text-sm leading-relaxed text-ink-muted">
        Ek mesaj paketi seçin. Ödeme sonrası onayla hakkınız eklenir.
      </p>

      <ul className="mt-4 space-y-2.5">
        {props.paketler.map((p) => {
          const pending = bekleyen.has(p.id)
          const selectedRow = props.selectedPackageId === p.id
          return (
            <li key={p.id}>
              <button
                type="button"
                disabled={pending || !p.aktif}
                onClick={() => props.onSelectPackage(p.id)}
                className={`flex w-full flex-wrap items-center justify-between gap-3 rounded-lg border px-3.5 py-3 text-left transition ${
                  selectedRow
                    ? 'border-primary bg-primary/5 ring-1 ring-primary/30'
                    : 'border-border bg-white hover:border-primary/40'
                } ${pending || !p.aktif ? 'cursor-default opacity-90' : ''}`}
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink sm:text-[15px]">
                    {p.mesajAdedi.toLocaleString('tr-TR')} mesaj — {formatFiyat(p.fiyatTL)}
                  </p>
                  {pending ? (
                    <p className="mt-1 text-xs font-medium text-warning-ink">Talebiniz bekliyor</p>
                  ) : null}
                </div>
                {pending ? (
                  <Badge variant="warning" className="normal-case tracking-normal">
                    Bekliyor
                  </Badge>
                ) : selectedRow ? (
                  <Badge variant="success" className="normal-case tracking-normal">
                    Seçildi
                  </Badge>
                ) : null}
              </button>
            </li>
          )
        })}
      </ul>

      {selected && !bekleyen.has(selected.id) ? (
        <div className="mt-5 space-y-3.5">
          <SecilenPaketOzeti mesajAdedi={selected.mesajAdedi} fiyatTL={selected.fiyatTL} />
          <WhatsappPaketOdemeHesaplariListesi onCopied={props.onCopied} />
          <p className="text-sm leading-relaxed text-ink-muted">{WHATSAPP_PAKET_ODEME_BILGI_METNI}</p>
          <Button
            type="button"
            disabled={!selected.aktif || Boolean(props.submittingId)}
            onClick={() => props.onRequest(selected)}
          >
            {props.submittingId === selected.id
              ? 'Gönderiliyor…'
              : 'Satın Alma Talebi Oluştur'}
          </Button>
        </div>
      ) : (
        <div className="mt-5 space-y-3.5">
          <WhatsappPaketOdemeHesaplariListesi onCopied={props.onCopied} />
          <p className="text-sm text-ink-muted">Ödenecek tutar için bir paket seçin.</p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <button
          type="button"
          className="text-sm font-medium text-ink-muted underline-offset-2 hover:text-ink hover:underline"
          onClick={props.onOpenHistory}
          disabled={Boolean(props.submittingId)}
        >
          Talep Geçmişim
        </button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={props.onClose}
          disabled={Boolean(props.submittingId)}
        >
          Kapat
        </Button>
      </div>
    </ModalShell>
  )
}

export function WhatsappMesajHakkiCard(): ReactElement | null {
  const [paketOpen, setPaketOpen] = useState(false)
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  const [successTalep, setSuccessTalep] = useState<WhatsAppMesajPaketTalepDto | null>(null)
  const [detailTalep, setDetailTalep] = useState<WhatsAppMesajPaketTalepDto | null>(null)
  const [historyOpen, setHistoryOpen] = useState(false)
  const toast = useToast()
  const qc = useQueryClient()

  const q = useQuery({
    queryKey: WHATSAPP_MESAJ_KREDI_QUERY_KEY,
    queryFn: getWhatsAppMesajKredisi,
    staleTime: 30_000
  })

  const taleplerQ = useQuery({
    queryKey: WHATSAPP_MESAJ_TALEP_QUERY_KEY,
    queryFn: () => listWhatsAppPaketTalepleri(),
    enabled: paketOpen || historyOpen,
    staleTime: 15_000
  })

  const bekleyenByPackage = useMemo(() => {
    const map = new Map<string, WhatsAppMesajPaketTalepDto>()
    for (const t of taleplerQ.data?.items ?? []) {
      if (t.durum === 'BEKLIYOR') map.set(t.packageId, t)
    }
    return map
  }, [taleplerQ.data?.items])

  const talepMu = useMutation({
    mutationFn: (packageId: string) => createWhatsAppPaketTalebi(packageId),
    onSuccess: (res) => {
      void qc.invalidateQueries({ queryKey: WHATSAPP_MESAJ_KREDI_QUERY_KEY })
      void qc.invalidateQueries({ queryKey: WHATSAPP_MESAJ_TALEP_QUERY_KEY })
      if (res.alreadyExists) {
        toast.info(res.message || 'Bu paket için bekleyen talebiniz zaten var.')
        setSuccessTalep(null)
        setHistoryOpen(false)
        setDetailTalep(res.talep)
        return
      }
      toast.success(res.message || 'Satın alma talebiniz oluşturuldu.')
      setDetailTalep(null)
      setHistoryOpen(false)
      setSuccessTalep(res.talep)
      setSelectedPackageId(null)
    },
    onError: (err) => {
      toast.error(friendlyClientErrorMessage(err, 'Talep oluşturulamadı.'))
    }
  })

  if (q.isLoading) {
    return (
      <div className="rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink-muted shadow-sm">
        Mesaj hakkı yükleniyor…
      </div>
    )
  }

  if (q.isError || !q.data) {
    return (
      <div className="rounded-xl border border-border bg-white px-4 py-3 text-sm text-ink-muted shadow-sm">
        Mesaj hakkı bilgisi alınamadı. {friendlyClientErrorMessage(q.error, '')}
      </div>
    )
  }

  const d = q.data
  const uyari = durumMesaji(d.durum)

  return (
    <>
      <div className={`rounded-xl border px-4 py-4 shadow-sm ${durumTone(d.durum)}`}>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-semibold text-ink">WhatsApp Mesaj Hakkı</p>
              {d.durum !== 'NORMAL' ? (
                <Badge
                  variant={d.durum === 'TUKENDI' ? 'danger' : 'warning'}
                  className="normal-case tracking-normal"
                >
                  {d.durum === 'TUKENDI' ? 'Tükendi' : d.durum === 'KRITIK' ? 'Kritik' : 'Düşük'}
                </Badge>
              ) : null}
            </div>
            <p className="mt-1 text-2xl font-bold tracking-tight text-ink">
              {d.bakiye.toLocaleString('tr-TR')} mesaj kaldı
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              Yıllık paketinizde {d.yillikDahilKredi.toLocaleString('tr-TR')} WhatsApp mesajı
              dahildir.
            </p>
            {uyari ? (
              <p
                className={`mt-2 text-sm font-medium ${
                  d.durum === 'TUKENDI' ? 'text-danger' : 'text-warning-ink'
                }`}
              >
                {uyari}
              </p>
            ) : null}
            {d.durum === 'TUKENDI' ? (
              <p className="mt-1.5 text-sm text-ink-muted">
                Mesaj hakkınız tükendi. Yeni mesaj hakkı eklediğinizde otomatik gönderimler
                mevcut ayarlarınızla devam eder.
              </p>
            ) : null}
          </div>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => {
              setSuccessTalep(null)
              setDetailTalep(null)
              setHistoryOpen(false)
              setSelectedPackageId(null)
              setPaketOpen(true)
            }}
          >
            Ek Mesaj Paketi Satın Al
          </Button>
        </div>
      </div>
      <PaketModal
        open={paketOpen}
        onClose={() => {
          setPaketOpen(false)
          setSuccessTalep(null)
          setDetailTalep(null)
          setHistoryOpen(false)
          setSelectedPackageId(null)
        }}
        paketler={d.paketler}
        bekleyenPackageIds={d.bekleyenPackageIds ?? []}
        submittingId={talepMu.isPending ? (talepMu.variables as string | undefined) ?? 'busy' : null}
        onRequest={(p) => talepMu.mutate(p.id)}
        successTalep={successTalep}
        detailTalep={detailTalep}
        onShowDetail={(t) => {
          setSuccessTalep(null)
          setHistoryOpen(false)
          setDetailTalep(t)
        }}
        onClearSuccess={() => setSuccessTalep(null)}
        onClearDetail={() => setDetailTalep(null)}
        onOpenHistory={() => {
          setSuccessTalep(null)
          setDetailTalep(null)
          setHistoryOpen(true)
        }}
        selectedPackageId={selectedPackageId}
        onSelectPackage={(id) => {
          if (id && bekleyenByPackage.has(id)) {
            const t = bekleyenByPackage.get(id)!
            setHistoryOpen(false)
            setDetailTalep(t)
            return
          }
          setSelectedPackageId(id)
        }}
        onCopied={(msg) => toast.success(msg)}
      />
      <TalepGecmisiModal
        open={historyOpen && paketOpen && !successTalep && !detailTalep}
        talepler={taleplerQ.data?.items ?? []}
        onClose={() => setHistoryOpen(false)}
        onShowDetail={(t) => {
          setSuccessTalep(null)
          setHistoryOpen(false)
          setDetailTalep(t)
        }}
      />
    </>
  )
}
