import { Suspense, lazy } from 'react'
import { Route, Routes } from 'react-router-dom'
import { SWRConfig } from 'swr'
import axios from 'axios'

import MainLayout from './layouts/MainLayout'
import LoadingSpinner from './components/ui/LoadingSpinner'
import { AuthProvider } from './context/AuthContext'
import { OfflineProvider } from './context/OfflineContext'
import LoginPage from './pages/auth/LoginPage'
import NotFoundPage from './pages/NotFoundPage'
import ProtectedRoute from './components/auth/ProtectedRoute'

// Lazy load pages for better performance
const DashboardPage = lazy(() => import('./pages/DashboardPage'))
const TemplatesListPage = lazy(() => import('./pages/templates/TemplatesListPage'))
const TemplateDetailPage = lazy(() => import('./pages/templates/TemplateDetailPage'))
const TemplateEditorPage = lazy(() => import('./pages/templates/TemplateEditorPage'))
const ChecklistsListPage = lazy(() => import('./pages/checklists/ChecklistsListPage'))
const ChecklistDetailPage = lazy(() => import('./pages/checklists/ChecklistDetailPage'))
const ChecklistExecutionPage = lazy(() => import('./pages/checklists/ChecklistExecutionPage'))
const ProfilePage = lazy(() => import('./pages/auth/ProfilePage'))
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'))
const AdminPage = lazy(() => import('./pages/admin/AdminPage'))

// Create axios instance with base URL
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
})

function App() {
  return (
    <SWRConfig
      value={{
        fetcher: (url: string) => apiClient.get(url).then(res => res.data),
        revalidateOnFocus: false,
        shouldRetryOnError: false,
      }}
    >
      <AuthProvider>
        <OfflineProvider>
          <Suspense fallback={<LoadingSpinner fullScreen />}>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route index element={<DashboardPage />} />
                <Route path="templates">
                  <Route index element={<TemplatesListPage />} />
                  <Route path="new" element={<TemplateEditorPage />} />
                  <Route path=":id" element={<TemplateDetailPage />} />
                  <Route path=":id/edit" element={<TemplateEditorPage />} />
                </Route>
                <Route path="checklists">
                  <Route index element={<ChecklistsListPage />} />
                  <Route path=":id" element={<ChecklistDetailPage />} />
                  <Route path=":id/execute" element={<ChecklistExecutionPage />} />
                </Route>
                <Route path="profile" element={<ProfilePage />} />
                <Route path="admin" element={<AdminPage />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </Suspense>
        </OfflineProvider>
      </AuthProvider>
    </SWRConfig>
  )
}

export default App
