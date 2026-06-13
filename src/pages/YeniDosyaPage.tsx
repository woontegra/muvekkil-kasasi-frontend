import { useQueryClient } from '@tanstack/react-query'
import type { FormEvent, ReactElement } from 'react'
import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { createDosya } from '../api/dosyalar'
import { invalidateDashboardSummary } from '../api/dashboard'
import { ApiError } from '../api/client'
import { APP_BASE } from '../config/appPaths'
import type { DosyaDurumuApi, DosyaTuruApi } from '../types/dosya'
import { AlertBox, Button, Card, CardBody, CardHeader, CardTitle, Input, Select } from '../components/ui'
import { cn } from '../lib/cn'

function emptyToNull(s: string): string | null {
  const t = s.trim()
  return t.length === 0 ? null : t
}

const TUR_OPTIONS: { value: DosyaTuruApi; label: string }[] = [
  { value: 'DAVA', label: 'Dava' },
  { value: 'ICRA', label: 'İcra' },
  { value: 'DANISMANLIK', label: 'Danışmanlık' },
  { value: 'DIGER', label: 'Diğer' }
]

const DURUM_OPTIONS: { value: DosyaDurumuApi; label: string }[] = [
  { value: 'AKTIF', label: 'Aktif' },
  { value: 'PASIF', label: 'Pasif' },
  { value: 'KAPANDI', label: 'Kapandı' },
  { value: 'ARSIV', label: 'Arşiv' }
]

export function YeniDosyaPage(): ReactElement {
  const { id: muvekkilId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [dosyaTuru, setDosyaTuru] = useState<DosyaTuruApi>('DAVA')
  const [konuBasligi, setKonuBasligi] = useState('')
  const [mahkeme, setMahkeme] = useState('')
  const [icraDairesi, setIcraDairesi] = useState('')
  const [dosyaNo, setDosyaNo] = useState('')
  const [durum, setDurum] = useState<DosyaDurumuApi>('AKTIF')
  const [aciklama, setAciklama] = useState('')

  const [errors, setErrors] = useState<Record<string, string>>({})
  const [formError, setFormError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!muvekkilId) {
    return (
      <div className="w-full">
        <Link to={APP_BASE} className="text-sm font-semibold text-primary hover:underline">
          ← Ana Sayfa
        </Link>
      </div>
    )
  }

  const muvekkilIdResolved = muvekkilId

  function validate(): boolean {
    const e: Record<string, string> = {}
    if (konuBasligi.trim().length < 1) e.konuBasligi = 'Konu başlığı zorunludur.'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  async function onSubmit(ev: FormEvent): Promise<void> {
    ev.preventDefault()
    setFormError(null)
    if (!validate()) return
    setSubmitting(true)
    try {
      const created = await createDosya(muvekkilIdResolved, {
        konuBasligi: konuBasligi.trim(),
        mahkeme: emptyToNull(mahkeme),
        icraDairesi: emptyToNull(icraDairesi),
        dosyaNo: emptyToNull(dosyaNo),
        dosyaTuru,
        durum,
        aciklama: emptyToNull(aciklama)
      })
      await queryClient.invalidateQueries({ queryKey: ['muvekkil-dosyalar', muvekkilIdResolved] })
      invalidateDashboardSummary(queryClient)
      navigate(`${APP_BASE}/muvekkil/${muvekkilIdResolved}/dosya/${created.id}`, { replace: false })
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Dosya oluşturulamadı.'
      setFormError(msg)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full space-y-5">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link to={APP_BASE} className="font-semibold text-primary hover:underline">
          ← Ana Sayfa
        </Link>
        <span className="text-ink-subtle">/</span>
        <Link to={`${APP_BASE}/muvekkil/${muvekkilIdResolved}`} className="font-semibold text-primary hover:underline">
          Müvekkil
        </Link>
        <span className="text-ink-subtle">/</span>
        <span className="font-medium text-ink">Yeni dosya</span>
      </div>

      <Card className="shadow-card">
        <CardHeader className="border-b border-border bg-gradient-to-r from-primary/8 to-accent/10">
          <CardTitle>Yeni dosya</CardTitle>
          <p className="mt-1 text-xs text-ink-muted">Dosya kaydı büronuzun veritabanına yazılır; tenant bilgisi oturumdan alınır.</p>
        </CardHeader>
        <CardBody className="p-4 md:p-6">
          {formError ? (
            <AlertBox variant="danger" title="Kayıt" className="mb-4">
              {formError}
            </AlertBox>
          ) : null}
          <form className="space-y-5" onSubmit={(e) => void onSubmit(e)}>
            <Select
              label="Dosya türü"
              name="dosyaTuru"
              value={dosyaTuru}
              onChange={(ev) => setDosyaTuru(ev.target.value as DosyaTuruApi)}
              disabled={submitting}
            >
              {TUR_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>

            <Input
              label="Konu başlığı"
              name="konuBasligi"
              value={konuBasligi}
              onChange={(ev) => setKonuBasligi(ev.target.value)}
              disabled={submitting}
              error={errors.konuBasligi}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <div
                className={cn(
                  'rounded-lg sm:col-span-1',
                  dosyaTuru === 'DAVA' && 'border border-primary/30 bg-primary-soft/25 p-3 ring-1 ring-primary/15'
                )}
              >
                <Input
                  label="Mahkeme"
                  name="mahkeme"
                  value={mahkeme}
                  onChange={(ev) => setMahkeme(ev.target.value)}
                  disabled={submitting}
                  hint={dosyaTuru === 'DAVA' ? 'Dava dosyalarında öne çıkan alan.' : undefined}
                />
              </div>
              <div
                className={cn(
                  'rounded-lg sm:col-span-1',
                  dosyaTuru === 'ICRA' && 'border border-accent/30 bg-accent/5 p-3 ring-1 ring-accent/20'
                )}
              >
                <Input
                  label="İcra dairesi"
                  name="icraDairesi"
                  value={icraDairesi}
                  onChange={(ev) => setIcraDairesi(ev.target.value)}
                  disabled={submitting}
                  hint={dosyaTuru === 'ICRA' ? 'İcra dosyalarında öne çıkan alan.' : undefined}
                />
              </div>
              <Input
                label="Dosya no"
                name="dosyaNo"
                value={dosyaNo}
                onChange={(ev) => setDosyaNo(ev.target.value)}
                disabled={submitting}
                className="sm:col-span-2"
              />
            </div>

            <Select label="Durum" name="durum" value={durum} onChange={(ev) => setDurum(ev.target.value as DosyaDurumuApi)} disabled={submitting}>
              {DURUM_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>

            <Input
              label="Açıklama"
              name="aciklama"
              value={aciklama}
              onChange={(ev) => setAciklama(ev.target.value)}
              disabled={submitting}
            />

            <div className="flex flex-wrap gap-2 border-t border-border pt-4">
              <Button type="submit" disabled={submitting}>
                {submitting ? 'Kaydediliyor…' : 'Kaydet'}
              </Button>
              <Button type="button" variant="outline" disabled={submitting} onClick={() => navigate(`${APP_BASE}/muvekkil/${muvekkilIdResolved}`)}>
                Vazgeç
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  )
}
