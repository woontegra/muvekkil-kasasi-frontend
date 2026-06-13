import type { ReactElement } from 'react'
import { useCallback, useState } from 'react'
import { generateStrongPassword } from '../../lib/password'
import { cn } from '../../lib/cn'
import { AlertBox, Button } from '../ui'

export type PasswordGeneratorProps = {
  /** Üretilen şifreyi hem şifre hem tekrar alanına yazmak için. */
  onApply: (password: string) => void
  disabled?: boolean
  className?: string
}

export function PasswordGenerator({ onApply, disabled, className }: PasswordGeneratorProps): ReactElement {
  const [lastGenerated, setLastGenerated] = useState<string | null>(null)
  const [copyHint, setCopyHint] = useState<string | null>(null)

  const handleGenerate = useCallback(() => {
    const pwd = generateStrongPassword()
    onApply(pwd)
    setLastGenerated(pwd)
    setCopyHint(null)
  }, [onApply])

  const handleCopy = useCallback(async () => {
    if (!lastGenerated) return
    try {
      await navigator.clipboard.writeText(lastGenerated)
      setCopyHint('Panoya kopyalandı.')
    } catch {
      setCopyHint('Kopyalama başarısız; şifreyi elle seçin.')
    }
  }, [lastGenerated])

  return (
    <div className={cn('space-y-2 rounded-lg border border-border bg-surface-muted/40 p-3', className)}>
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" variant="outline" size="sm" onClick={handleGenerate} disabled={disabled}>
          Güçlü şifre oluştur
        </Button>
        {lastGenerated ? (
          <Button type="button" variant="secondary" size="sm" onClick={() => void handleCopy()} disabled={disabled}>
            Kopyala
          </Button>
        ) : null}
      </div>
      {lastGenerated ? (
        <>
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase text-ink-muted">Oluşturulan şifre</p>
            <input
              readOnly
              className="w-full rounded-md border border-border bg-white px-2 py-1.5 font-mono text-sm text-ink"
              value={lastGenerated}
              aria-label="Oluşturulan şifre"
              onFocus={(e) => e.target.select()}
            />
          </div>
          <AlertBox variant="warning" title="Önemli">
            Bu şifreyi güvenli bir yerde saklayın. Üretilen değer hem &quot;Şifre&quot; hem &quot;Şifre tekrar&quot; alanına
            yazıldı.
          </AlertBox>
          {copyHint ? <p className="text-xs text-ink-muted">{copyHint}</p> : null}
        </>
      ) : (
        <p className="text-xs text-ink-muted">14–16 karakter; büyük/küçük harf, rakam ve okunabilir özel karakterler.</p>
      )}
    </div>
  )
}
