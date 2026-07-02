import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FormEvent, ReactElement, ReactNode } from 'react'
import { useCallback, useMemo, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { createUser, deactivateUser, listUsers, resetUserPassword, updateUser } from '../api/users'
import { ApiError } from '../api/client'
import { APP_BASE, HOME_PAGE_LABEL } from '../config/appPaths'
import { useAuth } from '../contexts/AuthContext'
import { generateStrongPassword } from '../lib/generatePassword'
import { isValidKullaniciAdi, normalizeKullaniciAdi } from '../lib/normalizeKullaniciAdi'
import { roleLabel } from '../lib/roleLabel'
import {
  AlertBox,
  Button,
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  Input,
  ModalScrim,
  PageHeader,
  Select,
  Table,
  TableEmptyRow,
  TBody,
  TD,
  TH,
  THead,
  TR
} from '../components/ui'
import type { StaffRole, UserDto } from '../types/user'

const ROLE_HINTS: Record<StaffRole, string> = {
  AVUKAT_YONETICI: 'Kayıtları yönetebilir, onay işlemleri yapabilir.',
  KATIP_PERSONEL: 'Kayıt girebilir, sınırlı işlem yapabilir.'
}

function formatDateTime(iso: string | null): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('tr-TR', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return '—'
  }
}

async function copyText(text: string): Promise<void> {
  await navigator.clipboard.writeText(text)
}

type AktifFilter = 'all' | 'active' | 'inactive'

/** Kullanıcı oluştur / düzenle — ortalanmış geniş modal */
const USER_MODAL_CARD =
  'mx-auto flex w-full max-w-[min(720px,calc(100vw-2rem))] max-h-[min(90dvh,calc(100dvh-2rem))] flex-col overflow-hidden shadow-card'

type CreateUserFieldKey = 'adSoyad' | 'kullaniciAdi' | 'eposta' | 'sifre' | 'sifreTekrar'

function isValidOptionalEmail(s: string): boolean {
  const t = s.trim()
  if (!t) return true
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)
}

function FormSection({ title, children }: { title: string; children: ReactNode }): ReactElement {
  return (
    <section className="space-y-4">
      <h3 className="border-b border-border pb-2.5 text-[11px] font-bold uppercase tracking-wider text-ink-muted">{title}</h3>
      <div className="space-y-4">{children}</div>
    </section>
  )
}

function CreateUserModal({ onClose, onDone }: { onClose: () => void; onDone: () => void }): ReactElement {
  const [adSoyad, setAdSoyad] = useState('')
  const [kullaniciAdi, setKullaniciAdi] = useState('')
  const [eposta, setEposta] = useState('')
  const [telefon, setTelefon] = useState('')
  const [rol, setRol] = useState<StaffRole>('KATIP_PERSONEL')
  const [sifre, setSifre] = useState('')
  const [sifreTekrar, setSifreTekrar] = useState('')
  const [apiError, setApiError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<CreateUserFieldKey, string>>>({})
  const [copied, setCopied] = useState(false)

  const clearApiError = useCallback(() => {
    setApiError(null)
  }, [])

  const patchField = useCallback(
    (key: CreateUserFieldKey, setter: (v: string) => void, v: string) => {
      clearApiError()
      setFieldErrors((prev) => {
        const next = { ...prev }
        delete next[key]
        return next
      })
      setter(v)
    },
    [clearApiError]
  )

  const mu = useMutation({
    mutationFn: () => {
      const normalizedKullaniciAdi = normalizeKullaniciAdi(kullaniciAdi)
      return createUser({
        adSoyad: adSoyad.trim(),
        kullaniciAdi: normalizedKullaniciAdi,
        eposta: eposta.trim() ? eposta.trim().toLowerCase() : null,
        telefon: telefon.trim() || null,
        rol,
        sifre
      })
    },
    onSuccess: () => {
      setApiError(null)
      setFieldErrors({})
      onDone()
    },
    onError: (e) => {
      setApiError(e instanceof ApiError ? e.message : 'Kayıt oluşturulamadı.')
    }
  })

  const submit = (e: FormEvent): void => {
    e.preventDefault()
    setApiError(null)
    const errs: Partial<Record<CreateUserFieldKey, string>> = {}
    if (adSoyad.trim().length < 2) {
      errs.adSoyad = 'En az 2 karakter girin.'
    }
    const normalizedKullaniciAdi = normalizeKullaniciAdi(kullaniciAdi)
    if (!normalizedKullaniciAdi) {
      errs.kullaniciAdi = 'Kullanıcı adı girin.'
    } else if (!isValidKullaniciAdi(normalizedKullaniciAdi)) {
      errs.kullaniciAdi = 'Kullanıcı adı en az 3 karakter olmalıdır.'
    }
    if (!isValidOptionalEmail(eposta)) {
      errs.eposta = 'Geçerli bir e-posta girin veya alanı boş bırakın.'
    }
    if (sifre.length < 8) {
      errs.sifre = 'En az 8 karakter girin.'
    }
    if (sifre !== sifreTekrar) {
      errs.sifreTekrar = 'Şifre ile eşleşmeli.'
    }
    setFieldErrors(errs)
    if (Object.keys(errs).length > 0) return
    mu.mutate()
  }

  const topBanner =
    apiError != null ? (
      <div
        role="alert"
        className="rounded-lg border border-danger/35 bg-danger-soft px-3 py-2 text-xs font-medium leading-snug text-danger"
      >
        {apiError}
      </div>
    ) : undefined

  const formId = 'create-user-modal-form'

  return (
    <ModalScrim onClose={onClose}>
      <Card className={USER_MODAL_CARD}>
        <CardHeader className="shrink-0 space-y-3 border-b border-border px-5 pb-4 pt-5 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1 pr-2">
              <CardTitle className="text-lg sm:text-xl">Yeni kullanıcı</CardTitle>
              <p className="text-sm leading-relaxed text-ink-muted">Büro çalışanı veya yönetici hesabı oluşturun.</p>
            </div>
            <Button variant="ghost" size="sm" type="button" className="shrink-0 text-ink-muted" onClick={onClose}>
              Kapat
            </Button>
          </div>
          {topBanner}
        </CardHeader>
        <CardBody className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <form id={formId} className="flex flex-col gap-10" onSubmit={submit}>
            <FormSection title="Kimlik bilgileri">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Ad soyad"
                  value={adSoyad}
                  onChange={(e) => patchField('adSoyad', setAdSoyad, e.target.value)}
                  autoComplete="name"
                  error={fieldErrors.adSoyad}
                  required
                />
                <Input
                  label="Kullanıcı adı"
                  value={kullaniciAdi}
                  onChange={(e) => patchField('kullaniciAdi', setKullaniciAdi, normalizeKullaniciAdi(e.target.value))}
                  onBlur={() => setKullaniciAdi((v) => normalizeKullaniciAdi(v))}
                  autoComplete="off"
                  hint="Kullanıcı adı giriş için kullanılır. Türkçe karakterler otomatik dönüştürülür. Örnek: Balım48 → balim48"
                  error={fieldErrors.kullaniciAdi}
                />
              </div>
            </FormSection>

            <FormSection title="İletişim bilgileri">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="E-posta"
                  type="email"
                  value={eposta}
                  onChange={(e) => patchField('eposta', setEposta, e.target.value)}
                  hint="İsteğe bağlı."
                  error={fieldErrors.eposta}
                />
                <Input
                  label="Telefon"
                  value={telefon}
                  onChange={(e) => {
                    clearApiError()
                    setTelefon(e.target.value)
                  }}
                />
              </div>
            </FormSection>

            <FormSection title="Yetki">
              <div className="space-y-2">
                <Select
                  label="Rol"
                  value={rol}
                  onChange={(e) => {
                    clearApiError()
                    setRol(e.target.value as StaffRole)
                  }}
                  className="h-11 rounded-lg border-border-strong bg-white text-sm font-medium shadow-sm"
                >
                  <option value="AVUKAT_YONETICI">Avukat / Yönetici</option>
                  <option value="KATIP_PERSONEL">Katip / Personel</option>
                </Select>
                <p className="rounded-lg border border-border bg-surface-muted/60 px-3 py-2.5 text-sm leading-relaxed text-ink-muted">
                  {ROLE_HINTS[rol]}
                </p>
              </div>
            </FormSection>

            <FormSection title="Şifre">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Şifre"
                  type="password"
                  value={sifre}
                  onChange={(e) => patchField('sifre', setSifre, e.target.value)}
                  autoComplete="new-password"
                  error={fieldErrors.sifre}
                />
                <Input
                  label="Şifre tekrar"
                  type="password"
                  value={sifreTekrar}
                  onChange={(e) => patchField('sifreTekrar', setSifreTekrar, e.target.value)}
                  autoComplete="new-password"
                  error={fieldErrors.sifreTekrar}
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => {
                      clearApiError()
                      const p = generateStrongPassword()
                      setSifre(p)
                      setSifreTekrar(p)
                      setFieldErrors((prev) => {
                        const next = { ...prev }
                        delete next.sifre
                        delete next.sifreTekrar
                        return next
                      })
                    }}
                  >
                    Güçlü şifre oluştur
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    disabled={!sifre.trim()}
                    onClick={() => {
                      void copyText(sifre).then(() => {
                        setCopied(true)
                        setTimeout(() => setCopied(false), 2200)
                      })
                    }}
                  >
                    Kopyala
                  </Button>
                  {copied ? (
                    <span className="text-xs font-semibold text-emerald-700" aria-live="polite">
                      Kopyalandı
                    </span>
                  ) : null}
                </div>
                <p className="text-xs text-ink-subtle sm:max-w-[240px] sm:text-right">Şifre yalnızca bu formda görünür; sunucu yanıtında dönmez.</p>
              </div>
            </FormSection>
          </form>
        </CardBody>
        <div className="shrink-0 border-t border-border bg-panel px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={mu.isPending}>
              Vazgeç
            </Button>
            <Button type="submit" form={formId} disabled={mu.isPending}>
              {mu.isPending ? 'Oluşturuluyor…' : 'Oluştur'}
            </Button>
          </div>
        </div>
      </Card>
    </ModalScrim>
  )
}

function EditUserModal({
  user,
  sessionUserId,
  onClose,
  onDone
}: {
  user: UserDto
  sessionUserId: string
  onClose: () => void
  onDone: () => void
}): ReactElement {
  const isFounder = user.role === 'BURO_SAHIBI'
  const [adSoyad, setAdSoyad] = useState(user.adSoyad)
  const [eposta, setEposta] = useState(user.eposta ?? '')
  const [telefon, setTelefon] = useState(user.telefon ?? '')
  const [rol, setRol] = useState(user.role)
  const [aktifMi, setAktifMi] = useState(user.aktifMi)
  const [formError, setFormError] = useState<string | null>(null)

  const mu = useMutation({
    mutationFn: () =>
      updateUser(user.id, {
        adSoyad: adSoyad.trim(),
        eposta: eposta.trim() ? eposta.trim().toLowerCase() : null,
        telefon: telefon.trim() || null,
        rol: isFounder ? 'BURO_SAHIBI' : (rol as 'AVUKAT_YONETICI' | 'KATIP_PERSONEL'),
        aktifMi: isFounder ? true : aktifMi
      }),
    onSuccess: () => {
      setFormError(null)
      onDone()
    },
    onError: (e) => {
      setFormError(e instanceof ApiError ? e.message : 'Güncellenemedi.')
    }
  })

  const submit = (e: FormEvent): void => {
    e.preventDefault()
    setFormError(null)
    if (adSoyad.trim().length < 2) {
      setFormError('Ad soyad en az 2 karakter olmalıdır.')
      return
    }
    if (user.id === sessionUserId && !aktifMi && !isFounder) {
      setFormError('Kendi hesabınızı pasifleştiremezsiniz.')
      return
    }
    mu.mutate()
  }

  const editFormId = 'edit-user-modal-form'
  const serverBanner =
    formError != null ? (
      <div
        role="alert"
        className="rounded-lg border border-danger/35 bg-danger-soft px-3 py-2 text-xs font-medium leading-snug text-danger"
      >
        {formError}
      </div>
    ) : null

  return (
    <ModalScrim onClose={onClose}>
      <Card className={USER_MODAL_CARD}>
        <CardHeader className="shrink-0 space-y-3 border-b border-border px-5 pb-4 pt-5 sm:px-6">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1 pr-2">
              <CardTitle className="text-lg sm:text-xl">Kullanıcıyı düzenle</CardTitle>
              <p className="text-sm leading-relaxed text-ink-muted">Kullanıcı bilgilerini ve yetkisini güncelleyin.</p>
            </div>
            <Button variant="ghost" size="sm" type="button" className="shrink-0 text-ink-muted" onClick={onClose}>
              Kapat
            </Button>
          </div>
          {serverBanner}
        </CardHeader>
        <CardBody className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6">
          <form id={editFormId} className="flex flex-col gap-10" onSubmit={submit}>
            <FormSection title="Kimlik bilgileri">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="Ad soyad" value={adSoyad} onChange={(e) => setAdSoyad(e.target.value)} required />
                <Input
                  label="Kullanıcı adı"
                  value={user.kullaniciAdi}
                  readOnly
                  className="bg-surface-muted"
                  hint="İlk sürümde değiştirilemez."
                />
              </div>
            </FormSection>

            <FormSection title="İletişim bilgileri">
              <div className="grid gap-4 sm:grid-cols-2">
                <Input label="E-posta" type="email" value={eposta} onChange={(e) => setEposta(e.target.value)} />
                <Input label="Telefon" value={telefon} onChange={(e) => setTelefon(e.target.value)} />
              </div>
            </FormSection>

            <FormSection title="Yetki ve durum">
              {isFounder ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Rol" value={roleLabel(user.role)} readOnly className="bg-surface-muted" />
                  <Input
                    label="Durum"
                    value="Aktif"
                    readOnly
                    className="bg-surface-muted"
                    hint="Büro sahibi hesabı bu ekrandan pasifleştirilemez."
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <Select
                    label="Rol"
                    value={rol}
                    onChange={(e) => setRol(e.target.value as typeof rol)}
                    className="h-11 rounded-lg border-border-strong bg-white text-sm font-medium shadow-sm"
                  >
                    <option value="AVUKAT_YONETICI">Avukat / Yönetici</option>
                    <option value="KATIP_PERSONEL">Katip / Personel</option>
                  </Select>
                  <p className="rounded-lg border border-border bg-surface-muted/60 px-3 py-2.5 text-sm leading-relaxed text-ink-muted">
                    {rol === 'AVUKAT_YONETICI' ? ROLE_HINTS.AVUKAT_YONETICI : ROLE_HINTS.KATIP_PERSONEL}
                  </p>
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-lg border border-border bg-surface-muted/40 px-3 py-2.5 text-sm font-medium text-ink">
                    <input type="checkbox" checked={aktifMi} onChange={(e) => setAktifMi(e.target.checked)} className="h-4 w-4 rounded border-border text-primary" />
                    Hesap aktif
                  </label>
                </div>
              )}
            </FormSection>
          </form>
        </CardBody>
        <div className="shrink-0 border-t border-border bg-panel px-5 py-4 sm:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Button type="button" variant="outline" onClick={onClose} disabled={mu.isPending}>
              Vazgeç
            </Button>
            <Button type="submit" form={editFormId} disabled={mu.isPending}>
              {mu.isPending ? 'Kaydediliyor…' : 'Kaydet'}
            </Button>
          </div>
        </div>
      </Card>
    </ModalScrim>
  )
}

function ResetPasswordModal({ user, onClose, onDone }: { user: UserDto; onClose: () => void; onDone: () => void }): ReactElement {
  const [sifre, setSifre] = useState('')
  const [sifreTekrar, setSifreTekrar] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const mu = useMutation({
    mutationFn: () => resetUserPassword(user.id, { yeniSifre: sifre }),
    onSuccess: () => {
      setFormError(null)
      onDone()
    },
    onError: (e) => {
      setFormError(e instanceof ApiError ? e.message : 'Şifre güncellenemedi.')
    }
  })

  const submit = (e: FormEvent): void => {
    e.preventDefault()
    setFormError(null)
    if (sifre.length < 8) {
      setFormError('Şifre en az 8 karakter olmalıdır.')
      return
    }
    if (sifre !== sifreTekrar) {
      setFormError('Şifreler eşleşmiyor.')
      return
    }
    mu.mutate()
  }

  return (
    <ModalScrim onClose={onClose}>
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="flex flex-row items-center justify-between gap-2 border-b border-border">
          <CardTitle>Şifre sıfırla</CardTitle>
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Kapat
          </Button>
        </CardHeader>
        <CardBody className="space-y-3 px-4 py-4">
          <form className="space-y-3" onSubmit={submit}>
            <p className="text-sm text-ink-muted">
              <strong className="text-ink">{user.adSoyad}</strong> ({user.kullaniciAdi}) için yeni şifre belirleyin.
            </p>
            {formError ? (
              <AlertBox variant="danger" title="Hata">
                {formError}
              </AlertBox>
            ) : null}
            <Input label="Yeni şifre" type="password" value={sifre} onChange={(e) => setSifre(e.target.value)} autoComplete="new-password" />
            <Input label="Yeni şifre tekrar" type="password" value={sifreTekrar} onChange={(e) => setSifreTekrar(e.target.value)} />
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  const p = generateStrongPassword()
                  setSifre(p)
                  setSifreTekrar(p)
                }}
              >
                Güçlü şifre oluştur
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={!sifre}
                onClick={() => {
                  void copyText(sifre).then(() => {
                    setCopied(true)
                    setTimeout(() => setCopied(false), 2000)
                  })
                }}
              >
                {copied ? 'Kopyalandı' : 'Kopyala'}
              </Button>
            </div>
            <div className="flex justify-end gap-2 border-t border-border pt-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Vazgeç
              </Button>
              <Button type="submit" disabled={mu.isPending}>
                {mu.isPending ? 'Kaydediliyor…' : 'Kaydet'}
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </ModalScrim>
  )
}

function ConfirmModal({
  title,
  message,
  confirmLabel,
  danger,
  loading,
  onCancel,
  onConfirm
}: {
  title: string
  message: string
  confirmLabel: string
  danger?: boolean
  loading: boolean
  onCancel: () => void
  onConfirm: () => void
}): ReactElement {
  return (
    <ModalScrim onClose={onCancel}>
      <Card className="w-full max-w-md shadow-card">
        <CardHeader className="border-b border-border">
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardBody className="space-y-4 px-4 py-4">
          <p className="text-sm text-ink-muted">{message}</p>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
              Vazgeç
            </Button>
            <Button type="button" variant={danger ? 'outline' : 'primary'} className={danger ? 'border-danger text-danger' : ''} onClick={onConfirm} disabled={loading}>
              {loading ? '…' : confirmLabel}
            </Button>
          </div>
        </CardBody>
      </Card>
    </ModalScrim>
  )
}

export function KullanicilarPage(): ReactElement {
  const { session } = useAuth()
  const queryClient = useQueryClient()
  const role = session?.user.role

  const [q, setQ] = useState('')
  const [rolFilter, setRolFilter] = useState('')
  const [aktifFilter, setAktifFilter] = useState<AktifFilter>('all')

  const [createOpen, setCreateOpen] = useState(false)
  const [editTarget, setEditTarget] = useState<UserDto | null>(null)
  const [resetTarget, setResetTarget] = useState<UserDto | null>(null)
  const [pendingDeactivate, setPendingDeactivate] = useState<UserDto | null>(null)
  const [pendingActivate, setPendingActivate] = useState<UserDto | null>(null)

  const listParams = useMemo(
    () => ({
      q: q.trim() || undefined,
      rol: (rolFilter || undefined) as 'BURO_SAHIBI' | 'AVUKAT_YONETICI' | 'KATIP_PERSONEL' | undefined,
      aktifMi: aktifFilter === 'all' ? undefined : aktifFilter === 'active',
      page: 1,
      limit: 100
    }),
    [q, rolFilter, aktifFilter]
  )

  const usersQuery = useQuery({
    queryKey: ['users', listParams],
    queryFn: () => listUsers(listParams),
    enabled: role === 'BURO_SAHIBI' || role === 'AVUKAT_YONETICI'
  })

  const invalidateUsers = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ['users'] })
  }, [queryClient])

  const deactivateMu = useMutation({
    mutationFn: (id: string) => deactivateUser(id),
    onSuccess: () => {
      setPendingDeactivate(null)
      invalidateUsers()
    }
  })

  const activateMu = useMutation({
    mutationFn: (u: UserDto) =>
      updateUser(u.id, {
        adSoyad: u.adSoyad,
        eposta: u.eposta,
        telefon: u.telefon,
        rol: u.role === 'BURO_SAHIBI' ? 'BURO_SAHIBI' : (u.role as 'AVUKAT_YONETICI' | 'KATIP_PERSONEL'),
        aktifMi: true
      }),
    onSuccess: () => {
      setPendingActivate(null)
      invalidateUsers()
    }
  })

  if (!session) {
    return <Navigate to="/login" replace />
  }

  if (role === 'KATIP_PERSONEL') {
    return (
      <div className="w-full max-w-none space-y-4">
        <PageHeader title="Kullanıcılar" description="Büro kullanıcılarını ve yetkilerini yönetin." />
        <AlertBox variant="warning" title="Yetki">
          Bu sayfayı görüntülemek için yetkiniz yok. Yalnızca büro sahibi ve avukat/yönetici rolleri kullanıcı listesine erişebilir.
        </AlertBox>
        <Link to={APP_BASE} className="text-sm font-semibold text-primary hover:underline">
          {HOME_PAGE_LABEL}&apos;na dön
        </Link>
      </div>
    )
  }

  const isOwner = role === 'BURO_SAHIBI'
  const items = usersQuery.data?.items ?? []
  const total = usersQuery.data?.total ?? 0

  return (
    <div className="w-full max-w-none space-y-5">
      <PageHeader
        title="Kullanıcılar"
        description="Büro kullanıcılarını ve yetkilerini yönetin."
        actions={
          isOwner ? (
            <Button type="button" onClick={() => setCreateOpen(true)}>
              Yeni Kullanıcı
            </Button>
          ) : null
        }
      />

      {usersQuery.isError ? (
        <AlertBox variant="danger" title="Liste yüklenemedi">
          {usersQuery.error instanceof ApiError ? usersQuery.error.message : 'Bir hata oluştu.'}
        </AlertBox>
      ) : null}

      <Card className="overflow-hidden">
        <CardHeader className="border-b border-border">
          <CardTitle className="text-base">Filtreler</CardTitle>
        </CardHeader>
        <CardBody className="grid gap-3 px-4 py-4 sm:grid-cols-2 lg:grid-cols-4">
          <Input label="Arama" placeholder="Ad, kullanıcı adı, e-posta…" value={q} onChange={(e) => setQ(e.target.value)} />
          <Select label="Rol" value={rolFilter} onChange={(e) => setRolFilter(e.target.value)}>
            <option value="">Tüm roller</option>
            <option value="BURO_SAHIBI">Büro sahibi</option>
            <option value="AVUKAT_YONETICI">Avukat / Yönetici</option>
            <option value="KATIP_PERSONEL">Katip / Personel</option>
          </Select>
          <Select label="Durum" value={aktifFilter} onChange={(e) => setAktifFilter(e.target.value as AktifFilter)}>
            <option value="all">Tümü</option>
            <option value="active">Aktif</option>
            <option value="inactive">Pasif</option>
          </Select>
          <div className="flex items-end">
            <p className="text-xs text-ink-muted">
              Toplam <strong className="text-ink">{total}</strong> kullanıcı
            </p>
          </div>
        </CardBody>
      </Card>

      <div className="overflow-x-auto rounded-lg border border-border bg-panel shadow-sm">
        <Table>
          <THead>
            <TR>
              <TH>Ad soyad</TH>
              <TH>Kullanıcı adı</TH>
              <TH>E-posta</TH>
              <TH>Telefon</TH>
              <TH>Rol</TH>
              <TH>Durum</TH>
              <TH>Son giriş</TH>
              <TH className="text-right">İşlem</TH>
            </TR>
          </THead>
          <TBody>
            {usersQuery.isLoading ? (
              <TableEmptyRow colSpan={8}>Yükleniyor…</TableEmptyRow>
            ) : items.length === 0 ? (
              <TableEmptyRow colSpan={8}>Kayıt bulunamadı.</TableEmptyRow>
            ) : (
              items.map((u) => {
                const self = u.id === session.user.id
                return (
                  <TR key={u.id}>
                    <TD className="font-medium text-ink">{u.adSoyad}</TD>
                    <TD className="font-mono text-xs">{u.kullaniciAdi}</TD>
                    <TD className="text-sm">{u.eposta ?? '—'}</TD>
                    <TD className="text-sm">{u.telefon ?? '—'}</TD>
                    <TD className="text-sm">{roleLabel(u.role)}</TD>
                    <TD className="text-sm">
                      {u.aktifMi ? <span className="text-emerald-700">Aktif</span> : <span className="text-ink-muted">Pasif</span>}
                    </TD>
                    <TD className="whitespace-nowrap text-xs text-ink-muted">{formatDateTime(u.sonGirisTarihi)}</TD>
                    <TD className="text-right">
                      {isOwner ? (
                        <div className="flex flex-wrap justify-end gap-1">
                          <Button variant="outline" size="sm" type="button" onClick={() => setEditTarget(u)}>
                            Düzenle
                          </Button>
                          {!self ? (
                            <Button variant="outline" size="sm" type="button" onClick={() => setResetTarget(u)}>
                              Şifre sıfırla
                            </Button>
                          ) : null}
                          {!self ? (
                            u.aktifMi ? (
                              <Button
                                variant="outline"
                                size="sm"
                                type="button"
                                className="text-danger border-danger/40"
                                onClick={() => setPendingDeactivate(u)}
                              >
                                Pasifleştir
                              </Button>
                            ) : (
                              <Button variant="outline" size="sm" type="button" onClick={() => setPendingActivate(u)}>
                                Aktifleştir
                              </Button>
                            )
                          ) : null}
                        </div>
                      ) : (
                        <span className="text-xs text-ink-subtle">—</span>
                      )}
                    </TD>
                  </TR>
                )
              })
            )}
          </TBody>
        </Table>
      </div>

      {createOpen ? (
        <CreateUserModal
          onClose={() => setCreateOpen(false)}
          onDone={() => {
            invalidateUsers()
            setCreateOpen(false)
          }}
        />
      ) : null}

      {editTarget ? (
        <EditUserModal
          user={editTarget}
          sessionUserId={session.user.id}
          onClose={() => setEditTarget(null)}
          onDone={() => {
            invalidateUsers()
            setEditTarget(null)
          }}
        />
      ) : null}

      {resetTarget ? (
        <ResetPasswordModal
          user={resetTarget}
          onClose={() => setResetTarget(null)}
          onDone={() => {
            invalidateUsers()
            setResetTarget(null)
          }}
        />
      ) : null}

      {pendingDeactivate ? (
        <ConfirmModal
          title="Kullanıcıyı pasifleştir"
          message={`${pendingDeactivate.adSoyad} hesabı pasifleştirilecek (silinmez). Devam edilsin mi?`}
          confirmLabel="Pasifleştir"
          danger
          onCancel={() => setPendingDeactivate(null)}
          onConfirm={() => {
            deactivateMu.mutate(pendingDeactivate.id)
          }}
          loading={deactivateMu.isPending}
        />
      ) : null}

      {pendingActivate ? (
        <ConfirmModal
          title="Kullanıcıyı aktifleştir"
          message={`${pendingActivate.adSoyad} hesabı yeniden aktifleştirilecek.`}
          confirmLabel="Aktifleştir"
          onCancel={() => setPendingActivate(null)}
          onConfirm={() => {
            activateMu.mutate(pendingActivate)
          }}
          loading={activateMu.isPending}
        />
      ) : null}
    </div>
  )
}
