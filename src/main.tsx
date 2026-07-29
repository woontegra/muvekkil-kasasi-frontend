import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import { AdminAuthProvider } from './contexts/AdminAuthContext'
import { AuthProvider } from './contexts/AuthContext'
import { ConfirmProvider } from './components/ui'
import { MotionProvider } from './motion'
import { ToastProvider } from './toast'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false }
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MotionProvider>
          <ToastProvider>
            <ConfirmProvider>
              <AuthProvider>
                <AdminAuthProvider>
                  <App />
                </AdminAuthProvider>
              </AuthProvider>
            </ConfirmProvider>
          </ToastProvider>
        </MotionProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
)
