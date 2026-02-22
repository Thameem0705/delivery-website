
import { useState, useCallback } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import SplashScreen from './components/SplashScreen'
import Login from './pages/Login'
import AdminStats from './pages/admin/AdminStats'
import TaskList from './pages/admin/TaskList'
import CreateTask from './pages/admin/CreateTask'
import DeliveryUsers from './pages/admin/DeliveryUsers'
import AdminPermissions from './pages/admin/AdminPermissions'
import DeliveryDashboard from './pages/DeliveryDashboard'
import MyPermissions from './pages/delivery/MyPermissions'

function App() {
  const [splashDone, setSplashDone] = useState(false)
  const handleSplashDone = useCallback(() => setSplashDone(true), [])

  return (
    <>
      {!splashDone && <SplashScreen onDone={handleSplashDone} />}
      {splashDone && (
        <AuthProvider>
          <BrowserRouter>
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
