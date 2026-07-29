import type { ReactElement } from 'react'
import { AnimatePresence } from 'framer-motion'
import { ModalScrim, Button } from '../ui'
import { AnimatedNumber } from '../../motion'
import { formatCurrencyTR, formatDateTR } from '../../utils/formatters'
import { cn } from '../../lib/cn'
import type { HesapDonemiOzetResponse } from '../../types/hesapDonemi'
import { getPreviousAccountingPeriod, getNextAccountingPeriod } from '../../lib/accountingPeriod'

type Props = {
  open: boolean
  onClose: () => void
  data: HesapDonemiOzetResponse | null
  onNavigate: (referenceDate: string | null) => void
}

function modeEtiket(mode: string): string {
  return mode === 'MONTHLY' ? 'Aylık' : 'Yıllık'
}

function netEtiket(n: number): string {
  if (n > 0) return 'Dönem net (kâr)'
  if (n < 0) return 'Dönem net (zarar)'
  return 'Dönem net'
}

function Row(p: { label: string; value: ReactElement | string; valueClass?: string }): ReactElement {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-border py-2 last:border-b-0">
      <span className="shrink-0 text-xs font-semibold text-ink-muted">{p.label}</span>
      <span className={cn('text-sm font-semibold tabular-nums text-ink', p.valueClass)}>{p.value}</span>
    </div>
  )
}

export function HesapDonemiModal({ open, onClose, data, onNavigate }: Props): ReactElement | null {
  return (
    <AnimatePresence>
      {open && data ? (
        <ModalScrim onClose={onClose} innerAsDialog>
          <div className="w-full max-w-md rounded-xl border border-border bg-white p-5 shadow-xl dark:bg-surface-elevated">
            <div className="mb-4 flex items-start justify-between gap-2">
              <h2 className="text-base font-bold text-ink">Hesap dönemi</h2>
              <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0" onClick={onClose}>
                ✕
              </Button>
            </div>

            <div className="space-y-0 rounded-lg border border-border bg-surface-muted/30 px-3 py-1">
              <Row label="Dönem tipi" value={modeEtiket(data.mode)} />
              <Row label="Dönem" value={data.period.etiket} />
              <Row label="Başlangıç" value={formatDateTR(data.period.bas)} />
              <Row label="Bitiş" value={formatDateTR(data.period.bit)} />
              <Row
                label="Devreden bakiye"
                value={<AnimatedNumber value={Number(data.devredenBakiye)} format={formatCurrencyTR} />}
              />
              <Row
                label="Dönem geliri"
                value={<AnimatedNumber value={Number(data.donemGelir)} format={formatCurrencyTR} />}
                valueClass="text-emerald-600"
              />
              <Row
                label="Dönem gideri"
                value={<AnimatedNumber value={Number(data.donemGider)} format={formatCurrencyTR} />}
                valueClass="text-danger"
              />
              {Number(data.donemDuzeltmeEtkisi) !== 0 ? (
                <Row
                  label="Düzeltme etkisi"
                  value={<AnimatedNumber value={Number(data.donemDuzeltmeEtkisi)} format={formatCurrencyTR} />}
                />
              ) : null}
              <Row
                label={netEtiket(Number(data.donemNetSonucu))}
                value={<AnimatedNumber value={Number(data.donemNetSonucu)} format={formatCurrencyTR} />}
                valueClass={Number(data.donemNetSonucu) > 0 ? 'text-emerald-600' : Number(data.donemNetSonucu) < 0 ? 'text-danger' : undefined}
              />
              <Row
                label="Kasa bakiyesi"
                value={<AnimatedNumber value={Number(data.kasaBakiyesi)} format={formatCurrencyTR} />}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const prev = getPreviousAccountingPeriod({ mode: data.mode, bas: data.period.bas, bit: data.period.bit, etiket: data.period.etiket })
                  onNavigate(prev.bas)
                }}
              >
                Önceki dönem
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!data.canGoNext}
                onClick={() => {
                  const next = getNextAccountingPeriod({ mode: data.mode, bas: data.period.bas, bit: data.period.bit, etiket: data.period.etiket })
                  if (next) onNavigate(next.bas)
                }}
              >
                Sonraki dönem
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={data.isCurrent}
                onClick={() => onNavigate(null)}
              >
                Güncel dönem
              </Button>
              <div className="flex-1" />
              <Button type="button" size="sm" onClick={onClose}>
                Kapat
              </Button>
            </div>
          </div>
        </ModalScrim>
      ) : null}
    </AnimatePresence>
  )
}
