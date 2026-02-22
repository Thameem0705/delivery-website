import { useEffect, useState } from 'react'
import { Package, CheckCircle } from 'lucide-react'

export default function LoadingScreen({ message = 'Account created! Taking you to login…', onDone, duration = 1800 }) {
    const [phase, setPhase] = useState(0) // 0=loading, 1=done, 2=exit

    useEffect(() => {
        const t1 = setTimeout(() => setPhase(1), duration - 500)
        const t2 = setTimeout(() => setPhase(2), duration)
        const t3 = setTimeout(() => onDone?.(), duration + 400)
        return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3) }
    }, [onDone, duration])

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 9998,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: 'radial-gradient(ellipse 800px 600px at 40% 30%, #0f1734 0%, #060b18 70%)',
                transition: 'opacity 0.4s ease',
                opacity: phase === 2 ? 0 : 1,
                pointerEvents: phase === 2 ? 'none' : 'all',
            }}
        >
            {/* Glow orb */}
            <div style={{
                position: 'absolute', width: '400px', height: '400px',
                background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
                borderRadius: '50%', pointerEvents: 'none',
                animation: 'orbPulse 2s ease-in-out infinite',
            }} />

            {/* Icon area */}
            <div style={{
                width: '100px', height: '100px', borderRadius: '50%',
                background: phase === 1
                    ? 'linear-gradient(135deg, #10b981, #059669)'
                    : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: phase === 1
                    ? '0 0 40px rgba(16,185,129,0.5), 0 0 80px rgba(16,185,129,0.2)'
                    : '0 0 40px rgba(99,102,241,0.5), 0 0 80px rgba(99,102,241,0.2)',
                transition: 'background 0.5s ease, box-shadow 0.5s ease',
                marginBottom: '2rem',
                position: 'relative',
                animation: phase === 1 ? 'scaleIn 0.4s cubic-bezier(0.2,0.8,0.2,1) both' : 'float3d 3s ease-in-out infinite',
            }}>
                {/* Spinning ring (only when loading) */}
                {phase === 0 && (
                    <div style={{
                        position: 'absolute', inset: '-10px', borderRadius: '50%',
                        border: '2px solid transparent',
                        borderTopColor: '#6366f1', borderRightColor: '#8b5cf6',
                        animation: 'spinRing 1s linear infinite',
                    }} />
                )}
                {phase === 0
                    ? <Package size={44} color="white" />
                    : <CheckCircle size={44} color="white" />
                }
            </div>

            {/* Message */}
            <div style={{ textAlign: 'center' }}>
                <h2 style={{
                    fontSize: '1.5rem', fontWeight: 800, margin: '0 0 0.5rem',
                    background: 'linear-gradient(135deg, #fff, #a5b4fc)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                    {phase === 1 ? 'All Set! 🎉' : 'DeliveryPro'}
                </h2>
                <p style={{ color: 'rgba(148,163,184,0.7)', fontSize: '0.95rem', margin: 0 }}>
                    {phase === 1 ? message : 'Setting up your account…'}
                </p>
            </div>

            {/* Progress dots */}
            {phase === 0 && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '2rem' }}>
                    {[0, 1, 2].map(i => (
                        <div key={i} style={{
                            width: '8px', height: '8px', borderRadius: '50%',
                            background: '#6366f1',
                            animation: `orbPulse 1.2s ease-in-out infinite ${i * 0.2}s`,
                        }} />
                    ))}
                </div>
            )}
        </div>
    )
}
