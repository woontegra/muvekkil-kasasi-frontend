import type { ReactElement } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { startLicenseRenewal } from '../lib/licenseRenewal'

export function LicenseRenewalEntryPage(): ReactElement {
  const { session } = useAuth()
  const role = session?.user.role
  const canRenew = role === 'BURO_SAHIBI' || role === 'AVUKAT_YONETICI'
  const started = useRef(false)
  const [error, setError] = useState<string | null>(null)
  const [opening, setOpening] = useState(canRenew)

  useEffect(() => {
    if (!canRenew || started.current) return
    started.current = true
    void (async () => {
      try {
        await startLicenseRenewal()
      } catch {
        setError('Lisans yenileme bağlantısı oluşturulamadı. Lütfen tekrar deneyin.')
      } finally {
        setOpening(false)
      }
    })()
  }, [canRenew])

  if (!canRenew) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <h1 className="text-lg font-semibold text-ink">Lisans yenileme</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Lisans yenileme işlemi yalnızca büro yöneticileri tarafından yapılabilir.
        </p>
        <Link to="/app/ayarlar" className="mt-6 inline-block text-sm font-medium text-brand hover:underline">
          Ayarlara dön
        </Link>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16 text-center">
      <h1 className="text-lg font-semibold text-ink">Lisans yenileme</h1>
      {opening ? (
        <p className="mt-2 text-sm text-ink-muted">Güvenli ödeme sayfası açılıyor…</p>
      ) : error ? (
        <p className="mt-2 text-sm text-danger">{error}</p>
      ) : (
        <p className="mt-2 text-sm text-ink-muted">
          Ödeme sayfası yeni sekmede açıldı. Sekme açılmadıysa Ayarlar → Lisans bölümünden yeniden deneyebilirsiniz.
        </p>
      )}
      <Link to="/app/ayarlar" className="mt-6 inline-block text-sm font-medium text-brand hover:underline">
        Ayarlara dön
      </Link>
    </div>
  )
}
