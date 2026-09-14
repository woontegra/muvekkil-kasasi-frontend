import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
  type FocusEvent,
  type KeyboardEvent,
  type ReactElement
} from 'react'
import { cn } from '../../lib/cn'
import { formControlClass, formControlErrorClass, uiType } from '../../lib/uiDensity'
import {
  formatCurrencyInputTR,
  formatMoneyTypingTR,
  moneyCaretFromSignificant,
  moneySignificantCount,
  normalizeMoneyPasteTR,
  parseCurrencyInputTR
} from '../../utils/formatters'

type Props = {
  id?: string
  name?: string
  label?: string
  hint?: string
  error?: string
  className?: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  readOnly?: boolean
  placeholder?: string
  /** true ise blur'da 0,00 da formatlanır */
  allowZero?: boolean
  /** Düzeltme vb. için negatif tutara izin ver */
  allowNegative?: boolean
  /** Üst sınır (fixed-2 string veya number). Aşılınca input bu değere sabitlenir. */
  maxValue?: number | string
  'aria-label'?: string
}

/** fixed-2 API string veya number → karşılaştırma için kuruş (Number float kullanmadan). */
function maxValueToCents(maxValue: number | string | undefined): number | null {
  if (maxValue == null) return null
  if (typeof maxValue === 'string') {
    const s = maxValue.trim()
    if (!/^-?\d+(\.\d{1,2})?$/.test(s)) return null
    const neg = s.startsWith('-')
    const body = neg ? s.slice(1) : s
    const [i, f = ''] = body.split('.')
    const cents = Number.parseInt(i, 10) * 100 + Number.parseInt(`${f}00`.slice(0, 2), 10)
    return neg ? -cents : cents
  }
  if (!Number.isFinite(maxValue)) return null
  return Math.round(maxValue * 100)
}

function applyMax(formatted: string, maxValue: number | string | undefined): string {
  const maxCents = maxValueToCents(maxValue)
  if (maxCents == null) return formatted
  if (!formatted.trim()) return formatted
  const n = parseCurrencyInputTR(formatted)
  if (n == null) return formatted
  const nCents = Math.round(n * 100)
  if (nCents <= maxCents) return formatted
  const abs = Math.abs(maxCents)
  const intPart = Math.floor(abs / 100)
  const frac = String(abs % 100).padStart(2, '0')
  const sign = maxCents < 0 ? '-' : ''
  return formatMoneyTypingTR(`${sign}${intPart},${frac}`)
}

/**
 * Para alanı: yazarken canlı TR binlik formatı, blur'da iki ondalık.
 * Odak varken değer draft'ta tutulur; parent re-render yazmayı ezmez.
 */
export function MoneyInput(props: Props): ReactElement {
  const {
    id,
    name,
    label,
    hint,
    error,
    className,
    value,
    onChange,
    disabled,
    readOnly,
    placeholder = '0,00',
    allowZero = false,
    allowNegative = false,
    maxValue,
    'aria-label': ariaLabel
  } = props

  const inputId = id ?? name
  const inputRef = useRef<HTMLInputElement>(null)
  const focusedRef = useRef(false)
  const [draft, setDraft] = useState(value)
  const pendingCaretRef = useRef<number | null>(null)

  useEffect(() => {
    if (!focusedRef.current) setDraft(value)
  }, [value])

  // Caret, React DOM'u güncelledikten sonra uygulanır (silmede öne atlamayı önler)
  useLayoutEffect(() => {
    const caret = pendingCaretRef.current
    if (caret == null) return
    const el = inputRef.current
    if (!el || document.activeElement !== el) {
      pendingCaretRef.current = null
      return
    }
    const pos = Math.max(0, Math.min(caret, el.value.length))
    try {
      el.setSelectionRange(pos, pos)
    } catch {
      /* ignore */
    }
    pendingCaretRef.current = null
  }, [draft])

  function commitTyping(raw: string, caretInRaw: number): void {
    let nextRaw = raw
    let caret = caretInRaw
    if (!allowNegative) {
      const cleaned = nextRaw.replace(/-/g, '')
      if (cleaned.length !== nextRaw.length) {
        const removedBefore = (nextRaw.slice(0, caretInRaw).match(/-/g) ?? []).length
        caret = Math.max(0, caretInRaw - removedBefore)
        nextRaw = cleaned
      }
    } else if (nextRaw.includes('-')) {
      // Eksi nerede yazılırsa yazılsın başa alınır (ör. 1500- → -1500)
      const body = nextRaw.replace(/-/g, '')
      const digitsBeforeCaret = moneySignificantCount(raw.replace(/-/g, ''), caretInRaw)
      nextRaw = `-${body}`
      caret = moneyCaretFromSignificant(nextRaw, digitsBeforeCaret + 1)
    }

    const significant = moneySignificantCount(nextRaw, caret)
    let formatted = formatMoneyTypingTR(nextRaw)
    const beforeClamp = formatted
    formatted = applyMax(formatted, maxValue)
    let nextCaret =
      formatted === beforeClamp ? moneyCaretFromSignificant(formatted, significant) : formatted.length
    if (formatted === '-' && nextCaret < 1) nextCaret = 1

    pendingCaretRef.current = nextCaret
    setDraft(formatted)
    onChange(formatted)
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>): void {
    const el = e.target
    commitTyping(el.value, el.selectionStart ?? el.value.length)
  }

  function handlePaste(e: ClipboardEvent<HTMLInputElement>): void {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text')
    const start = e.currentTarget.selectionStart ?? draft.length
    const end = e.currentTarget.selectionEnd ?? draft.length
    const merged = draft.slice(0, start) + pasted + draft.slice(end)
    const normalized = normalizeMoneyPasteTR(merged)
    // normalizeMoneyPasteTR baştaki eksiye bakar; sonda/ortada eksi varsa düzelt
    const wantsNeg = allowNegative && (merged.includes('-') || merged.includes('−'))
    const withSign =
      wantsNeg && normalized && !normalized.startsWith('-')
        ? `-${normalized}`
        : wantsNeg && !normalized
          ? '-'
          : !allowNegative
            ? normalized.replace(/-/g, '')
            : normalized
    commitTyping(withSign, withSign.length)
  }

  function handleKeyDown(e: KeyboardEvent<HTMLInputElement>): void {
    if (e.key !== 'Backspace') return
    const start = e.currentTarget.selectionStart ?? 0
    const end = e.currentTarget.selectionEnd ?? 0
    if (start !== end || start === 0) return
    if (draft[start - 1] !== '.') return
    e.preventDefault()
    const withoutDot = draft.slice(0, start - 1) + draft.slice(start)
    let cut = start - 1
    if (cut > 0 && /\d/.test(withoutDot[cut - 1] ?? '')) {
      const next = withoutDot.slice(0, cut - 1) + withoutDot.slice(cut)
      commitTyping(next, cut - 1)
    } else {
      commitTyping(withoutDot, cut)
    }
  }

  function handleBlur(_e: FocusEvent<HTMLInputElement>): void {
    focusedRef.current = false
    pendingCaretRef.current = null
    const trimmed = draft.trim()
    if (!trimmed || trimmed === '-') {
      setDraft('')
      onChange('')
      return
    }
    let n = parseCurrencyInputTR(trimmed)
    if (n == null) return
    if (!allowNegative && n < 0) {
      setDraft('')
      onChange('')
      return
    }
    if (!allowZero && n === 0) {
      setDraft('')
      onChange('')
      return
    }
    if (!allowZero && !allowNegative && n <= 0) {
      setDraft('')
      onChange('')
      return
    }
    if (maxValue != null) {
      const maxCents = maxValueToCents(maxValue)
      if (maxCents != null && Math.round(n * 100) > maxCents) {
        n = maxCents / 100
      }
    }
    const pretty = formatCurrencyInputTR(n)
    setDraft(pretty)
    onChange(pretty)
  }

  function handleFocus(e: FocusEvent<HTMLInputElement>): void {
    focusedRef.current = true
    setDraft(value)
    const n = parseCurrencyInputTR(value)
    if (n != null && (allowZero || n !== 0) && /,\d{2}$/.test(value.trim())) {
      e.target.select()
    }
  }

  return (
    <div className="w-full">
      {label ? (
        <label htmlFor={inputId} className={uiType.label}>
          {label}
        </label>
      ) : null}
      <input
        ref={inputRef}
        id={inputId}
        name={name}
        type="text"
        inputMode={allowNegative ? 'text' : 'decimal'}
        autoComplete="off"
        spellCheck={false}
        className={cn(formControlClass, 'tabular-nums', error && formControlErrorClass, className)}
        value={draft}
        onChange={handleChange}
        onPaste={handlePaste}
        onKeyDown={handleKeyDown}
        onBlur={handleBlur}
        onFocus={handleFocus}
        disabled={disabled}
        readOnly={readOnly}
        placeholder={placeholder}
        aria-label={ariaLabel}
      />
      {error ? <p className={cn(uiType.hint, 'text-danger')}>{error}</p> : null}
      {!error && hint ? <p className={uiType.hint}>{hint}</p> : null}
    </div>
  )
}
