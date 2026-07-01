import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { adminResetUserPasswordRequest, adminUserUpdateRequest } from '../../api/adminApi'
import type { AdminTenantDetailUserDto, TenantUserRoleDto } from '../../types/admin'
import { AdminConfirmDialog } from '../../components/admin/AdminConfirmDialog'
import { Button, Input, TD, TR } from '../../components/ui'

const USER_ROLES: TenantUserRoleDto[] = ['BURO_SAHIBI', 'AVUKAT_YONETICI', 'KATIP_PERSONEL']

export function AdminTenantUserRow(props: {
  tenantId: string
  user: AdminTenantDetailUserDto
  canManage: boolean
  onResetDone: (pwd: string) => void
}): ReactElement {
  const qc = useQueryClient()
  const [editing, setEditing] = useState(false)
  const [adSoyad, setAdSoyad] = useState(props.user.adSoyad)
  const [eposta, setEposta] = useState(props.user.eposta ?? '')
  const [telefon, setTelefon] = useState(props.user.telefon ?? '')
  const [rol, setRol] = useState<TenantUserRoleDto>(props.user.role)
  const [aktifMi, setAktifMi] = useState(props.user.aktifMi ? 'true' : 'false')
  const [newPwd, setNewPwd] = useState('')
  const [pwdErr, setPwdErr] = useState<string | null>(null)
  const [userPasifConfirm, setUserPasifConfirm] = useState(false)
  const [toggleErr, setToggleErr] = useState<string | null>(null)

  useEffect(() => {
    if (editing) return
    setAdSoyad(props.user.adSoyad)
    setEposta(props.user.eposta ?? '')
    setTelefon(props.user.telefon ?? '')
    setRol(props.user.role)
    setAktifMi(props.user.aktifMi ? 'true' : 'false')
    setToggleErr(null)
  }, [props.user, editing])

  const updateM = useMutation({
    mutationFn: () =>
      adminUserUpdateRequest(props.user.id, {
        tenantId: props.tenantId,
        adSoyad,
        eposta: eposta.trim() ? eposta.trim() : null,
        telefon: telefon.trim() || null,
        rol,
        aktifMi: aktifMi === 'true'
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-tenant', props.tenantId] })
      void qc.invalidateQueries({ queryKey: ['admin-tenants'] })
      setEditing(false)
    }
  })

  const quickToggleM = useMutation({
    mutationFn: (nextAktif: boolean) =>
      adminUserUpdateRequest(props.user.id, {
        tenantId: props.tenantId,
        adSoyad: props.user.adSoyad,
        eposta: props.user.eposta ?? null,
        telefon: props.user.telefon ?? null,
        rol: props.user.role,
        aktifMi: nextAktif
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-tenant', props.tenantId] })
      void qc.invalidateQueries({ queryKey: ['admin-tenants'] })
      setUserPasifConfirm(false)
      setToggleErr(null)
    },
    onError: (e: unknown) => {
      setToggleErr(e instanceof Error ? e.message : 'İşlem başarısız.')
    }
  })

  const resetM = useMutation({
    mutationFn: () => {
      const t = newPwd.trim()
      if (t && t.length < 8) {
        throw new Error('Özel şifre en az 8 karakter olmalı veya boş bırakın.')
      }
      return adminResetUserPasswordRequest(props.user.id, props.tenantId, t || undefined)
    },
    onSuccess: (data) => {
      props.onResetDone(data.geciciSifre)
      setPwdErr(null)
      void qc.invalidateQueries({ queryKey: ['admin-tenant', props.tenantId] })
      setNewPwd('')
    },
    onError: (e: unknown) => setPwdErr(e instanceof Error ? e.message : 'İşlem başarısız.')
  })

  if (editing) {
    return (
      <TR>
        <TD colSpan={5}>
          <div className="flex flex-col gap-2 p-2">
            <Input label="Ad Soyad" value={adSoyad} onChange={(e) => setAdSoyad(e.target.value)} />
            <Input label="E-posta" value={eposta} onChange={(e) => setEposta(e.target.value)} />
            <Input label="Telefon" value={telefon} onChange={(e) => setTelefon(e.target.value)} />
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">Rol</label>
              <select className="h-9 w-full rounded-md border border-border bg-white px-2 text-sm" value={rol} onChange={(e) => setRol(e.target.value as TenantUserRoleDto)}>
                {USER_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">Hesap aktif</label>
              <select className="h-9 w-full rounded-md border border-border bg-white px-2 text-sm" value={aktifMi} onChange={(e) => setAktifMi(e.target.value)}>
                <option value="true">Evet</option>
                <option value="false">Hayır (pasifleştir, silinmez)</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={() => void updateM.mutateAsync()} disabled={updateM.isPending}>
                Kaydet
              </Button>
              <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(false)}>
                İptal
              </Button>
            </div>
          </div>
        </TD>
      </TR>
    )
  }

  return (
    <>
      <AdminConfirmDialog
        open={userPasifConfirm}
        title="Kullanıcıyı pasifleştir"
        message={`${props.user.adSoyad} hesabı pasifleştirilecek (kayıt silinmez; giriş kapanır). Devam edilsin mi?`}
        confirmLabel="Pasifleştir"
        danger
        loading={quickToggleM.isPending}
        onCancel={() => setUserPasifConfirm(false)}
        onConfirm={() => void quickToggleM.mutateAsync(false)}
      />
      <TR>
        <TD>{props.user.adSoyad}</TD>
        <TD className="text-sm">{props.user.eposta ?? '—'}</TD>
        <TD>{props.user.role}</TD>
        <TD className="whitespace-nowrap text-sm">{props.user.aktifMi ? 'Aktif' : 'Pasif'}</TD>
        <TD>
          <div className="flex flex-col gap-1.5">
            {props.canManage ? (
              <div className="flex flex-wrap gap-1">
                {props.user.aktifMi ? (
                  <Button type="button" size="sm" variant="danger" onClick={() => setUserPasifConfirm(true)} disabled={quickToggleM.isPending}>
                    Pasifleştir
                  </Button>
                ) : (
                  <Button type="button" size="sm" variant="secondary" onClick={() => void quickToggleM.mutateAsync(true)} disabled={quickToggleM.isPending}>
                    Aktifleştir
                  </Button>
                )}
              </div>
            ) : null}
            <Button type="button" size="sm" variant="secondary" onClick={() => setEditing(true)} disabled={!props.canManage}>
              Düzenle
            </Button>
            {toggleErr ? <p className="text-xs text-danger">{toggleErr}</p> : null}
            <Input placeholder="Yeni şifre (boş=otomatik)" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className="text-xs" />
            {pwdErr ? <p className="text-xs text-danger">{pwdErr}</p> : null}
            <Button
              type="button"
              size="sm"
              onClick={() => {
                setPwdErr(null)
                void resetM.mutateAsync()
              }}
              disabled={resetM.isPending || !props.canManage}
            >
              Şifre sıfırla
            </Button>
          </div>
        </TD>
      </TR>
    </>
  )
}
