import type { FormEvent, ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { APP_BASE } from '../config/appPaths'
import { apiFetch, friendlyClientErrorMessage } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { PasswordGenerator } from '../components/auth/PasswordGenerator'
import { AuthFormCard } from '../components/auth/AuthFormCard'
import { PASSWORD_MIN_LENGTH } from '../lib/password'
import { AlertBox, Button, Input } from '../components/ui'

type ResetResponse = { ok: boolean; message: string }

export function ResetPasswordPage(): ReactElement {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const tokenFromUrl = params.get('token')?.trim() ?? ''

  const [token, setToken] = useState(tokenFromUrl)
  const [yeniSifre, setYeniSifre] = useState('')
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    setToken(tokenFromUrl)
  }, [tokenFromUrl])

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
    if (!token.trim()) {
      setError('Geçersiz sıfırlama bağlantısı.')
      return
    }
    setSubmitting(true)
    try {
      await apiFetch<ResetResponse>('/api/v1/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({
          token: token.trim(),
          yeniSifre,
          yeniSifreTekrar
        })
      })
      navigate('/login', { replace: true, state: { resetOk: true } })
    } catch (err) {
      setError(friendlyClientErrorMessage(err, 'Şifre güncellenemedi.'))
    } finally {
      setSubmitting(false)
    }
  }

  const bootstrapping = loading

  return (
    <AuthFormCard
      title="Yeni şifre belirle"
      subtitle="E-postadaki bağlantıdaki anahtar otomatik doldurulur."
      icon="key"
      className="max-h-[min(88vh,860px)] overflow-y-auto"
      footer={
        <p className="text-center text-sm text-ink-muted">
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Girişe dön
          </Link>
        </p>
      }
    >
      {bootstrapping ? (
        <AlertBox variant="info" title="Oturum kontrol ediliyor">
          Kaydınız doğrulanıyor; lütfen bekleyin.
        </AlertBox>
      ) : null}
      {!tokenFromUrl ? (
        <AlertBox variant="warning" title="Bağlantı eksik">
          Geçerli bir sıfırlama bağlantısı kullanın. Geliştirme ortamında link backend konsolunda görünür.
        </AlertBox>
      ) : null}

      {error ? (
        <AlertBox variant="danger" title="Şifre sıfırlama">
          {error}
        </AlertBox>
      ) : null}

      <form className="space-y-3" onSubmit={(e) => void onSubmit(e)}>
        <Input
          label="Sıfırlama anahtarı (token)"
          name="token"
          autoComplete="off"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          disabled={submitting || bootstrapping}
          className="font-mono text-xs"
        />
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
        <Button type="submit" className="h-10 w-full text-[0.95rem]" disabled={submitting || bootstrapping || !token.trim()}>
          {submitting ? 'Kaydediliyor…' : 'Şifreyi güncelle'}
        </Button>
      </form>
    </AuthFormCard>
  )
}
