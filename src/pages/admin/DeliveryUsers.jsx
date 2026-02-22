import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import {
    User, Search, Mail, Calendar, Hash, Truck,
    Phone, MapPin, BarChart2, X, CheckCircle,
    Clock, Package, TrendingUp, AlertCircle,
    Trash2
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function DeliveryUsers() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    // Report modal
    const [reportUser, setReportUser] = useState(null)
    const [reportData, setReportData] = useState(null)
    const [reportLoading, setReportLoading] = useState(false)

    // Remove user confirmation modal
    const [removeTarget, setRemoveTarget] = useState(null)
    const [removing, setRemoving] = useState(false)

    useEffect(() => { fetchUsers() }, [])

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'delivery')
                .order('created_at', { ascending: false })
            if (error) throw error
            setUsers(data)
        } catch (error) {
            console.error('Error fetching users:', error)
        } finally {
            setLoading(false)
        }
    }

    // ── Remove User ──
    const confirmRemove = (user) => setRemoveTarget(user)
    const cancelRemove = () => setRemoveTarget(null)
    const executeRemove = async () => {
        if (!removeTarget) return
        setRemoving(true)
        try {
            const { error } = await supabase
                .from('profiles')
                .delete()
                .eq('id', removeTarget.id)
            if (error) throw error
            setUsers(prev => prev.filter(u => u.id !== removeTarget.id))
            toast.success(`${removeTarget.full_name} removed from the team.`)
            setRemoveTarget(null)
        } catch (err) {
            toast.error('Failed to remove user: ' + err.message)
        } finally {
            setRemoving(false)
        }
    }

    // ── Report ──
    const openReport = async (user) => {
        setReportUser(user); setReportData(null); setReportLoading(true)
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('id, title, status, created_at, location_address')
                .eq('assigned_to', user.id)
                .order('created_at', { ascending: false })
            if (error) throw error
            const total = data.length
            const completed = data.filter(t => t.status === 'completed').length
            const pending = data.filter(t => t.status === 'pending').length
            const inProgress = data.filter(t => t.status === 'in-progress').length
            const rate = total > 0 ? Math.round((completed / total) * 100) : 0
            setReportData({ tasks: data, total, completed, pending, inProgress, rate })
        } catch (err) { console.error(err) }
        finally { setReportLoading(false) }
    }
    const closeReport = () => { setReportUser(null); setReportData(null) }

    const filteredUsers = users.filter(u =>
        (u.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

    const statusColor = s => s === 'completed' ? '#10b981' : s === 'in-progress' ? '#8b5cf6' : '#f59e0b'
    const statusBg = s => s === 'completed' ? 'rgba(16,185,129,0.1)' : s === 'in-progress' ? 'rgba(139,92,246,0.1)' : 'rgba(245,158,11,0.1)'

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8 animate-fadeIn">
            <Toaster position="top-right" />

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-8">
                <div>
                    <h2 className="text-3xl font-bold flex items-center gap-4">
                        <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 rounded-2xl shadow-xl shadow-purple-500/20">
                            <Truck size={32} className="text-white" />
                        </div>
                        <span style={{ background: 'linear-gradient(to right, #fff, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                            Delivery Team
                        </span>
                    </h2>
                    <p className="text-gray-400 mt-3 text-lg font-light">
                        Manage and monitor your fleet of {users.length} delivery professionals.
                    </p>
                </div>
                <div className="glass-panel px-8 py-4 flex flex-col items-center justify-center bg-white/[0.03] border border-white/10 min-w-[180px]">
                    <span className="text-xs text-blue-400 font-bold uppercase tracking-widest mb-1">Total Active</span>
                    <span className="text-4xl font-extrabold text-white tracking-tight">{users.length}</span>
                </div>
            </div>

            {/* Search */}
            <div className="relative group max-w-2xl">
                <div className="relative flex items-center bg-slate-900/80 border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-xl focus-within:border-primary/50 transition-all duration-300">
                    <div className="p-3 bg-white/5 rounded-xl text-gray-400 transition-colors"><Search size={22} /></div>
                    <input
                        className="w-full bg-transparent border-none px-4 py-2.5 text-base text-white placeholder-gray-500 focus:outline-none"
                        placeholder="Search drivers by name, username..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && <button onClick={() => setSearchQuery('')} className="p-2 text-gray-500 hover:text-white">✕</button>}
                </div>
            </div>

            {/* Grid */}
            {loading ? (
                <div className="flex justify-center py-24">
                    <div className="w-14 h-14 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {filteredUsers.map(user => (
                        <div key={user.id}
                            className="group relative bg-[#0f172a] rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1"
                            style={{ boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', border: '1px solid rgba(255,255,255,0.1)' }}
                        >
                            {/* Gradient border on hover */}
                            <div className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-500"
                                style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #3b82f6)', padding: '1px', WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)', WebkitMaskComposite: 'xor' }} />

                            <div className="relative z-10 flex flex-col h-full">

                                {/* Profile Header */}
                                <div className="relative p-4 mb-4 rounded-r-xl rounded-l-sm bg-white/[0.03]"
                                    style={{ borderLeft: '5px solid #10b981', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="relative">
                                            <div style={{ width: '3.5rem', height: '4.2rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', background: '#0f172a' }}>
                                                {user.avatar_url ? (
                                                    <img src={user.avatar_url} alt={user.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                                                ) : (
                                                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))', fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                                                        {(user.full_name || '?').charAt(0).toUpperCase()}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#0f172a] rounded-full flex items-center justify-center border border-white/5">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                            </div>
                                        </div>
                                        <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-full border border-emerald-500/20">Active</span>
                                    </div>
                                    <h3 className="text-lg font-bold text-white truncate">{user.full_name || 'Unnamed'}</h3>
                                    <div className="flex items-center gap-1.5 text-slate-400 text-sm mt-1">
                                        <Hash size={11} className="text-slate-500" />
                                        <span className="truncate">@{user.username || 'unknown'}</span>
                                    </div>
                                </div>

                                {/* Info rows */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                                    {[
                                        { icon: Mail, color: '#3b82f6', bg: 'rgba(59,130,246,0.12)', label: 'Email', value: user.email || '—' },
                                        { icon: Phone, color: '#10b981', bg: 'rgba(16,185,129,0.12)', label: 'Phone', value: user.phone_number || '—' },
                                        { icon: MapPin, color: '#f97316', bg: 'rgba(249,115,22,0.12)', label: 'Address', value: user.address || '—' },
                                        { icon: Calendar, color: '#8b5cf6', bg: 'rgba(139,92,246,0.12)', label: 'Joined', value: new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }) },
                                    ].map(({ icon: Icon, color, bg, label, value }) => (
                                        <div key={label} style={{
                                            display: 'grid',
                                            gridTemplateColumns: '2.25rem 1fr',
                                            alignItems: 'center',
                                            gap: '0.65rem',
                                            padding: '0.55rem 0.75rem 0.55rem 0.65rem',
                                            background: 'rgba(15,23,42,0.45)',
                                            borderRadius: '0.5rem',
                                            borderLeft: `3px solid ${color}`,
                                        }}>
                                            {/* Icon pill */}
                                            <div style={{
                                                width: '2rem', height: '2rem', borderRadius: '0.45rem',
                                                background: bg, flexShrink: 0,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <Icon size={14} color={color} />
                                            </div>
                                            {/* Text */}
                                            <div style={{ minWidth: 0 }}>
                                                <div style={{
                                                    fontSize: '0.6rem', fontWeight: 700, color: color,
                                                    textTransform: 'uppercase', letterSpacing: '0.07em',
                                                    lineHeight: 1, marginBottom: '0.22rem',
                                                }}>
                                                    {label}
                                                </div>
                                                <div style={{
                                                    fontSize: '0.82rem', color: '#cbd5e1', fontWeight: 500,
                                                    overflow: 'hidden', textOverflow: 'ellipsis',
                                                    whiteSpace: label === 'Address' ? 'normal' : 'nowrap',
                                                    lineHeight: 1.35,
                                                }}>
                                                    {value}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>


                                {/* Action Buttons */}
                                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                                    <button onClick={() => openReport(user)} style={{
                                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                                        padding: '0.5rem 0.75rem', borderRadius: '0.65rem',
                                        border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99,102,241,0.08)',
                                        color: '#a5b4fc', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', transition: 'all 0.2s',
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)'; e.currentTarget.style.color = 'white' }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)'; e.currentTarget.style.color = '#a5b4fc' }}
                                    >
                                        <BarChart2 size={15} /> Report
                                    </button>
                                    <button onClick={() => confirmRemove(user)} style={{
                                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                                        padding: '0.5rem 0.75rem', borderRadius: '0.65rem',
                                        border: '1px solid rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.07)',
                                        color: '#f87171', cursor: 'pointer', fontWeight: 700, fontSize: '0.8rem', transition: 'all 0.2s',
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.6)'; e.currentTarget.style.color = 'white' }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.07)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)'; e.currentTarget.style.color = '#f87171' }}
                                    >
                                        <Trash2 size={15} /> Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && filteredUsers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                    <User size={40} className="text-gray-600 mb-4" />
                    <h3 className="text-xl font-bold text-white mb-2">No Drivers Found</h3>
                    <p className="text-gray-400">Try different keywords.</p>
                </div>
            )}

            {/* ════ REMOVE CONFIRMATION MODAL ════ */}
            {removeTarget && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
                    style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
                    onClick={cancelRemove}>
                    <div className="glass-panel w-full max-w-md animate-scaleIn" style={{ padding: 0 }} onClick={e => e.stopPropagation()}>
                        {/* Header */}
                        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(239,68,68,0.06)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ width: '2.5rem', height: '2.5rem', borderRadius: '50%', background: 'rgba(239,68,68,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(239,68,68,0.3)', flexShrink: 0 }}>
                                <Trash2 size={18} color="#f87171" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: 'white' }}>Remove Driver</h3>
                                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>This action cannot be undone</p>
                            </div>
                        </div>

                        {/* Body */}
                        <div style={{ padding: '1.5rem' }}>
                            {/* Driver chip */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', background: 'rgba(15,23,42,0.6)', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.06)', marginBottom: '1.25rem' }}>
                                <div style={{ width: '2.5rem', height: '3rem', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.08)', flexShrink: 0, background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.1))', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1rem', fontWeight: 800, color: 'var(--primary)' }}>
                                    {removeTarget.avatar_url
                                        ? <img src={removeTarget.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        : (removeTarget.full_name || '?').charAt(0).toUpperCase()
                                    }
                                </div>
                                <div>
                                    <p style={{ margin: 0, fontWeight: 700, color: 'white' }}>{removeTarget.full_name}</p>
                                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>@{removeTarget.username}</p>
                                </div>
                            </div>

                            <p style={{ color: '#cbd5e1', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                                Are you sure you want to remove <strong style={{ color: 'white' }}>{removeTarget.full_name}</strong> from the team? Their profile and all related data will be deleted.
                            </p>

                            {/* Yes / No buttons */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                                <button onClick={cancelRemove} style={{
                                    padding: '0.75rem', borderRadius: '0.65rem', border: '1px solid rgba(255,255,255,0.1)',
                                    background: 'rgba(255,255,255,0.04)', color: '#94a3b8', cursor: 'pointer', fontWeight: 700, fontSize: '0.95rem', transition: 'all 0.2s',
                                }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                                >
                                    ✕ No, Keep
                                </button>
                                <button onClick={executeRemove} disabled={removing} style={{
                                    padding: '0.75rem', borderRadius: '0.65rem', border: 'none',
                                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                                    color: 'white', cursor: removing ? 'not-allowed' : 'pointer', fontWeight: 700, fontSize: '0.95rem',
                                    boxShadow: '0 4px 15px rgba(239,68,68,0.3)', transition: 'all 0.2s', opacity: removing ? 0.7 : 1,
                                }}>
                                    {removing ? 'Removing…' : '✓ Yes, Remove'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ════ REPORT MODAL ════ */}
            {reportUser && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fadeIn"
                    style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}
                    onClick={closeReport}>
                    <div className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scaleIn"
                        style={{ padding: 0 }} onClick={e => e.stopPropagation()}>

                        <div style={{ padding: '1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.05))', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <div style={{ width: '3.5rem', height: '4.2rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0, background: 'rgba(99,102,241,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 900, color: 'white' }}>
                                {reportUser.avatar_url ? <img src={reportUser.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} /> : (reportUser.full_name || '?').charAt(0).toUpperCase()}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.7rem', color: '#818cf8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}><BarChart2 size={14} /> Delivery Report</div>
                                <h3 style={{ margin: '0.15rem 0 0', fontSize: '1.2rem', fontWeight: 800, color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{reportUser.full_name}</h3>
                                <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>@{reportUser.username}</p>
                            </div>
                            <button onClick={closeReport} style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', padding: '0.5rem', cursor: 'pointer', color: 'var(--text-muted)', display: 'flex' }}><X size={18} /></button>
                        </div>

                        <div style={{ padding: '1.5rem' }}>
                            {reportLoading ? (
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '180px', color: 'var(--text-muted)', gap: '0.75rem' }}>
                                    <div style={{ animation: 'spin 1s linear infinite' }}><Package size={26} /></div> Loading...
                                </div>
                            ) : reportData ? (<>
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(110px,1fr))', gap: '0.65rem', marginBottom: '1.25rem' }}>
                                    {[
                                        { label: 'Total', value: reportData.total, icon: Package, color: '#6366f1', bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.2)' },
                                        { label: 'Completed', value: reportData.completed, icon: CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.2)' },
                                        { label: 'Pending', value: reportData.pending, icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.2)' },
                                        { label: 'In Progress', value: reportData.inProgress, icon: TrendingUp, color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.2)' },
                                    ].map(({ label, value, icon: Icon, color, bg, border }) => (
                                        <div key={label} style={{ background: bg, border: `1px solid ${border}`, borderRadius: '0.75rem', padding: '0.9rem', textAlign: 'center' }}>
                                            <Icon size={20} color={color} style={{ margin: '0 auto 0.4rem' }} />
                                            <p style={{ margin: 0, fontSize: '1.6rem', fontWeight: 900, color: 'white', lineHeight: 1 }}>{value}</p>
                                            <p style={{ margin: '0.25rem 0 0', fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                                        </div>
                                    ))}
                                </div>
                                <div style={{ background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '0.75rem', padding: '1rem', marginBottom: '1.25rem' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>Completion Rate</span>
                                        <span style={{ fontWeight: 800, color: reportData.rate >= 70 ? '#10b981' : reportData.rate >= 40 ? '#8b5cf6' : '#f59e0b' }}>{reportData.rate}%</span>
                                    </div>
                                    <div style={{ height: '7px', background: 'rgba(255,255,255,0.06)', borderRadius: '7px', overflow: 'hidden' }}>
                                        <div style={{ height: '100%', width: `${reportData.rate}%`, borderRadius: '7px', background: reportData.rate >= 70 ? 'linear-gradient(to right,#10b981,#34d399)' : 'linear-gradient(to right,#6366f1,#8b5cf6)', transition: 'width 0.8s ease' }} />
                                    </div>
                                </div>
                                <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.6rem' }}>Task History ({reportData.total})</h4>
                                {reportData.tasks.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}><AlertCircle size={30} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} /><p>No tasks assigned yet.</p></div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '260px', overflowY: 'auto' }}>
                                        {reportData.tasks.map(task => (
                                            <div key={task.id} style={{ display: 'flex', alignItems: 'center', gap: '0.7rem', padding: '0.65rem 0.9rem', background: 'rgba(15,23,42,0.5)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '0.6rem', borderLeft: `3px solid ${statusColor(task.status)}` }}>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <p style={{ margin: 0, fontWeight: 600, fontSize: '0.88rem', color: 'white', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</p>
                                                    <p style={{ margin: '0.15rem 0 0', fontSize: '0.73rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.location_address}</p>
                                                </div>
                                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.2rem', flexShrink: 0 }}>
                                                    <span style={{ padding: '0.18rem 0.55rem', borderRadius: '999px', fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', color: statusColor(task.status), background: statusBg(task.status) }}>{task.status}</span>
                                                    <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)' }}>{new Date(task.created_at).toLocaleDateString()}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>) : null}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
