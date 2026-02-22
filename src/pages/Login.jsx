
import { useState, useRef } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'
import LoadingOverlay from '../components/LoadingOverlay'
import { Camera, User } from 'lucide-react'

export default function Login() {
    const [loading, setLoading] = useState(false)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [realEmail, setRealEmail] = useState('')
    const [phoneNumber, setPhoneNumber] = useState('')
    const [address, setAddress] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)

    // Photo state
    const [photoFile, setPhotoFile] = useState(null)
    const [photoPreview, setPhotoPreview] = useState(null)
    const fileInputRef = useRef(null)

    const navigate = useNavigate()

    const handlePhotoSelect = (e) => {
        const file = e.target.files[0]
        if (!file) return
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file')
            return
        }
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Photo must be under 5MB')
            return
        }
        setPhotoFile(file)
        setPhotoPreview(URL.createObjectURL(file))
    }

    const uploadPhoto = async (userId) => {
        if (!photoFile) return null
        const ext = photoFile.name.split('.').pop()
        const path = `${userId}/avatar.${ext}`
        const { error } = await supabase.storage
            .from('profile-photos')
            .upload(path, photoFile, { upsert: true })
        if (error) throw error
        const { data } = supabase.storage
            .from('profile-photos')
            .getPublicUrl(path)
        return data.publicUrl
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
                // 1. Create auth user
                const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
                    email: authEmail,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                            username,
                            real_email: realEmail,
                            phone_number: phoneNumber,
                            address,
                        },
                    },
                })
                if (signUpError) throw signUpError

                const userId = signUpData.user?.id
                // 2. Upload photo if selected
                if (userId && photoFile) {
                    try {
                        const avatarUrl = await uploadPhoto(userId)
                        if (avatarUrl) {
                            await supabase
                                .from('profiles')
                                .update({ avatar_url: avatarUrl })
                                .eq('id', userId)
                        }
                    } catch (photoErr) {
                        console.error('Photo upload failed:', photoErr)
                        toast.error('Account created but photo upload failed. You can update it later.')
                    }
                }

                toast.success('Signup successful! You can now log in.')
                setIsSignUp(false)
                setFullName(''); setRealEmail(''); setPhoneNumber(''); setAddress('')
                setPhotoFile(null); setPhotoPreview(null)
                setLoading(false)
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email: authEmail, password })
                if (error) throw error
                toast.success('Login successful!')
                navigate('/')
            }
        } catch (error) {
            toast.error(error.message)
            setLoading(false)
        }
    }

    const switchMode = () => {
        setIsSignUp(!isSignUp)
        setPhotoFile(null)
        setPhotoPreview(null)
    }

    return (
        <div className="login-container">
            <Toaster position="top-right" />
            {loading && !isSignUp && <LoadingOverlay message="Signing you in…" />}

            {/* Left Side - Branding */}
            <div className="login-hero" style={{ backgroundImage: "url('/src/assets/login-hero.svg')" }}>
                <div className="hero-content">
                    <h1>Delivery<span className="text-primary">Connect</span></h1>
                    <p>Fast, Reliable, and Secure delivery at your fingertips.</p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="login-form-wrapper">
                <div className="glass-panel login-card" style={{ animation: 'splash-text-in 0.5s ease both' }}>
                    <div className="login-header">
                        <h2>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
                        <p className="text-muted">
                            {isSignUp ? 'Join our fleet of delivery professionals' : 'Enter your credentials to access your dashboard'}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="auth-form">
                        {isSignUp && (
                            <>
                                {/* ── Passport Photo Picker ── */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '1.5rem' }}>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={handlePhotoSelect}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => fileInputRef.current?.click()}
                                        style={{
                                            width: '100px', height: '120px',
                                            borderRadius: '8px',
                                            border: '2px dashed rgba(99,102,241,0.5)',
                                            background: photoPreview
                                                ? 'transparent'
                                                : 'rgba(99,102,241,0.05)',
                                            cursor: 'pointer',
                                            overflow: 'hidden',
                                            position: 'relative',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            flexDirection: 'column',
                                            gap: '0.5rem',
                                            transition: 'all 0.2s',
                                            padding: 0,
                                        }}
                                    >
                                        {photoPreview ? (
                                            <>
                                                <img
                                                    src={photoPreview}
                                                    alt="Preview"
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
                                                />
                                                {/* Overlay on hover */}
                                                <div style={{
                                                    position: 'absolute', inset: 0,
                                                    background: 'rgba(0,0,0,0.45)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    flexDirection: 'column', gap: '0.3rem',
                                                    opacity: 0, transition: 'opacity 0.2s',
                                                }}
                                                    onMouseEnter={e => e.currentTarget.style.opacity = 1}
                                                    onMouseLeave={e => e.currentTarget.style.opacity = 0}
                                                >
                                                    <Camera size={20} color="white" />
                                                    <span style={{ color: 'white', fontSize: '0.7rem', fontWeight: 600 }}>Change</span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div style={{
                                                    width: '40px', height: '40px', borderRadius: '50%',
                                                    background: 'rgba(99,102,241,0.15)',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                }}>
                                                    <User size={22} color="var(--primary)" />
                                                </div>
                                                <Camera size={16} color="var(--text-muted)" />
                                                <span style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 500, textAlign: 'center', lineHeight: 1.3 }}>
                                                    Upload Photo
                                                </span>
                                            </>
                                        )}
                                    </button>
                                    <p style={{ marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                                        Passport size · Max 5MB
                                    </p>
                                </div>

                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input type="text" placeholder="John Doe" className="input-field"
                                        value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                                </div>

                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input type="email" placeholder="john@example.com" className="input-field"
                                        value={realEmail} onChange={(e) => setRealEmail(e.target.value)} required />
                                </div>

                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input type="tel" placeholder="+91 9876543210" className="input-field"
                                        value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} required />
                                </div>

                                <div className="form-group">
                                    <label>Address</label>
                                    <textarea placeholder="123 Main St, City, State" className="input-field"
                                        value={address} onChange={(e) => setAddress(e.target.value)}
                                        required rows={2} style={{ resize: 'vertical', fontFamily: 'inherit' }} />
                                </div>
                            </>
                        )}

                        <div className="form-group">
                            <label>Username</label>
                            <input type="text" placeholder="johndoe" className="input-field"
                                value={username} onChange={(e) => setUsername(e.target.value)} required />
                        </div>

                        <div className="form-group" style={{ marginBottom: '1.75rem' }}>
                            <label>Password</label>
                            <input type="password" placeholder="••••••••" className="input-field"
                                value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>

                        <button type="submit" className="btn-primary w-full" disabled={loading}
                            style={{ padding: '0.85rem', fontSize: '1rem' }}>
                            {loading
                                ? (isSignUp ? 'Creating account…' : 'Processing...')
                                : (isSignUp ? 'Sign Up' : 'Log In')}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p>
                            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                            <span onClick={switchMode} className="toggle-auth">
                                {isSignUp ? 'Log In' : 'Sign Up'}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
