import type { FormEvent, ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { APP_BASE } from '../config/appPaths'
import { ApiError, apiFetch, friendlyClientErrorMessage } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { PasswordGenerator } from '../components/auth/PasswordGenerator'
import { AuthFormCard } from '../components/auth/AuthFormCard'
import { PASSWORD_MIN_LENGTH } from '../lib/password'
import { AlertBox, Button, Input } from '../components/ui'

type ResetResponse = { ok: boolean; message: string }

const RESET_LINK_INVALID_MSG =
  'Şifre sıfırlama bağlantısı geçersiz veya süresi dolmuş. Lütfen yeniden şifre sıfırlama talebi oluşturun.'

function readTokenFromUrl(): string {
  if (typeof window === 'undefined') return ''
  return new URLSearchParams(window.location.search).get('token')?.trim() ?? ''
}

function resetPasswordErrorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    if (err.code === 'PASSWORD_RESET_INVALID' || err.status === 400) {
      return RESET_LINK_INVALID_MSG
    }
    return err.message
  }
  return friendlyClientErrorMessage(err, 'Şifre güncellenemedi.')
}

export function ResetPasswordPage(): ReactElement {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [resetToken] = useState(readTokenFromUrl)

  const [yeniSifre, setYeniSifre] = useState('')
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (resetToken && window.location.search.includes('token=')) {
      navigate('/reset-password', { replace: true })
    }
  }, [resetToken, navigate])

  useEffect(() => {
    if (!loading && session) navigate(APP_BASE, { replace: true })
  }, [loading, session, navigate])

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)
    if (yeniSifre.length < PASSWORD_MIN_LENGTH || yeniSifreTekrar.length < PASSWORD_MIN_LENGTH) {
      setError(`Şifre en az ${PASSWORD_MIN_LENGTH} karakter olmalıdır.`)
      return
    }
    if (yeniSifre !== yeniSifreTekrar) {
      setError('Şifreler eşleşmiyor.')
      return
    }
    setSubmitting(true)
    try {
      await apiFetch<ResetResponse>('/api/v1/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: resetToken,
          yeniSifre,
          yeniSifreTekrar
        })
      })
      navigate('/login', { replace: true, state: { resetOk: true } })
    } catch (err) {
      setError(resetPasswordErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const bootstrapping = loading
  const hasToken = resetToken.length > 0

  const footer = (
    <p className="text-center text-sm text-ink-muted">
      <Link to="/login" className="font-semibold text-primary hover:underline">
        Girişe dön
      </Link>
    </p>
  )

  if (!bootstrapping && !hasToken) {
    return (
      <AuthFormCard title="Yeni Şifre Belirle" subtitle="" icon="key" footer={footer}>
        <AlertBox variant="warning" title="Bağlantı geçersiz">
          Şifre sıfırlama bağlantısı geçersiz veya eksik.
        </AlertBox>
        <p className="text-sm leading-relaxed text-ink-muted">Lütfen yeniden şifre sıfırlama talebi oluşturun.</p>
        <Link
          to="/forgot-password"
          className="inline-flex h-10 w-full items-center justify-center rounded-md border border-primary bg-primary px-4 text-[0.95rem] font-semibold text-primary-fg shadow-sm transition hover:bg-primary-hover"
        >
          Şifremi unuttum sayfasına git
        </Link>
      </AuthFormCard>
    )
  }

  return (
    <AuthFormCard
      title="Yeni Şifre Belirle"
      subtitle="Yeni şifrenizi belirleyerek hesabınıza tekrar erişebilirsiniz."
      icon="key"
      className="max-h-[min(88vh,860px)] overflow-y-auto"
      footer={footer}
    >
      {bootstrapping ? (
        <AlertBox variant="info" title="Oturum kontrol ediliyor">
          Kaydınız doğrulanıyor; lütfen bekleyin.
        </AlertBox>
      ) : null}

      {error ? (
        <AlertBox variant="danger" title="Şifre sıfırlama">
          {error}
        </AlertBox>
      ) : null}

      <form className="space-y-3" onSubmit={(e) => void onSubmit(e)}>
        <Input
          label="Yeni şifre"
          name="yeniSifre"
          type="password"
          autoComplete="new-password"
          value={yeniSifre}
          onChange={(e) => setYeniSifre(e.target.value)}
          disabled={submitting || bootstrapping}
        />
        <Input
          label="Yeni şifre tekrar"
          name="yeniSifreTekrar"
          type="password"
          autoComplete="new-password"
          value={yeniSifreTekrar}
          onChange={(e) => setYeniSifreTekrar(e.target.value)}
          disabled={submitting || bootstrapping}
        />
        <PasswordGenerator
          disabled={submitting || bootstrapping}
          onApply={(pwd) => {
            setYeniSifre(pwd)
            setYeniSifreTekrar(pwd)
          }}
        />
        <Button type="submit" className="h-10 w-full text-[0.95rem]" disabled={submitting || bootstrapping}>
          {submitting ? 'Kaydediliyor…' : 'Şifreyi güncelle'}
        </Button>
      </form>
    </AuthFormCard>
  )
}
