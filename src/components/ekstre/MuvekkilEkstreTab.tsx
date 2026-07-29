import type { ReactElement } from 'react'
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getMuvekkilEkstre } from '../../api/muvekkilEkstre'
import { downloadMuvekkilEkstrePdf } from '../../lib/muvekkilEkstrePdf'
import { AnimatedNumber, Stagger, StaggerItem } from '../../motion'
import { useToast } from '../../toast'
import { formatCurrencyTR, formatDateTR } from '../../utils/formatters'
import { AlertBox, Button, Input } from '../ui'
import { ReceiptModal } from '../receipt/ReceiptModal'
import { MuvekkilEkstrePrintView } from './MuvekkilEkstrePrintView'

type Props = {
  dosyaId: string
}

function todayYmdTr(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Istanbul' }).format(new Date())
}

export function MuvekkilEkstreTab(props: Props): ReactElement {
  const { dosyaId } = props
  const toast = useToast()
  const [itibariyle, setItibariyle] = useState(todayYmdTr)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [printOpen, setPrintOpen] = useState(false)
  const [pdfLoading, setPdfLoading] = useState(false)
  const pdfBusyRef = useRef(false)

  const query = useQuery({
    queryKey: ['muvekkil-ekstre', dosyaId, itibariyle],
    queryFn: () => getMuvekkilEkstre(dosyaId, itibariyle)
  })

  const ekstre = query.data
  const v = ekstre?.vekaletOzeti
  const a = ekstre?.masrafAvansiOzeti
  const printRootId = `ekstre-print-${dosyaId}`

  useEffect(() => {
    if (!printOpen || !ekstre) return
    const timer = window.setTimeout(() => {
      window.print()
    }, 350)
    const onAfterPrint = (): void => {
      setPrintOpen(false)
    }
    window.addEventListener('afterprint', onAfterPrint)
    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('afterprint', onAfterPrint)
    }
  }, [printOpen, ekstre])

  const handlePdfDownload = async (): Promise<void> => {
    if (!ekstre || pdfBusyRef.current) return
    pdfBusyRef.current = true
    setPdfLoading(true)
    try {
      await downloadMuvekkilEkstrePdf(ekstre)
      toast.success('Müvekkil ekstresi PDF olarak indirildi.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'PDF indirilemedi.')
    } finally {
      pdfBusyRef.current = false
      setPdfLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="max-w-xl">
          <h3 className="text-sm font-bold text-ink">Müvekkil Ekstresi</h3>
          <p className="mt-0.5 text-xs text-ink-muted">
            Müvekkile sunulacak vekalet ve masraf avansı özeti. Büro içi kârlılık ve iç notlar dahil
            edilmez.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          <Input
            label="İtibarıyla tarih"
            type="date"
            value={itibariyle}
            onChange={(e) => setItibariyle(e.target.value)}
          />
          <Button type="button" size="sm" variant="outline" onClick={() => setItibariyle(todayYmdTr())}>
            Bugün
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!ekstre}
          onClick={() => setPreviewOpen(true)}
        >
          Önizle
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!ekstre || pdfLoading}
          onClick={() => void handlePdfDownload()}
        >
          {pdfLoading ? 'PDF hazırlanıyor…' : 'PDF İndir'}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={!ekstre}
          onClick={() => setPrintOpen(true)}
        >
          Yazdır
        </Button>
      </div>

      {query.isError ? (
        <AlertBox variant="danger" title="Ekstre yüklenemedi">
          {query.error instanceof Error ? query.error.message : 'Bilinmeyen hata'}
        </AlertBox>
      ) : null}

      {query.isLoading ? (
        <p className="text-sm text-ink-muted">Müvekkil ekstresi hazırlanıyor…</p>
      ) : ekstre && v && a ? (
        <>
          <Stagger className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
            <StaggerItem>
              <div className="rounded-lg border border-border bg-surface-muted/30 px-3 py-2">
                <p className="text-[11px] font-semibold text-ink-muted">Kararlaştırılan vekalet</p>
                <p className="text-sm font-bold tabular-nums text-ink">
                  <AnimatedNumber
                    value={Number(v.kararlastirilanToplam)}
                    format={(n) => formatCurrencyTR(n)}
                  />
                </p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="rounded-lg border border-border bg-surface-muted/30 px-3 py-2">
                <p className="text-[11px] font-semibold text-ink-muted">Tahsil edilen</p>
                <p className="text-sm font-bold tabular-nums text-ink">
                  <AnimatedNumber
                    value={Number(v.tahsilEdilenToplam)}
                    format={(n) => formatCurrencyTR(n)}
                  />
                </p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="rounded-lg border border-border bg-surface-muted/30 px-3 py-2">
                <p className="text-[11px] font-semibold text-ink-muted">Kalan vekalet</p>
                <p className="text-sm font-bold tabular-nums text-ink">
                  <AnimatedNumber value={Number(v.kalanToplam)} format={(n) => formatCurrencyTR(n)} />
                </p>
              </div>
            </StaggerItem>
            <StaggerItem>
              <div className="rounded-lg border border-border bg-surface-muted/30 px-3 py-2">
                <p className="text-[11px] font-semibold text-ink-muted">Avans bakiyesi</p>
                <p className="text-sm font-bold tabular-nums text-ink">
                  <AnimatedNumber value={Number(a.guncelBakiye)} format={(n) => formatCurrencyTR(n)} />
                </p>
              </div>
            </StaggerItem>
          </Stagger>

          <div className="rounded-lg border border-border bg-white p-3 dark:bg-surface-elevated">
            <p className="mb-2 text-xs text-ink-muted">
              {ekstre.itibariyleAciklama} · Ref: {ekstre.belgeRef} · Ekstre tarihi:{' '}
              {formatDateTR(`${ekstre.ekstreTarihi}T12:00:00+03:00`)}
            </p>
            <MuvekkilEkstrePrintView ekstre={ekstre} />
          </div>
        </>
      ) : (
        <p className="text-sm text-ink-muted">Ekstre yüklenemedi.</p>
      )}

      {previewOpen && ekstre ? (
        <ReceiptModal
          title="Müvekkil ekstresi önizleme"
          printRootId={`ekstre-prev-${dosyaId}`}
          onClose={() => setPreviewOpen(false)}
        >
          <MuvekkilEkstrePrintView ekstre={ekstre} />
        </ReceiptModal>
      ) : null}

      {printOpen && ekstre ? (
        <ReceiptModal
          title="Yazdır — Müvekkil Ekstresi"
          printRootId={printRootId}
          onClose={() => setPrintOpen(false)}
          printButtonLabel="Yazdır"
          contentClassName="receipt-ekstre-print"
          hint="Tarayıcı yazdırma penceresi açılır. Fiziksel yazıcı seçebilirsiniz. Çıktıda yalnızca ekstre belgesi yer alır."
        >
          <MuvekkilEkstrePrintView ekstre={ekstre} expandAllPayments />
        </ReceiptModal>
      ) : null}
    </div>
  )
}
