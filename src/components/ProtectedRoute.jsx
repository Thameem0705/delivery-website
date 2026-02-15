
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ requiredRole }) {
    const { user, profile, loading } = useAuth()

    if (loading) {
        return (
            <div className="flex-center" style={{ height: '100vh' }}>
                <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Loading Auth...</div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    // If a specific role is required and the user doesn't have it
    if (requiredRole && profile?.role !== requiredRole) {
        // Redirect to their appropriate dashboard if they try to access wrong one
        if (profile?.role === 'admin') return <Navigate to="/admin" replace />
        if (profile?.role === 'delivery') return <Navigate to="/delivery" replace />

        return <div className="page-container glass-panel">Access Denied: You do not have permission for this page.</div>
    }

    return <Outlet />
}
