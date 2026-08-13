import type { ReactElement } from 'react'
import { useEffect } from 'react'
import { WHATSAPP_HELP_LINKS } from '../../../config/whatsappHelpLinks'
import { Button } from '../../ui'
import { ChoiceRow, SafetyNotice } from './ChoiceRow'
import { PhoneMenuPath, PhoneMock } from './PhoneMock'
import { GUIDE_PHASES, phaseForGuideStep } from './types'
import { cn } from '../../../lib/cn'

/** 0-based index of “WhatsApp Business’ın çalıştığını kontrol edin” (adım 5/6). */
const VERIFY_STEP_INDEX = 4
const CONNECT_STEP_INDEX = 5

export type GuideStep = {
  title: string
  body: string
  illustration: ReactElement
}

const STEPS: GuideStep[] = [
  {
    title: 'WhatsApp konuşmalarınızı yedekleyin',
    body: 'WhatsApp → Ayarlar → Sohbetler → Sohbet Yedeği bölümünden güncel yedek oluşturun.',
    illustration: (
      <PhoneMock title="WhatsApp">
        <PhoneMenuPath items={['Ayarlar', 'Sohbetler', 'Sohbet Yedeği']} />
        <p className="mt-2 rounded-md bg-emerald-50 px-2 py-1 text-[10px] font-medium text-emerald-800">
          Yedek oluştur
        </p>
      </PhoneMock>
    )
  },
  {
    title: 'WhatsApp Business uygulamasını yükleyin',
    body: 'Yalnızca resmi mağazalardan indirin. Kurulum bittikten sonra uygulamayı açın.',
    illustration: (
      <PhoneMock title="Mağaza">
        <div className="space-y-1.5">
          <div className="rounded-md border border-border bg-slate-50 px-2 py-1.5 font-semibold text-ink">
            WhatsApp Business
          </div>
          <p className="text-[10px] text-ink-muted">Resmi uygulama · WhatsApp LLC</p>
        </div>
      </PhoneMock>
    )
  },
  {
    title: 'Mevcut telefon numaranızla devam edin',
    body: 'WhatsApp Business uygulamasını açın ve normal WhatsApp’ta kullandığınız mevcut telefon numaranızla kuruluma devam edin.',
    illustration: (
      <PhoneMock title="WhatsApp Business">
        <p className="font-medium text-ink">Telefon numarası</p>
        <div className="mt-1 rounded-md border border-dashed border-border bg-slate-50 px-2 py-2 text-center font-mono text-[11px] tracking-wide text-ink-muted">
          +90 ··· ··· ····
        </div>
        <p className="mt-2 text-[10px] text-ink-subtle">Mevcut numaranızla devam</p>
      </PhoneMock>
    )
  },
  {
    title: 'Mevcut hesabınızı aktarın',
    body: 'WhatsApp Business size mevcut hesabınızı ve sohbetlerinizi aktarma seçeneği sunduğunda ekrandaki adımları tamamlayın.',
    illustration: (
      <PhoneMock title="Aktarım">
        <div className="rounded-md border border-border bg-slate-50 px-2 py-2">
          <p className="font-semibold text-ink">Hesabı aktar</p>
          <p className="mt-1 text-[10px] text-ink-muted">Sohbetler ve medya taşınabilir</p>
        </div>
        <p className="mt-2 rounded-md bg-primary/10 px-2 py-1 text-center text-[10px] font-semibold text-primary">
          Devam et
        </p>
      </PhoneMock>
    )
  },
  {
    title: 'WhatsApp Business’ın çalıştığını kontrol edin',
    body: 'Kişilerinizi ve sohbetlerinizi görebildiğinizden ve mesaj gönderip alabildiğinizden emin olun.',
    illustration: (
      <PhoneMock title="Sohbetler">
        <div className="space-y-1">
          {['Müvekkil A', 'Büro grubu', 'Asistan'].map((n) => (
            <div key={n} className="flex items-center gap-2 rounded-md bg-slate-50 px-2 py-1">
              <span className="h-5 w-5 rounded-full bg-slate-200" />
              <span className="font-medium text-ink">{n}</span>
            </div>
          ))}
        </div>
      </PhoneMock>
    )
  },
  {
    title: 'Müvekkil Kasa’ya dönün',
    body: 'Geçiş tamamsa buradan bağlantıya devam edebilirsiniz. Meta ekranı açılacak; adımları tamamlayın.',
    illustration: (
      <PhoneMock title="Müvekkil Kasa">
        <p className="font-semibold text-ink">WhatsApp Bağlantısı</p>
        <p className="mt-1 text-[10px] text-ink-muted">Business numarası bağlanmaya hazır</p>
        <p className="mt-2 rounded-md bg-primary px-2 py-1.5 text-center text-[10px] font-semibold text-white">
          Bağlantıya devam
        </p>
      </PhoneMock>
    )
  }
]

type Props = {
  stepIndex: number
  onStepChange: (next: number) => void
  onConnect: () => void
  connectBusy?: boolean
  chatsVerified: boolean
  onChatsVerifiedChange: (verified: boolean) => void
}

export function ConsumerToBusinessGuide(props: Props): ReactElement {
  const {
    stepIndex,
    onStepChange,
    onConnect,
    connectBusy,
    chatsVerified,
    onChatsVerifiedChange
  } = props
  const total = STEPS.length
  const clamped = Math.min(Math.max(stepIndex, 0), total - 1)
  const step = STEPS[clamped]!
  const phase = phaseForGuideStep(clamped)
  const isLast = clamped === CONNECT_STEP_INDEX
  const isVerifyStep = clamped === VERIFY_STEP_INDEX
  const canAdvanceFromVerify = chatsVerified

  useEffect(() => {
    if (clamped >= CONNECT_STEP_INDEX && !chatsVerified) {
      onStepChange(VERIFY_STEP_INDEX)
    }
  }, [clamped, chatsVerified, onStepChange])

  function requestStepChange(next: number): void {
    if (next >= CONNECT_STEP_INDEX && !chatsVerified) {
      onStepChange(VERIFY_STEP_INDEX)
      return
    }
    onStepChange(next)
  }

  function handleConnect(): void {
    if (!chatsVerified) {
      onStepChange(VERIFY_STEP_INDEX)
      return
    }
    onConnect()
  }

  return (
    <div className="space-y-4" data-testid="wa-consumer-guide">
      <div className="flex flex-wrap gap-1.5" role="list" aria-label="İlerleme">
        {GUIDE_PHASES.map((p) => (
          <span
            key={p.id}
            role="listitem"
            className={cn(
              'rounded-md px-2 py-1 text-[10px] font-semibold tracking-wide',
              p.id === phase
                ? 'bg-primary text-primary-fg'
                : p.id < phase
                  ? 'bg-primary/15 text-primary'
                  : 'bg-surface-muted text-ink-subtle'
            )}
          >
            {p.id} — {p.label}
          </span>
        ))}
      </div>

      <SafetyNotice />

      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-2">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-ink-subtle">
            Adım {clamped + 1} / {total}
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_220px] sm:items-start">
          <div>
            {isLast ? (
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">Hazırsınız</p>
            ) : null}
            <h3 className="text-base font-bold text-ink">{step.title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-ink-muted">{step.body}</p>
            {clamped === 0 ? (
              <a
                className="mt-2 inline-block text-xs font-medium text-primary underline-offset-2 hover:underline"
                href={WHATSAPP_HELP_LINKS.faqChatBackup}
                target="_blank"
                rel="noopener noreferrer"
              >
                Resmi yedekleme rehberi
              </a>
            ) : null}
            {clamped === 1 ? (
              <div className="mt-3 flex flex-col gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto min-h-8 w-full justify-start whitespace-normal px-3 py-2 text-left leading-snug sm:w-auto sm:min-w-[16rem]"
                  onClick={() =>
                    window.open(WHATSAPP_HELP_LINKS.playStoreBusiness, '_blank', 'noopener,noreferrer')
                  }
                  data-testid="wa-link-play"
                >
                  Google Play’de WhatsApp Business
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-auto min-h-8 w-full justify-start whitespace-normal px-3 py-2 text-left leading-snug sm:w-auto sm:min-w-[16rem]"
                  onClick={() =>
                    window.open(WHATSAPP_HELP_LINKS.appStoreBusiness, '_blank', 'noopener,noreferrer')
                  }
                  data-testid="wa-link-appstore"
                >
                  App Store’da WhatsApp Business
                </Button>
              </div>
            ) : null}
            {clamped === 3 ? (
              <a
                className="mt-2 inline-block text-xs font-medium text-primary underline-offset-2 hover:underline"
                href={WHATSAPP_HELP_LINKS.faqMoveMessengerToBusiness}
                target="_blank"
                rel="noopener noreferrer"
              >
                Resmi aktarım rehberi
              </a>
            ) : null}
            {isVerifyStep ? (
              <div className="mt-3 space-y-2" data-testid="wa-chats-verify">
                <label className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink">
                  <input
                    type="checkbox"
                    className="mt-0.5 h-4 w-4 shrink-0 rounded border-border text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-50"
                    checked={chatsVerified}
                    onChange={(e) => onChatsVerifiedChange(e.target.checked)}
                    data-testid="wa-chats-verify-checkbox"
                  />
                  <span className="min-w-0 leading-snug">
                    Eski sohbetlerimi WhatsApp Business içinde görüyorum ve mesaj gönderebiliyorum.
                  </span>
                </label>
                <p className="rounded-lg border border-amber-200/80 bg-amber-50/90 px-3 py-2 text-xs leading-relaxed text-amber-950">
                  Sohbetleriniz görünmüyorsa devam etmeyin.{' '}
                  <a
                    className="font-medium text-primary underline-offset-2 hover:underline"
                    href={WHATSAPP_HELP_LINKS.faqMoveMessengerToBusiness}
                    target="_blank"
                    rel="noopener noreferrer"
                    data-testid="wa-chats-verify-transfer-link"
                  >
                    Resmî aktarım rehberini yeniden açın
                  </a>{' '}
                  veya destek alın.
                </p>
              </div>
            ) : null}
          </div>
          <div>{step.illustration}</div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-3">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={clamped === 0}
            onClick={() => requestStepChange(clamped - 1)}
            data-testid="wa-guide-back"
          >
            Geri
          </Button>
          {isLast ? (
            <Button
              type="button"
              disabled={connectBusy || !chatsVerified}
              onClick={handleConnect}
              data-testid="wa-guide-connect"
              title={!chatsVerified ? 'Önce sohbet aktarımını onaylayın' : undefined}
            >
              {connectBusy ? 'Bağlanıyor…' : 'WhatsApp Business’a Geçtim, Bağlantıya Devam Et'}
            </Button>
          ) : (
            <Button
              type="button"
              disabled={isVerifyStep && !canAdvanceFromVerify}
              onClick={() => requestStepChange(clamped + 1)}
              data-testid="wa-guide-next"
              aria-disabled={isVerifyStep && !canAdvanceFromVerify}
              title={
                isVerifyStep && !canAdvanceFromVerify
                  ? 'Devam etmek için sohbet aktarımını onaylayın'
                  : undefined
              }
            >
              İleri
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

type IntroProps = {
  onStartGuide: () => void
  onBack: () => void
}

export function ConsumerIntro(props: IntroProps): ReactElement {
  return (
    <div className="space-y-4" data-testid="wa-consumer-intro">
      <div>
        <h3 className="text-base font-bold text-ink">Önce WhatsApp Business’a geçmeniz gerekiyor</h3>
        <p className="mt-2 text-sm leading-relaxed text-ink-muted">
          Mevcut telefon numaranızı değiştirmeden WhatsApp Business uygulamasına geçebilirsiniz. Geçiş
          tamamlandıktan sonra aynı numarayı Müvekkil Kasa’ya bağlayabilirsiniz.
        </p>
      </div>
      <SafetyNotice />
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={props.onStartGuide} data-testid="wa-start-consumer-guide">
          Geçiş Rehberini Aç
        </Button>
        <Button type="button" variant="ghost" onClick={props.onBack}>
          Geri
        </Button>
      </div>
    </div>
  )
}

type UnsureProps = {
  onConsumer: () => void
  onBusiness: () => void
  onBack: () => void
}

export function UnsureDiagnose(props: UnsureProps): ReactElement {
  return (
    <div className="space-y-3" data-testid="wa-unsure">
      <div>
        <h3 className="text-base font-bold text-ink">Telefonunuzdaki uygulamanın simgesinin altında hangi isim yazıyor?</h3>
        <p className="mt-1 text-sm text-ink-muted">Buna göre sizi doğru adıma yönlendireceğiz.</p>
      </div>
      <div className="space-y-2">
        <ChoiceRow
          data-testid="wa-unsure-messenger"
          title="WhatsApp"
          description="Normal (kişisel) WhatsApp uygulaması"
          onClick={props.onConsumer}
        />
        <ChoiceRow
          data-testid="wa-unsure-business"
          title="WhatsApp Business"
          description="İşletme uygulaması"
          onClick={props.onBusiness}
        />
        <ChoiceRow
          data-testid="wa-unsure-unknown"
          title="Bilmiyorum"
          description="Telefonunuzda kullandığınız WhatsApp uygulamasını açın → Ayarlar. İşletme araçları / Business tools bölümü varsa WhatsApp Business kullanıyorsunuz."
          onClick={props.onConsumer}
        />
      </div>
      <Button type="button" variant="ghost" size="sm" onClick={props.onBack}>
        Geri
      </Button>
    </div>
  )
}
