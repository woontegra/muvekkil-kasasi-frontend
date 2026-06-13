/** Tarayıcıda güçlü rastgele şifre (min. 8, harf+rakam+sembol). */
export function generateStrongPassword(length = 16): string {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ'
  const lower = 'abcdefghijkmnopqrstuvwxyz'
  const nums = '23456789'
  const special = '@#$%&*!?'
  const all = upper + lower + nums + special
  const buf = new Uint8Array(Math.max(length, 8))
  crypto.getRandomValues(buf)
  let out = ''
  out += upper[buf[0]! % upper.length]
  out += lower[buf[1]! % lower.length]
  out += nums[buf[2]! % nums.length]
  out += special[buf[3]! % special.length]
  for (let i = 4; i < buf.length; i++) {
    out += all[buf[i]! % all.length]
  }
  return out
}
