import { useQueryClient } from '@tanstack/react-query'
import type { FormEvent, ReactElement } from 'react'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createMuvekkil } from '../api/muvekkiller'
import { invalidateDashboardSummary } from '../api/dashboard'
import { ApiError } from '../api/client'
import { APP_BASE, HOME_PAGE_LABEL } from '../config/appPaths'
import type { CreateMuvekkilPayload, MuvekkilTurApi } from '../types/muvekkil'
import { AlertBox, Button, Card, CardBody, CardHeader, CardTitle, Input, Select } from '../components/ui'

function isEmail(s: string): boolean {
  return /^\S+@\S+\.\S+$/.test(s.trim())
}

export function YeniMuvekkilPage(): ReactElement {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [tur, setTur] = useState<MuvekkilTurApi>('GERCEK')

  const [gercekAdSoyad, setGercekAdSoyad] = useState('')
  const [gercekTelefon, setGercekTelefon] = useState('')
  const [gercekEposta, setGercekEposta] = useState('')
  const [gercekNot, setGercekNot] = useState('')

  const [sirketUnvani, setSirketUnvani] = useState('')
  const [yetkiliAdSoyad, setYetkiliAdSoyad] = useState('')
  const [yetkiliTelefon, setYetkiliTelefon] = useState('')
  const [mudurAdSoyad, setMudurAdSoyad] = useState('')
  const [mudurTelefon, setMudurTelefon] = useState('')
  const [muhasebeAdSoyad, setMuhasebeAdSoyad] = useState('')
  const [muhasebeTelefon, setMuhasebeTelefon] = useState('')
  const [tuzelEposta, setTuzelEposta] = useState('')
  const [tuzelNot, setTuzelNot] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (tur === 'GERCEK') {
      if (gercekAdSoyad.trim().length < 2) e.gercekAdSoyad = 'Ad soyad en az 2 karakter olmalıdır.'
      if (gercekTelefon.trim().length < 3) e.gercekTelefon = 'Telefon en az 3 karakter olmalıdır.'
      const ep = gercekEposta.trim()
      if (ep && !isEmail(ep)) e.gercekEposta = 'Geçerli bir e-posta girin.'
    } else {
      if (sirketUnvani.trim().length < 2) e.sirketUnvani = 'Şirket ünvanı en az 2 karakter olmalıdır.'
      const yAd = yetkiliAdSoyad.trim().length >= 2
      const yTel = yetkiliTelefon.trim().length >= 3
      if (!yAd && !yTel) {
        e.yetkiliAdSoyad = 'Yetkili adı soyadı veya yetkili telefon girilmelidir.'
        e.yetkiliTelefon = 'Yetkili adı soyadı veya yetkili telefon girilmelidir.'
      }
      const ep = tuzelEposta.trim()
      if (ep && !isEmail(ep)) e.tuzelEposta = 'Geçerli bir e-posta girin.'
    }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  function buildPayload(): CreateMuvekkilPayload {
    if (tur === 'GERCEK') {
      return {
        tur: 'GERCEK',
        adSoyad: gercekAdSoyad.trim(),
        sirketUnvani: null,
        telefon: gercekTelefon.trim(),
        eposta: gercekEposta.trim() || null,
        not: gercekNot.trim() || null,
        yetkiliAdSoyad: '',
        yetkiliTelefon: '',
        mudurAdSoyad: '',
        mudurTelefon: '',
        muhasebeAdSoyad: '',
        muhasebeTelefon: ''
      }
    }
    return {
      tur: 'TUZEL',
      adSoyad: yetkiliAdSoyad.trim(),
      sirketUnvani: sirketUnvani.trim(),
      telefon: yetkiliTelefon.trim(),
      eposta: tuzelEposta.trim() ? tuzelEposta.trim().toLowerCase() : null,
      not: tuzelNot.trim() || null,
      yetkiliAdSoyad: yetkiliAdSoyad.trim(),
      yetkiliTelefon: yetkiliTelefon.trim(),
      mudurAdSoyad: mudurAdSoyad.trim(),
      mudurTelefon: mudurTelefon.trim(),
      muhasebeAdSoyad: muhasebeAdSoyad.trim(),
      muhasebeTelefon: muhasebeTelefon.trim()
    }
  }

  async function onSubmit(ev: FormEvent): Promise<void> {
    ev.preventDefault()
    setFormError(null)
    if (!validate()) return
    setSubmitting(true)
    try {
      const created = await createMuvekkil(buildPayload())
      await queryClient.invalidateQueries({ queryKey: ['muvekkiller'] })
      invalidateDashboardSummary(queryClient)
      navigate(`${APP_BASE}/muvekkil/${created.id}`, { replace: false })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Kayıt oluşturulamadı.'
      setFormError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link to={APP_BASE} className="font-semibold text-primary hover:underline">
          ← {HOME_PAGE_LABEL}
        </Link>
        <span className="text-ink-subtle">/</span>
        <span className="font-medium text-ink">Yeni müvekkil</span>
      </div>

      <Card className="shadow-card">
        <CardHeader className="border-b border-border bg-gradient-to-r from-primary/8 to-accent/10">
          <CardTitle>Yeni müvekkil</CardTitle>
          <p className="mt-1 text-xs text-ink-muted">Kayıt büronuzun veritabanına kaydedilir; tenant bilgisi oturumdan alınır.</p>
        </CardHeader>
        <CardBody className="p-4 md:p-6">
          {formError ? (
            <AlertBox variant="danger" title="Kayıt" className="mb-4">
              {formError}
            </AlertBox>
          ) : null}
          <form className="space-y-6" onSubmit={(e) => void onSubmit(e)}>
            <Select
              label="Müvekkil türü"
              name="tur"
              value={tur}
              onChange={(ev) => setTur(ev.target.value as MuvekkilTurApi)}
              disabled={submitting}
            >
              <option value="GERCEK">Gerçek kişi</option>
              <option value="TUZEL">Tüzel kişi</option>
            </Select>

            {tur === 'GERCEK' ? (
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Ad soyad"
                  name="gercekAdSoyad"
                  value={gercekAdSoyad}
                  onChange={(ev) => setGercekAdSoyad(ev.target.value)}
                  disabled={submitting}
                  error={errors.gercekAdSoyad}
                />
                <Input
                  label="Telefon"
                  name="gercekTelefon"
                  value={gercekTelefon}
                  onChange={(ev) => setGercekTelefon(ev.target.value)}
                  disabled={submitting}
                  error={errors.gercekTelefon}
                />
                <Input
                  label="E-posta (isteğe bağlı)"
                  name="gercekEposta"
                  type="email"
                  value={gercekEposta}
                  onChange={(ev) => setGercekEposta(ev.target.value)}
                  disabled={submitting}
                  error={errors.gercekEposta}
                  className="sm:col-span-2"
                />
                <div className="sm:col-span-2">
                  <Input label="Not" name="gercekNot" value={gercekNot} onChange={(ev) => setGercekNot(ev.target.value)} disabled={submitting} />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Input
                  label="Şirket adı / ünvan"
                  name="sirketUnvani"
                  value={sirketUnvani}
                  onChange={(ev) => setSirketUnvani(ev.target.value)}
                  disabled={submitting}
                  error={errors.sirketUnvani}
                />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Yetkili adı soyadı"
                    name="yetkiliAdSoyad"
                    value={yetkiliAdSoyad}
                    onChange={(ev) => setYetkiliAdSoyad(ev.target.value)}
                    disabled={submitting}
                    error={errors.yetkiliAdSoyad}
                  />
                  <Input
                    label="Yetkili telefon"
                    name="yetkiliTelefon"
                    value={yetkiliTelefon}
                    onChange={(ev) => setYetkiliTelefon(ev.target.value)}
                    disabled={submitting}
                    error={errors.yetkiliTelefon}
                  />
                  <Input
                    label="Müdür adı soyadı"
                    name="mudurAdSoyad"
                    value={mudurAdSoyad}
                    onChange={(ev) => setMudurAdSoyad(ev.target.value)}
                    disabled={submitting}
                    error={errors.mudurAdSoyad}
                  />
                  <Input
                    label="Müdür telefon"
                    name="mudurTelefon"
                    value={mudurTelefon}
                    onChange={(ev) => setMudurTelefon(ev.target.value)}
                    disabled={submitting}
                    error={errors.mudurTelefon}
                  />
                  <Input
                    label="Muhasebe adı soyadı"
                    name="muhasebeAdSoyad"
                    value={muhasebeAdSoyad}
                    onChange={(ev) => setMuhasebeAdSoyad(ev.target.value)}
                    disabled={submitting}
                    error={errors.muhasebeAdSoyad}
                  />
                  <Input
                    label="Muhasebe telefon"
                    name="muhasebeTelefon"
                    value={muhasebeTelefon}
                    onChange={(ev) => setMuhasebeTelefon(ev.target.value)}
                    disabled={submitting}
                    error={errors.muhasebeTelefon}
                  />
                  <Input
                    label="E-posta (isteğe bağlı)"
                    name="tuzelEposta"
                    type="email"
                    value={tuzelEposta}
                    onChange={(ev) => setTuzelEposta(ev.target.value)}
                    disabled={submitting}
                    error={errors.tuzelEposta}
                    className="sm:col-span-2"
                  />
                  <div className="sm:col-span-2">
                    <Input label="Not" name="tuzelNot" value={tuzelNot} onChange={(ev) => setTuzelNot(ev.target.value)} disabled={submitting} />
                  </div>
                </div>
              </div>
            )}

            <AlertBox variant="info" title="Bilgi">
              Kayıt sonrası müvekkil detay sayfasına yönlendirilirsiniz; ana sayfa listesi güncellenir.
            </AlertBox>

            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Kaydediliyor…' : 'Kaydet'}
              </Button>
              <Button type="button" variant="outline" disabled={submitting} onClick={() => navigate(APP_BASE)}>
                Vazgeç
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
