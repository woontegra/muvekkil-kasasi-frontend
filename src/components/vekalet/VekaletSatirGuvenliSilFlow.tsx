import type { ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listVekaletTaksitOdemeler } from '../../api/vekalet'
import { MasrafGuvenliSilModal } from '../kasa/MasrafGuvenliSilModal'
import { AlertBox, Button } from '../ui'
import { ModalShell } from '../ayarlar/shared'
import { formatDateTR, formatMoneyFixed2, resolveParaBirimi } from '../../utils/formatters'
import type { VekaletTaksitiDto, VekaletTaksitOdemeDto } from '../../types/vekalet'

export type GuvenliSatirSilPayload = { sifre: string; deleteReason: string }

const TAKSIT_SIL_UYARI =
  'Bu taksit silinecek ancak anlaşılan vekalet ücreti değişmeyecektir. Kalan tutarı daha sonra yeniden taksitlendirebilirsiniz.'

function isAktifOdeme(o: VekaletTaksitOdemeDto): boolean {
  return o.iptalAt == null
}

type Props = {
  taksit: VekaletTaksitiDto
  /** Ödenen toplam (aktif) — 0 ise taksit silme, >0 ise tahsilat iptali */
  odenenToplamFixed2: string
  preselectedOdemeId?: string
  loading?: boolean
  error?: string | null
  onClose: () => void
  onSilTaksit: (payload: GuvenliSatirSilPayload) => void
  onSilTahsilat: (odemeId: string, payload: GuvenliSatirSilPayload) => void
}

/**
 * Satır Sil: ödemesiz → taksit soft-iptal; tek tahsilat → doğrudan modal;
 * birden fazla → seçim listesi. Yalnızca Büro sahibi UI’den açılır.
 */
export function VekaletSatirGuvenliSilFlow(props: Props): ReactElement {
  const {
    taksit,
    odenenToplamFixed2,
    preselectedOdemeId,
    loading,
    error,
    onClose,
    onSilTaksit,
    onSilTahsilat
  } = props
  const odenen = odenenToplamFixed2
  const unpaid = !odenen || /^0+(\.0+)?$/.test(odenen.trim())
  const pb = resolveParaBirimi(taksit.paraBirimi)

  const odemelerQ = useQuery({
    queryKey: ['taksit-odemeler', taksit.id, 'guvenli-sil'],
    queryFn: () => listVekaletTaksitOdemeler(taksit.id),
    enabled: !unpaid,
    staleTime: 0
  })

  const aktif = (odemelerQ.data?.items ?? []).filter(isAktifOdeme)
  const [selected, setSelected] = useState<VekaletTaksitOdemeDto | null>(null)

  useEffect(() => {
    if (unpaid) return
    if (!odemelerQ.isSuccess) return
    if (preselectedOdemeId) {
      const hit = aktif.find((o) => o.id === preselectedOdemeId)
      if (hit) {
        setSelected(hit)
        return
      }
    }
    if (aktif.length === 1) {
      setSelected(aktif[0]!)
    }
  }, [unpaid, odemelerQ.isSuccess, aktif.length, preselectedOdemeId, aktif])

  if (unpaid) {
    return (
      <MasrafGuvenliSilModal
        ozet={{
          id: taksit.id,
          tarih: taksit.vadeTarihi,
          aciklama: `Taksit #${taksit.taksitNo} — ${TAKSIT_SIL_UYARI}`,
          tutar: taksit.taksitTutari ?? taksit.tutar,
          odemeYontemiLabel: 'Taksit planı',
          belgeNo: `Taksit #${taksit.taksitNo}`,
          mode: 'GIDER_SIL',
          title: 'Sil',
          paraBirimi: pb
        }}
        loading={loading}
        error={error}
        onClose={onClose}
        onSubmit={onSilTaksit}
      />
    )
  }

  if (odemelerQ.isLoading) {
    return (
      <ModalShell title="Sil" onClose={onClose}>
        <p className="text-sm text-ink-muted">Tahsilatlar yükleniyor…</p>
      </ModalShell>
    )
  }

  if (odemelerQ.isError) {
    return (
      <ModalShell title="Sil" onClose={onClose}>
        <AlertBox variant="danger" title="Hata">
          {(odemelerQ.error as Error).message}
        </AlertBox>
      </ModalShell>
    )
  }

  if (aktif.length === 0) {
    return (
      <ModalShell title="Sil" onClose={onClose}>
        <p className="text-sm text-ink-muted">Aktif tahsilat bulunamadı. Taksit satırı korunur.</p>
        <div className="mt-3 flex justify-end">
          <Button type="button" variant="outline" onClick={onClose}>
            Kapat
          </Button>
        </div>
      </ModalShell>
    )
  }

  if (!selected && aktif.length > 1) {
    return (
      <ModalShell title="Silinecek tahsilatı seçin" onClose={onClose} panelClassName="max-w-lg">
        <p className="mb-3 text-xs text-ink-muted">
          Birden fazla kısmi tahsilat var. Toplu silme yok; silmek istediğiniz kaydı seçin. Taksit satırı
          kalır; yalnız seçilen tahsilatın borç ve kasa etkisi geri alınır.
        </p>
        <ul className="space-y-2">
          {aktif.map((o) => (
            <li key={o.id}>
              <button
                type="button"
                className="flex w-full items-center justify-between gap-3 rounded-md border border-border bg-white px-3 py-2 text-left text-sm hover:bg-surface-muted"
                onClick={() => setSelected(o)}
              >
                <span>
                  <span className="font-medium">Taksit #{taksit.taksitNo}</span>
                  <span className="ml-2 text-ink-muted">{formatDateTR(o.odemeTarihi)}</span>
                  <span className="ml-2 tabular-nums text-ink">
                    {formatMoneyFixed2(o.tutar, resolveParaBirimi(o.alacakParaBirimi ?? pb))}
                  </span>
                </span>
                <span className="text-xs text-ink-muted">{o.makbuzNo}</span>
              </button>
            </li>
          ))}
        </ul>
      </ModalShell>
    )
  }

  const odeme = selected ?? aktif[0]!
  return (
    <MasrafGuvenliSilModal
      ozet={{
        id: odeme.id,
        tarih: odeme.odemeTarihi,
        aciklama: `Taksit #${taksit.taksitNo} tahsilatı iptal edilecek; taksit satırı kalır.`,
        tutar: odeme.tutar,
        odemeYontemiLabel: odeme.odemeYontemi,
        belgeNo: odeme.makbuzNo,
        mode: 'TAHSILAT_IPTAL',
        title: 'Sil',
        paraBirimi: resolveParaBirimi(odeme.alacakParaBirimi ?? pb)
      }}
      loading={loading}
      error={error}
      onClose={onClose}
      onSubmit={(payload) => onSilTahsilat(odeme.id, payload)}
    />
  )
}

export { TAKSIT_SIL_UYARI }
