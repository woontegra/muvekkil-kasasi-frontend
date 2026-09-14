/**
 * Normal kullanıcı + platform admin route envanteri.
 * Playwright responsive-quality kapısı ve App.tsx sapma kontrolü buradan beslenir.
 *
 * Dinamik parametreli route'lar `resolve` ile oturum sonrası doldurulur.
 */
export type RouteGroup = 'public' | 'app' | 'admin'

export type ResponsiveRouteDef = {
  id: string
  group: RouteGroup
  /** Path şablonu (App.tsx ile aynı) */
  pathPattern: string
  /** Testte gidilecek path; dinamikse resolve gerekir */
  path?: string
  label: string
  /** Dosya detayı sekmeleri gibi alt yüzeyler */
  surfaces?: { id: string; label: string; activate: 'tab' | 'query'; value: string }[]
  /** Auth gerekir */
  auth?: boolean
  /** RoleRoute kısıtı */
  roles?: string[]
  /** Dinamik path — inventory resolve aşamasında doldurulur */
  dynamic?: 'muvekkil' | 'dosya' | 'yeni-dosya'
}

/** App.tsx korumalı /app altı (Navigate hariç). */
export const APP_ROUTE_PATTERNS = [
  '/app',
  '/app/muvekkiller/yeni',
  '/app/muvekkil/:id/dosyalar/yeni',
  '/app/muvekkil/:id/dosya/:dosyaId',
  '/app/muvekkil/:id',
  '/app/randevular',
  '/app/ofis-kasasi',
  '/app/icra-tahsilat',
  '/app/tahsilat-merkezi',
  '/app/bildirim-merkezi',
  '/app/primler',
  '/app/raporlar',
  '/app/kullanicilar',
  '/app/ayarlar/masaustu-ice-aktar',
  '/app/lisans-yenile',
  '/app/ayarlar'
] as const

export const PUBLIC_ROUTE_PATTERNS = [
  '/login',
  '/forgot-password',
  '/reset-password'
] as const

export const ADMIN_ROUTE_PATTERNS = [
  '/admin/login',
  '/admin',
  '/admin/burolar',
  '/admin/burolar/yeni',
  '/admin/burolar/:id',
  '/admin/whatsapp-paket-talepleri',
  '/admin/lisans-uyarilar',
  '/admin/pasif-burolar',
  '/admin/sistem',
  '/admin/ayarlar'
] as const

const DOSYA_TABS = [
  { id: 'kasa', label: 'Kasa Hareketleri', activate: 'tab' as const, value: 'Kasa Hareketleri' },
  { id: 'vekalet', label: 'Anlaşılan vekalet', activate: 'tab' as const, value: 'Anlaşılan vekalet' },
  { id: 'smm', label: 'SMM Takibi', activate: 'tab' as const, value: 'SMM Takibi' },
  { id: 'makbuz', label: 'Makbuzlar', activate: 'tab' as const, value: 'Makbuzlar' },
  { id: 'mali', label: 'Mali Özet', activate: 'tab' as const, value: 'Mali Özet' },
  { id: 'hesap', label: 'Hesap Özeti', activate: 'tab' as const, value: 'Hesap Özeti' },
  { id: 'ekstre', label: 'Müvekkil Ekstresi', activate: 'tab' as const, value: 'Müvekkil Ekstresi' }
]

const AYARLAR_BOLUMLER = [
  'buro',
  'hesap-donemi',
  'whatsapp',
  'whatsapp-sablonlari',
  'kullanici',
  'veri',
  'denetim',
  'lisans',
  'sistem'
]

/** Responsive-quality taramasında gezilecek normal kullanıcı yüzeyleri. */
export const NORMAL_USER_RESPONSIVE_ROUTES: ResponsiveRouteDef[] = [
  { id: 'login', group: 'public', pathPattern: '/login', path: '/login', label: 'Giriş', auth: false },
  {
    id: 'forgot-password',
    group: 'public',
    pathPattern: '/forgot-password',
    path: '/forgot-password',
    label: 'Şifremi unuttum',
    auth: false
  },
  {
    id: 'reset-password',
    group: 'public',
    pathPattern: '/reset-password',
    path: '/reset-password',
    label: 'Şifre sıfırla',
    auth: false
  },
  { id: 'home', group: 'app', pathPattern: '/app', path: '/app', label: 'Dashboard / Müvekkil Kasası', auth: true },
  {
    id: 'muvekkil-yeni',
    group: 'app',
    pathPattern: '/app/muvekkiller/yeni',
    path: '/app/muvekkiller/yeni',
    label: 'Yeni müvekkil',
    auth: true
  },
  {
    id: 'muvekkil-detail',
    group: 'app',
    pathPattern: '/app/muvekkil/:id',
    label: 'Müvekkil detayı',
    auth: true,
    dynamic: 'muvekkil'
  },
  {
    id: 'dosya-yeni',
    group: 'app',
    pathPattern: '/app/muvekkil/:id/dosyalar/yeni',
    label: 'Yeni dosya',
    auth: true,
    dynamic: 'yeni-dosya'
  },
  {
    id: 'dosya-detail',
    group: 'app',
    pathPattern: '/app/muvekkil/:id/dosya/:dosyaId',
    label: 'Dosya detayı',
    auth: true,
    dynamic: 'dosya',
    surfaces: DOSYA_TABS
  },
  { id: 'randevular', group: 'app', pathPattern: '/app/randevular', path: '/app/randevular', label: 'Randevular', auth: true },
  {
    id: 'ofis-kasasi',
    group: 'app',
    pathPattern: '/app/ofis-kasasi',
    path: '/app/ofis-kasasi',
    label: 'Ofis Kasası',
    auth: true
  },
  {
    id: 'icra-tahsilat',
    group: 'app',
    pathPattern: '/app/icra-tahsilat',
    path: '/app/icra-tahsilat',
    label: 'İcra Tahsilat',
    auth: true
  },
  {
    id: 'tahsilat-merkezi',
    group: 'app',
    pathPattern: '/app/tahsilat-merkezi',
    path: '/app/tahsilat-merkezi',
    label: 'Tahsilat Takibi',
    auth: true
  },
  {
    id: 'bildirim-merkezi',
    group: 'app',
    pathPattern: '/app/bildirim-merkezi',
    path: '/app/bildirim-merkezi',
    label: 'Bildirim Merkezi',
    auth: true
  },
  {
    id: 'primler',
    group: 'app',
    pathPattern: '/app/primler',
    path: '/app/primler',
    label: 'Primler',
    auth: true,
    roles: ['BURO_SAHIBI']
  },
  { id: 'raporlar', group: 'app', pathPattern: '/app/raporlar', path: '/app/raporlar', label: 'Raporlar', auth: true },
  {
    id: 'kullanicilar',
    group: 'app',
    pathPattern: '/app/kullanicilar',
    path: '/app/kullanicilar',
    label: 'Kullanıcılar',
    auth: true
  },
  {
    id: 'lisans-yenile',
    group: 'app',
    pathPattern: '/app/lisans-yenile',
    path: '/app/lisans-yenile',
    label: 'Lisans yenile',
    auth: true
  },
  {
    id: 'ayarlar',
    group: 'app',
    pathPattern: '/app/ayarlar',
    path: '/app/ayarlar',
    label: 'Ayarlar',
    auth: true,
    surfaces: AYARLAR_BOLUMLER.map((b) => ({
      id: b,
      label: `Ayarlar · ${b}`,
      activate: 'query' as const,
      value: `bolum=${b}`
    }))
  },
  {
    id: 'ayarlar-masaustu',
    group: 'app',
    pathPattern: '/app/ayarlar/masaustu-ice-aktar',
    path: '/app/ayarlar/masaustu-ice-aktar',
    label: 'Masaüstü içe aktar',
    auth: true
  }
]

/** Platform admin — ayrı grup; normal kullanıcı taramasına karıştırılmaz. */
export const ADMIN_RESPONSIVE_ROUTES: ResponsiveRouteDef[] = [
  { id: 'admin-login', group: 'admin', pathPattern: '/admin/login', path: '/admin/login', label: 'Admin giriş', auth: false },
  { id: 'admin-home', group: 'admin', pathPattern: '/admin', path: '/admin', label: 'Admin dashboard', auth: true },
  {
    id: 'admin-burolar',
    group: 'admin',
    pathPattern: '/admin/burolar',
    path: '/admin/burolar',
    label: 'Admin bürolar',
    auth: true
  },
  {
    id: 'admin-burolar-yeni',
    group: 'admin',
    pathPattern: '/admin/burolar/yeni',
    path: '/admin/burolar/yeni',
    label: 'Admin yeni büro',
    auth: true
  },
  {
    id: 'admin-whatsapp-paket',
    group: 'admin',
    pathPattern: '/admin/whatsapp-paket-talepleri',
    path: '/admin/whatsapp-paket-talepleri',
    label: 'Admin WhatsApp paket talepleri',
    auth: true
  },
  {
    id: 'admin-lisans',
    group: 'admin',
    pathPattern: '/admin/lisans-uyarilar',
    path: '/admin/lisans-uyarilar',
    label: 'Admin lisans uyarıları',
    auth: true
  },
  {
    id: 'admin-pasif',
    group: 'admin',
    pathPattern: '/admin/pasif-burolar',
    path: '/admin/pasif-burolar',
    label: 'Admin pasif bürolar',
    auth: true
  },
  {
    id: 'admin-sistem',
    group: 'admin',
    pathPattern: '/admin/sistem',
    path: '/admin/sistem',
    label: 'Admin süper adminler',
    auth: true
  },
  {
    id: 'admin-ayarlar',
    group: 'admin',
    pathPattern: '/admin/ayarlar',
    path: '/admin/ayarlar',
    label: 'Admin ayarlar',
    auth: true
  }
]

export const REQUIRED_VIEWPORTS = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1536x864', width: 1536, height: 864 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1280x720', width: 1280, height: 720 },
  { name: '1152x720', width: 1152, height: 720 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '390x844', width: 390, height: 844 }
] as const

/** Screenshot matrisi (zorunlu görsel set). */
export const SCREENSHOT_VIEWPORTS = [
  { name: '1920x1080', width: 1920, height: 1080 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1152x720', width: 1152, height: 720 },
  { name: '390x844', width: 390, height: 844 }
] as const
