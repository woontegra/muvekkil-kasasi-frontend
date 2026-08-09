import type { FormEvent, ReactElement } from 'react'
import { useEffect, useId, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { APP_BASE } from '../config/appPaths'
import { friendlyLoginErrorMessage } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { normalizeLoginIdentifier } from '../lib/normalizeKullaniciAdi'
import { LoginSuccessOverlay } from '../components/auth/LoginSuccessOverlay'
import { PremiumAlert } from '../components/auth/premium/PremiumAlert'
import { PremiumButton } from '../components/auth/premium/PremiumButton'
import { PremiumFormField } from '../components/auth/premium/PremiumFormField'
import { PremiumPasswordInput } from '../components/auth/premium/PremiumPasswordInput'
import { PremiumTextInput } from '../components/auth/premium/PremiumTextInput'
import { useToast } from '../toast'

const LOGIN_SUCCESS_DELAY_MS = 850

export function LoginPage(): ReactElement {
  const { login, session, loading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const toast = useToast()
  const idUser = useId()
  const idPass = useId()
  const resetOk = Boolean((location.state as { resetOk?: boolean } | null)?.resetOk)
  const resetToastShown = useRef(false)
  const redirectTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const shakeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [identifier, setIdentifier] = useState('')
  const [sifre, setSifre] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [successVisible, setSuccessVisible] = useState(false)
  const [welcomeName, setWelcomeName] = useState<string | null>(null)
  const [shake, setShake] = useState(false)

  useEffect(() => {
    return () => {
      if (redirectTimer.current) clearTimeout(redirectTimer.current)
      if (shakeTimer.current) clearTimeout(shakeTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!loading && session && !successVisible) {
      navigate(APP_BASE, { replace: true })
    }
  }, [loading, session, navigate, successVisible])

  useEffect(() => {
    if (!resetOk || resetToastShown.current) return
    resetToastShown.current = true
    toast.success({
      title: 'Şifre güncellendi',
      description: 'Yeni şifrenizle giriş yapabilirsiniz.'
    })
  }, [resetOk, toast])

  useEffect(() => {
    if (!error) return
    setShake(true)
    if (shakeTimer.current) clearTimeout(shakeTimer.current)
    shakeTimer.current = setTimeout(() => setShake(false), 520)
  }, [error])

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    if (submitting || successVisible) return
    setError(null)
    setSubmitting(true)
    try {
      const id = identifier.trim()
      const loginId = id.includes('@') ? id.toLowerCase() : normalizeLoginIdentifier(id)
      const result = await login({ identifier: loginId, sifre: sifre.trim() })
      setWelcomeName(result.user.adSoyad?.trim() || null)
      setSuccessVisible(true)
      redirectTimer.current = setTimeout(() => {
        navigate(APP_BASE, { replace: true })
      }, LOGIN_SUCCESS_DELAY_MS)
    } catch (err) {
      const message = friendlyLoginErrorMessage(err)
      setError(message)
      toast.error({
        title: 'Giriş başarısız',
        description: message
      })
      setSubmitting(false)
    }
  }

  const bootstrapping = loading
  const formLocked = submitting || successVisible || bootstrapping

  return (
    <>
      <div
        className={['pm-login-panel', 'pm-login-panel--enter', shake ? 'pm-login-panel--shake' : ''].filter(Boolean).join(' ')}
      >
        <header className="pm-login-panel-head">
          <h2 className="pm-login-panel-title">Hoş geldiniz</h2>
          <p className="pm-login-panel-sub">Hesabınızla güvenli oturum açın</p>
        </header>

        {bootstrapping ? <PremiumAlert tone="info">Oturum kontrol ediliyor…</PremiumAlert> : null}
        {error ? <PremiumAlert tone="error">{error}</PremiumAlert> : null}
        {resetOk ? <PremiumAlert tone="success">Yeni şifrenizle giriş yapabilirsiniz.</PremiumAlert> : null}

        <form className="pm-login-form" onSubmit={(e) => void onSubmit(e)}>
          <PremiumFormField label="E-posta veya kullanıcı adı" htmlFor={idUser}>
            <PremiumTextInput
              id={idUser}
              className="pm-login-input"
              name="identifier"
              autoComplete="username"
              type="text"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onBlur={() => {
                const v = identifier.trim()
                if (v && !v.includes('@')) setIdentifier(normalizeLoginIdentifier(v))
              }}
              disabled={formLocked}
              placeholder="E-posta veya kullanıcı adınız"
            />
          </PremiumFormField>

          <PremiumFormField label="Şifre" htmlFor={idPass}>
            <PremiumPasswordInput
              id={idPass}
              className="pm-login-input"
              name="password"
              autoComplete="current-password"
              value={sifre}
              onChange={(e) => setSifre(e.target.value)}
              disabled={formLocked}
              placeholder="••••••••"
              showPassword={showPass}
              onToggleVisibility={() => setShowPass((v) => !v)}
            />
          </PremiumFormField>

          <PremiumButton type="submit" className="pm-login-submit" disabled={formLocked}>
            {submitting ? (
              <span className="pm-login-submit-inner">
                <span className="pm-login-spinner" aria-hidden />
                Giriş yapılıyor…
              </span>
            ) : (
              'Giriş Yap'
            )}
          </PremiumButton>
        </form>

        <footer className="pm-login-panel-footer">
          <Link to="/forgot-password" className="pm-auth-link">
            Şifremi unuttum
          </Link>
        </footer>
      </div>

      {successVisible ? <LoginSuccessOverlay welcomeName={welcomeName} /> : null}
    </>
  )
}
