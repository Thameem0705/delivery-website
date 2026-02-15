
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import AdminStats from './pages/admin/AdminStats'
import TaskList from './pages/admin/TaskList'
import CreateTask from './pages/admin/CreateTask'
import DeliveryUsers from './pages/admin/DeliveryUsers'
// import AdminDashboard from './pages/AdminDashboard' // Deprecated
import DeliveryDashboard from './pages/DeliveryDashboard'

function App() {
  return (
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
              </Route>

              <Route element={<ProtectedRoute requiredRole="delivery" />}>
                <Route path="/delivery" element={<DeliveryDashboard />} />
              </Route>
            </Route>
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

// Helper to redirect to correct dashboard
function DashboardRedirect() {
  const { profile } = useAuth()

  if (profile?.role === 'admin') return <Navigate to="/admin/dashboard" replace />
  if (profile?.role === 'delivery') return <Navigate to="/delivery" replace />

  return <div className="flex-center" style={{ height: '100%' }}>Redirecting based on role...</div>
}

export default App
