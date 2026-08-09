import type { InputHTMLAttributes, ReactElement } from 'react'

type Props = InputHTMLAttributes<HTMLInputElement>

export function PremiumTextInput({ className = '', ...rest }: Props): ReactElement {
  return <input className={`pm-input${className ? ` ${className}` : ''}`} {...rest} />
}
