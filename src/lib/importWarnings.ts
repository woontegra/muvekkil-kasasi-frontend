/** İçe aktarma uyarılarını kullanıcı diline yaklaştırır (teknik özet korunur). */
export function humanizeImportWarning(text: string): string {
  const t = text.trim()
  if (/office_settings:\s*aktarılmayan\s*sütunlar:/i.test(t)) {
    const parts = t.split(/aktarılmayan\s*sütunlar:\s*/i)
    const detail = parts[1]?.trim()
    const base =
      'Bazı masaüstü ofis ayarları SaaS tarafında henüz kullanılmadığı için aktarılmadı.'
    return detail ? `${base} (${detail})` : base
  }
  return t
}
