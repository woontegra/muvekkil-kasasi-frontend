import type { FormEvent, ReactElement } from 'react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { APP_BASE } from '../config/appPaths'
import { friendlyLoginErrorMessage } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { normalizeLoginIdentifier } from '../lib/normalizeKullaniciAdi'
import { AuthFormCard } from '../components/auth/AuthFormCard'
import { AlertBox, Button, Input } from '../components/ui'
import { useToast } from '../toast'

export function LoginPage(): ReactElement {
  const { login, session, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const resetOk = Boolean((location.state as { resetOk?: boolean } | null)?.resetOk)
  const resetToastShown = useRef(false)
  const [identifier, setIdentifier] = useState('')
  const [sifre, setSifre] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && session) navigate(APP_BASE, { replace: true })
  }, [loading, session, navigate])

  useEffect(() => {
    if (!resetOk || resetToastShown.current) return
    resetToastShown.current = true
    toast.success({
      title: 'Şifre güncellendi',
      description: 'Yeni şifrenizle giriş yapabilirsiniz.'
    })
  }, [resetOk, toast])

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const id = identifier.trim()
      const loginId = id.includes('@') ? id.toLowerCase() : normalizeLoginIdentifier(id)
      await login({ identifier: loginId, sifre: sifre.trim() })
      toast.success({
        title: 'Giriş başarılı',
        description: 'Müvekkil Kasası’na yönlendiriliyorsunuz.'
      })
      navigate(APP_BASE, { replace: true })
    } catch (err) {
      const message = friendlyLoginErrorMessage(err)
      setError(message)
      toast.error({
        title: 'Giriş başarısız',
        description: message
      })
    } finally {
      setSubmitting(false)
    }
  }

  const bootstrapping = loading

  return (
    <AuthFormCard
      title="Giriş Yap"
      subtitle="Devam etmek için kullanıcı bilgilerinizi girin."
      icon="lock"
      footer={
        <p className="text-center text-xs leading-relaxed text-ink-muted">
          Hesabınız Woontegra tarafından oluşturulduktan sonra size iletilen bilgilerle giriş yapabilirsiniz.
        </p>
      }
    >
      {bootstrapping ? (
        <AlertBox variant="info" title="Oturum kontrol ediliyor">
          Kaydınız doğrulanıyor; lütfen bekleyin.
        </AlertBox>
      ) : null}
      {error ? (
        <div className="motion-field-error" key={error}>
          <AlertBox variant="danger" title="Giriş başarısız">
            {error}
          </AlertBox>
        </div>
      ) : null}
      {resetOk ? (
        <AlertBox variant="success" title="Şifre güncellendi" className="motion-success-pop">
          Yeni şifrenizle giriş yapabilirsiniz.
        </AlertBox>
      ) : null}

      <form className="space-y-3" onSubmit={(e) => void onSubmit(e)}>
        <Input
          label="E-posta veya kullanıcı adı"
          name="identifier"
          autoComplete="username"
          type="text"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
          onBlur={() => {
            const v = identifier.trim()
            if (v && !v.includes('@')) setIdentifier(normalizeLoginIdentifier(v))
          }}
          disabled={submitting || bootstrapping}
        />
        <Input
          label="Şifre"
          name="password"
          type="password"
          autoComplete="current-password"
          value={sifre}
          onChange={(e) => setSifre(e.target.value)}
          disabled={submitting || bootstrapping}
        />
        <div className="text-right">
          <Link to="/forgot-password" className="text-sm font-semibold text-primary hover:underline">
            Şifremi unuttum
          </Link>
        </div>
        <Button type="submit" className="h-10 w-full text-[0.95rem]" loading={submitting} disabled={bootstrapping}>
          Giriş Yap
        </Button>
      </form>
    </AuthFormCard>
  )
}
