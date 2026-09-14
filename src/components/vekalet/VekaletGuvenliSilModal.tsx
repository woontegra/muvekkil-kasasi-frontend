import type { ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { ModalShell } from '../ayarlar/shared'
import { AlertBox, Button, Input, Textarea } from '../ui'
import { formatMoney, resolveParaBirimi } from '../../utils/formatters'
import type { VekaletSilEtkiAnaliziDto } from '../../types/vekalet'

export type VekaletGuvenliSilPayload = {
  sifre: string
  deleteReason: string
  analysisFingerprint: string
}

export const VEKALET_GUVENLI_SIL_WARNING =
  'Bu vekalet ücreti silindiğinde bağlı tahsilatlar iptal edilecek, taksitler kaldırılacak ve kasaya giren tutarlar ilgili para birimi bakiyelerinden geri alınacaktır. İşlem denetim geçmişinde korunacaktır.'

type Props = {
  analiz: VekaletSilEtkiAnaliziDto | null
  analizLoading: boolean
  analizError: string | null
  loading?: boolean
  error?: string | null
  onClose: () => void
  onSubmit: (payload: VekaletGuvenliSilPayload) => void
}

function currencyLines(map: Record<string, string>): string {
  const entries = Object.entries(map)
  if (entries.length === 0) return '—'
  return entries.map(([pb, tutar]) => `${formatMoney(Number(tutar), resolveParaBirimi(pb))}`).join(' · ')
}

export function VekaletGuvenliSilModal(props: Props): ReactElement {
  const { analiz, analizLoading, analizError, loading, error, onClose, onSubmit } = props
  const [step, setStep] = useState<1 | 2>(1)
  const [deleteReason, setDeleteReason] = useState('')
  const [sifre, setSifre] = useState('')
  const [confirmed, setConfirmed] = useState(false)
  const [localErr, setLocalErr] = useState<string | null>(null)

  useEffect(() => {
    setStep(1)
    setDeleteReason('')
    setSifre('')
    setConfirmed(false)
    setLocalErr(null)
  }, [analiz?.vekaletUcretiId])

  function goConfirm(): void {
    if (!analiz) {
      setLocalErr('Etki analizi yüklenemedi.')
      return
    }
    setLocalErr(null)
    setStep(2)
  }

  function submit(): void {
    setLocalErr(null)
    if (!analiz) {
      setLocalErr('Etki analizi güncel değil.')
      return
    }
    if (deleteReason.trim().length < 3) {
      setLocalErr('Neden zorunludur (en az 3 karakter).')
      return
    }
    if (!sifre) {
      setLocalErr('Güvenlik için mevcut giriş şifrenizi girin.')
      return
    }
    if (!confirmed) {
      setLocalErr('Onay kutusunu işaretleyin.')
      return
    }
    onSubmit({
      sifre,
      deleteReason: deleteReason.trim(),
      analysisFingerprint: analiz.fingerprint
    })
  }

  const pb = resolveParaBirimi(analiz?.paraBirimi)

  return (
    <ModalShell title="Vekalet ücretini sil" onClose={onClose} panelClassName="max-w-lg">
      <div className="space-y-3">
        <p className="text-sm text-ink-muted">{VEKALET_GUVENLI_SIL_WARNING}</p>

        {analizLoading ? <p className="text-sm text-ink-muted">Etki analizi yükleniyor…</p> : null}
        {analizError ? (
          <AlertBox variant="danger" title="Analiz">
            {analizError}
          </AlertBox>
        ) : null}

        {step === 1 && analiz ? (
          <>
            <dl className="space-y-2 rounded-lg border border-border bg-surface-muted/40 px-3 py-2.5 text-sm">
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Anlaşılan tutar</dt>
                <dd className="font-medium text-ink">{formatMoney(Number(analiz.toplamTutar), pb)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Aktif taksit</dt>
                <dd className="font-medium text-ink">{analiz.aktifTaksitSayisi}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Ödenmiş/kısmi taksit</dt>
                <dd className="font-medium text-ink">{analiz.odenmisKismiTaksitSayisi}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Tahsilat (aktif)</dt>
                <dd className="font-medium text-ink">{analiz.aktifTahsilatSayisi}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">İptal edilecek makbuz</dt>
                <dd className="font-medium text-ink">{analiz.makbuzSayisi}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Mahsup toplamları</dt>
                <dd className="text-right font-medium text-ink">{currencyLines(analiz.mahsupByCurrency)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Kasa girişi</dt>
                <dd className="text-right font-medium text-ink">{currencyLines(analiz.kasaGirisByCurrency)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-ink-muted">Planlı bildirim</dt>
                <dd className="font-medium text-ink">{analiz.planliBildirimSayisi}</dd>
              </div>
            </dl>
            <ul className="list-disc space-y-1 pl-5 text-xs text-ink-muted">
              {analiz.afterState.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={onClose}>
                Vazgeç
              </Button>
              <Button type="button" onClick={goConfirm} disabled={Boolean(analizError)}>
                Devam
              </Button>
            </div>
          </>
        ) : null}

        {step === 2 && analiz ? (
          <>
            <Textarea
              label="İptal nedeni"
              value={deleteReason}
              onChange={(e) => setDeleteReason(e.target.value)}
              rows={3}
              maxLength={1000}
              disabled={loading}
            />
            <Input
              label="Giriş şifreniz"
              type="password"
              autoComplete="current-password"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              disabled={loading}
            />
            <label className="flex cursor-pointer items-start gap-2 text-sm text-ink">
              <input
                type="checkbox"
                className="mt-1"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                disabled={loading}
              />
              <span>Yukarıdaki mali etkileri okudum; vekalet ücretini ve bağlı tahsilatları iptal etmek istiyorum.</span>
            </label>
            {(localErr || error) && (
              <AlertBox variant="danger">{localErr ?? error}</AlertBox>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={loading}>
                Geri
              </Button>
              <Button type="button" variant="danger" onClick={submit} disabled={loading}>
                Sil
              </Button>
            </div>
          </>
        ) : null}
      </div>
    </ModalShell>
  )
}
