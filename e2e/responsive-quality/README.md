# Responsive route inventory

## Normal kullanıcı (tarama kapsamı)

| ID | Path | Not |
|---|---|---|
| login | `/login` | public |
| forgot-password | `/forgot-password` | public |
| reset-password | `/reset-password` | public |
| home | `/app` | Dashboard + müvekkil listesi |
| muvekkil-yeni | `/app/muvekkiller/yeni` | |
| muvekkil-detail | `/app/muvekkil/:id` | dinamik |
| dosya-yeni | `/app/muvekkil/:id/dosyalar/yeni` | dinamik |
| dosya-detail | `/app/muvekkil/:id/dosya/:dosyaId` | sekmeler: kasa, vekalet, smm, makbuz, mali, hesap, ekstre |
| randevular | `/app/randevular` | |
| ofis-kasasi | `/app/ofis-kasasi` | |
| icra-tahsilat | `/app/icra-tahsilat` | |
| tahsilat-merkezi | `/app/tahsilat-merkezi` | |
| bildirim-merkezi | `/app/bildirim-merkezi` | |
| primler | `/app/primler` | BURO_SAHIBI |
| raporlar | `/app/raporlar` | |
| kullanicilar | `/app/kullanicilar` | |
| lisans-yenile | `/app/lisans-yenile` | |
| ayarlar | `/app/ayarlar?bolum=*` | 9 bölüm |
| ayarlar-masaustu | `/app/ayarlar/masaustu-ice-aktar` | |

Kaynak: `e2e/responsive-quality/inventory.ts` ↔ `src/App.tsx`

## Platform admin (ayrı grup — normal tarama dışı)

`/admin/login`, `/admin`, `/admin/burolar`, `/admin/burolar/yeni`, `/admin/burolar/:id`,
`/admin/whatsapp-paket-talepleri`, `/admin/lisans-uyarilar`, `/admin/pasif-burolar`,
`/admin/sistem`, `/admin/ayarlar`

## Viewport matrisi

1920×1080 · 1536×864 · 1440×900 · 1366×768 · 1280×720 · **1152×720** · 1024×768 · 768×1024 · 390×844

## Komut

```bash
npm run test:responsive-quality
```

Rapor: `tmp-responsive-quality/responsive-quality-report.{json,md,html}`
