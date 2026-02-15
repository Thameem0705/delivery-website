
import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useNavigate } from 'react-router-dom'
import toast, { Toaster } from 'react-hot-toast'

export default function Login() {
    const [loading, setLoading] = useState(false)
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [fullName, setFullName] = useState('')
    const [isSignUp, setIsSignUp] = useState(false)
    const navigate = useNavigate()

    const handleAuth = async (e) => {
        e.preventDefault()
        setLoading(true)

        // Validate username format (words & numbers only)
        const usernameRegex = /^[a-zA-Z0-9]+$/
        if (!usernameRegex.test(username)) {
            toast.error('Username must contain only letters and numbers')
            setLoading(false)
            return
        }

        // Append dummy domain to username to create a valid email format for Supabase
        const email = `${username}@delivery.local`

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                            username: username,
                        },
                    },
                })
                if (error) throw error
                toast.success('Signup successful! You can now log in.')
                setIsSignUp(false)
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                })
                if (error) throw error
                toast.success('Login successful!')
                navigate('/') // Protected route will redirect based on role
            }
        } catch (error) {
            toast.error(error.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="login-container">
            <Toaster position="top-right" />

            {/* Left Side - Image/Branding (Visible on Desktop) */}
            <div className="login-hero" style={{ backgroundImage: "url('/src/assets/login-hero.svg')" }}>
                <div className="hero-content">
                    <h1>Delivery<span className="text-primary">Connect</span></h1>
                    <p>Fast, Reliable, and Secure delivery at your fingertips. Manage your fleet or deliver with ease.</p>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="login-form-wrapper">
                <div className="glass-panel login-card">
                    <div className="login-header">
                        <h2>{isSignUp ? 'Create Account' : 'Welcome Back'}</h2>
                        <p className="text-muted">
                            {isSignUp ? 'Join our fleet of delivery professionals' : 'Enter your credentials to access your dashboard'}
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="auth-form">
                        {isSignUp && (
                            <div className="form-group">
                                <label>Full Name</label>
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    className="input-field"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    required
                                />
                            </div>
                        )}

                        <div className="form-group">
                            <label>Username</label>
                            <input
                                type="text"
                                placeholder="johndoe"
                                className="input-field"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Password</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                className="input-field"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="btn-primary w-full" disabled={loading}>
                            {loading ? 'Processing...' : (isSignUp ? 'Sign Up' : 'Log In')}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p>
                            {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                            <span
                                onClick={() => setIsSignUp(!isSignUp)}
                                className="toggle-auth"
                            >
                                {isSignUp ? 'Log In' : 'Sign Up'}
                            </span>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    )
}
