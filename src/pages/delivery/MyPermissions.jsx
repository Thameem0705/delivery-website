import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { useAuth } from '../../context/AuthContext'
import {
    ShieldCheck, Clock, CheckCircle, XCircle,
    Send, AlertCircle, ChevronDown, Plus
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

const REQUEST_TYPES = [
    'Leave Request',
    'Extra Allowance',
    'Route Change',
    'Equipment Request',
    'Complaint',
    'Other',
]

export default function MyPermissions() {
    const { user, profile } = useAuth()
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ type: REQUEST_TYPES[0], message: '' })
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => { fetchMyRequests() }, [user])

    const fetchMyRequests = async () => {
        if (!user) return
        try {
            const { data, error } = await supabase
                .from('permission_requests')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
            if (error) throw error
            setRequests(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const submitRequest = async (e) => {
        e.preventDefault()
        if (!form.message.trim()) { toast.error('Please write your message.'); return }
        setSubmitting(true)
        try {
            const { error } = await supabase.from('permission_requests').insert({
                user_id: user.id,
                user_name: profile?.full_name || 'Unknown',
                type: form.type,
                message: form.message.trim(),
                status: 'pending',
            })
            if (error) throw error
            toast.success('Request submitted!')
            setForm({ type: REQUEST_TYPES[0], message: '' })
            setShowForm(false)
            fetchMyRequests()
        } catch (err) {
            toast.error(err.message)
        } finally {
            setSubmitting(false)
        }
    }

    const statusInfo = {
        pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', icon: Clock, label: 'Pending' },
        approved: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', icon: CheckCircle, label: 'Approved' },
        denied: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', icon: XCircle, label: 'Denied' },
    }

    return (
        <div className="page-container">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="glass-panel" style={{ padding: '1.5rem 1.75rem', marginBottom: '1.5rem', background: 'linear-gradient(135deg,rgba(99,102,241,0.08),rgba(139,92,246,0.05))', border: '1px solid rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', padding: '0.6rem', borderRadius: '0.75rem', display: 'flex', flexShrink: 0 }}>
                        <ShieldCheck size={24} color="white" />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 'clamp(1.2rem,4vw,1.75rem)', fontWeight: 800 }}>Permission Requests</h2>
                        <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Submit and track your requests to the admin.</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowForm(v => !v)}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '0.65rem', border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem', boxShadow: '0 4px 15px rgba(99,102,241,0.3)', transition: 'opacity 0.2s' }}
                >
                    <Plus size={16} /> New Request
                </button>
            </div>

            {/* New Request Form */}
            {showForm && (
                <div className="glass-panel" style={{ padding: '1.5rem', marginBottom: '1.5rem', border: '1px solid rgba(99,102,241,0.25)', animation: 'splash-text-in 0.3s ease' }}>
                    <h3 style={{ margin: '0 0 1.25rem', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Send size={16} color="#818cf8" /> Submit a New Request
                    </h3>
                    <form onSubmit={submitRequest}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Request Type</label>
                            <div style={{ position: 'relative' }}>
                                <select
                                    value={form.type}
                                    onChange={e => setForm({ ...form, type: e.target.value })}
                                    className="input-field"
                                    style={{ appearance: 'none', paddingRight: '2.5rem' }}
                                >
                                    {REQUEST_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                                </select>
                                <ChevronDown size={16} style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
                            </div>
                        </div>
                        <div style={{ marginBottom: '1.25rem' }}>
                            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Your Message</label>
                            <textarea
                                value={form.message}
                                onChange={e => setForm({ ...form, message: e.target.value })}
                                rows={4}
                                placeholder="Describe your request in detail..."
                                className="input-field"
                                style={{ resize: 'vertical', fontFamily: 'inherit' }}
                                required
                            />
                        </div>
                        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button type="button" onClick={() => setShowForm(false)} style={{ padding: '0.6rem 1.2rem', borderRadius: '0.6rem', border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: 600 }}>Cancel</button>
                            <button type="submit" disabled={submitting} style={{ padding: '0.6rem 1.5rem', borderRadius: '0.6rem', border: 'none', background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', cursor: 'pointer', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Send size={15} /> {submitting ? 'Sending…' : 'Submit'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Requests List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading...</div>
            ) : requests.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                    <AlertCircle size={40} style={{ margin: '0 auto 1rem', opacity: 0.3, display: 'block' }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>No Requests Yet</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Click "New Request" to submit your first request to the admin.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {requests.map((req, i) => {
                        const s = statusInfo[req.status] || statusInfo.pending
                        const SIcon = s.icon
                        return (
                            <div key={req.id} className="glass-panel" style={{ padding: '1.25rem 1.5rem', animation: `fadeIn 0.3s ease ${i * 0.05}s both`, borderLeft: `4px solid ${s.color}` }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                                            <span style={{ fontWeight: 700, color: 'white', fontSize: '0.95rem' }}>{req.type}</span>
                                            <span style={{ padding: '0.15rem 0.6rem', borderRadius: '999px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', color: s.color, background: s.bg, border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <SIcon size={11} /> {s.label}
                                            </span>
                                        </div>
                                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.55 }}>{req.message}</p>
                                        {req.admin_reply && (
                                            <div style={{ marginTop: '0.75rem', padding: '0.65rem 0.9rem', background: 'rgba(15,23,42,0.6)', borderRadius: '0.6rem', border: '1px solid rgba(255,255,255,0.06)', borderLeft: `3px solid ${s.color}` }}>
                                                <p style={{ margin: 0, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Admin Reply</p>
                                                <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.875rem' }}>{req.admin_reply}</p>
                                            </div>
                                        )}
                                    </div>
                                    <span style={{ fontSize: '0.73rem', color: 'var(--text-muted)', flexShrink: 0 }}>
                                        {new Date(req.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </span>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
