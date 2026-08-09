import type { ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { updateTenantProfile } from '../../../api/tenant'
import { useAuth } from '../../../contexts/AuthContext'
import { Button, Input } from '../../ui'
import { useToast } from '../../../toast'
import { AyarlarPanelShell, ModalShell, SettingRow } from '../shared'

export function BuroBilgileriPanel(): ReactElement {
  const { session, refreshMe } = useAuth()
  const toast = useToast()
  const isBuroSahibi = session?.user.role === 'BURO_SAHIBI'
  const tenant = session?.tenant

  const [officeModalOpen, setOfficeModalOpen] = useState(false)
  const [draftBuroAdi, setDraftBuroAdi] = useState('')
  const [draftTelefon, setDraftTelefon] = useState('')
  const [draftEposta, setDraftEposta] = useState('')
  const [draftAdres, setDraftAdres] = useState('')
  const [draftVergiNo, setDraftVergiNo] = useState('')
  const [draftVergiDairesi, setDraftVergiDairesi] = useState('')

  const officeSaveMu = useMutation({
    mutationFn: () =>
      updateTenantProfile({
        buroAdi: draftBuroAdi.trim(),
        telefon: draftTelefon.trim() || null,
        eposta: draftEposta.trim() || null,
        adres: draftAdres.trim() || null,
        vergiNo: draftVergiNo.trim() || null,
        vergiDairesi: draftVergiDairesi.trim() || null
      }),
    onSuccess: async () => {
      toast.success('Büro bilgileri güncellendi.')
      await refreshMe()
      setOfficeModalOpen(false)
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : 'Büro bilgileri kaydedilemedi.')
    }
  })

  useEffect(() => {
    if (!officeModalOpen || !tenant) return
    setDraftBuroAdi(tenant.buroAdi ?? '')
    setDraftTelefon(tenant.telefon ?? '')
    setDraftEposta(tenant.eposta ?? '')
    setDraftAdres(tenant.adres ?? '')
    setDraftVergiNo(tenant.vergiNo ?? '')
    setDraftVergiDairesi(tenant.vergiDairesi ?? '')
  }, [officeModalOpen, tenant])

  return (
    <AyarlarPanelShell
      title="Büro Bilgileri"
      description="Büronuzun iletişim ve vergi bilgilerini görüntüleyin veya güncelleyin."
    >
      <div className="rounded-lg border border-border bg-white px-4 py-1 shadow-sm sm:px-5">
        <SettingRow label="Büro adı" value={tenant?.buroAdi} />
        <SettingRow label="Telefon" value={tenant?.telefon} />
        <SettingRow label="E-posta" value={tenant?.eposta} />
        <SettingRow label="Adres" value={tenant?.adres} />
        <SettingRow label="Vergi no" value={tenant?.vergiNo} />
        <SettingRow label="Vergi dairesi" value={tenant?.vergiDairesi} />
        <div className="py-2.5">
          <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Büro kodu</p>
          <p className="mt-0.5 font-mono text-xs text-ink-subtle">{tenant?.slug ?? '—'}</p>
          <p className="mt-1 text-[11px] leading-snug text-ink-subtle">Teknik tanımlayıcıdır; değiştirilemez.</p>
        </div>
      </div>

      <div className="pt-1">
        {isBuroSahibi ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setOfficeModalOpen(true)}>
            Büro bilgilerini düzenle
          </Button>
        ) : (
          <p className="text-xs text-ink-muted">Büro bilgilerini yalnızca büro sahibi düzenleyebilir.</p>
        )}
      </div>

      {officeModalOpen && tenant && isBuroSahibi ? (
        <ModalShell title="Büro bilgilerini düzenle" onClose={() => setOfficeModalOpen(false)}>
          <div className="space-y-3">
            <Input label="Büro adı" value={draftBuroAdi} onChange={(e) => setDraftBuroAdi(e.target.value)} disabled={officeSaveMu.isPending} />
            <Input label="Telefon" value={draftTelefon} onChange={(e) => setDraftTelefon(e.target.value)} disabled={officeSaveMu.isPending} />
            <Input label="E-posta" type="email" value={draftEposta} onChange={(e) => setDraftEposta(e.target.value)} disabled={officeSaveMu.isPending} />
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">Adres</label>
              <textarea
                className="min-h-[72px] w-full rounded-md border border-border bg-white px-3 py-2 text-sm text-ink dark:bg-surface-elevated"
                value={draftAdres}
                onChange={(e) => setDraftAdres(e.target.value)}
                disabled={officeSaveMu.isPending}
              />
            </div>
            <Input label="Vergi no" value={draftVergiNo} onChange={(e) => setDraftVergiNo(e.target.value)} disabled={officeSaveMu.isPending} />
            <Input
              label="Vergi dairesi"
              value={draftVergiDairesi}
              onChange={(e) => setDraftVergiDairesi(e.target.value)}
              disabled={officeSaveMu.isPending}
            />
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setOfficeModalOpen(false)} disabled={officeSaveMu.isPending}>
              Kapat
            </Button>
            <Button type="button" size="sm" disabled={officeSaveMu.isPending || !draftBuroAdi.trim()} onClick={() => officeSaveMu.mutate()}>
              {officeSaveMu.isPending ? 'Kaydediliyor…' : 'Kaydet'}
            </Button>
          </div>
        </ModalShell>
      ) : null}
    </AyarlarPanelShell>
  )
}
