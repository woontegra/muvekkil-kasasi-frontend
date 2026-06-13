import type { ReactElement } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { APP_BASE } from './config/appPaths'
import { ProtectedLayout } from './layouts/ProtectedLayout'
import { PublicAuthLayout } from './layouts/PublicAuthLayout'
import { AyarlarPage } from './pages/AyarlarPage'
import { MasaustuIceAktarPage } from './pages/MasaustuIceAktarPage'
import { DosyaDetailPage } from './pages/DosyaDetailPage'
import { YeniDosyaPage } from './pages/YeniDosyaPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { MuvekkilDetailPage } from './pages/MuvekkilDetailPage'
import { OfisKasasiPage } from './pages/OfisKasasiPage'
import { KullanicilarPage } from './pages/KullanicilarPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { RegisterOfficePage } from './pages/RegisterOfficePage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { YeniMuvekkilPage } from './pages/YeniMuvekkilPage'

export default function App(): ReactElement {
  return (
    <Routes>
      <Route element={<PublicAuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register-office" element={<RegisterOfficePage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route path={APP_BASE} element={<ProtectedLayout />}>
        <Route index element={<HomePage />} />
        <Route path="muvekkiller/yeni" element={<YeniMuvekkilPage />} />
        <Route path="muvekkil/:id/dosyalar/yeni" element={<YeniDosyaPage />} />
        <Route path="muvekkil/:id/dosya/:dosyaId" element={<DosyaDetailPage />} />
        <Route path="muvekkil/:id" element={<MuvekkilDetailPage />} />
        <Route path="ofis-kasasi" element={<OfisKasasiPage />} />
        <Route path="raporlar" element={<PlaceholderPage title="Raporlar" description="Hesap özeti ve ofis kasası raporları (yazdırma)." />} />
        <Route path="kullanicilar" element={<KullanicilarPage />} />
        <Route path="ayarlar/masaustu-ice-aktar" element={<MasaustuIceAktarPage />} />
        <Route path="ayarlar" element={<AyarlarPage />} />
      </Route>

      <Route path="/" element={<Navigate to={APP_BASE} replace />} />
      <Route path="*" element={<Navigate to={APP_BASE} replace />} />
    </Routes>
  )
}
