import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import {
    ShieldCheck, Clock, CheckCircle, XCircle,
    AlertCircle, MessageSquare, ChevronDown
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function AdminPermissions() {
    const [requests, setRequests] = useState([])
    const [loading, setLoading] = useState(true)
    const [filter, setFilter] = useState('all')
    const [replyModal, setReplyModal] = useState(null) // { request }
    const [replyText, setReplyText] = useState('')
    const [processing, setProcessing] = useState(false)

    useEffect(() => { fetchRequests() }, [])

    const fetchRequests = async () => {
        try {
            const { data, error } = await supabase
                .from('permission_requests')
                .select('*')
                .order('created_at', { ascending: false })
            if (error) throw error
            setRequests(data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const updateRequest = async (id, status) => {
        setProcessing(true)
        try {
            const { error } = await supabase
                .from('permission_requests')
                .update({ status, admin_reply: replyText.trim() || null })
                .eq('id', id)
            if (error) throw error
            setRequests(prev => prev.map(r => r.id === id ? { ...r, status, admin_reply: replyText.trim() || null } : r))
            toast.success(`Request ${status}!`)
            setReplyModal(null)
            setReplyText('')
        } catch (err) {
            toast.error('Failed: ' + err.message)
        } finally {
            setProcessing(false)
        }
    }

    const statusInfo = {
        pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', icon: Clock, label: 'Pending' },
        approved: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', icon: CheckCircle, label: 'Approved' },
        denied: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', icon: XCircle, label: 'Denied' },
    }

    const filtered = filter === 'all' ? requests : requests.filter(r => r.status === filter)
    const pending = requests.filter(r => r.status === 'pending').length

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
                        <h2 style={{ margin: 0, fontSize: 'clamp(1.2rem,4vw,1.75rem)', fontWeight: 800 }}>
                            Permission Requests
                            {pending > 0 && <span style={{ marginLeft: '0.6rem', padding: '0.15rem 0.6rem', borderRadius: '999px', background: 'rgba(245,158,11,0.15)', color: '#fbbf24', fontSize: '0.75rem', fontWeight: 700, border: '1px solid rgba(245,158,11,0.3)' }}>{pending} new</span>}
                        </h2>
                        <p style={{ margin: '0.2rem 0 0', color: 'var(--text-muted)', fontSize: '0.875rem' }}>Review and respond to delivery team requests.</p>
                    </div>
                </div>
                {/* Filter */}
                <div style={{ position: 'relative' }}>
                    <select value={filter} onChange={e => setFilter(e.target.value)}
                        className="input-field" style={{ paddingRight: '2rem', paddingLeft: '0.75rem', fontSize: '0.85rem', appearance: 'none', cursor: 'pointer' }}>
                        <option value="all">All Requests</option>
                        <option value="pending">Pending</option>
                        <option value="approved">Approved</option>
                        <option value="denied">Denied</option>
                    </select>
                    <ChevronDown size={15} style={{ position: 'absolute', right: '0.6rem', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-muted)' }} />
                </div>
            </div>

            {/* List */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>Loading...</div>
            ) : filtered.length === 0 ? (
                <div className="glass-panel" style={{ textAlign: 'center', padding: '3rem 2rem' }}>
                    <AlertCircle size={40} style={{ margin: '0 auto 1rem', opacity: 0.3, display: 'block' }} />
                    <h3 style={{ marginBottom: '0.5rem' }}>No Requests</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>No permission requests in this category.</p>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {filtered.map((req, i) => {
                        const s = statusInfo[req.status] || statusInfo.pending
                        const SIcon = s.icon
                        return (
                            <div key={req.id} className="glass-panel" style={{ padding: '1.25rem 1.5rem', animation: `fadeIn 0.3s ease ${i * 0.04}s both`, borderLeft: `4px solid ${s.color}` }}>
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                                            <span style={{ fontWeight: 700, color: 'white' }}>{req.user_name}</span>
                                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', background: 'rgba(255,255,255,0.06)', padding: '0.1rem 0.5rem', borderRadius: '0.35rem' }}>{req.type}</span>
                                            <span style={{ padding: '0.15rem 0.6rem', borderRadius: '999px', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', color: s.color, background: s.bg, border: `1px solid ${s.border}`, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                                <SIcon size={11} /> {s.label}
                                            </span>
                                        </div>
                                        <p style={{ margin: '0 0 0.5rem', color: '#94a3b8', fontSize: '0.875rem', lineHeight: 1.55 }}>{req.message}</p>
                                        {req.admin_reply && (
                                            <div style={{ padding: '0.6rem 0.85rem', background: 'rgba(15,23,42,0.5)', borderRadius: '0.5rem', border: `1px solid ${s.border}`, borderLeft: `3px solid ${s.color}` }}>
                                                <p style={{ margin: '0 0 0.2rem', fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'flex', alignItems: 'center', gap: '0.3rem' }}><MessageSquare size={11} /> Your Reply</p>
                                                <p style={{ margin: 0, color: '#e2e8f0', fontSize: '0.875rem' }}>{req.admin_reply}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
                                        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                                            {new Date(req.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                        </span>
                                        {req.status === 'pending' && (
                                            <button onClick={() => { setReplyModal(req); setReplyText('') }}
                                                style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', padding: '0.4rem 0.85rem', borderRadius: '0.5rem', border: '1px solid rgba(99,102,241,0.35)', background: 'rgba(99,102,241,0.08)', color: '#a5b4fc', cursor: 'pointer', fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.2s' }}
                                                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; e.currentTarget.style.color = 'white' }}
                                                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.color = '#a5b4fc' }}
                                            >
                                                <MessageSquare size={14} /> Respond
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Response Modal */}
            {replyModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
                    style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
                    onClick={() => setReplyModal(null)}>
                    <div className="glass-panel w-full max-w-lg animate-scaleIn" style={{ padding: 0 }} onClick={e => e.stopPropagation()}>
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                                <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.1rem' }}>Respond to Request</h3>
                                <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{replyModal.user_name} — {replyModal.type}</p>
                            </div>
                            <button onClick={() => setReplyModal(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}>✕</button>
                        </div>
                        <div style={{ padding: '1.25rem 1.5rem' }}>
                            <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.25rem', padding: '0.75rem', background: 'rgba(15,23,42,0.5)', borderRadius: '0.6rem', border: '1px solid rgba(255,255,255,0.06)' }}>
                                "{replyModal.message}"
                            </p>
                            <div style={{ marginBottom: '1.25rem' }}>
                                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reply (optional)</label>
                                <textarea value={replyText} onChange={e => setReplyText(e.target.value)} rows={3}
                                    placeholder="Write a reply to the driver..." className="input-field"
                                    style={{ resize: 'vertical', fontFamily: 'inherit' }} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <button onClick={() => updateRequest(replyModal.id, 'denied')} disabled={processing}
                                    style={{ padding: '0.7rem', borderRadius: '0.65rem', border: '1px solid rgba(239,68,68,0.4)', background: 'rgba(239,68,68,0.08)', color: '#f87171', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', transition: 'all 0.2s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}
                                >
                                    <XCircle size={16} /> Deny
                                </button>
                                <button onClick={() => updateRequest(replyModal.id, 'approved')} disabled={processing}
                                    style={{ padding: '0.7rem', borderRadius: '0.65rem', border: 'none', background: 'linear-gradient(135deg,#10b981,#059669)', color: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', boxShadow: '0 4px 15px rgba(16,185,129,0.3)', transition: 'opacity 0.2s', opacity: processing ? 0.7 : 1 }}
                                >
                                    <CheckCircle size={16} /> Approve
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
