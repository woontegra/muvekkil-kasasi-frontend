export type WhatsappUsageChoice = 'consumer' | 'business' | 'new_number' | 'unsure'

export type OnboardingView =
  | 'chooser'
  | 'help_hub'
  | 'unsure'
  | 'consumer_intro'
  | 'consumer_guide'
  | 'business_info'
  | 'new_number_info'
  | 'recovery'

export type GuidePhaseId = 1 | 2 | 3 | 4

export const GUIDE_PHASES: ReadonlyArray<{ id: GuidePhaseId; label: string }> = [
  { id: 1, label: 'Hazırlık' },
  { id: 2, label: 'WhatsApp Business' },
  { id: 3, label: 'Aktarım' },
  { id: 4, label: 'Müvekkil Kasa' }
]

export function phaseForGuideStep(stepIndex: number): GuidePhaseId {
  if (stepIndex <= 0) return 1
  if (stepIndex <= 2) return 2
  if (stepIndex <= 4) return 3
  return 4
}
