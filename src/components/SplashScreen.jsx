import { useEffect, useState } from 'react'
import { Package } from 'lucide-react'

export default function SplashScreen({ onDone }) {
    const [phase, setPhase] = useState('enter') // enter → hold → exit

    useEffect(() => {
        const holdTimer = setTimeout(() => setPhase('exit'), 2200)
        const doneTimer = setTimeout(() => onDone(), 2800)
        return () => {
            clearTimeout(holdTimer)
            clearTimeout(doneTimer)
        }
    }, [onDone])

    return (
        <div
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'radial-gradient(circle at 30% 20%, #1e1b4b 0%, #0f172a 60%)',
                transition: 'opacity 0.6s ease, transform 0.6s ease',
                opacity: phase === 'exit' ? 0 : 1,
                transform: phase === 'exit' ? 'scale(1.04)' : 'scale(1)',
                pointerEvents: phase === 'exit' ? 'none' : 'all',
            }}
        >
            {/* Background orbs */}
            <div style={{
                position: 'absolute', width: '500px', height: '500px',
                background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)',
                borderRadius: '50%', top: '-100px', left: '-100px', animation: 'orb-pulse 4s ease-in-out infinite'
            }} />
            <div style={{
                position: 'absolute', width: '400px', height: '400px',
                background: 'radial-gradient(circle, rgba(139,92,246,0.12) 0%, transparent 70%)',
                borderRadius: '50%', bottom: '-80px', right: '-80px', animation: 'orb-pulse 4s ease-in-out infinite 2s'
            }} />

            {/* Logo ring */}
            <div style={{
                position: 'relative',
                marginBottom: '2rem',
                animation: 'splash-logo-in 0.7s cubic-bezier(0.2,0.8,0.2,1) forwards'
            }}>
                {/* Outer spinning ring */}
                <div style={{
                    position: 'absolute',
                    inset: '-12px',
                    borderRadius: '50%',
                    border: '2px solid transparent',
                    borderTopColor: '#6366f1',
                    borderRightColor: '#8b5cf6',
                    animation: 'spin-ring 1.5s linear infinite',
                }} />
                {/* Secondary ring */}
                <div style={{
                    position: 'absolute',
                    inset: '-20px',
                    borderRadius: '50%',
                    border: '1px solid rgba(99,102,241,0.2)',
                    animation: 'spin-ring 3s linear infinite reverse',
                }} />
                {/* Icon bg */}
                <div style={{
                    width: '80px', height: '80px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 40px rgba(99,102,241,0.5), 0 0 80px rgba(99,102,241,0.2)',
                }}>
                    <Package size={36} color="white" />
                </div>
            </div>

            {/* Brand name */}
            <div style={{ animation: 'splash-text-in 0.7s 0.3s cubic-bezier(0.2,0.8,0.2,1) both', textAlign: 'center' }}>
                <h1 style={{
                    fontSize: 'clamp(2rem,6vw,3rem)', fontWeight: 900, margin: '0 0 0.5rem 0',
                    letterSpacing: '-1px',
                    background: 'linear-gradient(135deg, #fff 30%, #a5b4fc)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                    DeliveryPro
                </h1>
                <p style={{ color: 'rgba(148,163,184,0.8)', fontSize: '1rem', margin: 0, letterSpacing: '0.05em' }}>
                    Fast · Reliable · Secure
                </p>
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: '3rem', width: '160px', animation: 'splash-text-in 0.6s 0.5s both' }}>
                <div style={{ height: '2px', background: 'rgba(255,255,255,0.08)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%',
                        background: 'linear-gradient(to right, #6366f1, #8b5cf6)',
                        borderRadius: '2px',
                        animation: 'splash-progress 2s ease forwards',
                    }} />
                </div>
            </div>
        </div>
    )
}
