import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { updateHesapDonemiModu, HESAP_DONEMI_OZET_QUERY_KEY } from '../../../api/hesapDonemi'
import { useAuth } from '../../../contexts/AuthContext'
import { Button } from '../../ui'
import { useToast } from '../../../toast'
import { AyarlarPanelShell } from '../shared'

export function HesapDonemiPanel(): ReactElement {
  const { session, refreshMe } = useAuth()
  const queryClient = useQueryClient()
  const toast = useToast()
  const currentMode = session?.tenant.hesapDonemiModu ?? 'MONTHLY'

  const mutation = useMutation({
    mutationFn: (modu: 'MONTHLY' | 'YEARLY') => updateHesapDonemiModu(modu),
    onSuccess: async (_data, modu) => {
      toast.success(`Hesap dönemi modu "${modu === 'MONTHLY' ? 'Aylık' : 'Yıllık'}" olarak güncellendi.`)
      void queryClient.invalidateQueries({ queryKey: [...HESAP_DONEMI_OZET_QUERY_KEY] })
      await refreshMe()
    },
    onError: () => {
      toast.error('Hesap dönemi modu güncellenemedi.')
    }
  })

  return (
    <AyarlarPanelShell
      title="Hesap Dönemi"
      description="Ofis kasası özet kartında hangi dönemin gösterileceğini seçin."
    >
      <div className="space-y-4 rounded-lg border border-border bg-white p-4 shadow-sm sm:p-5">
        <div className="space-y-2 text-sm text-ink-muted">
          <p>
            <strong className="text-ink">Aylık:</strong> Özet kartı içinde bulunulan takvim ayına göre hesaplanır.
          </p>
          <p>
            <strong className="text-ink">Yıllık:</strong> Özet kartı içinde bulunulan takvim yılına göre hesaplanır.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant={currentMode === 'MONTHLY' ? 'primary' : 'outline'}
            size="sm"
            disabled={mutation.isPending}
            onClick={() => {
              if (currentMode !== 'MONTHLY') mutation.mutate('MONTHLY')
            }}
          >
            Aylık
          </Button>
          <Button
            type="button"
            variant={currentMode === 'YEARLY' ? 'primary' : 'outline'}
            size="sm"
            disabled={mutation.isPending}
            onClick={() => {
              if (currentMode !== 'YEARLY') mutation.mutate('YEARLY')
            }}
          >
            Yıllık
          </Button>
        </div>
        {mutation.isPending ? <p className="text-xs text-ink-muted">Kaydediliyor…</p> : null}
      </div>
    </AyarlarPanelShell>
  )
}
