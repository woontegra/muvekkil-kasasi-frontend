import type { FormEvent, ReactElement } from 'react'
import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { AlertBox, Button, Input } from '../../components/ui'
import { AuthFormCard } from '../../components/auth/AuthFormCard'
import { useToast } from '../../toast'

export function AdminLoginPage(): ReactElement {
  const { login, isAuthenticated, loading } = useAdminAuth()
  const navigate = useNavigate()
  const toast = useToast()
  const [identifier, setIdentifier] = useState('')
  const [sifre, setSifre] = useState('')
  const [err, setErr] = useState<string | null>(null)
  const [pending, setPending] = useState(false)

  if (!loading && isAuthenticated) {
    return <Navigate to="/admin" replace />
  }

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setErr(null)
    setPending(true)
    try {
      await login(identifier.trim(), sifre)
      toast.success({
        title: 'Giriş başarılı',
        description: 'Admin paneline yönlendiriliyorsunuz.'
      })
      navigate('/admin', { replace: true })
    } catch (ex: unknown) {
      const message = ex instanceof Error ? ex.message : 'Giriş yapılamadı.'
      setErr(message)
      toast.error({
        title: 'Giriş başarısız',
        description: message
      })
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-canvas px-4 py-10">
      <AuthFormCard title="Woontegra Admin" subtitle="Platform yönetim girişi" icon="lock">
        <form onSubmit={(e) => void onSubmit(e)} className="space-y-4">
          {err ? (
            <div className="motion-field-error" key={err}>
              <AlertBox variant="danger" title="Giriş">
                {err}
              </AlertBox>
            </div>
          ) : null}
          <Input
            label="Kullanıcı adı veya e-posta"
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            autoComplete="username"
            required
          />
          <Input
            label="Şifre"
            type="password"
            value={sifre}
            onChange={(e) => setSifre(e.target.value)}
            autoComplete="current-password"
            required
          />
          <Button type="submit" className="w-full" loading={pending}>
            Giriş yap
          </Button>
          <Button type="button" variant="outline" className="w-full" onClick={() => navigate('/login')}>
            Büro kullanıcı girişi
          </Button>
        </form>
      </AuthFormCard>
    </div>
  )
}
