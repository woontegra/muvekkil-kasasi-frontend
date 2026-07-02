import type { FormEvent, ReactElement, ReactNode } from 'react'
import { useState } from 'react'
import { activateLicenseRequest, changeInitialPasswordRequest } from '../../api/authOnboarding'
import { friendlyClientErrorMessage } from '../../api/client'
import { useAuth } from '../../contexts/AuthContext'
import { AlertBox, Button, Card, CardBody, CardHeader, CardTitle, Input } from '../ui'
import { ModalScrim } from '../ui/ModalScrim'

type Props = {
  children: ReactNode
}

export function FirstLoginOnboarding({ children }: Props): ReactElement {
  const { onboarding, logout, applyOnboardingSession } = useAuth()
  const [licenseKey, setLicenseKey] = useState('')
  const [licenseError, setLicenseError] = useState<string | null>(null)
  const [licensePending, setLicensePending] = useState(false)

  const [yeniSifre, setYeniSifre] = useState('')
  const [yeniSifreTekrar, setYeniSifreTekrar] = useState('')
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [passwordPending, setPasswordPending] = useState(false)

  const showLicense = onboarding.requiresLicenseActivation
  const showPassword = !showLicense && onboarding.mustChangePassword
  const blocked = showLicense || showPassword

  async function onLicenseSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setLicenseError(null)
    setLicensePending(true)
    try {
      const r = await activateLicenseRequest(licenseKey)
      applyOnboardingSession(r)
      setLicenseKey('')
    } catch (err) {
      setLicenseError(friendlyClientErrorMessage(err, 'Lisans doğrulanamadı.'))
    } finally {
      setLicensePending(false)
    }
  }

  async function onPasswordSubmit(e: FormEvent): Promise<void> {
    e.preventDefault()
    setPasswordError(null)
    if (yeniSifre.length < 8) {
      setPasswordError('Şifre en az 8 karakter olmalıdır.')
      return
    }
    if (yeniSifre !== yeniSifreTekrar) {
      setPasswordError('Şifreler eşleşmiyor.')
      return
    }
    setPasswordPending(true)
    try {
      const r = await changeInitialPasswordRequest(yeniSifre, yeniSifreTekrar)
      applyOnboardingSession(r)
      setYeniSifre('')
      setYeniSifreTekrar('')
    } catch (err) {
      setPasswordError(friendlyClientErrorMessage(err, 'Şifre güncellenemedi.'))
    } finally {
      setPasswordPending(false)
    }
  }

  return (
    <>
      <div className={blocked ? 'pointer-events-none select-none blur-[2px]' : undefined}>{children}</div>

      {showLicense ? (
        <ModalScrim onClose={() => undefined} disabled align="center" innerAsDialog>
          <Card className="w-full max-w-md shadow-card">
            <CardHeader>
              <CardTitle>Lisans anahtarını doğrulayın</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <p className="text-sm leading-relaxed text-ink-muted">
                Müvekkil Kasa hesabınızı kullanmaya başlamadan önce size e-posta ile gönderilen lisans anahtarını
                girin.
              </p>
              {licenseError ? (
                <AlertBox variant="danger" title="Doğrulama başarısız">
                  {licenseError}
                </AlertBox>
              ) : null}
              <form className="space-y-3" onSubmit={(e) => void onLicenseSubmit(e)}>
                <Input
                  label="Lisans anahtarı"
                  name="licenseKey"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  autoComplete="off"
                  disabled={licensePending}
                  placeholder="Örn. A12B-128J-14KM-GFR3"
                />
                <Button type="submit" className="w-full" disabled={licensePending || !licenseKey.trim()}>
                  {licensePending ? 'Doğrulanıyor…' : 'Lisansı Aktif Et'}
                </Button>
              </form>
              <Button type="button" variant="outline" className="w-full" onClick={() => logout()}>
                Çıkış yap
              </Button>
            </CardBody>
          </Card>
        </ModalScrim>
      ) : null}

      {showPassword ? (
        <ModalScrim onClose={() => undefined} disabled align="center" innerAsDialog>
          <Card className="w-full max-w-md shadow-card">
            <CardHeader>
              <CardTitle>Şifrenizi güncelleyin</CardTitle>
            </CardHeader>
            <CardBody className="space-y-4">
              <p className="text-sm leading-relaxed text-ink-muted">
                Geçici şifrenizi değiştirmeden uygulamayı kullanamazsınız. Lütfen yeni bir şifre belirleyin.
              </p>
              {passwordError ? (
                <AlertBox variant="danger" title="Güncelleme başarısız">
                  {passwordError}
                </AlertBox>
              ) : null}
              <form className="space-y-3" onSubmit={(e) => void onPasswordSubmit(e)}>
                <Input
                  label="Yeni şifre"
                  name="yeniSifre"
                  type="password"
                  autoComplete="new-password"
                  value={yeniSifre}
                  onChange={(e) => setYeniSifre(e.target.value)}
                  disabled={passwordPending}
                />
                <Input
                  label="Yeni şifre tekrar"
                  name="yeniSifreTekrar"
                  type="password"
                  autoComplete="new-password"
                  value={yeniSifreTekrar}
                  onChange={(e) => setYeniSifreTekrar(e.target.value)}
                  disabled={passwordPending}
                />
                <Button type="submit" className="w-full" disabled={passwordPending}>
                  {passwordPending ? 'Kaydediliyor…' : 'Kaydet'}
                </Button>
              </form>
              <Button type="button" variant="outline" className="w-full" onClick={() => logout()}>
                Çıkış yap
              </Button>
            </CardBody>
          </Card>
        </ModalScrim>
      ) : null}
    </>
  )
}
