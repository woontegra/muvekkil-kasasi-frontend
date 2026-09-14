import type { ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { ModalShell } from '../ayarlar/shared'
import { AlertBox, Button, Input, Textarea } from '../ui'
import { formatDateTR, formatMoney, resolveParaBirimi, type ParaBirimi } from '../../utils/formatters'
import type { OfisGuvenliIslemMode } from '../../lib/ofisKasaGuvenliSil'
import { ofisGuvenliIslemLabel } from '../../lib/ofisKasaGuvenliSil'
import type { DosyaKasaGuvenliSilMode } from '../../lib/dosyaKasaGuvenliSil'
import { dosyaKasaGuvenliSilModalTitle } from '../../lib/dosyaKasaGuvenliSil'

export type MasrafGuvenliSilPayload = {
  sifre: string
  deleteReason: string
}

export type GuvenliSilModalMode = OfisGuvenliIslemMode | DosyaKasaGuvenliSilMode

export type MasrafGuvenliSilOzet = {
  id: string
  tarih: string
  aciklama: string
  tutar: string | number
  odemeYontemiLabel: string
  belgeNo: string
  /** Ofis veya dosya kasa silme / iptal modu */
  mode?: GuvenliSilModalMode
  /** Modal başlığı — verilirse mode başlığını ezer */
  title?: string
  muvekkilAdi?: string | null
  kategori?: string | null
  paraBirimi?: ParaBirimi | string | null
}

type Props = {
  ozet: MasrafGuvenliSilOzet
  loading?: boolean
  error?: string | null
  onClose: () => void
  onSubmit: (payload: MasrafGuvenliSilPayload) => void
}

function titleFor(mode: GuvenliSilModalMode | undefined): string {
  if (!mode || mode === 'GIDER_SIL' || mode === 'MASRAF_SIL') return 'Masrafı sil'
  if (mode === 'AVANS_SIL') return dosyaKasaGuvenliSilModalTitle('AVANS_SIL')
  return ofisGuvenliIslemLabel(mode)
}

function blurbFor(mode: GuvenliSilModalMode | undefined): string {
  if (mode === 'TAHSILAT_IPTAL') {
    return 'Tahsilat iptal edilecek: kaynak ödeme geri alınır, borç bakiyesi güncellenir, ofis kasa hareketi listeden çıkar; makbuz ve denetim geçmişi korunur.'
  }
  if (mode === 'GELIR_SIL') {
    return 'Bu gelir listeden ve mali toplamlardan çıkarılacak; güvenlik ve denetim geçmişi korunacaktır.'
  }
  if (mode === 'AVANS_SIL') {
    return 'Bu avans listeden ve mali toplamlardan çıkarılacak (toplam avans ve bakiye azalır); güvenlik ve denetim geçmişi korunacaktır.'
  }
  if (mode === 'MASRAF_SIL' || mode === 'GIDER_SIL' || !mode) {
    return 'Bu masraf listeden ve mali toplamlardan çıkarılacak (toplam masraf azalır, bakiye artar); güvenlik ve denetim geçmişi korunacaktır.'
  }
  return 'Bu kayıt listeden ve mali toplamlardan çıkarılacak; güvenlik ve denetim geçmişi korunacaktır.'
}

/** Büro sahibi güvenli silme / tahsilat iptali — şifre her açılışta boş. */
export function MasrafGuvenliSilModal(props: Props): ReactElement {
  const { ozet, loading, error, onClose, onSubmit } = props
  const mode = ozet.mode ?? 'MASRAF_SIL'
  const [deleteReason, setDeleteReason] = useState('')
  const [sifre, setSifre] = useState('')
  const [localErr, setLocalErr] = useState<string | null>(null)
  const pb = resolveParaBirimi(ozet.paraBirimi)
  const modalTitle = ozet.title?.trim() || titleFor(mode)

  useEffect(() => {
    setDeleteReason('')
    setSifre('')
    setLocalErr(null)
  }, [ozet.id, mode])

  function submit(): void {
    setLocalErr(null)
    if (deleteReason.trim().length < 3) {
      setLocalErr('Neden zorunludur (en az 3 karakter).')
      return
    }
    if (!sifre) {
      setLocalErr('Güvenlik için mevcut giriş şifrenizi girin.')
      return
    }
    onSubmit({ sifre, deleteReason: deleteReason.trim() })
  }

  const showGelirFields = mode === 'GELIR_SIL' || mode === 'TAHSILAT_IPTAL'

  return (
    <ModalShell title={modalTitle} onClose={onClose} panelClassName="max-w-md">
      <div className="space-y-3">
        <p className="text-sm text-ink-muted">{blurbFor(mode)}</p>

        <dl className="space-y-2 rounded-lg border border-border bg-surface-muted/40 px-3 py-2.5 text-sm">
          <div className="flex justify-between gap-3">
            <dt className="text-ink-muted">Tarih</dt>
            <dd className="font-medium text-ink">{formatDateTR(ozet.tarih)}</dd>
          </div>
          {showGelirFields ? (
            <>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Müvekkil</dt>
                <dd className="text-right font-medium text-ink">{ozet.muvekkilAdi?.trim() || '—'}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Kategori</dt>
                <dd className="text-right font-medium text-ink">{ozet.kategori?.trim() || '—'}</dd>
              </div>
            </>
          ) : null}
          <div className="flex justify-between gap-3">
            <dt className="shrink-0 text-ink-muted">Açıklama</dt>
            <dd className="text-right font-medium text-ink">{ozet.aciklama}</dd>
          </div>
          {showGelirFields ? (
            <div className="flex justify-between gap-3">
              <dt className="text-ink-muted">Para birimi</dt>
              <dd className="font-medium text-ink">{pb}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3">
            <dt className="text-ink-muted">Tutar</dt>
            <dd className="font-semibold tabular-nums text-ink">{formatMoney(Number(ozet.tutar), pb)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-muted">Ödeme yöntemi</dt>
            <dd className="font-medium text-ink">{ozet.odemeYontemiLabel}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-muted">Belge no</dt>
            <dd className="font-mono text-xs text-ink">{ozet.belgeNo}</dd>
          </div>
        </dl>

        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-muted">
            {mode === 'TAHSILAT_IPTAL' ? 'İptal nedeni *' : 'Silme nedeni *'}
          </label>
          <Textarea
            value={deleteReason}
            onChange={(e) => setDeleteReason(e.target.value)}
            rows={3}
            autoComplete="off"
            placeholder="Nedeni yazın"
          />
        </div>

        <Input
          label="Güvenlik için mevcut giriş şifrenizi yeniden girin *"
          type="password"
          value={sifre}
          onChange={(e) => setSifre(e.target.value)}
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          name="ofis-guvenli-sil-sifre-confirm"
          data-lpignore="true"
          data-1p-ignore="true"
          data-form-type="other"
        />

        {localErr || error ? (
          <AlertBox variant="danger" title="İşlem yapılamadı">
            {localErr ?? error}
          </AlertBox>
        ) : null}

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Vazgeç
          </Button>
          <Button type="button" variant="danger" disabled={loading} onClick={submit}>
            {loading ? 'İşleniyor…' : titleFor(mode)}
          </Button>
        </div>
      </div>
    </ModalShell>
  )
}
