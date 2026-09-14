import type { ReactElement } from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { TcmbCrossRatePanel } from '../kurlar/TcmbCrossRatePanel'
import { useCrossCurrencyTcmb } from '../../hooks/useCrossCurrencyTcmb'
import { postCaprazHesap } from '../../api/kurlar'
import type { CrossPaymentKurMeta } from '../../types/kurlar'
import { MoneyInput } from '../ui/MoneyInput'
import { ParaBirimiSelect } from './ParaBirimiSelect'
import { PARA_BIRIMI_SEMBOL, type ParaBirimi } from '../../utils/paraBirimi'
import { formatCurrencyInputTR, moneyInputFromAmount } from '../../utils/formatters'
import { formatTcmbKurInput } from '../../utils/tcmbFormat'

type Props = {
  alacakParaBirimi: ParaBirimi
  mahsupTutar: string
  onMahsupTutarChange: (value: string) => void
  odemeParaBirimi: ParaBirimi
  onOdemeParaBirimiChange: (value: ParaBirimi) => void
  kasaTutari: string
  onKasaTutariChange: (value: string) => void
  odemeTarihi: string
  onKurMetaChange?: (meta: CrossPaymentKurMeta) => void
  maxMahsup?: number
  mahsupLabel?: string
  disabled?: boolean
}

type LastEdited = 'mahsup' | 'kasa' | 'kur'

export function CrossCurrencyPaymentFields(props: Props): ReactElement {
  const {
    alacakParaBirimi,
    mahsupTutar,
    onMahsupTutarChange,
    odemeParaBirimi,
    onOdemeParaBirimiChange,
    kasaTutari,
    onKasaTutariChange,
    odemeTarihi,
    onKurMetaChange,
    maxMahsup,
    mahsupLabel,
    disabled
  } = props

  const [onizleme, setOnizleme] = useState<string | null>(null)
  const lastEditedRef = useRef<LastEdited>('mahsup')
  const calcSeq = useRef(0)

  const tcmb = useCrossCurrencyTcmb({
    alacakParaBirimi,
    odemeParaBirimi,
    odemeTarihi,
    mahsupTutar,
    kasaTutari,
    onKasaTutariChange,
    disabled,
    /** Hesaplamayı bu bileşen Decimal API ile yapar */
    skipLocalMultiply: true
  })

  useEffect(() => {
    onKurMetaChange?.({
      kurKaynagi: tcmb.state.kurKaynagi,
      tcmbKurTarihi: tcmb.state.tcmbKurTarihi,
      tcmbReferansKur: tcmb.state.tcmbReferansKur
    })
  }, [onKurMetaChange, tcmb.state.kurKaynagi, tcmb.state.tcmbKurTarihi, tcmb.state.tcmbReferansKur])

  const runCaprazHesap = useCallback(
    async (edited: LastEdited, patch?: { mahsup?: string; kasa?: string; kur?: string }) => {
      if (odemeParaBirimi === alacakParaBirimi) {
        setOnizleme(null)
        return
      }
      const seq = ++calcSeq.current
      const mahsup = patch?.mahsup ?? mahsupTutar
      const kasa = patch?.kasa ?? kasaTutari
      const kur = patch?.kur ?? tcmb.state.uygulanacakKur
      try {
        const res = await postCaprazHesap({
          alacakParaBirimi,
          odemeParaBirimi,
          mahsupTutari: mahsup || undefined,
          kasaTutari: kasa || undefined,
          uygulanacakKur: kur || undefined,
          lastEdited: edited
        })
        if (seq !== calcSeq.current) return
        if (!res.ok) {
          setOnizleme(null)
          return
        }
        setOnizleme(res.onizlemeMetni)
        if (edited === 'mahsup' || edited === 'kur') {
          onKasaTutariChange(moneyInputFromAmount(res.kasaTutari) || formatCurrencyInputTR(0))
        }
        if (edited === 'kasa') {
          onMahsupTutarChange(moneyInputFromAmount(res.mahsupTutari) || formatCurrencyInputTR(0))
          tcmb.setUygulanacakKurSilent?.(formatTcmbKurInput(res.uygulanacakKur))
        }
        if (edited === 'kur') {
          tcmb.setUygulanacakKurSilent?.(formatTcmbKurInput(res.uygulanacakKur))
        }
      } catch {
        if (seq === calcSeq.current) setOnizleme(null)
      }
    },
    [
      alacakParaBirimi,
      odemeParaBirimi,
      mahsupTutar,
      kasaTutari,
      tcmb,
      onKasaTutariChange,
      onMahsupTutarChange
    ]
  )

  useEffect(() => {
    if (!tcmb.cross) {
      setOnizleme(null)
      return
    }
    if (tcmb.state.tcmbKullan && tcmb.state.uygulanacakKur && mahsupTutar) {
      void runCaprazHesap('mahsup', { kur: tcmb.state.uygulanacakKur })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- TCMB doldurunca bir kez
  }, [tcmb.state.tcmbKullan, tcmb.state.uygulanacakKur, tcmb.cross])

  return (
    <div className="space-y-3 rounded-lg border border-border bg-surface-muted/20 p-3">
      <p className="text-xs text-ink-muted">
        Borç para birimi:{' '}
        <strong className="text-ink">
          {alacakParaBirimi} {PARA_BIRIMI_SEMBOL[alacakParaBirimi]}
        </strong>
      </p>
      <MoneyInput
        label={mahsupLabel ?? `Borca mahsup edilecek tutar (${alacakParaBirimi})`}
        value={mahsupTutar}
        onChange={(v) => {
          lastEditedRef.current = 'mahsup'
          onMahsupTutarChange(v)
          if (tcmb.cross && tcmb.state.uygulanacakKur) {
            void runCaprazHesap('mahsup', { mahsup: v })
          }
        }}
        maxValue={maxMahsup}
        disabled={disabled}
      />
      <ParaBirimiSelect
        label="Ödeme para birimi"
        value={odemeParaBirimi}
        onChange={(pb) => {
          onOdemeParaBirimiChange(pb)
          if (pb === alacakParaBirimi) {
            onKasaTutariChange('')
            setOnizleme(null)
          }
        }}
        disabled={disabled}
      />
      {tcmb.cross ? (
        <>
          <TcmbCrossRatePanel
            bazParaBirimi={alacakParaBirimi}
            karsiParaBirimi={odemeParaBirimi}
            state={tcmb.state}
            onTcmbKullanChange={(v) => {
              tcmb.setTcmbKullan(v)
              if (v && tcmb.state.tcmbReferansKur) {
                lastEditedRef.current = 'kur'
                void runCaprazHesap('kur', { kur: tcmb.state.tcmbReferansKur })
              }
            }}
            onUygulanacakKurChange={(v) => {
              lastEditedRef.current = 'kur'
              tcmb.setUygulanacakKur(v)
              void runCaprazHesap('kur', { kur: v })
            }}
            onUseTcmbClick={
              tcmb.state.tcmbReferansKur
                ? () => {
                    tcmb.setTcmbKullan(true)
                    lastEditedRef.current = 'kur'
                    void runCaprazHesap('kur', { kur: tcmb.state.tcmbReferansKur! })
                  }
                : undefined
            }
            disabled={disabled}
          />
          <MoneyInput
            label={`Kasaya giren tutar (${odemeParaBirimi})`}
            value={kasaTutari}
            onChange={(v) => {
              lastEditedRef.current = 'kasa'
              onKasaTutariChange(v)
              void runCaprazHesap('kasa', { kasa: v })
            }}
            disabled={disabled}
            hint="TRY tahsilatta kasaya giren gerçek tutar."
          />
        </>
      ) : null}
      {onizleme ? (
        <p
          className="rounded-md border border-sky-300/60 bg-sky-50/80 px-2.5 py-2 text-xs font-medium text-sky-900 dark:border-sky-900/50 dark:bg-sky-950/30 dark:text-sky-100"
          data-testid="capraz-onizleme"
        >
          Önizleme: {onizleme}
        </p>
      ) : null}
    </div>
  )
}
