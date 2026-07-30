import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { FormEvent, ReactElement } from 'react'
import { useState } from 'react'
import { updateMuvekkil } from '../../api/muvekkiller'
import { ApiError } from '../../api/client'
import { invalidateDashboardSummary } from '../../api/dashboard'
import type { CreateMuvekkilPayload, MuvekkilDto, MuvekkilTurApi } from '../../types/muvekkil'
import { OtomatikHatirlatmaSwitch } from '../bildirim/OtomatikHatirlatmaSwitch'
import { AlertBox, Button, Input, ModalScrim, Select, Textarea } from '../ui'

type Props = {
  muvekkil: MuvekkilDto
  onClose: () => void
}

function isEmail(s: string): boolean {
  return /^\S+@\S+\.\S+$/.test(s.trim())
}

export function MuvekkilEditModal({ muvekkil, onClose }: Props): ReactElement {
  const queryClient = useQueryClient()
  const [tur, setTur] = useState<MuvekkilTurApi>(muvekkil.tur)

  const [gercekAdSoyad, setGercekAdSoyad] = useState(muvekkil.tur === 'GERCEK' ? muvekkil.adSoyad : '')
  const [gercekTelefon, setGercekTelefon] = useState(muvekkil.tur === 'GERCEK' ? (muvekkil.telefon ?? '') : '')
  const [gercekEposta, setGercekEposta] = useState(muvekkil.tur === 'GERCEK' ? (muvekkil.eposta ?? '') : '')
  const [gercekAdres, setGercekAdres] = useState(muvekkil.tur === 'GERCEK' ? (muvekkil.adres ?? '') : '')
  const [gercekNot, setGercekNot] = useState(muvekkil.tur === 'GERCEK' ? (muvekkil.not ?? '') : '')

  const [sirketUnvani, setSirketUnvani] = useState(muvekkil.tur === 'TUZEL' ? (muvekkil.sirketUnvani ?? '') : '')
  const [yetkiliAdSoyad, setYetkiliAdSoyad] = useState(muvekkil.yetkiliAdSoyad)
  const [yetkiliTelefon, setYetkiliTelefon] = useState(muvekkil.yetkiliTelefon)
  const [mudurAdSoyad, setMudurAdSoyad] = useState(muvekkil.mudurAdSoyad)
  const [mudurTelefon, setMudurTelefon] = useState(muvekkil.mudurTelefon)
  const [muhasebeAdSoyad, setMuhasebeAdSoyad] = useState(muvekkil.muhasebeAdSoyad)
  const [muhasebeTelefon, setMuhasebeTelefon] = useState(muvekkil.muhasebeTelefon)
  const [tuzelEposta, setTuzelEposta] = useState(muvekkil.tur === 'TUZEL' ? (muvekkil.eposta ?? '') : '')
  const [tuzelAdres, setTuzelAdres] = useState(muvekkil.tur === 'TUZEL' ? (muvekkil.adres ?? '') : '')
  const [tuzelNot, setTuzelNot] = useState(muvekkil.tur === 'TUZEL' ? (muvekkil.not ?? '') : '')

  const [otomatikHatirlatma, setOtomatikHatirlatma] = useState(muvekkil.otomatikBildirimIzni ?? false)

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)

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
        adres: gercekAdres.trim() || null,
        not: gercekNot.trim() || null,
        yetkiliAdSoyad: '',
        yetkiliTelefon: '',
        mudurAdSoyad: '',
        mudurTelefon: '',
        muhasebeAdSoyad: '',
        muhasebeTelefon: '',
        otomatikBildirimIzni: otomatikHatirlatma
      }
    }
    return {
      tur: 'TUZEL',
      adSoyad: yetkiliAdSoyad.trim(),
      sirketUnvani: sirketUnvani.trim(),
      telefon: yetkiliTelefon.trim(),
      eposta: tuzelEposta.trim() ? tuzelEposta.trim().toLowerCase() : null,
      adres: tuzelAdres.trim() || null,
      not: tuzelNot.trim() || null,
      yetkiliAdSoyad: yetkiliAdSoyad.trim(),
      yetkiliTelefon: yetkiliTelefon.trim(),
      mudurAdSoyad: mudurAdSoyad.trim(),
      mudurTelefon: mudurTelefon.trim(),
      muhasebeAdSoyad: muhasebeAdSoyad.trim(),
      muhasebeTelefon: muhasebeTelefon.trim(),
      otomatikBildirimIzni: otomatikHatirlatma
    }
  }

  const saveMu = useMutation({
    mutationFn: () => updateMuvekkil(muvekkil.id, buildPayload()),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['muvekkil', muvekkil.id] })
      await queryClient.invalidateQueries({ queryKey: ['muvekkiller'] })
      invalidateDashboardSummary(queryClient)
      onClose()
    },
    onError: (err) => {
      setFormError(err instanceof ApiError ? err.message : 'Müvekkil güncellenemedi.')
    }
  })

  function onSubmit(ev: FormEvent): void {
    ev.preventDefault()
    setFormError(null)
    if (!validate()) return
    saveMu.mutate()
  }

  const submitting = saveMu.isPending

  return (
    <ModalScrim onClose={onClose} disabled={submitting} wide align="top" innerAsDialog>
      <div className="w-full overflow-hidden rounded-xl border border-border bg-panel shadow-xl">
        <header className="flex items-start justify-between gap-4 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <h2 className="text-lg font-bold text-ink">Müvekkil düzenle</h2>
            <p className="mt-0.5 text-sm text-ink-muted">Adres, iletişim ve not bilgilerini güncelleyin.</p>
          </div>
          <button
            type="button"
            className="rounded-md px-2 py-1 text-sm font-semibold text-ink-muted hover:bg-surface-muted hover:text-ink"
            onClick={onClose}
            disabled={submitting}
            aria-label="Kapat"
          >
            ✕
          </button>
        </header>

        <form className="space-y-4 p-5" onSubmit={onSubmit}>
          {formError ? (
            <AlertBox variant="danger" title="Güncelleme">
              {formError}
            </AlertBox>
          ) : null}

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
                <Textarea
                  label="Adres (isteğe bağlı)"
                  name="gercekAdres"
                  rows={2}
                  value={gercekAdres}
                  onChange={(ev) => setGercekAdres(ev.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="sm:col-span-2">
                <Input
                  label="Not"
                  name="gercekNot"
                  value={gercekNot}
                  onChange={(ev) => setGercekNot(ev.target.value)}
                  disabled={submitting}
                />
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
                />
                <Input
                  label="Müdür telefon"
                  name="mudurTelefon"
                  value={mudurTelefon}
                  onChange={(ev) => setMudurTelefon(ev.target.value)}
                  disabled={submitting}
                />
                <Input
                  label="Muhasebe adı soyadı"
                  name="muhasebeAdSoyad"
                  value={muhasebeAdSoyad}
                  onChange={(ev) => setMuhasebeAdSoyad(ev.target.value)}
                  disabled={submitting}
                />
                <Input
                  label="Muhasebe telefon"
                  name="muhasebeTelefon"
                  value={muhasebeTelefon}
                  onChange={(ev) => setMuhasebeTelefon(ev.target.value)}
                  disabled={submitting}
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
                  <Textarea
                    label="Adres (isteğe bağlı)"
                    name="tuzelAdres"
                    rows={2}
                    value={tuzelAdres}
                    onChange={(ev) => setTuzelAdres(ev.target.value)}
                    disabled={submitting}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Input
                    label="Not"
                    name="tuzelNot"
                    value={tuzelNot}
                    onChange={(ev) => setTuzelNot(ev.target.value)}
                    disabled={submitting}
                  />
                </div>
              </div>
            </div>
          )}

          <OtomatikHatirlatmaSwitch
            id="muvekkil-edit-otomatik-hatirlatma"
            label="Bu müvekkile otomatik ödeme hatırlatması gönder"
            description="Kapalı olduğunda bu müvekkile vadesi yaklaşan veya geciken taksitler için otomatik mesaj gönderilmez. Manuel WhatsApp hatırlatma özelliğini yine kullanabilirsiniz."
            checked={otomatikHatirlatma}
            disabled={submitting}
            onChange={setOtomatikHatirlatma}
          />

          <div className="flex flex-wrap justify-end gap-2 border-t border-border pt-4">
            <Button type="button" variant="outline" disabled={submitting} onClick={onClose}>
              Vazgeç
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Kaydediliyor…' : 'Kaydet'}
            </Button>
          </div>
        </form>
      </div>
    </ModalScrim>
  )
}
