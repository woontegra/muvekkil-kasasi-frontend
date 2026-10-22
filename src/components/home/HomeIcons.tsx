import type { ReactElement, ReactNode } from 'react'
import { cn } from '../../lib/cn'

/** Kart/bölüm ikon kabarcıkları (yalnız dekoratif). */
export type HomeIconTone = 'red' | 'amber' | 'violet' | 'green' | 'blue' | 'teal'

const bubbleTone: Record<HomeIconTone, string> = {
  red: 'bg-[#fde7e6] text-[#e5484d]',
  amber: 'bg-[#fdf0d5] text-[#dc8a14]',
  violet: 'bg-[#eee8fd] text-[#7a5af0]',
  green: 'bg-[#dcf5e8] text-[#16a565]',
  blue: 'bg-[#e3ecfe] text-[#3a6df0]',
  teal: 'bg-[#d9f4ea] text-[#12a172]'
}

export function HomeIconBubble({
  tone,
  children,
  size = 'md',
  className
}: {
  tone: HomeIconTone
  children: ReactNode
  size?: 'sm' | 'md'
  className?: string
}): ReactElement {
  return (
    <span
      aria-hidden
      className={cn(
        'flex shrink-0 items-center justify-center',
        size === 'md' ? 'h-9 w-9 rounded-[10px]' : 'h-7 w-7 rounded-lg',
        bubbleTone[tone],
        className
      )}
    >
      {children}
    </span>
  )
}

function Svg({ children, className }: { children: ReactNode; className?: string }): ReactElement {
  return (
    <svg className={className ?? 'h-[18px] w-[18px]'} viewBox="0 0 24 24" fill="none" aria-hidden>
      {children}
    </svg>
  )
}

const stroke = { stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
const onFill = { stroke: '#ffffff', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const

export const HomeIcons = {
  clock: (className?: string) => (
    <Svg className={className}>
      <circle cx="12" cy="12" r="9" fill="currentColor" />
      <path d="M12 7.5V12l3 2" {...onFill} />
    </Svg>
  ),
  calendar: (className?: string) => (
    <Svg className={className}>
      <rect x="3.5" y="5" width="17" height="15.5" rx="2.5" {...stroke} />
      <path d="M8 3v4M16 3v4M3.5 10h17" {...stroke} />
      <path d="M8.5 14h2M13.5 14h2M8.5 17h2" {...stroke} />
    </Svg>
  ),
  document: (className?: string) => (
    <Svg className={className}>
      <path d="M6 2.5h8l4.5 4.5v13a1.5 1.5 0 0 1-1.5 1.5H6A1.5 1.5 0 0 1 4.5 20V4A1.5 1.5 0 0 1 6 2.5z" fill="currentColor" />
      <path d="M8.5 12h7M8.5 15.5h7M8.5 8.5h3" {...onFill} />
    </Svg>
  ),
  checkCircle: (className?: string) => (
    <Svg className={className}>
      <circle cx="12" cy="12" r="9" fill="currentColor" />
      <path d="M8 12.3l2.7 2.7L16 9.6" {...onFill} />
    </Svg>
  ),
  bank: (className?: string) => (
    <Svg className={className}>
      <path d="M3 9.5L12 4l9 5.5H3z" fill="currentColor" />
      <path d="M5.5 11.5v6M9.8 11.5v6M14.2 11.5v6M18.5 11.5v6M3 20.5h18" {...stroke} />
    </Svg>
  ),
  users: (className?: string) => (
    <Svg className={className}>
      <circle cx="9" cy="8" r="3.5" {...stroke} />
      <path d="M2.5 20v-1a5 5 0 0 1 5-5h3a5 5 0 0 1 5 5v1" {...stroke} />
      <path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.2A5 5 0 0 1 21.5 19v1" {...stroke} />
    </Svg>
  ),
  user: (className?: string) => (
    <Svg className={className}>
      <circle cx="12" cy="8" r="4" fill="currentColor" />
      <path d="M4 21a8 8 0 0 1 16 0z" fill="currentColor" />
    </Svg>
  ),
  folder: (className?: string) => (
    <Svg className={className}>
      <path d="M3 6.5A1.5 1.5 0 0 1 4.5 5h4.6l2 2.2h8.4A1.5 1.5 0 0 1 21 8.7v9.8a1.5 1.5 0 0 1-1.5 1.5h-15A1.5 1.5 0 0 1 3 18.5z" fill="currentColor" />
    </Svg>
  ),
  register: (className?: string) => (
    <Svg className={className}>
      <path d="M6 4h12v5H6z" fill="currentColor" />
      <rect x="3" y="10" width="18" height="10" rx="2" fill="currentColor" />
      <path d="M7 14h2M11 14h2M15 14h2M7 17h10" {...onFill} />
    </Svg>
  ),
  warning: (className?: string) => (
    <Svg className={className}>
      <path d="M10.3 3.9L2.2 18a2 2 0 0 0 1.7 3h16.2a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z" fill="currentColor" />
      <path d="M12 9.5v4M12 17h.01" {...onFill} />
    </Svg>
  ),
  checklist: (className?: string) => (
    <Svg className={className}>
      <rect x="4" y="3.5" width="16" height="17" rx="2.5" fill="currentColor" />
      <path d="M8 9h8M8 12.5h8M8 16h5" {...onFill} />
    </Svg>
  ),
  shield: (className?: string) => (
    <Svg className={className}>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" fill="currentColor" />
    </Svg>
  )
} as const
