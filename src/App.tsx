import type { ReactElement } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { APP_BASE } from './config/appPaths'
import { AdminAuthGate } from './layouts/AdminAuthGate'
import { AdminProtectedLayout } from './layouts/AdminProtectedLayout'
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
import { IcraTahsilatPage } from './pages/IcraTahsilatPage'
import { KullanicilarPage } from './pages/KullanicilarPage'
import { PrimlerPage } from './pages/PrimlerPage'
import { ReportsPage } from './pages/ReportsPage'
import { ResetPasswordPage } from './pages/ResetPasswordPage'
import { YeniMuvekkilPage } from './pages/YeniMuvekkilPage'
import { AdminDashboardPage } from './pages/admin/AdminDashboardPage'
import { AdminLicenseAlertsPage } from './pages/admin/AdminLicenseAlertsPage'
import { AdminLoginPage } from './pages/admin/AdminLoginPage'
import { AdminPassiveTenantsPage } from './pages/admin/AdminPassiveTenantsPage'
import { AdminSettingsPage } from './pages/admin/AdminSettingsPage'
import { AdminSuperAdminsPage } from './pages/admin/AdminSuperAdminsPage'
import { AdminTenantDetailPage } from './pages/admin/AdminTenantDetailPage'
import { AdminCreateTenantPage } from './pages/admin/AdminCreateTenantPage'
import { AdminTenantsPage } from './pages/admin/AdminTenantsPage'
import { RoleRoute } from './components/auth/RoleRoute'

export default function App(): ReactElement {
  return (
    <Routes>
      <Route element={<PublicAuthLayout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register-office" element={<Navigate to="/login" replace />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Route>

      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route
        path="/admin"
        element={
          <AdminAuthGate>
            <AdminProtectedLayout />
          </AdminAuthGate>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="burolar/yeni" element={<AdminCreateTenantPage />} />
        <Route path="burolar" element={<AdminTenantsPage />} />
        <Route path="burolar/:id" element={<AdminTenantDetailPage />} />
        <Route path="lisans-uyarilar" element={<AdminLicenseAlertsPage />} />
        <Route path="pasif-burolar" element={<AdminPassiveTenantsPage />} />
        <Route path="sistem" element={<AdminSuperAdminsPage />} />
        <Route path="ayarlar" element={<AdminSettingsPage />} />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Route>

      <Route path={APP_BASE} element={<ProtectedLayout />}>
        <Route index element={<HomePage />} />
        <Route path="muvekkiller/yeni" element={<YeniMuvekkilPage />} />
        <Route path="muvekkil/:id/dosyalar/yeni" element={<YeniDosyaPage />} />
        <Route path="muvekkil/:id/dosya/:dosyaId" element={<DosyaDetailPage />} />
        <Route path="muvekkil/:id" element={<MuvekkilDetailPage />} />
        <Route path="ofis-kasasi" element={<OfisKasasiPage />} />
        <Route path="icra-tahsilat" element={<IcraTahsilatPage />} />
        <Route
          path="primler"
          element={
            <RoleRoute allow={['BURO_SAHIBI']}>
              <PrimlerPage />
            </RoleRoute>
          }
        />
        <Route path="raporlar" element={<ReportsPage />} />
        <Route path="kullanicilar" element={<KullanicilarPage />} />
        <Route path="ayarlar/masaustu-ice-aktar" element={<MasaustuIceAktarPage />} />
        <Route path="ayarlar" element={<AyarlarPage />} />
      </Route>

      <Route path="/" element={<Navigate to={APP_BASE} replace />} />
      <Route path="*" element={<Navigate to={APP_BASE} replace />} />
    </Routes>
  )
}
