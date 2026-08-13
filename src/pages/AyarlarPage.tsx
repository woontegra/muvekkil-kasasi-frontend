import type { ReactElement } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AyarlarNav } from '../components/ayarlar/AyarlarNav'
import { DenetimKayitlariModal } from '../components/ayarlar/DenetimKayitlariModal'
import { BuroBilgileriPanel } from '../components/ayarlar/panels/BuroBilgileriPanel'
import { DenetimKayitlariPanel } from '../components/ayarlar/panels/VeriVeDenetimPanels'
import { HesapDonemiPanel } from '../components/ayarlar/panels/HesapDonemiPanel'
import { KullaniciGuvenlikPanel } from '../components/ayarlar/panels/KullaniciGuvenlikPanel'
import { LisansKullanimPanel } from '../components/ayarlar/panels/LisansKullanimPanel'
import { SistemBilgisiPanel } from '../components/ayarlar/panels/SistemBilgisiPanel'
import { WhatsappBaglantiPanel } from '../components/ayarlar/panels/WhatsappBaglantiPanel'
import { WhatsappHazirSablonKutuphanesiPanel } from '../components/ayarlar/panels/WhatsappHazirSablonKutuphanesiPanel'
import { WhatsappHatirlatmalariPanel } from '../components/ayarlar/panels/WhatsappHatirlatmalariPanel'
import { VeriAktarimiPanel } from '../components/ayarlar/panels/VeriVeDenetimPanels'
import {
  buildAyarlarNavItems,
  firstAllowedSection,
  isAyarlarSectionAllowed,
  resolveAyarlarAccess,
  type AyarlarSectionId
} from '../components/ayarlar/ayarlarSections'
import { PageHeader } from '../components/ui'
import { useAuth } from '../contexts/AuthContext'

function parseSection(raw: string | null): AyarlarSectionId | null {
  if (
    raw === 'buro' ||
    raw === 'hesap-donemi' ||
    raw === 'whatsapp' ||
    raw === 'kullanici' ||
    raw === 'veri' ||
    raw === 'denetim' ||
    raw === 'lisans' ||
    raw === 'sistem'
  ) {
    return raw
  }
  return null
}

export function AyarlarPage(): ReactElement {
  // Yalnızca tenant oturumu — useAdminAuth / SUPER_ADMIN burada kullanılmaz.
  const { session } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const [auditModalOpen, setAuditModalOpen] = useState(false)

  const access = useMemo(() => resolveAyarlarAccess(session?.user.role), [session?.user.role])
  const { isBuroSahibi, isYonetici, canViewAudit } = access

  const navItems = useMemo(() => buildAyarlarNavItems(access), [access])
  const defaultSection = useMemo(() => firstAllowedSection(access), [access])

  const requested = parseSection(searchParams.get('bolum'))
  const activeSection: AyarlarSectionId =
    requested && isAyarlarSectionAllowed(requested, access) ? requested : defaultSection

  useEffect(() => {
    if (!requested || !isAyarlarSectionAllowed(requested, access)) {
      const sp = new URLSearchParams(searchParams)
      sp.set('bolum', defaultSection)
      setSearchParams(sp, { replace: true })
    }
  }, [requested, access, defaultSection, searchParams, setSearchParams])

  function selectSection(id: AyarlarSectionId): void {
    const sp = new URLSearchParams(searchParams)
    sp.set('bolum', id)
    setSearchParams(sp, { replace: true })
  }

  return (
    <div className="w-full max-w-none space-y-5">
      <PageHeader
        title="Ayarlar"
        description="Büro, hesap ve sistem tercihlerinizi yönetin."
      />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:gap-6">
        <AyarlarNav items={navItems} active={activeSection} onSelect={selectSection} />

        <div className="min-w-0 flex-1">
          {activeSection === 'buro' ? <BuroBilgileriPanel /> : null}
          {activeSection === 'hesap-donemi' && isYonetici ? <HesapDonemiPanel /> : null}
          {activeSection === 'whatsapp' ? (
            <div className="space-y-5">
              <WhatsappBaglantiPanel />
              <WhatsappHazirSablonKutuphanesiPanel />
              {isYonetici ? <WhatsappHatirlatmalariPanel /> : null}
            </div>
          ) : null}
          {activeSection === 'kullanici' ? <KullaniciGuvenlikPanel /> : null}
          {activeSection === 'veri' && isBuroSahibi ? <VeriAktarimiPanel /> : null}
          {activeSection === 'denetim' && canViewAudit ? (
            <DenetimKayitlariPanel canViewAudit={canViewAudit} onOpenAudit={() => setAuditModalOpen(true)} />
          ) : null}
          {activeSection === 'lisans' ? <LisansKullanimPanel /> : null}
          {activeSection === 'sistem' ? <SistemBilgisiPanel /> : null}
        </div>
      </div>

      {auditModalOpen && canViewAudit ? <DenetimKayitlariModal onClose={() => setAuditModalOpen(false)} /> : null}
    </div>
  )
}
