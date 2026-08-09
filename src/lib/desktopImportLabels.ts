export const DESKTOP_IMPORT_COUNT_LABELS: Record<string, string> = {
  muvekkil: 'Müvekkil',
  dosya: 'Dosya',
  dosya_kasa_hareket: 'Dosya kasa',
  anlasilan_vekalet_ucreti: 'Vekalet ücreti',
  vekalet_ucreti_taksit: 'Vekalet taksiti',
  ofis_kasa_hareketleri: 'Ofis kasası',
  office_settings: 'Ofis ayarları'
}

export function formatDesktopImportCountKey(key: string): string {
  return DESKTOP_IMPORT_COUNT_LABELS[key] ?? key
}
