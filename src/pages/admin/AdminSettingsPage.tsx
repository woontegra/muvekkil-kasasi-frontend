import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FormEvent, ReactElement } from 'react'
import { useEffect, useState } from 'react'
import {
  adminSettingsChangePasswordRequest,
  adminSettingsProfileGet,
  adminSettingsProfilePut,
  adminSettingsSystemInfoRequest
} from '../../api/adminApi'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import { AlertBox, Button, Card, CardBody, CardHeader, CardTitle, Input } from '../../components/ui'
import { formatDateTimeTR } from '../../utils/formatters'

function generateStrongPassword(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789'
  const specials = '!@#$%'
  const out: string[] = []
  const buf = new Uint8Array(14)
  crypto.getRandomValues(buf)
  for (let i = 0; i < 12; i += 1) out.push(alphabet[buf[i] % alphabet.length]!)
  out.push(specials[buf[12]! % specials.length]!)
  out.push(specials[buf[13]! % specials.length]!)
  return out.join('')
}

export function AdminSettingsPage(): ReactElement {
  const { refreshMe } = useAdminAuth()
  const qc = useQueryClient()

  const profileQ = useQuery({
    queryKey: ['admin-settings-profile'],
    queryFn: adminSettingsProfileGet
  })
  const sysQ = useQuery({
    queryKey: ['admin-settings-system'],
    queryFn: adminSettingsSystemInfoRequest
  })

  const [adSoyad, setAdSoyad] = useState('')
  const [eposta, setEposta] = useState('')

  useEffect(() => {
    const p = profileQ.data?.profile
    if (p) {
      setAdSoyad(p.adSoyad)
      setEposta(p.eposta ?? '')
    }
  }, [profileQ.data?.profile])

  const saveProfileM = useMutation({
    mutationFn: () => adminSettingsProfilePut({ adSoyad: adSoyad.trim(), eposta: eposta.trim() || null }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-settings-profile'] })
      void refreshMe()
    }
  })

  const [mevcut, setMevcut] = useState('')
  const [yeni, setYeni] = useState('')
  const [yeni2, setYeni2] = useState('')

  const pwdM = useMutation({
    mutationFn: () =>
      adminSettingsChangePasswordRequest({
        mevcutSifre: mevcut,
        yeniSifre: yeni,
        yeniSifreTekrar: yeni2
      }),
    onSuccess: () => {
      setMevcut('')
      setYeni('')
      setYeni2('')
    }
  })

  const p = profileQ.data?.profile

  return (
    <div className="w-full max-w-none space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Admin ayarları</h1>
        <p className="mt-1 text-sm text-slate-600">Profil, şifre ve ortam bilgileri.</p>
      </div>

      <div className="grid w-full gap-6 xl:grid-cols-2">
        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/80 py-3">
            <CardTitle className="text-base">Profil bilgileri</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4 py-5">
            {profileQ.isLoading ? (
              <p className="text-sm text-ink-muted">Yükleniyor…</p>
            ) : profileQ.isError ? (
              <p className="text-sm text-danger">{profileQ.error instanceof Error ? profileQ.error.message : 'Profil alınamadı.'}</p>
            ) : p ? (
              <form
                className="space-y-4"
                onSubmit={(e: FormEvent) => {
                  e.preventDefault()
                  void saveProfileM.mutateAsync()
                }}
              >
                <Input label="Ad soyad" value={adSoyad} onChange={(e) => setAdSoyad(e.target.value)} required />
                <Input label="Kullanıcı adı" value={p.kullaniciAdi} readOnly className="bg-slate-50" />
                <Input label="E-posta" type="email" value={eposta} onChange={(e) => setEposta(e.target.value)} />
                <div className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2 text-sm">
                  <span className="text-ink-muted">Rol:</span> <span className="font-semibold text-ink">{p.rol}</span>
                  <br />
                  <span className="text-ink-muted">Son giriş:</span>{' '}
                  <span className="text-ink">{formatDateTimeTR(p.sonGirisTarihi)}</span>
                </div>
                {saveProfileM.isError ? (
                  <AlertBox variant="danger" title="Kayıt">
                    {saveProfileM.error instanceof Error ? saveProfileM.error.message : 'Hata'}
                  </AlertBox>
                ) : null}
                <Button type="submit" disabled={saveProfileM.isPending}>
                  {saveProfileM.isPending ? 'Kaydediliyor…' : 'Profili kaydet'}
                </Button>
              </form>
            ) : null}
          </CardBody>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader className="border-b border-slate-100 bg-slate-50/80 py-3">
            <CardTitle className="text-base">Şifre değiştir</CardTitle>
          </CardHeader>
          <CardBody className="space-y-4 py-5">
            <form
              className="space-y-4"
              onSubmit={(e: FormEvent) => {
                e.preventDefault()
                void pwdM.mutateAsync()
              }}
            >
              <Input label="Mevcut şifre" type="password" value={mevcut} onChange={(e) => setMevcut(e.target.value)} autoComplete="current-password" required />
              <Input label="Yeni şifre" type="password" value={yeni} onChange={(e) => setYeni(e.target.value)} autoComplete="new-password" required />
              <Input label="Yeni şifre tekrar" type="password" value={yeni2} onChange={(e) => setYeni2(e.target.value)} autoComplete="new-password" required />
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const g = generateStrongPassword()
                    setYeni(g)
                    setYeni2(g)
                  }}
                >
                  Güçlü şifre oluştur
                </Button>
              </div>
              {pwdM.isError ? (
                <AlertBox variant="danger" title="Şifre">
                  {pwdM.error instanceof Error ? pwdM.error.message : 'İşlem başarısız.'}
                </AlertBox>
              ) : null}
              <Button type="submit" disabled={pwdM.isPending}>
                {pwdM.isPending ? 'Kaydediliyor…' : 'Şifreyi kaydet'}
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>

      <Card className="border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/80 py-3">
          <CardTitle className="text-base">Sistem bilgileri</CardTitle>
        </CardHeader>
        <CardBody className="py-5">
          {sysQ.isLoading ? (
            <p className="text-sm text-ink-muted">Yükleniyor…</p>
          ) : sysQ.isError ? (
            <p className="text-sm text-danger">{sysQ.error instanceof Error ? sysQ.error.message : 'Bilgi alınamadı.'}</p>
          ) : sysQ.data ? (
            <dl className="grid max-w-3xl gap-3 text-sm sm:grid-cols-2">
              <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
                <dt className="text-xs font-bold uppercase text-slate-500">API durumu</dt>
                <dd className="mt-1 font-semibold text-emerald-700">{sysQ.data.apiStatus}</dd>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
                <dt className="text-xs font-bold uppercase text-slate-500">Ortam</dt>
                <dd className="mt-1 font-semibold text-ink">{sysQ.data.environment}</dd>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 sm:col-span-2">
                <dt className="text-xs font-bold uppercase text-slate-500">Frontend domain</dt>
                <dd className="mt-1 break-all font-mono text-xs text-ink">{sysQ.data.frontendDomain}</dd>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2 sm:col-span-2">
                <dt className="text-xs font-bold uppercase text-slate-500">Backend domain</dt>
                <dd className="mt-1 break-all font-mono text-xs text-ink">{sysQ.data.backendDomain}</dd>
              </div>
              <div className="rounded-lg border border-slate-100 bg-slate-50/80 px-3 py-2">
                <dt className="text-xs font-bold uppercase text-slate-500">Versiyon</dt>
                <dd className="mt-1 font-semibold text-ink">{sysQ.data.version}</dd>
              </div>
            </dl>
          ) : null}
        </CardBody>
      </Card>
    </div>
  )
}
