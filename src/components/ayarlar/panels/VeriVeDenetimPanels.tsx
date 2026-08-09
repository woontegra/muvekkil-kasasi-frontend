import type { ReactElement } from 'react'
import { DesktopImportFlow } from '../DesktopImportFlow'
import { Button } from '../../ui'
import { AyarlarPanelShell } from '../shared'

export function VeriAktarimiPanel(): ReactElement {
  return (
    <AyarlarPanelShell
      title="Veri Aktarımı"
      description="Masaüstü Kasa Defteri yedeğinizi bu SaaS bürosuna aktarın."
    >
      <DesktopImportFlow />
    </AyarlarPanelShell>
  )
}

export function DenetimKayitlariPanel(props: { onOpenAudit: () => void; canViewAudit: boolean }): ReactElement {
  return (
    <AyarlarPanelShell
      title="Denetim Kayıtları"
      description="Güvenlik kuralları ve denetim günlüğü erişimi."
    >
      <div className="rounded-lg border border-border bg-white p-4 text-sm leading-relaxed text-ink-muted shadow-sm sm:p-5">
        <ul className="list-inside list-disc space-y-1.5">
          <li>Onaylı dosya kasası ve ofis kasası hareketleri doğrudan değiştirilmez.</li>
          <li>Düzeltmeler ayrı kayıt olarak tutulur ve onay akışından geçer.</li>
          <li>Önemli işlemler denetim (audit) günlüğüne yazılır.</li>
        </ul>
        <div className="mt-4">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={!props.canViewAudit}
            title={!props.canViewAudit ? 'Denetim kayıtları yönetici rolleri içindir.' : undefined}
            onClick={props.onOpenAudit}
          >
            Denetim kayıtları
          </Button>
        </div>
      </div>
    </AyarlarPanelShell>
  )
}
