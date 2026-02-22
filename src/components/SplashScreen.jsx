import { useEffect, useState } from 'react'
import { Package, Truck } from 'lucide-react'

export default function SplashScreen({ onDone }) {
    const [phase, setPhase] = useState('enter') // enter → exit

    useEffect(() => {
        const holdTimer = setTimeout(() => setPhase('exit'), 2400)
        const doneTimer = setTimeout(() => onDone(), 3000)
        return () => { clearTimeout(holdTimer); clearTimeout(doneTimer) }
    }, [onDone])

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 9999,
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                background: 'radial-gradient(ellipse 900px 700px at 30% 20%, #1a1040 0%, #060b18 60%)',
                transition: 'opacity 0.6s ease, transform 0.6s ease',
                opacity: phase === 'exit' ? 0 : 1,
                transform: phase === 'exit' ? 'scale(1.05)' : 'scale(1)',
                pointerEvents: phase === 'exit' ? 'none' : 'all',
                overflow: 'hidden',
            }}
        >
            {/* Ambient background orbs */}
            {[
                { w: 600, h: 600, x: '-150px', y: '-150px', color: 'rgba(99,102,241,0.12)', delay: '0s' },
                { w: 500, h: 500, x: 'auto', y: 'auto', right: '-100px', bottom: '-100px', color: 'rgba(139,92,246,0.1)', delay: '1.5s' },
                { w: 300, h: 300, x: '50%', y: '60%', color: 'rgba(6,182,212,0.08)', delay: '0.8s' },
            ].map((orb, i) => (
                <div key={i} style={{
                    position: 'absolute',
                    width: `${orb.w}px`, height: `${orb.h}px`,
                    background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
                    borderRadius: '50%',
                    left: orb.x !== 'auto' ? orb.x : undefined,
                    top: orb.y !== 'auto' ? orb.y : undefined,
                    right: orb.right,
                    bottom: orb.bottom,
                    animation: `orbPulse 4s ease-in-out infinite ${orb.delay}`,
                    pointerEvents: 'none',
                }} />
            ))}

            {/* Floating particles */}
            {[...Array(8)].map((_, i) => (
                <div key={i} style={{
                    position: 'absolute',
                    width: `${4 + (i % 4)}px`, height: `${4 + (i % 4)}px`,
                    borderRadius: '50%',
                    background: i % 3 === 0 ? '#6366f1' : i % 3 === 1 ? '#8b5cf6' : '#06b6d4',
                    opacity: 0.3 + (i * 0.08),
                    left: `${10 + (i * 11)}%`,
                    top: `${15 + ((i * 17) % 70)}%`,
                    animation: `particleFloat ${3 + (i * 0.5)}s ease-in-out infinite ${i * 0.3}s`,
                    pointerEvents: 'none',
                }} />
            ))}

            {/* Driving truck road line */}
            <div style={{
                position: 'absolute',
                bottom: '22%',
                left: 0, right: 0,
                height: '1px',
                background: 'linear-gradient(to right, transparent, rgba(99,102,241,0.3), transparent)',
                pointerEvents: 'none',
            }} />
            <div style={{
                position: 'absolute',
                bottom: '22%',
                color: 'rgba(99,102,241,0.5)',
                animation: 'truckDrive 2.8s ease-in-out forwards 0.3s',
                opacity: 0,
                pointerEvents: 'none',
            }}>
                <Truck size={28} />
            </div>

            {/* 3D Logo ring + icon */}
            <div style={{
                position: 'relative',
                marginBottom: '2rem',
                animation: 'splashLogoIn 0.8s cubic-bezier(0.2,0.8,0.2,1) forwards',
                perspective: '600px',
            }}>
                {/* Outer spinning ring */}
                <div style={{
                    position: 'absolute', inset: '-16px',
                    borderRadius: '50%',
                    border: '2px solid transparent',
                    borderTopColor: '#6366f1',
                    borderRightColor: '#8b5cf6',
                    animation: 'spinRing 1.4s linear infinite',
                }} />
                {/* Secondary ring */}
                <div style={{
                    position: 'absolute', inset: '-26px',
                    borderRadius: '50%',
                    border: '1px solid rgba(6,182,212,0.2)',
                    animation: 'spinRing 3s linear infinite reverse',
                }} />
                {/* Tertiary glow ring */}
                <div style={{
                    position: 'absolute', inset: '-8px',
                    borderRadius: '50%',
                    border: '1px solid rgba(99,102,241,0.15)',
                    animation: 'pulseRing 2s ease-in-out infinite',
                }} />
                {/* Icon container */}
                <div style={{
                    width: '88px', height: '88px', borderRadius: '50%',
                    background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #06b6d4 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 0 50px rgba(99,102,241,0.5), 0 0 100px rgba(99,102,241,0.2), inset 0 1px 0 rgba(255,255,255,0.2)',
                    animation: 'float3d 3s ease-in-out infinite 0.8s',
                }}>
                    <Package size={40} color="white" />
                </div>
            </div>

            {/* Brand name */}
            <div style={{ animation: 'splashTextIn 0.7s 0.35s cubic-bezier(0.2,0.8,0.2,1) both', textAlign: 'center' }}>
                <h1 style={{
                    fontSize: 'clamp(2.2rem, 6vw, 3.2rem)',
                    fontWeight: 900, margin: '0 0 0.5rem 0',
                    letterSpacing: '-1.5px',
                    background: 'linear-gradient(135deg, #fff 20%, #a5b4fc 60%, #67e8f9 100%)',
                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                }}>
                    DeliveryPro
                </h1>
                <p style={{ color: 'rgba(148,163,184,0.75)', fontSize: '0.95rem', margin: 0, letterSpacing: '0.08em' }}>
                    Fast · Reliable · Secure
                </p>
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: '3.5rem', width: '180px', animation: 'splashTextIn 0.6s 0.6s both' }}>
                <div style={{ height: '2px', background: 'rgba(255,255,255,0.07)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{
                        height: '100%',
                        background: 'linear-gradient(to right, #6366f1, #8b5cf6, #06b6d4)',
                        borderRadius: '2px',
                        animation: 'splashProgress 2.5s ease forwards',
                        boxShadow: '0 0 8px rgba(99,102,241,0.6)',
                    }} />
                </div>
                <p style={{ textAlign: 'center', marginTop: '0.75rem', fontSize: '0.75rem', color: 'rgba(148,163,184,0.4)', letterSpacing: '0.1em' }}>
                    LOADING...
                </p>
            </div>
        </div>
    )
}
