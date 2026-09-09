import type { ReactElement } from 'react'
import { useMemo, useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { isYoneticiRole } from '../../lib/isYonetici'
import { WhatsappBaglantiPanel } from './panels/WhatsappBaglantiPanel'
import { WhatsappHatirlatmalariPanel } from './panels/WhatsappHatirlatmalariPanel'
import { WhatsappRandevuHatirlatmalariPanel } from './panels/WhatsappRandevuHatirlatmalariPanel'

type WaTab = 'baglanti' | 'tahsilat' | 'randevu'

const TAB_LABEL: Record<WaTab, string> = {
  baglanti: 'Bağlantı',
  tahsilat: 'Tahsilat Hatırlatmaları',
  randevu: 'Randevu Hatırlatmaları'
}

/**
 * WhatsApp ayarları — bağlantı / tahsilat / randevu sekmeleri.
 * Yalnız sunum; mevcut panellerin API davranışına dokunulmaz.
 */
export function WhatsappSection(): ReactElement {
  const { session } = useAuth()
  const isYonetici = isYoneticiRole(session?.user.role)
  const tabs = useMemo((): WaTab[] => {
    if (isYonetici) return ['baglanti', 'tahsilat', 'randevu']
    return ['baglanti']
  }, [isYonetici])
  const [tab, setTab] = useState<WaTab>('baglanti')
  const active = tabs.includes(tab) ? tab : 'baglanti'

  return (
    <div className="w-full min-w-0 space-y-4">
      <div
        className="flex flex-wrap gap-1 rounded-lg border border-border bg-surface-muted/40 p-1"
        role="tablist"
        aria-label="WhatsApp ayar bölümleri"
      >
        {tabs.map((id) => {
          const selected = active === id
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={selected}
              className={`rounded-md px-3 py-2 text-sm font-semibold transition ${
                selected
                  ? 'bg-white text-ink shadow-sm'
                  : 'text-ink-muted hover:bg-white/60 hover:text-ink'
              }`}
              onClick={() => setTab(id)}
            >
              {TAB_LABEL[id]}
            </button>
          )
        })}
      </div>

      <div role="tabpanel" className="min-w-0">
        {active === 'baglanti' ? <WhatsappBaglantiPanel /> : null}
        {active === 'tahsilat' && isYonetici ? <WhatsappHatirlatmalariPanel /> : null}
        {active === 'randevu' && isYonetici ? <WhatsappRandevuHatirlatmalariPanel /> : null}
      </div>
    </div>
  )
}
