import type { FormEvent, ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { APP_BASE } from '../config/appPaths'
import { apiFetch, friendlyForgotPasswordErrorMessage } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { AuthFormCard } from '../components/auth/AuthFormCard'
import { AlertBox, Button, Input } from '../components/ui'

type ForgotResponse = { ok: boolean; message: string }

const SUCCESS_HINT =
  'Bilgiler sistemde kayıtlıysa şifre sıfırlama bağlantısı e-posta adresinize gönderilecektir.'

export function ForgotPasswordPage(): ReactElement {
  const { session, loading } = useAuth()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [doneMessage, setDoneMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && session) navigate(APP_BASE, { replace: true })
  }, [loading, session, navigate])

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)
    setDoneMessage(null)
    setSubmitting(true)
    try {
      const r = await apiFetch<ForgotResponse>('/api/v1/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ identifier: identifier.trim() })
      })
      setDoneMessage(r.message || SUCCESS_HINT)
      setIdentifier('')
    } catch (err) {
      setError(friendlyForgotPasswordErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  const bootstrapping = loading

  return (
    <AuthFormCard
      title="Şifremi unuttum"
      subtitle="Kayıtlı e-posta adresiniz veya kullanıcı adınız ile sıfırlama bağlantısı talep edebilirsiniz."
      icon="mail"
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
      {error ? (
        <AlertBox variant="danger" title="Hata">
          {error}
        </AlertBox>
      ) : null}
      {doneMessage ? (
        <AlertBox variant="success" title="İstek alındı">
          {doneMessage}
        </AlertBox>
      ) : null}

      <form className="space-y-3" onSubmit={(e) => void onSubmit(e)}>
        <Input
          label="E-posta veya kullanıcı adı"
          name="identifier"
          type="text"
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          disabled={submitting || bootstrapping}
          hint="E-posta tek bir büroya kayıtlı olmalıdır."
          required
        />
        <Button type="submit" className="h-10 w-full text-[0.95rem]" disabled={submitting || bootstrapping}>
          {submitting ? 'Gönderiliyor…' : 'Şifre sıfırlama bağlantısı gönder'}
        </Button>
      </form>
    </AuthFormCard>
  )
}
