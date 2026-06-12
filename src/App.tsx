import type { ReactElement } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { APP_BASE } from './config/appPaths'
import { ProtectedLayout } from './layouts/ProtectedLayout'
import { PublicAuthLayout } from './layouts/PublicAuthLayout'
import { DosyaDetailPage } from './pages/DosyaDetailPage'
import { HomePage } from './pages/HomePage'
import { LoginPage } from './pages/LoginPage'
import { MuvekkilDetailPage } from './pages/MuvekkilDetailPage'
import { PlaceholderPage } from './pages/PlaceholderPage'
import { RegisterOfficePage } from './pages/RegisterOfficePage'

export default function App(): ReactElement {
  return (
    <Routes>
      <Route element={<PublicAuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register-office" element={<RegisterOfficePage />} />
      </Route>

      <Route path={APP_BASE} element={<ProtectedLayout />}>
        <Route index element={<HomePage />} />
        <Route path="muvekkil/:id" element={<MuvekkilDetailPage />} />
        <Route path="muvekkil/:id/dosya/:dosyaId" element={<DosyaDetailPage />} />
        <Route
          path="ofis-kasasi"
          element={<PlaceholderPage title="Ofis Kasası" description="Müvekkil dosya kasasından ayrı ofis geneli hareketler." />}
        />
        <Route path="raporlar" element={<PlaceholderPage title="Raporlar" description="Hesap özeti ve ofis kasası raporları (yazdırma)." />} />
        <Route path="kullanicilar" element={<PlaceholderPage title="Kullanıcılar" description="Büro sahibi tarafından kullanıcı oluşturma ve roller." />} />
        <Route path="ayarlar" element={<PlaceholderPage title="Ayarlar" description="Ofis bilgileri ve sistem ayarları." />} />
      </Route>

      <Route path="/" element={<Navigate to={APP_BASE} replace />} />
      <Route path="*" element={<Navigate to={APP_BASE} replace />} />
    </Routes>
  )
}
