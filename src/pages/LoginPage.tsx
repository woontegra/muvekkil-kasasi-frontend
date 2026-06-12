import type { FormEvent, ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { APP_BASE } from '../config/appPaths'
import { ApiError } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { AlertBox, Button, Card, CardBody, CardHeader, CardTitle, Input } from '../components/ui'

export function LoginPage(): ReactElement {
  const { login, session, loading } = useAuth()
  const navigate = useNavigate()
  const [epostaVeyaKullaniciAdi, setEpostaVeyaKullaniciAdi] = useState('')
  const [tenantSlug, setTenantSlug] = useState('')
  const [sifre, setSifre] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && session) navigate(APP_BASE, { replace: true })
  }, [loading, session, navigate])

  const isEmail = epostaVeyaKullaniciAdi.trim().includes('@')

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await login({
        epostaVeyaKullaniciAdi,
        tenantSlug: isEmail ? undefined : tenantSlug,
        sifre
      })
      navigate(APP_BASE, { replace: true })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Giriş yapılamadı.'
      setError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardBody className="py-10 text-center text-sm text-ink-muted">Yükleniyor…</CardBody>
      </Card>
    )
  }

  return (
    <Card className="overflow-hidden shadow-card">
      <CardHeader className="bg-gradient-to-r from-primary to-accent text-primary-fg">
        <CardTitle className="text-primary-fg">Giriş</CardTitle>
        <p className="text-xs text-white/90">Woontegra · Müvekkil Kasa Defteri SaaS</p>
      </CardHeader>
      <CardBody className="space-y-4 p-5">
        <p className="text-sm text-ink-muted">
          E-posta ile giriş yapıyorsanız büro kodu gerekmez. <strong>Kullanıcı adı</strong> ile giriş için{' '}
          <strong>büro kodunu</strong> (URL&apos;deki kısa kod) girin.
        </p>

        {error ? (
          <AlertBox variant="danger" title="Giriş başarısız">
            {error}
          </AlertBox>
        ) : null}

        <form className="space-y-3" onSubmit={(e) => void onSubmit(e)}>
          <Input
            label="E-posta veya kullanıcı adı"
            name="identifier"
            autoComplete="username"
            value={epostaVeyaKullaniciAdi}
            onChange={(e) => setEpostaVeyaKullaniciAdi(e.target.value)}
            disabled={submitting}
          />
          {!isEmail && epostaVeyaKullaniciAdi.trim().length > 0 ? (
            <Input
              label="Büro kodu (slug)"
              name="tenantSlug"
              autoComplete="organization"
              hint="Örn: yilmaz-hukuk — kayıt sonrası e-postanızda veya yöneticinizden alın."
              value={tenantSlug}
              onChange={(e) => setTenantSlug(e.target.value)}
              disabled={submitting}
            />
          ) : null}
          <Input
            label="Şifre"
            name="password"
            type="password"
            autoComplete="current-password"
            value={sifre}
            onChange={(e) => setSifre(e.target.value)}
            disabled={submitting}
          />
          <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
            {submitting ? 'Giriş yapılıyor…' : 'Giriş yap'}
          </Button>
        </form>

        <p className="border-t border-border pt-4 text-center text-sm text-ink-muted">
          Hesabınız yok mu?{' '}
          <Link to="/register-office" className="font-semibold text-primary hover:underline">
            Büro hesabı oluşturun
          </Link>
        </p>
      </CardBody>
    </Card>
  )
}
