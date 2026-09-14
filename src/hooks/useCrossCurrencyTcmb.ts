import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CrossPaymentKurMeta } from '../types/kurlar'
import { formatCurrencyInputTR, parsePosTutar } from '../utils/formatters'
import type { ParaBirimi } from '../utils/paraBirimi'
import { formatTcmbKurInput, parseTcmbKurInput } from '../utils/tcmbFormat'
import { useTcmbCaprazKur } from './useTcmbKurlar'

export type CrossCurrencyTcmbState = CrossPaymentKurMeta & {
  tcmbKullan: boolean
  uygulanacakKur: string
  tcmbUnavailable: boolean
  tcmbMessage: string | null
  tcmbLoading: boolean
  tcmbStale: boolean
}

type Params = {
  alacakParaBirimi: ParaBirimi
  odemeParaBirimi: ParaBirimi
  odemeTarihi: string
  mahsupTutar: string
  kasaTutari: string
  onKasaTutariChange: (value: string) => void
  disabled?: boolean
  /** true → yerel Number çarpımı yok; parent Decimal API kullanır */
  skipLocalMultiply?: boolean
}

function emptyMeta(): CrossCurrencyTcmbState {
  return {
    kurKaynagi: null,
    tcmbKurTarihi: null,
    tcmbReferansKur: null,
    tcmbKullan: false,
    uygulanacakKur: '',
    tcmbUnavailable: false,
    tcmbMessage: null,
    tcmbLoading: false,
    tcmbStale: false
  }
}

export function useCrossCurrencyTcmb(params: Params): {
  cross: boolean
  state: CrossCurrencyTcmbState
  setTcmbKullan: (value: boolean) => void
  setUygulanacakKur: (value: string) => void
  setUygulanacakKurSilent: (value: string) => void
  onKasaTutariManualChange: (value: string) => void
} {
  const {
    alacakParaBirimi,
    odemeParaBirimi,
    odemeTarihi,
    mahsupTutar,
    onKasaTutariChange,
    disabled,
    skipLocalMultiply = false
  } = params

  const cross = odemeParaBirimi !== alacakParaBirimi
  const caprazQ = useTcmbCaprazKur(alacakParaBirimi, odemeParaBirimi, odemeTarihi, cross && !disabled)

  const [tcmbKullan, setTcmbKullanState] = useState(false)
  const [uygulanacakKur, setUygulanacakKurState] = useState('')
  const [kurKaynagi, setKurKaynagi] = useState<CrossPaymentKurMeta['kurKaynagi']>(null)
  const manualLockRef = useRef(false)
  const pairKeyRef = useRef('')

  const pairKey = `${alacakParaBirimi}|${odemeParaBirimi}|${odemeTarihi}`

  const tcmbRate = caprazQ.data?.available ? caprazQ.data.dovizAlis : null
  const tcmbKurTarihi = caprazQ.data?.available ? caprazQ.data.bulunanTcmbKurTarihi : null
  const tcmbReferansKur = tcmbRate
  const tcmbUnavailable =
    cross && !caprazQ.isLoading && (caprazQ.data?.available === false || caprazQ.isError)
  const tcmbMessage = tcmbUnavailable
    ? caprazQ.data?.available === false
      ? caprazQ.data.message
      : 'TCMB kuru alınamadı, uygulanacak kuru manuel giriniz'
    : null

  const applyLocalKasaFromMahsup = useCallback(
    (rate: string, mahsupRaw: string) => {
      if (skipLocalMultiply) return
      const mahsup = parsePosTutar(mahsupRaw)
      const kurNum = parseTcmbKurInput(formatTcmbKurInput(rate))
      if (mahsup != null && kurNum != null) {
        onKasaTutariChange(formatCurrencyInputTR(mahsup * kurNum))
      }
    },
    [onKasaTutariChange, skipLocalMultiply]
  )

  useEffect(() => {
    if (!cross) {
      manualLockRef.current = false
      pairKeyRef.current = pairKey
      setTcmbKullanState(false)
      setUygulanacakKurState('')
      setKurKaynagi(null)
      return
    }

    if (pairKey !== pairKeyRef.current) {
      pairKeyRef.current = pairKey
      manualLockRef.current = false
      setTcmbKullanState(false)
    }
  }, [cross, pairKey])

  useEffect(() => {
    if (!cross || caprazQ.isLoading || !caprazQ.data) return
    if (caprazQ.data.available && !manualLockRef.current && !tcmbKullan) {
      setTcmbKullanState(true)
    }
    if (caprazQ.data.available && tcmbKullan && !manualLockRef.current) {
      setUygulanacakKurState(formatTcmbKurInput(caprazQ.data.dovizAlis))
      setKurKaynagi('TCMB')
      applyLocalKasaFromMahsup(caprazQ.data.dovizAlis, mahsupTutar)
    }
    if (!caprazQ.data.available) {
      setTcmbKullanState(false)
      setKurKaynagi('MANUEL')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cross, caprazQ.data, caprazQ.isLoading, tcmbKullan, applyLocalKasaFromMahsup])

  useEffect(() => {
    if (skipLocalMultiply || !cross || !tcmbKullan || manualLockRef.current) return
    applyLocalKasaFromMahsup(uygulanacakKur, mahsupTutar)
  }, [skipLocalMultiply, cross, tcmbKullan, mahsupTutar, uygulanacakKur, applyLocalKasaFromMahsup])

  const setTcmbKullan = useCallback(
    (value: boolean) => {
      if (value && tcmbRate) {
        manualLockRef.current = false
        setTcmbKullanState(true)
        setUygulanacakKurState(formatTcmbKurInput(tcmbRate))
        setKurKaynagi('TCMB')
        applyLocalKasaFromMahsup(tcmbRate, mahsupTutar)
        return
      }
      setTcmbKullanState(false)
      if (!value) setKurKaynagi('MANUEL')
    },
    [tcmbRate, applyLocalKasaFromMahsup, mahsupTutar]
  )

  const setUygulanacakKur = useCallback(
    (value: string) => {
      manualLockRef.current = true
      setTcmbKullanState(false)
      setKurKaynagi('MANUEL')
      setUygulanacakKurState(value)
      applyLocalKasaFromMahsup(value, mahsupTutar)
    },
    [applyLocalKasaFromMahsup, mahsupTutar]
  )

  const setUygulanacakKurSilent = useCallback((value: string) => {
    setUygulanacakKurState(value)
  }, [])

  const onKasaTutariManualChange = useCallback(
    (value: string) => {
      manualLockRef.current = true
      setTcmbKullanState(false)
      setKurKaynagi('MANUEL')
      onKasaTutariChange(value)
      if (skipLocalMultiply) return
      const mahsup = parsePosTutar(mahsupTutar)
      const kasa = parsePosTutar(value)
      if (mahsup != null && kasa != null && mahsup > 0) {
        setUygulanacakKurState(formatTcmbKurInput(kasa / mahsup))
      }
    },
    [onKasaTutariChange, mahsupTutar, skipLocalMultiply]
  )

  const state = useMemo((): CrossCurrencyTcmbState => {
    if (!cross) return emptyMeta()
    return {
      kurKaynagi,
      tcmbKurTarihi,
      tcmbReferansKur,
      tcmbKullan,
      uygulanacakKur,
      tcmbUnavailable,
      tcmbMessage,
      tcmbLoading: caprazQ.isLoading,
      tcmbStale: caprazQ.data?.available ? caprazQ.data.stale : false
    }
  }, [
    cross,
    kurKaynagi,
    tcmbKurTarihi,
    tcmbReferansKur,
    tcmbKullan,
    uygulanacakKur,
    tcmbUnavailable,
    tcmbMessage,
    caprazQ.isLoading,
    caprazQ.data
  ])

  return {
    cross,
    state,
    setTcmbKullan,
    setUygulanacakKur,
    setUygulanacakKurSilent,
    onKasaTutariManualChange
  }
}
