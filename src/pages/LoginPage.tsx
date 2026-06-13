import type { FormEvent, ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { APP_BASE } from '../config/appPaths'
import { friendlyClientErrorMessage } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { AuthFormCard } from '../components/auth/AuthFormCard'
import { AlertBox, Button, Input } from '../components/ui'

export function LoginPage(): ReactElement {
  const { login, session, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const resetOk = Boolean((location.state as { resetOk?: boolean } | null)?.resetOk)
  const [identifier, setIdentifier] = useState('')
  const [sifre, setSifre] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && session) navigate(APP_BASE, { replace: true })
  }, [loading, session, navigate])

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login({ identifier, sifre })
      navigate(APP_BASE, { replace: true })
    } catch (err) {
      setError(friendlyClientErrorMessage(err, 'Giriş yapılamadı.'))
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
        <AlertBox variant="danger" title="Giriş başarısız">
          {error}
        </AlertBox>
      ) : null}
      {resetOk ? (
        <AlertBox variant="success" title="Şifre güncellendi">
          Yeni şifrenizle giriş yapabilirsiniz.
        </AlertBox>
      ) : null}

      <form className="space-y-3" onSubmit={(e) => void onSubmit(e)}>
        <Input
          label="Kullanıcı adı veya e-posta"
          name="identifier"
          autoComplete="username"
          value={identifier}
          onChange={(e) => setIdentifier(e.target.value)}
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
        <Button type="submit" className="h-10 w-full text-[0.95rem]" disabled={submitting || bootstrapping}>
          {submitting ? 'Giriş yapılıyor…' : 'Giriş Yap'}
        </Button>
      </form>
    </AuthFormCard>
  )
}
