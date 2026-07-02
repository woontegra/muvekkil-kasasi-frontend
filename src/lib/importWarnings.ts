/** İçe aktarma uyarılarını kullanıcı diline yaklaştırır. */
export function humanizeImportWarning(text: string): string {
  const t = text.trim()

  if (/Belge no çakışması/i.test(t) || /IMP-[\w-]*-EMPTY/i.test(t)) {
    return 'Bazı belge numaraları mevcut kayıtlarla çakıştığı veya boş olduğu için yeniden üretildi.'
  }

  if (/office_settings:\s*aktarılmayan\s*sütunlar:/i.test(t)) {
    return 'Bazı ofis ayarları SaaS\'ta karşılığı olmadığı için aktarılmadı.'
  }

  if (/Bazı masaüstü ofis ayarları SaaS tarafında henüz kullanılmadığı/i.test(t)) {
    return t.replace(/\s*\([^)]+\)\s*$/, '').trim() || 'Bazı ofis ayarları SaaS\'ta karşılığı olmadığı için aktarılmadı.'
  }

  if (/Belge no çakışma riski/i.test(t)) {
    return t.replace(/^Belge no çakışma riski \(mevcut SaaS kayıtlarıyla örtüşen\):/i, 'Mevcut kayıtlarla çakışabilecek belge numaraları:')
  }

  return t
}
