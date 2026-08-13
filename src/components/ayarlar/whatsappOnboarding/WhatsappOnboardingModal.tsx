import type { ReactElement } from 'react'
import { useEffect, useState } from 'react'
import { ModalScrim, Button } from '../../ui'
import { ChoiceRow } from './ChoiceRow'
import {
  ConsumerIntro,
  ConsumerToBusinessGuide,
  UnsureDiagnose
} from './ConsumerToBusinessGuide'
import type { OnboardingView } from './types'
import { WHATSAPP_HELP_LINKS } from '../../../config/whatsappHelpLinks'

export type WhatsappOnboardingOpenMode = 'connect' | 'guide' | 'consumer_guide' | 'recovery'

type Props = {
  open: boolean
  mode: WhatsappOnboardingOpenMode
  onClose: () => void
  /** Embedded Signup’ı başlatır (Meta popup). */
  onStartEmbeddedSignup: () => void | Promise<void>
  connectBusy?: boolean
}

function initialView(mode: WhatsappOnboardingOpenMode): OnboardingView {
  if (mode === 'guide') return 'help_hub'
  if (mode === 'consumer_guide') return 'consumer_guide'
  if (mode === 'recovery') return 'recovery'
  return 'chooser'
}

function viewTitle(view: OnboardingView): string {
  switch (view) {
    case 'chooser':
      return 'WhatsApp Numaranızı Bağlayalım'
    case 'help_hub':
      return 'WhatsApp Kurulum Rehberi'
    case 'unsure':
      return 'Hangisini kullanıyorsunuz?'
    case 'consumer_intro':
    case 'consumer_guide':
      return 'Normal WhatsApp → Business'
    case 'business_info':
      return 'WhatsApp Business bağlantısı'
    case 'new_number_info':
      return 'Yeni numara bağlantısı'
    case 'recovery':
      return 'Bu numara henüz WhatsApp Business’a hazır değil'
    default:
      return 'WhatsApp bağlantısı'
  }
}

export function WhatsappOnboardingModal(props: Props): ReactElement | null {
  const { open, mode, onClose, onStartEmbeddedSignup, connectBusy } = props
  const [view, setView] = useState<OnboardingView>(() => initialView(mode))
  const [guideStep, setGuideStep] = useState(0)

  useEffect(() => {
    if (!open) return
    setView(initialView(mode))
    setGuideStep(mode === 'consumer_guide' || mode === 'recovery' ? 0 : 0)
  }, [open, mode])

  if (!open) return null

  async function startConnect(): Promise<void> {
    onClose()
    await onStartEmbeddedSignup()
  }

  function goChooser(): void {
    setView('chooser')
    setGuideStep(0)
  }

  return (
    <ModalScrim onClose={onClose} innerAsDialog zIndexClass="z-[110]">
      <div
        data-testid="wa-onboarding-modal"
        className="mx-auto max-h-[min(90vh,760px)] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-white p-5 shadow-xl dark:bg-surface-elevated"
      >
        <div data-modal-drag-handle className="mb-4 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h2 className="text-base font-bold text-ink">{viewTitle(view)}</h2>
            {view === 'chooser' ? (
              <p className="mt-1 text-sm text-ink-muted">
                Size uygun bağlantı yöntemini belirlemek için telefon numaranızı şu anda nasıl
                kullandığınızı seçin.
              </p>
            ) : null}
          </div>
          <Button type="button" variant="ghost" size="sm" className="h-8 shrink-0" onClick={onClose} aria-label="Kapat">
            ✕
          </Button>
        </div>

        {view === 'chooser' ? (
          <div className="space-y-2" data-testid="wa-onboarding-chooser">
            <ChoiceRow
              data-testid="wa-choice-consumer"
              title="Normal WhatsApp kullanıyorum"
              description="Kişisel WhatsApp uygulaması"
              onClick={() => setView('consumer_intro')}
            />
            <ChoiceRow
              data-testid="wa-choice-business"
              title="WhatsApp Business kullanıyorum"
              description="Telefonumda Business uygulaması var"
              onClick={() => setView('business_info')}
            />
            <ChoiceRow
              data-testid="wa-choice-new"
              title="Yeni / kullanılmayan bir numara bağlayacağım"
              description="Bu numara henüz WhatsApp’ta kayıtlı değil"
              onClick={() => setView('new_number_info')}
            />
            <ChoiceRow
              data-testid="wa-choice-unsure"
              title="Emin değilim"
              description="Kısa bir soruyla birlikte seçelim"
              onClick={() => setView('unsure')}
            />
          </div>
        ) : null}

        {view === 'help_hub' ? (
          <div className="space-y-2" data-testid="wa-help-hub">
            <p className="mb-2 text-sm text-ink-muted">Nasıl yardımcı olalım?</p>
            <ChoiceRow
              data-testid="wa-help-chooser"
              title="Bağlantı yöntemini seç"
              description="Normal / Business / yeni numara"
              onClick={goChooser}
            />
            <ChoiceRow
              data-testid="wa-help-consumer"
              title="Normal WhatsApp’tan Business’a Geçiş"
              onClick={() => {
                setGuideStep(0)
                setView('consumer_guide')
              }}
            />
            <ChoiceRow
              data-testid="wa-help-business"
              title="WhatsApp Business ile bağlan"
              onClick={() => setView('business_info')}
            />
            <ChoiceRow
              data-testid="wa-help-retry"
              title="Bağlantıyı Tekrar Dene"
              onClick={() => void startConnect()}
            />
            <a
              className="mt-2 inline-block text-xs font-medium text-primary underline-offset-2 hover:underline"
              href={WHATSAPP_HELP_LINKS.faqDownloadBusiness}
              target="_blank"
              rel="noopener noreferrer"
            >
              WhatsApp resmi indirme rehberi
            </a>
          </div>
        ) : null}

        {view === 'unsure' ? (
          <UnsureDiagnose
            onConsumer={() => setView('consumer_intro')}
            onBusiness={() => setView('business_info')}
            onBack={goChooser}
          />
        ) : null}

        {view === 'consumer_intro' ? (
          <ConsumerIntro onStartGuide={() => { setGuideStep(0); setView('consumer_guide') }} onBack={goChooser} />
        ) : null}

        {view === 'consumer_guide' ? (
          <ConsumerToBusinessGuide
            stepIndex={guideStep}
            onStepChange={setGuideStep}
            connectBusy={connectBusy}
            onConnect={() => void startConnect()}
          />
        ) : null}

        {view === 'business_info' ? (
          <div className="space-y-4" data-testid="wa-business-info">
            <p className="text-sm leading-relaxed text-ink-muted">
              Mevcut WhatsApp Business numaranızı Müvekkil Kasa’ya bağlayabilirsiniz. Telefonunuzdaki
              WhatsApp Business uygulamasını kullanmaya devam edebilirsiniz.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={connectBusy} onClick={() => void startConnect()} data-testid="wa-business-connect">
                {connectBusy ? 'Bağlanıyor…' : 'Bağlantıya Devam Et'}
              </Button>
              <Button type="button" variant="ghost" onClick={goChooser}>
                Geri
              </Button>
            </div>
          </div>
        ) : null}

        {view === 'new_number_info' ? (
          <div className="space-y-4" data-testid="wa-new-number-info">
            <p className="text-sm leading-relaxed text-ink-muted">
              Bu numara mevcut bir WhatsApp hesabında kullanılmıyorsa doğrudan bağlantıya devam
              edebilirsiniz.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button type="button" disabled={connectBusy} onClick={() => void startConnect()} data-testid="wa-new-connect">
                {connectBusy ? 'Bağlanıyor…' : 'Bağlantıya Devam Et'}
              </Button>
              <Button type="button" variant="ghost" onClick={goChooser}>
                Geri
              </Button>
            </div>
          </div>
        ) : null}

        {view === 'recovery' ? (
          <div className="space-y-4" data-testid="wa-signup-recovery">
            <p className="text-sm leading-relaxed text-ink-muted">
              Telefon numaranız normal WhatsApp uygulamasında kullanılıyor olabilir. Aynı numarayla
              WhatsApp Business’a geçtikten sonra tekrar deneyebilirsiniz.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => {
                  setGuideStep(0)
                  setView('consumer_guide')
                }}
                data-testid="wa-recovery-guide"
              >
                Geçiş Rehberini Aç
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={connectBusy}
                onClick={() => void startConnect()}
                data-testid="wa-recovery-retry"
              >
                Tekrar Dene
              </Button>
              <Button type="button" variant="ghost" onClick={onClose}>
                Kapat
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </ModalScrim>
  )
}
