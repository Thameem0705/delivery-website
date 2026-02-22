import { Package } from 'lucide-react'

export default function LoadingOverlay({ message = 'Loading...' }) {
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 8000,
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'rgba(15,23,42,0.85)',
            backdropFilter: 'blur(12px)',
            animation: 'fadeIn 0.25s ease',
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
            <p style={{
                color: '#e2e8f0', fontWeight: 600, fontSize: '1rem',
                margin: 0, letterSpacing: '0.02em',
                animation: 'pulse 1.5s ease-in-out infinite',
            }}>{message}</p>
        </div>
    )
}
