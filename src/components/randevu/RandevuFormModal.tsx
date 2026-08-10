import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { FormEvent, ReactElement } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { listMuvekkilDosyalari } from '../../api/dosyalar'
import { createRandevu, RANDEVULAR_QUERY_KEY, updateRandevu } from '../../api/randevular'
import { listMuvekkiller } from '../../api/muvekkiller'
import { listUsers } from '../../api/users'
import { ApiError } from '../../api/client'
import {
  combineLocalDateTime,
  defaultEndTimeFromStart,
  localDateTimeToIso,
  toDateInputValue,
  toTimeInputValue
} from '../../lib/randevuCalendar'
import type { RandevuDto, RandevuWritePayload } from '../../types/randevu'
import { useToast } from '../../toast'
import { AlertBox, Button, Input, ModalScrim, Textarea } from '../ui'
import {
  RANDEVU_FORM_MODAL_WIDTH,
  RandevuFormField,
  RandevuModalBody,
  RandevuModalFooter,
  RandevuModalHeader,
  RandevuModalPanel,
  randevuFormSelectClass
} from './RandevuModalChrome'

export type RandevuFormPrefill = {
  date?: string
  startTime?: string
  endTime?: string
  muvekkilId?: string
  dosyaId?: string
}

type Props = {
  mode: 'create' | 'edit'
  randevu?: RandevuDto
  prefill?: RandevuFormPrefill
  onClose: () => void
  onSaved: () => void
}

export function RandevuFormModal({ mode, randevu, prefill, onClose, onSaved }: Props): ReactElement {
  const toast = useToast()
  const queryClient = useQueryClient()
  const now = new Date()
  const isEdit = mode === 'edit'

  const [baslik, setBaslik] = useState(randevu?.baslik ?? '')
  const [tarih, setTarih] = useState(
    randevu ? toDateInputValue(new Date(randevu.baslangicAt)) : prefill?.date ?? toDateInputValue(now)
  )
  const [baslangicSaati, setBaslangicSaati] = useState(
    randevu
      ? toTimeInputValue(new Date(randevu.baslangicAt))
      : prefill?.startTime ?? toTimeInputValue(now)
  )
  const [bitisSaati, setBitisSaati] = useState(
    randevu
      ? toTimeInputValue(new Date(randevu.bitisAt))
      : prefill?.endTime ?? defaultEndTimeFromStart(prefill?.startTime ?? toTimeInputValue(now))
  )
  const [konum, setKonum] = useState(randevu?.konum ?? '')
  const [aciklama, setAciklama] = useState(randevu?.aciklama ?? '')
  const [muvekkilId, setMuvekkilId] = useState(randevu?.muvekkilId ?? prefill?.muvekkilId ?? '')
  const [dosyaId, setDosyaId] = useState(randevu?.dosyaId ?? prefill?.dosyaId ?? '')
  const [sorumluUserId, setSorumluUserId] = useState(randevu?.sorumluUserId ?? '')
  const [muvekkilQ, setMuvekkilQ] = useState('')
  const [debouncedMuvekkilQ, setDebouncedMuvekkilQ] = useState('')
  const [formError, setFormError] = useState<string | null>(null)

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedMuvekkilQ(muvekkilQ.trim()), 300)
    return () => window.clearTimeout(t)
  }, [muvekkilQ])

  const muvekkilQuery = useQuery({
    queryKey: ['muvekkiller', 'randevu-form', debouncedMuvekkilQ],
    queryFn: () => listMuvekkiller({ q: debouncedMuvekkilQ, page: 1, limit: 50 }),
    enabled: debouncedMuvekkilQ.length >= 1
  })

  const showMuvekkilDropdown =
    muvekkilQ.trim().length >= 1 &&
    !muvekkilId &&
    muvekkilQuery.isSuccess &&
    (muvekkilQuery.data?.items.length ?? 0) > 0

  const dosyaQuery = useQuery({
    queryKey: ['muvekkil-dosyalar', muvekkilId, 'randevu-form'],
    queryFn: () => listMuvekkilDosyalari(muvekkilId, { page: 1, limit: 100 }),
    enabled: Boolean(muvekkilId)
  })

  const usersQuery = useQuery({
    queryKey: ['users', 'randevu-form'],
    queryFn: () => listUsers({ aktifMi: true, page: 1, limit: 100 })
  })

  const selectedMuvekkilLabel = useMemo(() => {
    if (!muvekkilId) return ''
    const fromList = muvekkilQuery.data?.items.find((m) => m.id === muvekkilId)
    if (fromList) return fromList.gorunenAd
    if (randevu?.muvekkilId === muvekkilId && randevu.muvekkilAd) return randevu.muvekkilAd
    return ''
  }, [muvekkilId, muvekkilQuery.data?.items, randevu])

  function buildPayload(): RandevuWritePayload {
    return {
      baslik: baslik.trim(),
      baslangicAt: localDateTimeToIso(tarih, baslangicSaati),
      bitisAt: localDateTimeToIso(tarih, bitisSaati),
      konum: konum.trim() || null,
      aciklama: aciklama.trim() || null,
      muvekkilId: muvekkilId || null,
      dosyaId: dosyaId || null,
      sorumluUserId: sorumluUserId || null
    }
  }

  function validate(): boolean {
    if (!baslik.trim()) {
      setFormError('Başlık zorunludur.')
      return false
    }
    if (!tarih || !baslangicSaati || !bitisSaati) {
      setFormError('Tarih ve saat alanları zorunludur.')
      return false
    }
    const start = combineLocalDateTime(tarih, baslangicSaati)
    const end = combineLocalDateTime(tarih, bitisSaati)
    if (end <= start) {
      setFormError('Bitiş saati başlangıçtan sonra olmalıdır.')
      return false
    }
    setFormError(null)
    return true
  }

  const saveMu = useMutation({
    mutationFn: async () => {
      const payload = buildPayload()
      if (isEdit && randevu) {
        return updateRandevu(randevu.id, payload)
      }
      return createRandevu(payload)
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: RANDEVULAR_QUERY_KEY })
      toast.success(isEdit ? 'Randevu güncellendi.' : 'Randevu oluşturuldu.')
      onSaved()
      onClose()
    },
    onError: (err) => {
      if (err instanceof ApiError) {
        setFormError(err.message)
      } else {
        setFormError('Randevu kaydedilemedi.')
      }
    }
  })

  function onSubmit(e: FormEvent): void {
    e.preventDefault()
    if (!validate()) return
    saveMu.mutate()
  }

  return (
    <ModalScrim onClose={onClose} draggable={false} innerAsDialog innerClassName={RANDEVU_FORM_MODAL_WIDTH}>
      <RandevuModalPanel>
        <RandevuModalHeader
          title={isEdit ? 'Randevuyu Düzenle' : 'Yeni Randevu'}
          subtitle={
            isEdit
              ? 'Tarih, saat ve randevu bilgilerini güncelleyin.'
              : 'Randevu tarihini ve ilgili bilgileri belirleyin.'
          }
        />

        <form onSubmit={onSubmit}>
          <RandevuModalBody className="space-y-4">
            {formError ? (
              <AlertBox variant="danger" title="Hata">
                {formError}
              </AlertBox>
            ) : null}

            <RandevuFormField label="Başlık" required>
              <Input value={baslik} onChange={(e) => setBaslik(e.target.value)} required />
            </RandevuFormField>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <RandevuFormField label="Müvekkil">
                <Input
                  placeholder="Müvekkil ara…"
                  value={muvekkilId && !muvekkilQ ? selectedMuvekkilLabel : muvekkilQ}
                  onChange={(e) => {
                    const next = e.target.value
                    setMuvekkilQ(next)
                    if (muvekkilId) {
                      setMuvekkilId('')
                      setDosyaId('')
                    }
                  }}
                />
                {showMuvekkilDropdown ? (
                  <ul className="mt-1 max-h-32 overflow-y-auto rounded-md border border-border bg-white text-sm shadow-sm">
                    {(muvekkilQuery.data?.items ?? []).map((m) => (
                      <li key={m.id}>
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left transition-colors hover:bg-primary/5"
                          onClick={() => {
                            setMuvekkilId(m.id)
                            setMuvekkilQ('')
                            setDosyaId('')
                          }}
                        >
                          {m.gorunenAd}
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {muvekkilId ? (
                  <p className="mt-1 text-xs text-ink-muted">
                    Seçili müvekkil: <span className="font-medium text-ink">{selectedMuvekkilLabel}</span>
                    <button
                      type="button"
                      className="ml-2 text-primary hover:underline"
                      onClick={() => {
                        setMuvekkilId('')
                        setDosyaId('')
                        setMuvekkilQ('')
                      }}
                    >
                      Temizle
                    </button>
                  </p>
                ) : null}
              </RandevuFormField>

              <RandevuFormField label="Dosya">
                <select
                  className={randevuFormSelectClass}
                  value={dosyaId}
                  onChange={(e) => setDosyaId(e.target.value)}
                  disabled={!muvekkilId}
                >
                  <option value="">— Seçiniz —</option>
                  {(dosyaQuery.data?.items ?? []).map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.konuBasligi}
                    </option>
                  ))}
                </select>
              </RandevuFormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <RandevuFormField label="Tarih" required>
                <Input type="date" value={tarih} onChange={(e) => setTarih(e.target.value)} required />
              </RandevuFormField>
              <RandevuFormField label="Sorumlu">
                <select
                  className={randevuFormSelectClass}
                  value={sorumluUserId}
                  onChange={(e) => setSorumluUserId(e.target.value)}
                >
                  <option value="">— Seçiniz —</option>
                  {(usersQuery.data?.items ?? []).map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.adSoyad}
                    </option>
                  ))}
                </select>
              </RandevuFormField>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <RandevuFormField label="Başlangıç" required>
                <Input type="time" value={baslangicSaati} onChange={(e) => setBaslangicSaati(e.target.value)} required />
              </RandevuFormField>
              <RandevuFormField label="Bitiş" required>
                <Input type="time" value={bitisSaati} onChange={(e) => setBitisSaati(e.target.value)} required />
              </RandevuFormField>
            </div>

            <RandevuFormField label="Konum">
              <Input value={konum} onChange={(e) => setKonum(e.target.value)} />
            </RandevuFormField>

            <RandevuFormField label="Açıklama">
              <Textarea value={aciklama} onChange={(e) => setAciklama(e.target.value)} rows={3} />
            </RandevuFormField>
          </RandevuModalBody>

          <RandevuModalFooter
            right={
              <>
                <Button type="button" variant="outline" className="w-full sm:w-auto" onClick={onClose}>
                  Vazgeç
                </Button>
                <Button type="submit" className="w-full sm:w-auto" disabled={saveMu.isPending}>
                  {isEdit ? 'Değişiklikleri Kaydet' : 'Randevu Oluştur'}
                </Button>
              </>
            }
          />
        </form>
      </RandevuModalPanel>
    </ModalScrim>
  )
}
