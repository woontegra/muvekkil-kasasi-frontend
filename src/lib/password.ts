/** Okunabilir güçlü şifre: O/0, l/1 gibi karışık çiftler yok. */

const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
const LOWER = 'abcdefghijkmnopqrstuvwxyz'
const DIGITS = '23456789'
const SPECIAL = '#@%*+-='
const ALL = UPPER + LOWER + DIGITS + SPECIAL

export const PASSWORD_MIN_LENGTH = 8

/** Otomatik üretilen şifre uzunluğu (14–16). */
export const GENERATED_PASSWORD_MIN = 14
export const GENERATED_PASSWORD_MAX = 16

function randomUint32(): number {
  const buf = new Uint32Array(1)
  crypto.getRandomValues(buf)
  return buf[0]!
}

function pickFrom(pool: string): string {
  const i = randomUint32() % pool.length
  return pool[i]!
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = randomUint32() % (i + 1)
    ;[a[i], a[j]] = [a[j]!, a[i]!]
  }
  return a
}

/**
 * En az bir büyük, bir küçük, bir rakam, bir özel karakter içeren 14–16 karakterlik şifre üretir.
 */
export function generateStrongPassword(): string {
  const targetLen = GENERATED_PASSWORD_MIN + (randomUint32() % (GENERATED_PASSWORD_MAX - GENERATED_PASSWORD_MIN + 1))
  const chars: string[] = [pickFrom(UPPER), pickFrom(LOWER), pickFrom(DIGITS), pickFrom(SPECIAL)]
  while (chars.length < targetLen) {
    chars.push(pickFrom(ALL))
  }
  return shuffle(chars).join('')
}
