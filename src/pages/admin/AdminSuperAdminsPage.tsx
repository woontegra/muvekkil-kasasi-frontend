import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FormEvent, ReactElement } from 'react'
import { useState } from 'react'
import {
  adminAdminUserActivateRequest,
  adminAdminUserCreateRequest,
  adminAdminUserDeactivateRequest,
  adminAdminUserResetPasswordRequest,
  adminAdminUserUpdateRequest,
  adminAdminUsersListRequest
} from '../../api/adminApi'
import { AdminScrim } from '../../components/admin/AdminScrim'
import { useAdminAuth } from '../../contexts/AdminAuthContext'
import type { AdminUserDto, SuperAdminRoleDto } from '../../types/admin'
import { AlertBox, Button, Card, CardBody, CardHeader, CardTitle, Input, Table, TBody, TD, TH, THead, TR } from '../../components/ui'
import { formatDateTimeTR } from '../../utils/formatters'

const ROLES: SuperAdminRoleDto[] = ['SUPER_ADMIN', 'DESTEK', 'FINANS']

export function AdminSuperAdminsPage(): ReactElement {
  const { admin, refreshMe } = useAdminAuth()
  const qc = useQueryClient()
  const isSuper = admin?.rol === 'SUPER_ADMIN'

  const listQ = useQuery({
    queryKey: ['admin-admin-users'],
    queryFn: adminAdminUsersListRequest
  })
  const rows = listQ.data?.items ?? []

  const [createOpen, setCreateOpen] = useState(false)
  const [editRow, setEditRow] = useState<AdminUserDto | null>(null)
  const [pwdResult, setPwdResult] = useState<string | null>(null)

  const [cAd, setCAd] = useState('')
  const [cUser, setCUser] = useState('')
  const [cMail, setCMail] = useState('')
  const [cPwd, setCPwd] = useState('')
  const [cRol, setCRol] = useState<SuperAdminRoleDto>('DESTEK')

  const createM = useMutation({
    mutationFn: () =>
      adminAdminUserCreateRequest({
        adSoyad: cAd.trim(),
        kullaniciAdi: cUser.trim(),
        eposta: cMail.trim() || null,
        sifre: cPwd,
        rol: cRol
      }),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: ['admin-admin-users'] })
      setCreateOpen(false)
      setCAd('')
      setCUser('')
      setCMail('')
      setCPwd('')
      setCRol('DESTEK')
    }
  })

  return (
    <div className="w-full max-w-none space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Sistem / Adminler</h1>
          <p className="mt-1 text-sm text-slate-600">Woontegra panel kullanıcıları (kiracı kullanıcılarından ayrı).</p>
        </div>
        {isSuper ? (
          <Button type="button" onClick={() => setCreateOpen(true)}>
            Yeni admin kullanıcısı
          </Button>
        ) : null}
      </div>

      {!isSuper ? (
        <AlertBox variant="warning" title="Salt okunur">
          Yalnız <strong>SUPER_ADMIN</strong> yeni admin oluşturabilir, şifre sıfırlayabilir veya hesap durumunu değiştirebilir. Listeyi
          görüntüleyebilirsiniz.
        </AlertBox>
      ) : null}

      <Card className="overflow-hidden border-slate-200 shadow-sm">
        <CardHeader className="border-b border-slate-100 bg-slate-50/80 py-3">
          <CardTitle className="text-base">Admin kullanıcıları</CardTitle>
        </CardHeader>
        <CardBody className="p-0">
          {listQ.isLoading ? (
            <p className="px-4 py-10 text-center text-sm text-ink-muted">Yükleniyor…</p>
          ) : listQ.isError ? (
            <p className="px-4 py-10 text-center text-sm text-danger">{listQ.error instanceof Error ? listQ.error.message : 'Liste alınamadı.'}</p>
          ) : (
            <div className="w-full max-w-full overflow-x-auto">
              <Table className="min-w-[960px]">
                <THead>
                  <TR>
                    <TH>Ad soyad</TH>
                    <TH>Kullanıcı adı</TH>
                    <TH>E-posta</TH>
                    <TH>Rol</TH>
                    <TH>Aktif</TH>
                    <TH>Son giriş</TH>
                    <TH className="min-w-[220px]">İşlem</TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.map((u) => (
                    <AdminUserTableRow
                      key={u.id}
                      u={u}
                      selfId={admin?.id}
                      isSuper={isSuper}
                      onEdit={() => setEditRow(u)}
                      onPwd={(pwd) => setPwdResult(pwd)}
                    />
                  ))}
                </TBody>
              </Table>
            </div>
          )}
        </CardBody>
      </Card>

      {createOpen && isSuper ? (
        <AdminScrim title="Yeni admin kullanıcısı" onClose={() => !createM.isPending && setCreateOpen(false)}>
          <form
            className="space-y-3"
            onSubmit={(e: FormEvent) => {
              e.preventDefault()
              void createM.mutateAsync()
            }}
          >
            <Input label="Ad soyad" value={cAd} onChange={(e) => setCAd(e.target.value)} required />
            <Input label="Kullanıcı adı" value={cUser} onChange={(e) => setCUser(e.target.value)} required autoComplete="off" />
            <Input label="E-posta" type="email" value={cMail} onChange={(e) => setCMail(e.target.value)} />
            <Input label="Şifre" type="password" value={cPwd} onChange={(e) => setCPwd(e.target.value)} required autoComplete="new-password" />
            <div>
              <label className="mb-1 block text-xs font-semibold text-ink-muted">Rol</label>
              <select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={cRol} onChange={(e) => setCRol(e.target.value as SuperAdminRoleDto)}>
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
            {createM.isError ? (
              <p className="text-sm text-danger">{createM.error instanceof Error ? createM.error.message : 'Kayıt başarısız.'}</p>
            ) : null}
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="outline" disabled={createM.isPending} onClick={() => setCreateOpen(false)}>
                İptal
              </Button>
              <Button type="submit" disabled={createM.isPending}>
                {createM.isPending ? 'Kaydediliyor…' : 'Oluştur'}
              </Button>
            </div>
          </form>
        </AdminScrim>
      ) : null}

      {editRow && isSuper ? (
        <EditAdminModal
          user={editRow}
          onClose={() => setEditRow(null)}
          onSaved={() => {
            void qc.invalidateQueries({ queryKey: ['admin-admin-users'] })
            void refreshMe()
            setEditRow(null)
          }}
        />
      ) : null}

      {pwdResult ? (
        <AdminScrim title="Yeni şifre" onClose={() => setPwdResult(null)}>
          <AlertBox variant="warning" title="Tek seferlik gösterim">
            {pwdResult}
          </AlertBox>
          <div className="mt-4 flex justify-end">
            <Button type="button" onClick={() => setPwdResult(null)}>
              Tamam
            </Button>
          </div>
        </AdminScrim>
      ) : null}
    </div>
  )
}

function AdminUserTableRow(props: {
  u: AdminUserDto
  selfId?: string
  isSuper: boolean
  onEdit: () => void
  onPwd: (pwd: string) => void
}): ReactElement {
  const qc = useQueryClient()
  const resetM = useMutation({
    mutationFn: () => adminAdminUserResetPasswordRequest(props.u.id),
    onSuccess: (r) => props.onPwd(r.geciciSifre)
  })
  const deactM = useMutation({
    mutationFn: () => adminAdminUserDeactivateRequest(props.u.id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-admin-users'] })
  })
  const actM = useMutation({
    mutationFn: () => adminAdminUserActivateRequest(props.u.id),
    onSuccess: () => void qc.invalidateQueries({ queryKey: ['admin-admin-users'] })
  })

  const isSelf = props.u.id === props.selfId

  return (
    <TR>
      <TD className="font-medium">{props.u.adSoyad}</TD>
      <TD className="text-sm text-ink-muted">{props.u.kullaniciAdi}</TD>
      <TD className="text-sm text-ink-muted">{props.u.eposta ?? '—'}</TD>
      <TD className="text-xs font-semibold">{props.u.rol}</TD>
      <TD>{props.u.aktifMi ? 'Evet' : 'Hayır'}</TD>
      <TD className="whitespace-nowrap text-xs text-ink-muted">{formatDateTimeTR(props.u.sonGirisTarihi)}</TD>
      <TD>
        <div className="flex flex-wrap gap-2">
          <Button type="button" size="sm" variant="outline" disabled={!props.isSuper} onClick={props.onEdit}>
            Düzenle
          </Button>
          <Button type="button" size="sm" variant="secondary" disabled={!props.isSuper || resetM.isPending} onClick={() => void resetM.mutateAsync()}>
            Şifre sıfırla
          </Button>
          {props.u.aktifMi ? (
            <Button
              type="button"
              size="sm"
              variant="danger"
              disabled={!props.isSuper || isSelf || deactM.isPending}
              title={isSelf ? 'Kendi hesabınızı buradan kapatamazsınız.' : undefined}
              onClick={() => void deactM.mutateAsync()}
            >
              Pasifleştir
            </Button>
          ) : (
            <Button type="button" size="sm" variant="secondary" disabled={!props.isSuper || actM.isPending} onClick={() => void actM.mutateAsync()}>
              Aktifleştir
            </Button>
          )}
        </div>
      </TD>
    </TR>
  )
}

function EditAdminModal(props: { user: AdminUserDto; onClose: () => void; onSaved: () => void }): ReactElement {
  const [adSoyad, setAdSoyad] = useState(props.user.adSoyad)
  const [eposta, setEposta] = useState(props.user.eposta ?? '')
  const [rol, setRol] = useState<SuperAdminRoleDto>(props.user.rol)
  const [aktifMi, setAktifMi] = useState(props.user.aktifMi ? 'true' : 'false')

  const saveM = useMutation({
    mutationFn: () =>
      adminAdminUserUpdateRequest(props.user.id, {
        adSoyad,
        eposta: eposta.trim() || null,
        rol,
        aktifMi: aktifMi === 'true'
      }),
    onSuccess: props.onSaved
  })

  return (
    <AdminScrim title="Admin düzenle" onClose={() => !saveM.isPending && props.onClose()}>
      <div className="space-y-3">
        <Input label="Ad soyad" value={adSoyad} onChange={(e) => setAdSoyad(e.target.value)} />
        <Input label="E-posta" type="email" value={eposta} onChange={(e) => setEposta(e.target.value)} />
        <p className="text-xs text-ink-muted">Kullanıcı adı: {props.user.kullaniciAdi} (sistemde sabit)</p>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-muted">Rol</label>
          <select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={rol} onChange={(e) => setRol(e.target.value as SuperAdminRoleDto)}>
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-ink-muted">Aktif</label>
          <select className="h-10 w-full rounded-md border border-slate-200 bg-white px-3 text-sm" value={aktifMi} onChange={(e) => setAktifMi(e.target.value)}>
            <option value="true">Evet</option>
            <option value="false">Hayır</option>
          </select>
        </div>
        {saveM.isError ? <p className="text-sm text-danger">{saveM.error instanceof Error ? saveM.error.message : 'Hata'}</p> : null}
        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" disabled={saveM.isPending} onClick={props.onClose}>
            İptal
          </Button>
          <Button type="button" disabled={saveM.isPending} onClick={() => void saveM.mutateAsync()}>
            Kaydet
          </Button>
        </div>
      </div>
    </AdminScrim>
  )
}
