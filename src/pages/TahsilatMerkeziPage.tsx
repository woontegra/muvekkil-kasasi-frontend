import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import type { ReactElement } from 'react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listMuvekkilDosyalari } from '../api/dosyalar'
import { listMuvekkiller } from '../api/muvekkiller'
import { invalidateFinancialQueries } from '../lib/financialQueryInvalidation'
import {
  invalidateTahsilatMerkezi,
  listTahsilatMerkezi,
  TAKSILAT_MERKEZI_QUERY_KEY
} from '../api/tahsilatMerkezi'
import { createVekaletTaksitOdeme } from '../api/vekalet'
import { resolveOdemeApiError } from '../api/client'
import { TahsilatiYapanPersonelSelect } from '../components/prim/TahsilatiYapanPersonelSelect'
import { WhatsAppHatirlatModal } from '../components/tahsilat/WhatsAppHatirlatModal'
import { SmsHatirlatModal } from '../components/tahsilat/SmsHatirlatModal'
import { VekaletTaksitOdemeModal } from '../components/vekalet/VekaletTaksitOdemeModal'
import {
  MobileActionBar,
  MobileFilterPanel,
  MobileRecordCard,
  ResponsiveDataView
} from '../components/responsive'
import {
  AlertBox,
  Badge,
  Button,
  Card,
  CardBody,
  EmptyState,
  Input,
  PageHeader,
  StatCard,
  Table,
  TBody,
  TD,
  TH,
  THead,
  TR,
  tableActionButtonShrinkClass,
  tableActionsFlexRow
} from '../components/ui'
import { buildMaliKontrolNavigateUrl } from '../lib/maliKontrolNavigation'
import { formControlClass, uiType } from '../lib/uiDensity'
import { AnimatedNumber, Stagger, StaggerItem } from '../motion'
import { useToast } from '../toast'
import type { CreateVekaletTaksitOdemePayload, TaksitComputedDurumApi, VekaletTaksitiDto } from '../types/vekalet'
import type { TahsilatMerkeziGorunumFilter, TahsilatMerkeziSatirDto } from '../types/tahsilatMerkezi'
import { TAKSILAT_MERKEZI_GORUNUM_LABEL as GORUNUM_LABEL } from '../types/tahsilatMerkezi'
import { formatDateTR, formatMoney, resolveParaBirimi } from '../utils/formatters'

const GORUNUM_TABS: TahsilatMerkeziGorunumFilter[] = [
  'GECIKENLER',
  'BUGUN',
  'YAKLASANLAR',
  'KISMI_ODENENLER',
  'TUMU'
]

const DURUM_OPTIONS: { value: '' | TaksitComputedDurumApi; label: string }[] = [
  { value: '', label: 'T�m durumlar' },
  { value: 'GECIKTI', label: 'Gecikti' },
  { value: 'ODENMEDI', label: '�denmedi' },
  { value: 'KISMI_ODENDI', label: 'K�smi �dendi' }
]

function durumBadge(d: TaksitComputedDurumApi): 'default' | 'success' | 'warning' | 'danger' {
  if (d === 'ODENDI') return 'success'
  if (d === 'GECIKTI') return 'danger'
  if (d === 'KISMI_ODENDI') return 'warning'
  return 'default'
}

function durumLabel(d: TaksitComputedDurumApi): string {
  switch (d) {
    case 'GECIKTI':
      return 'Gecikti'
    case 'KISMI_ODENDI':
      return 'K�smi �dendi'
    case 'ODENMEDI':
      return '�denmedi'
    case 'ODENDI':
      return '�dendi'
    default:
      return d
  }
}

function gunFarkiLabel(gun: number): string {
  if (gun < 0) return `${Math.abs(gun)} g�n gecikti`
  if (gun === 0) return 'Bug�n'
  return `${gun} g�n kald�`
}

export function TahsilatMerkeziPage(): ReactElement {
  const toast = useToast()
  const qc = useQueryClient()
  const navigate = useNavigate()

  const [gorunum, setGorunum] = useState<TahsilatMerkeziGorunumFilter>('YAKLASANLAR')
  const [q, setQ] = useState('')
  const [muvekkilId, setMuvekkilId] = useState('')
  const [dosyaId, setDosyaId] = useState('')
  const [durum, setDurum] = useState<'' | TaksitComputedDurumApi>('')
  const [personelId, setPersonelId] = useState('')
  const [vadeBas, setVadeBas] = useState('')
  const [vadeBit, setVadeBit] = useState('')
  const [page, setPage] = useState(1)
  const limit = 50

  const [odemeRow, setOdemeRow] = useState<TahsilatMerkeziSatirDto | null>(null)
  const [whatsappRow, setWhatsappRow] = useState<TahsilatMerkeziSatirDto | null>(null)
  const [smsRow, setSmsRow] = useState<TahsilatMerkeziSatirDto | null>(null)

  const listParams = useMemo(
    () => ({
      gorunum,
      q: q.trim() || undefined,
      muvekkilId: muvekkilId || undefined,
      dosyaId: dosyaId || undefined,
      durum: durum || undefined,
      personelId: personelId || undefined,
      vadeBas: vadeBas || undefined,
      vadeBit: vadeBit || undefined,
      page,
      limit
    }),
    [gorunum, q, muvekkilId, dosyaId, durum, personelId, vadeBas, vadeBit, page, limit]
  )

  const listQ = useQuery({
    queryKey: [...TAKSILAT_MERKEZI_QUERY_KEY, 'liste', listParams],
    queryFn: () => listTahsilatMerkezi(listParams)
  })

  const muvekkillerQ = useQuery({
    queryKey: ['muvekkiller', 'all'],
    queryFn: () => listMuvekkiller({ page: 1, limit: 500 })
  })
  const dosyalarQ = useQuery({
    queryKey: ['muvekkil-dosyalar', muvekkilId],
    queryFn: () => listMuvekkilDosyalari(muvekkilId, { page: 1, limit: 200 }),
    enabled: Boolean(muvekkilId)
  })

  useEffect(() => {
    setPage(1)
  }, [gorunum, q, muvekkilId, dosyaId, durum, personelId, vadeBas, vadeBit])

  useEffect(() => {
    setDosyaId('')
  }, [muvekkilId])

  const invalidateAll = (dosyaIdForVekalet?: string): void => {
    invalidateTahsilatMerkezi(qc)
    invalidateFinancialQueries(qc, {
      dosyaId: dosyaIdForVekalet,
      ofisKasa: true,
      vekalet: Boolean(dosyaIdForVekalet),
      kasa: Boolean(dosyaIdForVekalet),
      karlilik: true,
      dashboard: true,
      maliKontrol: true
    })
    if (dosyaIdForVekalet) {
      void qc.invalidateQueries({ queryKey: ['prim'] })
    }
  }

  const odemeMu = useMutation({
    mutationFn: ({ id, body }: { id: string; body: CreateVekaletTaksitOdemePayload }) =>
      createVekaletTaksitOdeme(id, body),
    onSuccess: (res) => {
      const kalan = Number(res.taksit.kalanTutar ?? 0)
      invalidateAll(res.taksit.dosyaId)
      setOdemeRow(null)
      toast.success('Tahsilat kaydedildi.')
      if (kalan <= 0.001) {
        toast.success('Taksit tamamen kapand�.')
      }
    },
    onError: () => {
      toast.error('Tahsilat kaydedilemedi.')
    }
  })

  const ozet = listQ.data?.ozet
  const items = listQ.data?.items ?? []
  const total = listQ.data?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / limit))

  return (
    <div className="w-full space-y-5">
      <PageHeader
        title="Tahsilat Takibi"
        description="Vadesi yakla?an, bug�n vadesi gelen, gecikmi? ve k?smi �denmi? vekalet taksitleri."
      />

      <Stagger className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StaggerItem>
          <StatCard
            label="Gecikmi� taksit"
            value={
              listQ.isLoading ? (
                '-'
              ) : (
                <AnimatedNumber value={ozet?.gecikmisAdet ?? 0} format={(n) => String(Math.round(n))} />
              )
            }
            sub="Tutarlar listede para birimine g�re"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="Bug�n vadesi gelen"
            value={
              listQ.isLoading ? (
                '-'
              ) : (
                <AnimatedNumber value={ozet?.bugunAdet ?? 0} format={(n) => String(Math.round(n))} />
              )
            }
            sub="taksit"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="�n�m�zdeki 7 g�n"
            value={
              listQ.isLoading ? (
                '-'
              ) : (
                <AnimatedNumber value={ozet?.yakin7GunAdet ?? 0} format={(n) => String(Math.round(n))} />
              )
            }
            sub="taksit"
          />
        </StaggerItem>
        <StaggerItem>
          <StatCard
            label="K�smi �denmi�"
            value={
              listQ.isLoading ? (
                '-'
              ) : (
                <AnimatedNumber value={ozet?.kismiAdet ?? 0} format={(n) => String(Math.round(n))} />
              )
            }
            sub="taksit � kalan tutar listede"
          />
        </StaggerItem>
      </Stagger>

      <Card>
        <CardBody className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {GORUNUM_TABS.map((g) => (
              <Button
                key={g}
                type="button"
                size="sm"
                variant={gorunum === g ? 'primary' : 'outline'}
                onClick={() => setGorunum(g)}
              >
                {GORUNUM_LABEL[g]}
              </Button>
            ))}
          </div>

          <MobileFilterPanel
            activeCount={[q, muvekkilId, dosyaId, durum, personelId, vadeBas, vadeBit].filter(Boolean).length}
            onApply={() => setPage(1)}
            onReset={() => {
              setQ('')
              setMuvekkilId('')
              setDosyaId('')
              setDurum('')
              setPersonelId('')
              setVadeBas('')
              setVadeBit('')
              setPage(1)
            }}
            primary={<Input label="Ara" value={q} onChange={(e) => setQ(e.target.value)} placeholder="M�vekkil, dosya�" />}
          >
            <div>
              <label className={uiType.label}>M�vekkil</label>
              <select
                className={formControlClass}
                value={muvekkilId}
                onChange={(e) => setMuvekkilId(e.target.value)}
              >
                <option value="">T�m�</option>
                {(muvekkillerQ.data?.items ?? []).map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.gorunenAd}
                  </option>
                ))}
              </select>
            </div>
            <DosyaSelect
              dosyaId={dosyaId}
              onChange={setDosyaId}
              dosyalar={dosyalarQ.data?.items ?? []}
              disabled={!muvekkilId}
            />
            <div>
              <label className={uiType.label}>�deme durumu</label>
              <select
                className={formControlClass}
                value={durum}
                onChange={(e) => setDurum(e.target.value as '' | TaksitComputedDurumApi)}
              >
                {DURUM_OPTIONS.map((o) => (
                  <option key={o.value || 'all'} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
            <Input
              label="Vade ba�lang��"
              type="date"
              value={vadeBas}
              onChange={(e) => setVadeBas(e.target.value)}
              placeholder="Tarih se�in"
            />
            <Input
              label="Vade biti�"
              type="date"
              value={vadeBit}
              onChange={(e) => setVadeBit(e.target.value)}
              placeholder="Tarih se�in"
            />
            <div className="md:col-span-2">
              <TahsilatiYapanPersonelSelect value={personelId} onChange={setPersonelId} />
            </div>
          </MobileFilterPanel>

          {listQ.isError ? (
            <AlertBox variant="danger" title="Liste y�klenemedi">
              {listQ.error instanceof Error ? listQ.error.message : 'Bilinmeyen hata'}
            </AlertBox>
          ) : null}

          <ResponsiveDataView
            isLoading={listQ.isLoading}
            loading={<p className="py-6 text-[11px] text-ink-muted">Tahsilat bekleyenler y�kleniyor�</p>}
            isEmpty={!listQ.isLoading && items.length === 0}
            empty={
              <EmptyState
                title="Kay�t yok"
                description="Se�ili g�r�n�m ve filtrelere uygun a��k taksit bulunamad�."
              />
            }
            table={
              <div className="min-w-0 max-w-full">
                <Table>
                  <THead>
                    <TR>
                      <TH>M�vekkil</TH>
                      <TH>Dosya</TH>
                      <TH>Taksit</TH>
                      <TH className="text-right">Tutar</TH>
                      <TH className="text-right">�denen</TH>
                      <TH className="text-right">Kalan</TH>
                      <TH>Vade</TH>
                      <TH>S�re</TH>
                      <TH>Durum</TH>
                      <TH>��lem</TH>
                    </TR>
                  </THead>
                  <TBody>
                    <AnimatePresence initial={false}>
                      {items.map((row) => (
                        <ListeSatir
                          key={row.id}
                          row={row}
                          onOdeme={() => {
                            odemeMu.reset()
                            setOdemeRow(row)
                          }}
                          onWhatsapp={() => setWhatsappRow(row)}
                          onSms={() => setSmsRow(row)}
                          onEkstreAc={() =>
                            navigate(
                              buildMaliKontrolNavigateUrl({
                                muvekkilId: row.muvekkilId,
                                dosyaId: row.dosyaId,
                                tab: 'ekstre'
                              })
                            )
                          }
                          onDosya={() =>
                            navigate(
                              buildMaliKontrolNavigateUrl({
                                muvekkilId: row.muvekkilId,
                                dosyaId: row.dosyaId,
                                tab: 'vekalet',
                                taksitId: row.id
                              })
                            )
                          }
                        />
                      ))}
                    </AnimatePresence>
                  </TBody>
                </Table>
              </div>
            }
            cards={
              <>
                {items.map((row) => {
                  const taksitLabel = row.taksitAciklama?.trim()
                    ? `#${row.taksitNo} - ${row.taksitAciklama}`
                    : `Taksit #${row.taksitNo}`
                  return (
                    <MobileRecordCard
                      key={row.id}
                      title={row.muvekkilAd}
                      subtitle={
                        <>
                          {row.dosyaBaslik}
                          {row.dosyaNo ? ` � ${row.dosyaNo}` : ''}
                        </>
                      }
                      badge={<Badge variant={durumBadge(row.durum)}>{durumLabel(row.durum)}</Badge>}
                      fields={[
                        { label: 'Taksit', value: taksitLabel, full: true },
                        {
                          label: 'Tutar',
                          value: formatMoney(Number(row.taksitTutari), resolveParaBirimi(row.taksit.paraBirimi)),
                          numeric: true
                        },
                        {
                          label: '�denen',
                          value: formatMoney(Number(row.odenenToplam), resolveParaBirimi(row.taksit.paraBirimi)),
                          numeric: true
                        },
                        {
                          label: 'Kalan',
                          value: formatMoney(Number(row.kalanTutar), resolveParaBirimi(row.taksit.paraBirimi)),
                          numeric: true
                        },
                        { label: 'Vade', value: formatDateTR(`${row.vadeTarihi}T12:00:00.000Z`) },
                        {
                          label: 'S�re',
                          value: (
                            <span className={row.gunFarki < 0 ? 'font-medium text-danger' : undefined}>
                              {gunFarkiLabel(row.gunFarki)}
                            </span>
                          )
                        }
                      ]}
                      actions={
                        <MobileActionBar
                          items={[
                            {
                              key: 'odeme',
                              label: '�deme Al',
                              primary: true,
                              onClick: () => {
                                odemeMu.reset()
                                setOdemeRow(row)
                              }
                            },
                            {
                              key: 'wa',
                              label: 'WhatsApp�tan G�nder',
                              primary: true,
                              variant: 'outline',
                              onClick: () => setWhatsappRow(row)
                            },
                            {
                              key: 'sms',
                              label: 'SMS G�nder',
                              variant: 'outline',
                              onClick: () => setSmsRow(row)
                            },
                            {
                              key: 'ekstre',
                              label: 'Ekstre A�',
                              variant: 'outline',
                              onClick: () =>
                                navigate(
                                  buildMaliKontrolNavigateUrl({
                                    muvekkilId: row.muvekkilId,
                                    dosyaId: row.dosyaId,
                                    tab: 'ekstre'
                                  })
                                )
                            },
                            {
                              key: 'dosya',
                              label: 'Dosyaya Git',
                              variant: 'outline',
                              onClick: () =>
                                navigate(
                                  buildMaliKontrolNavigateUrl({
                                    muvekkilId: row.muvekkilId,
                                    dosyaId: row.dosyaId,
                                    tab: 'vekalet',
                                    taksitId: row.id
                                  })
                                )
                            }
                          ]}
                        />
                      }
                    />
                  )
                })}
              </>
            }
          />

          {total > limit ? (
            <div className="flex items-center justify-between gap-2 text-sm">
              <span className="text-ink-muted">
                Toplam {total} kay�t � Sayfa {page}/{totalPages}
              </span>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  �nceki
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Sonraki
                </Button>
              </div>
            </div>
          ) : null}
        </CardBody>
      </Card>

      {odemeRow ? (
        <VekaletTaksitOdemeModal
          key={odemeRow.id}
          taksit={odemeRow.taksit as VekaletTaksitiDto}
          dosyaId={odemeRow.dosyaId}
          onClose={() => {
            odemeMu.reset()
            setOdemeRow(null)
          }}
          loading={odemeMu.isPending}
          error={resolveOdemeApiError(odemeMu.error)}
          onSubmit={(body) => odemeMu.mutate({ id: odemeRow.id, body })}
          onStaleSummary={() => invalidateAll(odemeRow.dosyaId)}
        />
      ) : null}

      {whatsappRow ? <WhatsAppHatirlatModal row={whatsappRow} onClose={() => setWhatsappRow(null)} /> : null}
      {smsRow ? <SmsHatirlatModal row={smsRow} onClose={() => setSmsRow(null)} /> : null}
    </div>
  )
}

function DosyaSelect(props: {
  dosyaId: string
  onChange: (v: string) => void
  dosyalar: { id: string; konuBasligi: string; dosyaNo: string | null }[]
  disabled: boolean
}): ReactElement {
  return (
    <div>
      <label className={uiType.label}>Dosya</label>
      <select
        className={formControlClass}
        value={props.dosyaId}
        disabled={props.disabled}
        onChange={(e) => props.onChange(e.target.value)}
      >
        <option value="">T�m�</option>
        {props.dosyalar.map((d) => (
          <option key={d.id} value={d.id}>
            {d.konuBasligi}
            {d.dosyaNo ? ` (${d.dosyaNo})` : ''}
          </option>
        ))}
      </select>
    </div>
  )
}

function ListeSatir(props: {
  row: TahsilatMerkeziSatirDto
  onOdeme: () => void
  onWhatsapp: () => void
  onSms: () => void
  onEkstreAc: () => void
  onDosya: () => void
}): ReactElement {
  const { row, onOdeme, onWhatsapp, onSms, onEkstreAc, onDosya } = props
  const taksitLabel = row.taksitAciklama?.trim()
    ? `#${row.taksitNo} - ${row.taksitAciklama}`
    : `Taksit #${row.taksitNo}`
  const rowPb = resolveParaBirimi(row.taksit.paraBirimi)

  return (
    <motion.tr
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -2 }}
      transition={{ duration: 0.2 }}
      className="border-b border-border"
    >
      <TD className="font-medium">{row.muvekkilAd}</TD>
      <TD>
        <div>{row.dosyaBaslik}</div>
        {row.dosyaNo ? <div className="text-xs text-ink-muted">{row.dosyaNo}</div> : null}
      </TD>
      <TD>{taksitLabel}</TD>
      <TD className="text-right tabular-nums">{formatMoney(Number(row.taksitTutari), rowPb)}</TD>
      <TD className="text-right tabular-nums">{formatMoney(Number(row.odenenToplam), rowPb)}</TD>
      <TD className="text-right tabular-nums font-semibold">{formatMoney(Number(row.kalanTutar), rowPb)}</TD>
      <TD className="whitespace-nowrap">{formatDateTR(`${row.vadeTarihi}T12:00:00.000Z`)}</TD>
      <TD className={row.gunFarki < 0 ? 'font-medium text-danger' : 'text-ink-muted'}>
        {gunFarkiLabel(row.gunFarki)}
      </TD>
      <TD>
        <Badge variant={durumBadge(row.durum)}>{durumLabel(row.durum)}</Badge>
      </TD>
      <TD>
        <div className={tableActionsFlexRow}>
          <Button type="button" size="sm" className={tableActionButtonShrinkClass} onClick={onOdeme}>
            �deme Al
          </Button>
          <Button type="button" size="sm" variant="outline" className={tableActionButtonShrinkClass} onClick={onWhatsapp}>
            WhatsApp�tan G�nder
          </Button>
          <Button type="button" size="sm" variant="outline" className={tableActionButtonShrinkClass} onClick={onSms}>
            SMS G�nder
          </Button>
          <Button type="button" size="sm" variant="outline" className={tableActionButtonShrinkClass} onClick={onEkstreAc}>
            Ekstre A�
          </Button>
          <Button type="button" size="sm" variant="outline" className={tableActionButtonShrinkClass} onClick={onDosya}>
            Dosyaya Git
          </Button>
        </div>
      </TD>
    </motion.tr>
  )
}
