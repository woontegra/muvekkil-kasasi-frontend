/** Tahsilat merkezi süre etiketi — encoding-safe Turkish copy. */
export function gunFarkiLabel(gun: number): string {
  if (gun < 0) return `${Math.abs(gun)} gün gecikti`
  if (gun === 0) return 'Bugün'
  return `${gun} gün kaldı`
}
