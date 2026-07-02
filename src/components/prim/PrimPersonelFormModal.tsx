import { useMutation, useQuery } from '@tanstack/react-query'
import type { ReactElement, ReactNode } from 'react'
import { useState } from 'react'
import { createPrimPersonel, listPrimPersonelLinkKullanicilar, updatePrimPersonel } from '../../api/primPersonel'
import { roleLabel } from '../../lib/roleLabel'
import { cn } from '../../lib/cn'
import { AlertBox, Button, Input, ModalScrim } from '../ui'
import type { PrimPersonelDto, PrimPersonelLinkUserDto } from '../../types/primPersonel'

type Props = {
  initial?: PrimPersonelDto | null
  onClose: () => void
  onSaved: (personelId: string) => void
}

const fieldInputClass = 'h-10'

function suggestedUnvanFromRole(role: PrimPersonelLinkUserDto['role']): string {
  return roleLabel(role)
}

function resolveDisplayName(user: PrimPersonelLinkUserDto): string {
  const name = user.adSoyad?.trim()
  if (name && name.length >= 2) return name
  const username = user.kullaniciAdi?.trim()
  if (username && username.length >= 2) return username
  const emailLocal = user.eposta?.split('@')[0]?.trim()
  if (emailLocal && emailLocal.length >= 2) return emailLocal
  return name ?? username ?? ''
}

function applyLinkedUserToForm(
  user: PrimPersonelLinkUserDto,
  setters: {
    setAdSoyad: (v: string) => void
    setEposta: (v: string) => void
    setTelefon: (v: string) => void
    setUnvan: (v: string) => void
    setAdSoyadError: (v: string | null) => void
  }
): void {
  setters.setAdSoyad(resolveDisplayName(user))
  setters.setEposta(user.eposta?.trim() ?? '')
  setters.setTelefon(user.telefon?.trim() ?? '')
  setters.setUnvan(suggestedUnvanFromRole(user.role))
  setters.setAdSoyadError(null)
}

export function PrimPersonelFormModal(props: Props): ReactElement {
  const { initial, onClose, onSaved } = props
  const isEdit = Boolean(initial)
  const [adSoyad, setAdSoyad] = useState(initial?.adSoyad ?? '')
  const [telefon, setTelefon] = useState(initial?.telefon ?? '')
  const [eposta, setEposta] = useState(initial?.eposta ?? '')
  const [unvan, setUnvan] = useState(initial?.unvan ?? '')
  const [not, setNot] = useState(initial?.not ?? '')
  const [bagliUserId, setBagliUserId] = useState(initial?.bagliUserId ?? '')
  const [aktifMi, setAktifMi] = useState(initial?.aktifMi ?? true)
  const [adSoyadError, setAdSoyadError] = useState<string | null>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null)

  const usersQ = useQuery({
    queryKey: ['prim-personel', 'link-kullanicilar', initial?.id ?? 'new'],
    queryFn: () => listPrimPersonelLinkKullanicilar(initial?.id)
  })

  const linkUsers = usersQ.data?.items ?? []
  const selectableUsers = linkUsers.filter((u) => !u.baskaPersoneleBagli || u.id === bagliUserId)

  const handleBagliUserChange = (userId: string): void => {
    setBagliUserId(userId)
    if (!userId) return
    const user = linkUsers.find((u) => u.id === userId)
    if (!user || (user.baskaPersoneleBagli && user.id !== bagliUserId)) return
    applyLinkedUserToForm(user, {
      setAdSoyad,
      setEposta,
      setTelefon,
      setUnvan,
      setAdSoyadError
    })
  }

  const resolveSubmitAdSoyad = (): string => {
    const trimmed = adSoyad.trim()
    if (trimmed.length >= 2) return trimmed
    if (!bagliUserId) return trimmed
    const linked = linkUsers.find((u) => u.id === bagliUserId)
    if (!linked) return trimmed
    return resolveDisplayName(linked)
  }

  const saveMu = useMutation({
    mutationFn: async () => {
      const resolvedAdSoyad = resolveSubmitAdSoyad()
      const payload = {
        adSoyad: resolvedAdSoyad,
        telefon: telefon.trim() || null,
        eposta: eposta.trim() || null,
        unvan: unvan.trim() || null,
        not: not.trim() || null,
        bagliUserId: bagliUserId || null,
        aktifMi
      }
      if (initial) return updatePrimPersonel(initial.id, payload)
      return createPrimPersonel(payload)
    },
    onSuccess: (res) => {
      if ('duplicateNameWarning' in res && res.duplicateNameWarning) {
        setDuplicateWarning('Aynı isimde başka bir aktif personel kaydı var.')
      }
      onSaved(res.personel.id)
    }
  })

  const submit = (): void => {
    setAdSoyadError(null)
    setDuplicateWarning(null)
    const resolvedAdSoyad = resolveSubmitAdSoyad()
    if (resolvedAdSoyad.length < 2) {
      setAdSoyadError('Ad soyad en az 2 karakter olmalıdır.')
      return
    }
    if (resolvedAdSoyad !== adSoyad.trim()) {
      setAdSoyad(resolvedAdSoyad)
    }
    saveMu.mutate()
  }

  return (
    <ModalScrim onClose={onClose}>
      <div
        className="w-[min(720px,92vw)] overflow-hidden rounded-xl border border-border bg-panel shadow-xl"
        role="dialog"
        aria-modal="true"
        aria-labelledby="prim-personel-modal-title"
      >
        <header className="flex items-start justify-between gap-4 border-b border-border px-6 py-4">
          <div className="min-w-0 pr-2">
            <h2 id="prim-personel-modal-title" className="text-lg font-bold text-ink">
              {isEdit ? 'Personel düzenle' : 'Yeni personel ekle'}
            </h2>
            <p className="mt-0.5 text-sm text-ink-muted">
              {isEdit
                ? 'Personel bilgilerini güncelleyin.'
                : 'Prim takibinde kullanılacak personel bilgilerini girin.'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saveMu.isPending}
            aria-label="Kapat"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border bg-white text-lg leading-none text-ink-muted transition hover:bg-surface-muted hover:text-ink"
          >
            ×
          </button>
        </header>

        <div className="max-h-[min(70dvh,640px)] overflow-y-auto px-6 py-5">
          {duplicateWarning ? (
            <AlertBox variant="warning" title="Uyarı" className="mb-4">
              {duplicateWarning}
            </AlertBox>
          ) : null}
          {saveMu.error ? (
            <AlertBox variant="danger" title="Kayıt hatası" className="mb-4">
              {(saveMu.error as Error).message}
            </AlertBox>
          ) : null}

          <div className="grid grid-cols-1 gap-x-6 gap-y-4 md:grid-cols-2">
            <Input
              label="Ad soyad *"
              value={adSoyad}
              onChange={(e) => {
                setAdSoyad(e.target.value)
                if (adSoyadError) setAdSoyadError(null)
              }}
              error={adSoyadError ?? undefined}
              className={fieldInputClass}
              autoFocus
            />
            <Input
              label="Görev / ünvan"
              value={unvan}
              onChange={(e) => setUnvan(e.target.value)}
              placeholder="Örn. İcra personeli"
              className={fieldInputClass}
            />
            <Input
              label="Telefon"
              value={telefon}
              onChange={(e) => setTelefon(e.target.value)}
              placeholder="05xx xxx xx xx"
              className={fieldInputClass}
            />
            <SelectField
              label="Sistemdeki kullanıcıyla bağla"
              hint={
                usersQ.isLoading
                  ? 'Kullanıcılar yükleniyor…'
                  : usersQ.isError
                    ? 'Kullanıcı listesi alınamadı.'
                    : selectableUsers.length === 0 && !usersQ.isLoading
                      ? 'Sistemde bağlanabilecek kullanıcı yok.'
                      : 'Opsiyonel — sisteme giriş yapan kullanıcıyla eşleştirir.'
              }
            >
              <select
                className={selectClass}
                value={bagliUserId}
                onChange={(e) => handleBagliUserChange(e.target.value)}
                disabled={usersQ.isLoading || usersQ.isError}
              >
                <option value="">Bağlı değil</option>
                {linkUsers.map((u) => {
                  const disabled = u.baskaPersoneleBagli && u.id !== bagliUserId
                  const label = disabled
                    ? `${u.adSoyad} — ${roleLabel(u.role)} (zaten bağlı: ${u.bagliPersonelAdSoyad})`
                    : `${u.adSoyad} — ${roleLabel(u.role)}`
                  return (
                    <option key={u.id} value={u.id} disabled={disabled}>
                      {label}
                    </option>
                  )
                })}
              </select>
              {usersQ.isError ? (
                <p className="mt-1 text-xs text-danger">{(usersQ.error as Error).message}</p>
              ) : null}
            </SelectField>
            <Input
              label="E-posta"
              type="email"
              value={eposta}
              onChange={(e) => setEposta(e.target.value)}
              placeholder="ornek@buro.com"
              className={fieldInputClass}
            />
            <SelectField label="Durum">
              <select
                className={selectClass}
                value={aktifMi ? 'aktif' : 'pasif'}
                onChange={(e) => setAktifMi(e.target.value === 'aktif')}
              >
                <option value="aktif">Aktif</option>
                <option value="pasif">Pasif</option>
              </select>
            </SelectField>
          </div>

          <div className="mt-4">
            <SelectField label="Not" hint="İsteğe bağlı iç not.">
              <textarea
                className={cn(
                  'min-h-[88px] w-full resize-y rounded-md border border-border bg-white px-3 py-2.5 text-sm text-ink shadow-inner outline-none transition',
                  'placeholder:text-ink-subtle focus:border-primary focus:ring-2 focus:ring-primary/15'
                )}
                value={not}
                onChange={(e) => setNot(e.target.value)}
                placeholder="Personel hakkında kısa not…"
              />
            </SelectField>
          </div>
        </div>

        <footer className="flex justify-end gap-2 border-t border-border bg-surface-muted/30 px-6 py-4">
          <Button type="button" variant="outline" onClick={onClose} disabled={saveMu.isPending}>
            Vazgeç
          </Button>
          <Button type="button" onClick={submit} disabled={saveMu.isPending}>
            {saveMu.isPending
              ? 'Kaydediliyor…'
              : isEdit
                ? 'Değişiklikleri Kaydet'
                : 'Personeli Kaydet'}
          </Button>
        </footer>
      </div>
    </ModalScrim>
  )
}

const selectClass = cn(
  'h-10 w-full rounded-md border border-border bg-white px-3 text-sm text-ink shadow-inner outline-none transition',
  'focus:border-primary focus:ring-2 focus:ring-primary/15 disabled:bg-surface-muted disabled:text-ink-muted'
)

function SelectField(props: { label: string; hint?: string; children: ReactNode }): ReactElement {
  return (
    <div className="w-full">
      <label className="mb-1.5 block text-xs font-semibold text-ink-muted">{props.label}</label>
      {props.children}
      {props.hint ? <p className="mt-1 text-xs text-ink-subtle">{props.hint}</p> : null}
    </div>
  )
}
