import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  type DosyaDetailTabKey,
  dosyaFocusElementId,
  parseDosyaFocusParam
} from '../lib/maliKontrolNavigation'

export type KasaListeFiltre = 'tum' | 'avans' | 'masraf' | 'onaysiz' | 'onayli' | 'reddedildi'

const VALID_TABS: DosyaDetailTabKey[] = ['kasa', 'vekalet', 'smm', 'makbuz', 'hesap', 'mali', 'ekstre']
const VALID_KASA_FILTERS: KasaListeFiltre[] = ['tum', 'avans', 'masraf', 'onaysiz', 'onayli', 'reddedildi']

type Options = {
  setTab: (tab: DosyaDetailTabKey) => void
  setKasaFilter: (filter: KasaListeFiltre) => void
  kasaFilter: KasaListeFiltre
  tabReady: Record<DosyaDetailTabKey, boolean>
  onFocusNotFound: () => void
  reducedMotion?: boolean
}

export function useDosyaDetailDeepLink(options: Options): {
  highlightRowId: string | null
  isRowHighlighted: (elementId: string) => boolean
} {
  const { setTab, setKasaFilter, kasaFilter, tabReady, onFocusNotFound, reducedMotion } = options
  const [searchParams, setSearchParams] = useSearchParams()
  const [highlightRowId, setHighlightRowId] = useState<string | null>(null)
  const appliedRef = useRef<string | null>(null)
  const highlightTimerRef = useRef<number | null>(null)

  const tabParam = searchParams.get('tab') as DosyaDetailTabKey | null
  const focusParam = searchParams.get('focus')
  const kasaFilterParam = searchParams.get('kasaFilter') as KasaListeFiltre | null

  useEffect(() => {
    if (tabParam && VALID_TABS.includes(tabParam)) {
      setTab(tabParam)
    }
    if (kasaFilterParam && VALID_KASA_FILTERS.includes(kasaFilterParam)) {
      setKasaFilter(kasaFilterParam)
    }
  }, [tabParam, kasaFilterParam, setTab, setKasaFilter])

  useEffect(() => {
    if (!focusParam) {
      appliedRef.current = null
      return
    }

    const signature = `${tabParam ?? ''}|${focusParam}|${kasaFilterParam ?? ''}`
    if (appliedRef.current === signature) return

    const activeTab = tabParam && VALID_TABS.includes(tabParam) ? tabParam : 'kasa'
    if (!tabReady[activeTab]) return
    if (kasaFilterParam && kasaFilter !== kasaFilterParam) return

    const parsed = parseDosyaFocusParam(focusParam)
    if (!parsed) {
      appliedRef.current = signature
      onFocusNotFound()
      clearDeepLinkParams(setSearchParams)
      return
    }

    const elementId = dosyaFocusElementId(parsed.kind, parsed.id)
    const el = document.getElementById(elementId)

    appliedRef.current = signature

    if (!el) {
      onFocusNotFound()
      clearDeepLinkParams(setSearchParams)
      return
    }

    window.requestAnimationFrame(() => {
      el.scrollIntoView({
        behavior: reducedMotion ? 'auto' : 'smooth',
        block: 'center'
      })
    })

    setHighlightRowId(elementId)
    if (highlightTimerRef.current != null) {
      window.clearTimeout(highlightTimerRef.current)
    }
    highlightTimerRef.current = window.setTimeout(() => {
      setHighlightRowId(null)
      highlightTimerRef.current = null
    }, 3200)

    clearDeepLinkParams(setSearchParams)
  }, [
    focusParam,
    tabParam,
    kasaFilterParam,
    tabReady,
    kasaFilter,
    onFocusNotFound,
    reducedMotion,
    setSearchParams
  ])

  useEffect(() => {
    return () => {
      if (highlightTimerRef.current != null) {
        window.clearTimeout(highlightTimerRef.current)
      }
    }
  }, [])

  return {
    highlightRowId,
    isRowHighlighted: (elementId: string) => highlightRowId === elementId
  }
}

function clearDeepLinkParams(setSearchParams: ReturnType<typeof useSearchParams>[1]): void {
  setSearchParams(
    (prev) => {
      const next = new URLSearchParams(prev)
      next.delete('focus')
      next.delete('kasaFilter')
      return next
    },
    { replace: true }
  )
}
