import { useMutation, useQuery } from '@tanstack/react-query'
import type { ReactElement } from 'react'
import { useRef, useState } from 'react'
import {
  adminWhatsAppControlledSessionTestRequest,
  adminWhatsAppWebhookOverrideStatusRequest,
  type AdminWhatsAppControlledSessionTestResponse
} from '../../api/adminApi'
import { AdminApiError } from '../../api/adminClient'
import {
  CONTROLLED_SESSION_TEST_TEXT,
  controlledTestConfirmMessage,
  controlledTestErrorMessage,
  controlledTestShouldLock,
  maskControlledTestPhone,
  normalizeControlledTestPhone
} from '../../lib/adminControlledSessionTest'
import { AdminConfirmDialog } from './AdminConfirmDialog'
import { AlertBox, Button, Card, CardBody, CardHeader, CardTitle, Input } from '../ui'

type Props = {
  tenantId: string
  /** Yalnızca SUPER_ADMIN için true verilmeli. */
  enabled: boolean
}

type Sonuc =
  | { tur: 'basarili'; data: AdminWhatsAppControlledSessionTestResponse; telefon: string }
  | { tur: 'hata'; mesaj: string; kilitlendi: boolean }

export function AdminWhatsAppControlledTestPanel(props: Props): ReactElement | null {
  const [telefon, setTelefon] = useState('')
  const [onayAcik, setOnayAcik] = useState(false)
  const [sonuc, setSonuc] = useState<Sonuc | null>(null)
  const [kilitliNumaralar, setKilitliNumaralar] = useState<Set<string>>(() => new Set())
  const istekSuruyor = useRef(false)

  const statusQ = useQuery({
    queryKey: ['admin-wa-webhook-override', props.tenantId],
    queryFn: () => adminWhatsAppWebhookOverrideStatusRequest(props.tenantId),
    enabled: props.enabled && Boolean(props.tenantId),
    retry: false
  })

  const kilitle = (n: string): void => {
    setKilitliNumaralar((prev) => new Set(prev).add(n))
  }

  const testMu = useMutation({
    mutationFn: (to: string) => adminWhatsAppControlledSessionTestRequest({ tenantId: props.tenantId, to }),
    onSuccess: (data, to) => {
      kilitle(to)
      setSonuc({ tur: 'basarili', data, telefon: to })
    },
    onError: (e: unknown, to) => {
      const err = e instanceof AdminApiError ? e : { status: 0, code: undefined }
      const kilit = controlledTestShouldLock(err)
      if (kilit) kilitle(to)
      setSonuc({ tur: 'hata', mesaj: controlledTestErrorMessage(err), kilitlendi: kilit })
    },
    onSettled: () => {
      istekSuruyor.current = false
      setOnayAcik(false)
    }
  })

  if (!props.enabled) return null

  const normalized = normalizeControlledTestPhone(telefon)
  const kilitli = normalized ? kilitliNumaralar.has(normalized) : false
  const statusCode = statusQ.error instanceof AdminApiError ? statusQ.error.code : undefined

  const gonder = (): void => {
    if (!normalized || kilitli || istekSuruyor.current || testMu.isPending) return
    istekSuruyor.current = true
    testMu.mutate(normalized)
  }

  return (
    <>
      <Card className="border-slate-200/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-sm">Kontrollü WhatsApp Testi</CardTitle>
        </CardHeader>
        <CardBody className="space-y-3">
          {statusQ.isLoading ? (
            <p className="text-sm text-slate-500">Bağlantı durumu kontrol ediliyor…</p>
          ) : statusQ.isError ? (
            <p className="text-sm text-slate-500">
              {statusCode === 'WHATSAPP_NOT_CONNECTED'
                ? 'Bu büronun WhatsApp bağlantısı aktif olmadığı için test kullanılamaz.'
                : 'WhatsApp bağlantı durumu doğrulanamadı; test şu an kullanılamaz.'}
            </p>
          ) : (
            <>
              <p className="text-xs text-slate-500">
                Büronun bağlı WhatsApp numarasından tek bir sabit test metni gönderir: “{CONTROLLED_SESSION_TEST_TEXT}”.
                Meta yalnızca alıcı son 24 saat içinde bu işletme numarasına mesaj yazdıysa kabul eder.
              </p>
              <Input
                id={`wa-kontrollu-test-telefon-${props.tenantId}`}
                label="Alıcı telefon numarası"
                placeholder="05XX XXX XX XX"
                inputMode="tel"
                autoComplete="off"
                maxLength={20}
                value={telefon}
                disabled={testMu.isPending}
                error={telefon.trim() && !normalized ? 'Geçerli bir Türkiye cep telefonu numarası girin.' : undefined}
                onChange={(e) => setTelefon(e.target.value)}
              />
              {kilitli ? (
                <p className="text-xs text-slate-500">
                  Bu numaraya bu oturumda test isteği gönderildi; tekrar gönderim kapalı.
                </p>
              ) : null}
              <Button
                type="button"
                size="sm"
                disabled={!normalized || kilitli || testMu.isPending}
                onClick={() => {
                  setSonuc(null)
                  setOnayAcik(true)
                }}
              >
                {testMu.isPending ? 'Gönderiliyor…' : 'Test mesajını gönder'}
              </Button>
            </>
          )}

          {sonuc?.tur === 'basarili' ? (
            sonuc.data.idempotent ? (
              <AlertBox variant="info" title="Yeni gönderim yapılmadı">
                {maskControlledTestPhone(sonuc.telefon)} numarasına bugün zaten bir test gönderilmiş ve Meta tarafından
                kabul edilmişti.
              </AlertBox>
            ) : (
              <AlertBox variant="success" title="Gönderim Meta tarafından kabul edildi">
                Alıcı: {maskControlledTestPhone(sonuc.telefon)}. Bu, mesajın teslim edildiği veya okunduğu anlamına
                gelmez.
              </AlertBox>
            )
          ) : null}
          {sonuc?.tur === 'hata' ? (
            <AlertBox variant="danger" title="Test gönderilemedi">
              {sonuc.mesaj}
              {sonuc.kilitlendi ? ' Bu numaraya tekrar gönderim bu oturumda kapatıldı.' : ''}
            </AlertBox>
          ) : null}
        </CardBody>
      </Card>

      <AdminConfirmDialog
        open={onayAcik && Boolean(normalized)}
        title="Kontrollü WhatsApp testi gönderilsin mi?"
        message={normalized ? controlledTestConfirmMessage(normalized) : ''}
        confirmLabel="Onayla ve gönder"
        loading={testMu.isPending}
        onCancel={() => setOnayAcik(false)}
        onConfirm={gonder}
      />
    </>
  )
}
