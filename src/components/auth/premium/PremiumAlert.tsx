import type { ReactElement, ReactNode } from 'react'

type Props = {
  children: ReactNode
  tone?: 'error' | 'success' | 'info'
}

export function PremiumAlert({ children, tone = 'info' }: Props): ReactElement {
  const role = tone === 'error' ? 'alert' : 'status'
  return (
    <div className={`pm-alert pm-alert--${tone} pm-alert--enter`} role={role}>
      {children}
    </div>
  )
}
