import { useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import LoadingScreen from '../components/LoadingScreen'
import {
    Camera, User, Eye, EyeOff, Package, Truck,
    Mail, Phone, MapPin, Lock, AtSign, ArrowRight, Star,
    CheckCircle, Zap, Shield, KeyRound, RotateCcw
} from 'lucide-react'

export default function Login() {
    const [loading, setLoading] = useState(false)
    const [showLoadingScreen, setShowLoadingScreen] = useState(false)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPass, setShowPass] = useState(false)
    const [fullName, setFullName] = useState('')
    const [realEmail, setRealEmail] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [address, setAddress] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const [photoFile, setPhotoFile] = useState(null)
    const [photoPreview, setPhotoPreview] = useState(null)
    const fileInputRef = useRef(null)
    const navigate = useNavigate()

    // Forgot Password state
    const [view, setView] = useState('login') // 'login' | 'forgotPhone' | 'resetPassword'
    const [mobileNumber, setMobileNumber] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showNewPass, setShowNewPass] = useState(false)
    const [showConfirmPass, setShowConfirmPass] = useState(false)

    const handlePhotoSelect = (e) => {
        const file = e.target.files[0]
        if (!file) return
        if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return }
        if (file.size > 5 * 1024 * 1024) { toast.error('Photo must be under 5MB'); return }
        setPhotoFile(file)
        setPhotoPreview(URL.createObjectURL(file))
    }

    const uploadPhoto = async (userId) => {
        if (!photoFile) return null
        const ext = photoFile.name.split('.').pop()
        const path = `${userId}/avatar.${ext}`
        const { error } = await supabase.storage.from('profile-photos').upload(path, photoFile, { upsert: true })
        if (error) throw error
        const { data } = supabase.storage.from('profile-photos').getPublicUrl(path)
        return data.publicUrl
    }

    const resetForm = () => {
        setFullName(''); setRealEmail(''); setPhoneNumber(''); setAddress('')
        setPhotoFile(null); setPhotoPreview(null)
        setUsername(''); setPassword(''); setShowPass(false)
    }

    const handleAuth = async (e) => {
        e.preventDefault()
        setLoading(true)
        const usernameRegex = /^[a-zA-Z0-9]+$/
        if (!usernameRegex.test(username)) {
            toast.error('Username must contain only letters and numbers')
            setLoading(false)
            return
        }
        const authEmail = `${username}@delivery.local`
        try {
            if (isSignUp) {
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email: authEmail, password,
                    options: { data: { full_name: fullName, username, real_email: realEmail, phone_number: phoneNumber, address } },
                })
                if (signUpError) throw signUpError
                const userId = signUpData.user?.id
                if (userId && photoFile) {
                    try {
                        const avatarUrl = await uploadPhoto(userId)
                        if (avatarUrl) await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', userId)
                    } catch { toast.error('Account created but photo upload failed.') }
                }
                // Show branded loading screen then go to login
                setLoading(false)
                setShowLoadingScreen(true)
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password })
                if (error) throw error
                toast.success('Welcome back! 🚀')
                navigate('/')
            }
        } catch (error) {
            toast.error(error.message)
            setLoading(false)
        }
    }

    const handleLoadingDone = () => {
        setShowLoadingScreen(false)
        setIsSignUp(false)
        resetForm()
        toast.success('Account ready! Please log in. ✨')
    }

    const switchMode = () => {
        setIsSignUp(!isSignUp)
        setPhotoFile(null); setPhotoPreview(null)
    }

    // ── Forgot Password Handlers ──
    const handleForgotPhone = async (e) => {
        e.preventDefault()
        if (!mobileNumber.trim()) { toast.error('Please enter your mobile number'); return }
        setLoading(true)
        try {
            const { data, error } = await supabase.rpc('reset_password_by_phone', {
                p_phone: mobileNumber.trim(),
                p_new_password: '__CHECK_ONLY__'
            })
            if (error) throw error
            const result = typeof data === 'string' ? JSON.parse(data) : data
            if (!result.success) {
                toast.error(result.message || 'Mobile number not registered')
            } else {
                setView('resetPassword')
            }
        } catch (err) {
            // If RPC check fails with invalid password error it still means phone exists
            // But if it's a not-found-type error, show the message
            const msg = err.message || ''
            if (msg.includes('not registered') || msg.includes('not found')) {
                toast.error('Mobile number not registered')
            } else {
                // Phone found (the __CHECK_ONLY__ password still goes through, we'll reset next)
                setView('resetPassword')
            }
        } finally {
            setLoading(false)
        }
    }

    const handleResetPassword = async (e) => {
        e.preventDefault()
        if (!newPassword || !confirmPassword) { toast.error('Please fill in both fields'); return }
        if (newPassword.length < 6) { toast.error('Password must be at least 6 characters'); return }
        if (newPassword !== confirmPassword) { toast.error('Passwords do not match'); return }
        setLoading(true)
        try {
            const { data, error } = await supabase.rpc('reset_password_by_phone', {
                p_phone: mobileNumber.trim(),
                p_new_password: newPassword
            })
            if (error) throw error
            const result = typeof data === 'string' ? JSON.parse(data) : data
            if (!result.success) {
                toast.error(result.message || 'Password reset failed')
            } else {
                // Success!
                setMobileNumber(''); setNewPassword(''); setConfirmPassword('')
                setView('login')
                setIsSignUp(false)
                setTimeout(() => {
                    alert('Password changed successfully. Please login.')
                }, 100)
            }
        } catch (err) {
            toast.error(err.message || 'Failed to reset password')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-container">
            <Toaster position="top-right" toastOptions={{
                style: { background: '#1e2942', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)' }
            }} />
            {showLoadingScreen && <LoadingScreen onDone={handleLoadingDone} />}

            {/* ─── Left Hero Panel ─── */}
            <div className="login-hero">
                <div className="login-hero-bg" />

                {/* 3D floating mockup cards */}
                <div style={{ position: 'relative', zIndex: 10, width: '100%', maxWidth: '420px' }}>
                    {/* Main card */}
                    <div style={{
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.15) 0%, rgba(139,92,246,0.1) 100%)',
                        border: '1px solid rgba(99,102,241,0.3)',
                        borderRadius: '1.5rem',
                        padding: '1.75rem',
                        marginBottom: '1rem',
                        boxShadow: '0 20px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
                        animation: 'floatCard 5s ease-in-out infinite',
                        transformOrigin: 'center bottom',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                            <div style={{
                                width: '44px', height: '44px', borderRadius: '50%',
                                background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                            }}>
                                <Truck size={22} color="white" />
                            </div>
                            <div>
                                <p style={{ margin: 0, fontSize: '0.85rem', fontWeight: 700 }}>Active Deliveries</p>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'rgba(148,163,184,0.7)' }}>Live tracking enabled</p>
                            </div>
                            <div style={{ marginLeft: 'auto' }}>
                                <span style={{
                                    background: 'linear-gradient(135deg, #10b981, #059669)',
                                    color: 'white', fontSize: '0.7rem', fontWeight: 700,
                                    padding: '0.25rem 0.75rem', borderRadius: '999px',
                                    boxShadow: '0 0 12px rgba(16,185,129,0.4)',
                                }}>LIVE</span>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem' }}>
                            {[{ n: '24', l: 'Tasks', c: '#6366f1' }, { n: '18', l: 'Done', c: '#10b981' }, { n: '98%', l: 'Rate', c: '#f59e0b' }].map(s => (
                                <div key={s.l} style={{
                                    flex: 1, background: 'rgba(0,0,0,0.3)', borderRadius: '0.75rem',
                                    padding: '0.75rem', textAlign: 'center',
                                    border: `1px solid ${s.c}30`,
                                }}>
                                    <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: s.c }}>{s.n}</p>
                                    <p style={{ margin: 0, fontSize: '0.65rem', color: 'rgba(148,163,184,0.6)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Floating mini cards */}
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                        {[
                            { icon: Shield, label: 'Secure', color: '#6366f1', delay: '0.5s' },
                            { icon: Zap, label: 'Fast', color: '#f59e0b', delay: '1s' },
                            { icon: Star, label: 'Reliable', color: '#ec4899', delay: '1.5s' },
                        ].map(({ icon: Icon, label, color, delay }) => (
                            <div key={label} style={{
                                flex: 1,
                                background: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)',
                                borderRadius: '1rem', padding: '0.875rem 0.5rem',
                                textAlign: 'center',
                                animation: `float3d 4s ease-in-out infinite ${delay}`,
                                boxShadow: `0 8px 24px rgba(0,0,0,0.3)`,
                            }}>
                                <Icon size={20} color={color} style={{ marginBottom: '0.4rem' }} />
                                <p style={{ margin: 0, fontSize: '0.7rem', fontWeight: 600, color: 'rgba(241,245,249,0.7)' }}>{label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hero text */}
                <div className="hero-content" style={{ marginTop: '2.5rem', textAlign: 'left' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                        <div style={{
                            background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                            padding: '0.6rem', borderRadius: '0.75rem',
                            boxShadow: '0 4px 16px rgba(99,102,241,0.4)',
                        }}>
                            <Package size={24} color="white" />
                        </div>
                        <span style={{ fontSize: '1.1rem', fontWeight: 800, letterSpacing: '-0.5px' }}>
                            Delivery<span className="gradient-text">Pro</span>
                        </span>
                    </div>
                    <h1 style={{ fontWeight: 900, letterSpacing: '-1.5px', marginBottom: '1rem' }}>
                        Manage Deliveries<br />
                        <span className="gradient-text">Like a Pro</span>
                    </h1>
                    <p style={{ margin: 0, lineHeight: 1.7 }}>
                        Real-time tracking, smart task assignment, and full team visibility — all in one powerful platform.
                    </p>
                    {/* Feature bullets */}
                    <div style={{ marginTop: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                        {['Real-time task updates via live sync', 'Role-based admin & driver access', 'Mobile-ready for drivers on the go'].map(f => (
                            <div key={f} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                <CheckCircle size={16} color="#10b981" />
                                <span style={{ fontSize: '0.875rem', color: 'rgba(241,245,249,0.75)' }}>{f}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ─── Right Form Panel ─── */}
            <div className="login-form-wrapper">
                <div className="glass-panel login-card" key={view}>
                    {/* Header */}
                    <div className="login-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                            <div style={{
                                width: '48px', height: '48px', borderRadius: '50%',
                                background: view === 'login'
                                    ? 'linear-gradient(135deg, #6366f1, #8b5cf6)'
                                    : 'linear-gradient(135deg, #f59e0b, #f97316)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                boxShadow: view === 'login'
                                    ? '0 0 24px rgba(99,102,241,0.35)'
                                    : '0 0 24px rgba(245,158,11,0.35)',
                            }}>
                                {view === 'login' ? <Package size={22} color="white" /> : <KeyRound size={22} color="white" />}
                            </div>
                            <div>
                                <h2 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800 }}>
                                    {view === 'login' && (isSignUp ? 'Create Account' : 'Welcome Back')}
                                    {view === 'forgotPhone' && 'Forgot Password?'}
                                    {view === 'resetPassword' && 'Reset Password'}
                                </h2>
                                <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-muted)' }}>
                                    {view === 'login' && (isSignUp ? 'Join the delivery team' : 'Sign in to your dashboard')}
                                    {view === 'forgotPhone' && 'Enter your registered mobile number'}
                                    {view === 'resetPassword' && 'Choose a new password'}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── VIEW: Forgot Phone ── */}
                    {view === 'forgotPhone' && (
                        <form onSubmit={handleForgotPhone} className="auth-form">
                            {/* Info box */}
                            <div style={{
                                background: 'rgba(245,158,11,0.08)',
                                border: '1px solid rgba(245,158,11,0.25)',
                                borderRadius: '0.75rem',
                                padding: '0.875rem 1rem',
                                marginBottom: '1.25rem',
                                display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
                            }}>
                                <Phone size={16} color="#f59e0b" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(245,158,11,0.9)', lineHeight: 1.5 }}>
                                    We'll verify your mobile number against our records to reset your password.
                                </p>
                            </div>

                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label>Registered Mobile Number</label>
                                <div style={{ position: 'relative' }}>
                                    <Phone size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                                    <input
                                        type="tel"
                                        placeholder="+91 9876543210"
                                        className="input-field"
                                        style={{ paddingLeft: '2.5rem' }}
                                        value={mobileNumber}
                                        onChange={e => setMobileNumber(e.target.value)}
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                className="btn-primary btn-full btn-tall"
                                disabled={loading}
                                style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #f59e0b, #f97316)', boxShadow: '0 4px 12px rgba(245,158,11,0.35)' }}
                            >
                                {loading ? (
                                    <><div className="spinner" style={{ width: '20px', height: '20px' }} /> Verifying…</>
                                ) : (
                                    <>Verify Number <ArrowRight size={18} /></>
                                )}
                            </button>

                            <div className="login-footer">
                                <p>
                                    Remember your password?{' '}
                                    <span onClick={() => setView('login')} className="toggle-auth">Back to Login</span>
                                </p>
                            </div>
                        </form>
                    )}

                    {/* ── VIEW: Reset Password ── */}
                    {view === 'resetPassword' && (
                        <form onSubmit={handleResetPassword} className="auth-form">
                            {/* Success info box */}
                            <div style={{
                                background: 'rgba(16,185,129,0.08)',
                                border: '1px solid rgba(16,185,129,0.25)',
                                borderRadius: '0.75rem',
                                padding: '0.875rem 1rem',
                                marginBottom: '1.25rem',
                                display: 'flex', gap: '0.6rem', alignItems: 'flex-start',
                            }}>
                                <CheckCircle size={16} color="#10b981" style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'rgba(16,185,129,0.9)', lineHeight: 1.5 }}>
                                    Mobile number verified! Now set your new password.
                                </p>
                            </div>

                            {/* New Password */}
                            <div className="form-group">
                                <label>New Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                                    <input
                                        type={showNewPass ? 'text' : 'password'}
                                        placeholder="Min 6 characters"
                                        className="input-field"
                                        style={{ paddingLeft: '2.5rem', paddingRight: '3rem' }}
                                        value={newPassword}
                                        onChange={e => setNewPassword(e.target.value)}
                                        required
                                        autoFocus
                                        autoComplete="new-password"
                                    />
                                    <button type="button" onClick={() => setShowNewPass(!showNewPass)} style={{
                                        position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                        color: 'var(--text-subtle)', display: 'flex', alignItems: 'center',
                                    }}>
                                        {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* Confirm Password */}
                            <div className="form-group" style={{ marginBottom: '1.5rem' }}>
                                <label>Confirm New Password</label>
                                <div style={{ position: 'relative' }}>
                                    <Lock size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                                    <input
                                        type={showConfirmPass ? 'text' : 'password'}
                                        placeholder="Re-enter new password"
                                        className="input-field"
                                        style={{
                                            paddingLeft: '2.5rem', paddingRight: '3rem',
                                            borderColor: confirmPassword && newPassword !== confirmPassword
                                                ? 'rgba(239,68,68,0.6)' : undefined
                                        }}
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                        required
                                        autoComplete="new-password"
                                    />
                                    <button type="button" onClick={() => setShowConfirmPass(!showConfirmPass)} style={{
                                        position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer', padding: 0,
                                        color: 'var(--text-subtle)', display: 'flex', alignItems: 'center',
                                    }}>
                                        {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {confirmPassword && newPassword !== confirmPassword && (
                                    <p style={{ margin: '0.35rem 0 0', fontSize: '0.75rem', color: 'var(--danger)' }}>
                                        Passwords do not match
                                    </p>
                                )}
                            </div>

                            <button
                                type="submit"
                                className="btn-success btn-full btn-tall"
                                disabled={loading}
                                style={{ position: 'relative', overflow: 'hidden' }}
                            >
                                {loading ? (
                                    <><div className="spinner" style={{ width: '20px', height: '20px' }} /> Updating…</>
                                ) : (
                                    <>Update Password <ArrowRight size={18} /></>
                                )}
                            </button>

                            <div className="login-footer">
                                <p>
                                    <span
                                        onClick={() => { setView('forgotPhone'); setNewPassword(''); setConfirmPassword('') }}
                                        className="toggle-auth"
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}
                                    >
                                        <RotateCcw size={13} /> Try a different number
                                    </span>
                                </p>
                            </div>
                        </form>
                    )}

                    {/* ── VIEW: Login / Sign Up ── */}
                    {view === 'login' && (
                        <>
                            <form onSubmit={handleAuth} className="auth-form">
                                {isSignUp && (
                                    <>
                                        {/* Photo Upload */}
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
                                            <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handlePhotoSelect} />
                                            <button
                                                type="button"
                                                onClick={() => fileInputRef.current?.click()}
                                                style={{
                                                    width: '96px', height: '112px', borderRadius: '12px',
                                                    border: `2px dashed ${photoPreview ? 'rgba(99,102,241,0.6)' : 'rgba(99,102,241,0.3)'}`,
                                                    background: photoPreview ? 'transparent' : 'rgba(99,102,241,0.05)',
                                                    cursor: 'pointer', overflow: 'hidden', position: 'relative',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexDirection: 'column', gap: '0.4rem',
                                                    transition: 'all 0.2s', padding: 0,
                                                    boxShadow: photoPreview ? '0 4px 16px rgba(99,102,241,0.2)' : 'none',
                                                }}
                                            >
                                                {photoPreview ? (
                                                    <>
                                                        <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                                                        <div style={{
                                                            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)',
                                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                            flexDirection: 'column', gap: '0.25rem',
                                                            opacity: 0, transition: 'opacity 0.2s',
                                                        }}
                                                            onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                                            onMouseLeave={e => e.currentTarget.style.opacity = 0}
                                                        >
                                                            <Camera size={18} color="white" />
                                                            <span style={{ color: 'white', fontSize: '0.65rem', fontWeight: 600 }}>Change</span>
                                                        </div>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div style={{
                                                            width: '36px', height: '36px', borderRadius: '50%',
                                                            background: 'rgba(99,102,241,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                        }}>
                                                            <User size={20} color="var(--primary)" />
                                                        </div>
                                                        <Camera size={14} color="var(--text-muted)" />
                                                        <span style={{ color: 'var(--text-muted)', fontSize: '0.65rem', fontWeight: 500, textAlign: 'center', lineHeight: 1.3 }}>Upload Photo</span>
                                                    </>
                                                )}
                                            </button>
                                            <p style={{ marginTop: '0.45rem', fontSize: '0.68rem', color: 'var(--text-subtle)' }}>Passport · Max 5MB</p>
                                        </div>

                                        {/* Full Name */}
                                        <div className="form-group">
                                            <label>Full Name</label>
                                            <div style={{ position: 'relative' }}>
                                                <User size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                                                <input type="text" placeholder="John Doe" className="input-field" style={{ paddingLeft: '2.5rem' }}
                                                    value={fullName} onChange={e => setFullName(e.target.value)} required />
                                            </div>
                                        </div>

                                        {/* Email */}
                                        <div className="form-group">
                                            <label>Email Address</label>
                                            <div style={{ position: 'relative' }}>
                                                <Mail size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                                                <input type="email" placeholder="john@example.com" className="input-field" style={{ paddingLeft: '2.5rem' }}
                                                    value={realEmail} onChange={e => setRealEmail(e.target.value)} required />
                                            </div>
                                        </div>

                                        {/* Phone */}
                                        <div className="form-group">
                                            <label>Phone Number</label>
                                            <div style={{ position: 'relative' }}>
                                                <Phone size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                                                <input type="tel" placeholder="+91 9876543210" className="input-field" style={{ paddingLeft: '2.5rem' }}
                                                    value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} required />
                                            </div>
                                        </div>

                                        {/* Address */}
                                        <div className="form-group">
                                            <label>Address</label>
                                            <div style={{ position: 'relative' }}>
                                                <MapPin size={16} style={{ position: 'absolute', left: '0.9rem', top: '0.85rem', color: 'var(--text-subtle)' }} />
                                                <textarea placeholder="123 Main St, City, State" className="input-field" style={{ paddingLeft: '2.5rem', resize: 'vertical', fontFamily: 'inherit' }}
                                                    value={address} onChange={e => setAddress(e.target.value)} required rows={2} />
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Username */}
                                <div className="form-group">
                                    <label>Username</label>
                                    <div style={{ position: 'relative' }}>
                                        <AtSign size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                                        <input type="text" placeholder="johndoe" className="input-field" style={{ paddingLeft: '2.5rem' }}
                                            value={username} onChange={e => setUsername(e.target.value)} required autoComplete="username" />
                                    </div>
                                </div>

                                {/* Password */}
                                <div className="form-group" style={{ marginBottom: !isSignUp ? '0.5rem' : '1.5rem' }}>
                                    <label>Password</label>
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={16} style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)' }} />
                                        <input
                                            type={showPass ? 'text' : 'password'}
                                            placeholder="••••••••" className="input-field"
                                            style={{ paddingLeft: '2.5rem', paddingRight: '3rem' }}
                                            value={password} onChange={e => setPassword(e.target.value)} required
                                            autoComplete={isSignUp ? 'new-password' : 'current-password'}
                                        />
                                        <button
                                            type="button" onClick={() => setShowPass(!showPass)}
                                            style={{
                                                position: 'absolute', right: '0.9rem', top: '50%', transform: 'translateY(-50%)',
                                                background: 'none', border: 'none', cursor: 'pointer', padding: '0', color: 'var(--text-subtle)',
                                                display: 'flex', alignItems: 'center',
                                            }}
                                        >
                                            {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                                        </button>
                                    </div>
                                </div>

                                {/* Forgot Password link - only on login mode */}
                                {!isSignUp && (
                                    <div style={{ textAlign: 'right', marginBottom: '1.25rem' }}>
                                        <span
                                            className="forgot-link"
                                            onClick={() => { setView('forgotPhone'); setMobileNumber('') }}
                                        >
                                            Forgot Password?
                                        </span>
                                    </div>
                                )}

                                {/* Submit */}
                                <button
                                    type="submit"
                                    className="btn-primary btn-full btn-tall"
                                    disabled={loading}
                                    style={{ position: 'relative', overflow: 'hidden' }}
                                >
                                    {loading ? (
                                        <><div className="spinner" style={{ width: '20px', height: '20px' }} /> {isSignUp ? 'Creating account…' : 'Signing in…'}</>
                                    ) : (
                                        <>{isSignUp ? 'Create Account' : 'Sign In'} <ArrowRight size={18} /></>
                                    )}
                                </button>
                            </form>

                            <div className="login-footer">
                                <p>
                                    {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                                    <span onClick={switchMode} className="toggle-auth">
                                        {isSignUp ? 'Sign In' : 'Sign Up'}
                                    </span>
                                </p>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div style={{
                position: 'fixed',
                bottom: '1rem',
                left: 0,
                right: 0,
                textAlign: 'center',
                fontSize: '0.8rem',
                color: 'rgba(255,255,255,0.4)',
                pointerEvents: 'none',
                zIndex: 50
            }}>
                &copy; {new Date().getFullYear()} Ansari-Karthi. All rights reserved.
            </div>
        </div>
    )
}
