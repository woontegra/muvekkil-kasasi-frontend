import type { ButtonHTMLAttributes, ReactElement, ReactNode } from 'react'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost'
  children: ReactNode
}

export function PremiumButton({
  variant = 'primary',
  className = '',
  children,
  type = 'button',
  ...rest
}: Props & { type?: 'button' | 'submit' | 'reset' }): ReactElement {
  const cls = `pm-btn pm-btn--${variant}${className ? ` ${className}` : ''}`
  return (
    <button type={type} className={cls} {...rest}>
      {children}
    </button>
  )
}
