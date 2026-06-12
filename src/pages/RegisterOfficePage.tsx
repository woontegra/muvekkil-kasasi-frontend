import type { FormEvent, ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { APP_BASE } from '../config/appPaths'
import { ApiError } from '../api/client'
import { useAuth } from '../contexts/AuthContext'
import { AlertBox, Button, Card, CardBody, CardHeader, CardTitle, Input } from '../components/ui'

export function RegisterOfficePage(): ReactElement {
  const { registerOffice, session, loading } = useAuth()
  const navigate = useNavigate()
  const [buroAdi, setBuroAdi] = useState('')
  const [adSoyad, setAdSoyad] = useState('')
  const [kullaniciAdi, setKullaniciAdi] = useState('')
  const [eposta, setEposta] = useState('')
  const [telefon, setTelefon] = useState('')
  const [sifre, setSifre] = useState('')
  const [sifreTekrar, setSifreTekrar] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && session) navigate(APP_BASE, { replace: true })
  }, [loading, session, navigate])

  async function onSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setError(null)
    if (sifre !== sifreTekrar) {
      setError('Şifreler eşleşmiyor.')
      return
    }
    setSubmitting(true)
    try {
      await registerOffice({
        buroAdi,
        adSoyad,
        kullaniciAdi,
        eposta,
        telefon,
        sifre
      })
      navigate(APP_BASE, { replace: true })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Kayıt tamamlanamadı.'
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
    <Card className="max-h-[90vh] overflow-y-auto shadow-card">
      <CardHeader className="bg-gradient-to-r from-primary to-accent text-primary-fg">
        <CardTitle className="text-primary-fg">İlk büro kaydı</CardTitle>
        <p className="text-xs text-white/90">Büro oluşturulur; siz otomatik olarak büro sahibi kullanıcısı olursunuz.</p>
      </CardHeader>
      <CardBody className="space-y-3 p-5">
        {error ? (
          <AlertBox variant="danger" title="Kayıt">
            {error}
          </AlertBox>
        ) : null}

        <form className="grid gap-3 sm:grid-cols-2" onSubmit={(e: FormEvent) => void onSubmit(e)}>
          <div className="sm:col-span-2">
            <Input label="Büro adı" name="buroAdi" value={buroAdi} onChange={(e) => setBuroAdi(e.target.value)} disabled={submitting} />
          </div>
          <Input label="Ad soyad" name="adSoyad" value={adSoyad} onChange={(e) => setAdSoyad(e.target.value)} disabled={submitting} />
          <Input
            label="Kullanıcı adı"
            name="kullaniciAdi"
            autoComplete="username"
            hint="Küçük harf, rakam, . _ -"
            value={kullaniciAdi}
            onChange={(e) => setKullaniciAdi(e.target.value)}
            disabled={submitting}
          />
          <Input
            label="E-posta"
            name="eposta"
            type="email"
            autoComplete="email"
            value={eposta}
            onChange={(e) => setEposta(e.target.value)}
            disabled={submitting}
          />
          <Input label="Telefon" name="telefon" autoComplete="tel" value={telefon} onChange={(e) => setTelefon(e.target.value)} disabled={submitting} />
          <Input
            label="Şifre"
            name="sifre"
            type="password"
            autoComplete="new-password"
            value={sifre}
            onChange={(e) => setSifre(e.target.value)}
            disabled={submitting}
          />
          <Input
            label="Şifre tekrar"
            name="sifreTekrar"
            type="password"
            autoComplete="new-password"
            value={sifreTekrar}
            onChange={(e) => setSifreTekrar(e.target.value)}
            disabled={submitting}
          />
          <div className="flex flex-wrap gap-2 sm:col-span-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Kaydediliyor…' : 'Büroyu oluştur'}
            </Button>
            <Link
              to="/login"
              className="inline-flex h-9 items-center rounded-md border border-border bg-white px-3 text-sm font-semibold text-ink-muted hover:bg-surface-muted"
            >
              Girişe dön
            </Link>
          </div>
        </form>
      </CardBody>
    </Card>
  )
}
