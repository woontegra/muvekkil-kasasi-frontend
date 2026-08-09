import { useMutation } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { changePasswordRequest } from '../../../api/authOnboarding'
import { APP_BASE } from '../../../config/appPaths'
import { useAuth } from '../../../contexts/AuthContext'
import { roleLabel } from '../../../lib/roleLabel'
import { Button, Input } from '../../ui'
import { useToast } from '../../../toast'
import { AyarlarPanelShell, SettingRow } from '../shared'

export function KullaniciGuvenlikPanel(): ReactElement {
  const { session, logout } = useAuth()
  const toast = useToast()
  const user = session?.user

  const [passwordOpen, setPasswordOpen] = useState(false)
  const [mevcutSifre, setMevcutSifre] = useState('')
  const [yeniSifre, setYeniSifre] = useState('')
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState('')

  const passwordMu = useMutation({
    mutationFn: () =>
      changePasswordRequest({
        mevcutSifre,
        yeniSifre,
        yeniSifreTekrar
      }),
    onSuccess: async (res) => {
      toast.success(res.message)
      setMevcutSifre('')
      setYeniSifre('')
      setYeniSifreTekrar('')
      setPasswordOpen(false)
      await logout()
    },
    onError: (e) => {
      toast.error(e instanceof Error ? e.message : 'Şifre güncellenemedi.')
    }
  })

  return (
    <AyarlarPanelShell
      title="Kullanıcı & Güvenlik"
      description="Oturum bilgileriniz ve şifre yönetimi."
    >
      <div className="rounded-lg border border-border bg-white px-4 py-1 shadow-sm sm:px-5">
        <SettingRow label="Kullanıcı adı" value={user?.kullaniciAdi} mono />
        <SettingRow label="Ad soyad" value={user?.adSoyad} />
        <SettingRow label="Rol" value={user ? roleLabel(user.role) : null} />
      </div>

      <div className="space-y-3">
        {!passwordOpen ? (
          <Button type="button" variant="outline" size="sm" onClick={() => setPasswordOpen(true)}>
            Şifre değiştir
          </Button>
        ) : (
          <form
            className="space-y-3 rounded-lg border border-border bg-surface-muted/30 p-4"
            onSubmit={(e) => {
              e.preventDefault()
              if (passwordMu.isPending) return
              passwordMu.mutate()
            }}
          >
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">Şifre değiştir</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => {
                  setPasswordOpen(false)
                  setMevcutSifre('')
                  setYeniSifre('')
                  setYeniSifreTekrar('')
                }}
              >
                Kapat
              </Button>
            </div>
            <Input
              label="Mevcut şifre"
              type="password"
              autoComplete="current-password"
              value={mevcutSifre}
              onChange={(e) => setMevcutSifre(e.target.value)}
              disabled={passwordMu.isPending}
            />
            <Input
              label="Yeni şifre"
              type="password"
              autoComplete="new-password"
              value={yeniSifre}
              onChange={(e) => setYeniSifre(e.target.value)}
              disabled={passwordMu.isPending}
            />
            <Input
              label="Yeni şifre tekrar"
              type="password"
              autoComplete="new-password"
              value={yeniSifreTekrar}
              onChange={(e) => setYeniSifreTekrar(e.target.value)}
              disabled={passwordMu.isPending}
            />
            <Button type="submit" size="sm" disabled={passwordMu.isPending || !mevcutSifre || !yeniSifre || !yeniSifreTekrar}>
              {passwordMu.isPending ? 'Kaydediliyor…' : 'Şifreyi güncelle'}
            </Button>
          </form>
        )}

        <Link
          to={`${APP_BASE}/kullanicilar`}
          className="inline-flex h-8 items-center justify-center rounded-md border border-border-strong bg-white px-3 text-xs font-semibold text-ink shadow-sm hover:bg-surface-muted dark:bg-surface-elevated"
        >
          Kullanıcıları yönet
        </Link>
      </div>
    </AyarlarPanelShell>
  )
}
