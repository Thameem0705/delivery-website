import { useState, useCallback, Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import SplashScreen from './components/SplashScreen'
import LoadingOverlay from './components/LoadingOverlay'

const Login = lazy(() => import('./pages/Login'))
const AdminStats = lazy(() => import('./pages/admin/AdminStats'))
const TaskList = lazy(() => import('./pages/admin/TaskList'))
const CreateTask = lazy(() => import('./pages/admin/CreateTask'))
const DeliveryUsers = lazy(() => import('./pages/admin/DeliveryUsers'))
const AdminPermissions = lazy(() => import('./pages/admin/AdminPermissions'))
const DeliveryDashboard = lazy(() => import('./pages/DeliveryDashboard'))
const MyPermissions = lazy(() => import('./pages/delivery/MyPermissions'))

function App() {
  const [splashDone, setSplashDone] = useState(false)
  const handleSplashDone = useCallback(() => setSplashDone(true), [])

  return (
    <>
      {!splashDone && <SplashScreen onDone={handleSplashDone} />}
      {splashDone && (
        <AuthProvider>
          <BrowserRouter>
            <Suspense fallback={<LoadingOverlay message="Loading page..." />}>
              <Routes>
                <Route path="/login" element={<Login />} />

                <Route element={<ProtectedRoute />}>
                  <Route element={<Layout />}>
                    <Route path="/" element={<DashboardRedirect />} />

                    <Route element={<ProtectedRoute requiredRole="admin" />}>
                      <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                      <Route path="/admin/dashboard" element={<AdminStats />} />
                      <Route path="/admin/tasks" element={<TaskList />} />
                      <Route path="/admin/create" element={<CreateTask />} />
                      <Route path="/admin/users" element={<DeliveryUsers />} />
                      <Route path="/admin/permissions" element={<AdminPermissions />} />
                    </Route>

                    <Route element={<ProtectedRoute requiredRole="delivery" />}>
                      <Route path="/delivery" element={<DeliveryDashboard />} />
                      <Route path="/delivery/permissions" element={<MyPermissions />} />
                    </Route>
                  </Route>
                </Route>

                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </BrowserRouter>
        </AuthProvider>
      )}
    </>
  )
}

function DashboardRedirect() {
  const { profile } = useAuth()
  if (profile?.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  if (profile?.role === 'delivery') return <Navigate to="/delivery" replace />
  return <div className="flex-center" style={{ height: '100%' }}>Redirecting...</div>
}

export default App
