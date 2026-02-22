
import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Package } from 'lucide-react'

export default function ProtectedRoute({ requiredRole }) {
    const { user, profile, loading } = useAuth()

    if (loading) {
        return (
            <div style={{
                position: 'fixed', inset: 0, zIndex: 100,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: 'radial-gradient(circle at 30% 20%, #1e1b4b, #0f172a)',
            }}>
                <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
                    <div style={{
                        position: 'absolute', inset: '-10px', borderRadius: '50%',
                        border: '2px solid transparent',
                        borderTopColor: '#6366f1',
                        borderRightColor: '#8b5cf6',
                        animation: 'spin-ring 1s linear infinite',
                    }} />
                    <div style={{
                        width: '56px', height: '56px', borderRadius: '50%',
                        background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 30px rgba(99,102,241,0.5)',
                    }}>
                        <Package size={24} color="white" />
                    </div>
                </div>
                <p style={{ color: '#94a3b8', fontWeight: 500, margin: 0 }}>Authenticating...</p>
            </div>
        )
    }

    if (!user) return <Navigate to="/login" replace />

    if (requiredRole && profile?.role !== requiredRole) {
        if (profile?.role === 'admin') return <Navigate to="/admin" replace />
        if (profile?.role === 'delivery') return <Navigate to="/delivery" replace />
        return <div className="page-container glass-panel">Access Denied.</div>
    }

    return <Outlet />
}
