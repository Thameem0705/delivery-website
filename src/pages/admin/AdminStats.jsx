import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import {
    Package, Clock, CheckCircle, TrendingUp, Activity,
    MapPin, User, Plus, List, Zap, ArrowRight, RefreshCw
} from 'lucide-react'
import { Link } from 'react-router-dom'

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
}

function RingChart({ percentage, size = 120, strokeWidth = 10 }) {
    const radius = (size - strokeWidth) / 2
    const circumference = 2 * Math.PI * radius
    const offset = circumference - (percentage / 100) * circumference
    const color = percentage >= 70 ? '#10b981' : percentage >= 40 ? '#f59e0b' : '#ef4444'

    return (
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <circle cx={size / 2} cy={size / 2} r={radius}
                fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeWidth} />
            <circle cx={size / 2} cy={size / 2} r={radius}
                fill="none" stroke={color} strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4,0,0.2,1)', filter: `drop-shadow(0 0 6px ${color}88)` }}
            />
        </svg>
    )
}

export default function AdminStats() {
    const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 })
    const [recentTasks, setRecentTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [refreshing, setRefreshing] = useState(false)

    useEffect(() => {
        fetchData()
        const channel = supabase.channel('admin-stats')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchData())
            .subscribe()
        return () => supabase.removeChannel(channel)
    }, [])

    const fetchData = async (showRefresh = false) => {
        if (showRefresh) setRefreshing(true)
        try {
            const { data: tasks, error } = await supabase
                .from('tasks').select('*, assigned_to(full_name)')
                .order('created_at', { ascending: false })
            if (error) throw error
            setStats({
                total: tasks.length,
                pending: tasks.filter(t => t.status === 'pending').length,
                inProgress: tasks.filter(t => t.status === 'in-progress').length,
                completed: tasks.filter(t => t.status === 'completed').length,
            })
            setRecentTasks(tasks.slice(0, 8))
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
            setRefreshing(false)
        }
    }

    const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

    const statCards = [
        { title: 'Total Tasks', value: stats.total, icon: Package, color: '#6366f1', bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.25)', glow: '0 0 40px rgba(99,102,241,0.12)', sub: 'All assignments', topBorder: '#6366f1' },
        { title: 'Pending', value: stats.pending, icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.25)', glow: '0 0 40px rgba(245,158,11,0.12)', sub: 'Awaiting pickup', topBorder: '#f59e0b' },
        { title: 'Completed', value: stats.completed, icon: CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.25)', glow: '0 0 40px rgba(16,185,129,0.12)', sub: 'Successfully delivered', topBorder: '#10b981' },
    ]

    return (
        <div className="page-container">
            {/* ── Page Header ── */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <div className="section-header" style={{ marginBottom: '0.4rem' }}>
                        <div className="section-icon section-icon-primary">
                            <Activity size={22} color="white" />
                        </div>
                        <h2 style={{ margin: 0, fontSize: 'clamp(1.25rem, 3vw, 1.75rem)' }}>
                            Dashboard <span className="gradient-text">Overview</span>
                        </h2>
                    </div>
                    <p style={{ color: 'var(--text-muted)', margin: '0 0 0 3.5rem', fontSize: '0.9rem' }}>
                        Real-time insights into your delivery operations.
                    </p>
                </div>
                <button
                    onClick={() => fetchData(true)}
                    className="btn-secondary"
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 'max-content' }}
                >
                    <RefreshCw size={16} style={{ animation: refreshing ? 'spin 1s linear infinite' : 'none' }} />
                    Refresh
                </button>
            </div>

            {/* ── Quick Actions ── */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
                <Link to="/admin/create" className="btn-primary" style={{ textDecoration: 'none' }}>
                    <Plus size={18} /> New Task
                </Link>
                <Link to="/admin/tasks" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <List size={18} /> View All Tasks
                </Link>
                <Link to="/admin/users" className="btn-secondary" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={18} /> Delivery Team
                </Link>
            </div>

            {/* ── Stat Cards ── */}
            <div className="stats-grid" style={{ marginBottom: '1.75rem' }}>
                {statCards.map(({ title, value, icon: Icon, color, bg, border, glow, sub, topBorder }) => (
                    <div key={title} className="stat-card-3d" style={{ padding: '1.5rem', borderColor: border, boxShadow: `var(--shadow-3d), ${glow}`, borderTop: `3px solid ${topBorder}` }}>
                        {/* Background glow blob */}
                        <div style={{ position: 'absolute', top: '-20px', right: '-20px', width: '120px', height: '120px', background: bg, borderRadius: '50%', filter: 'blur(30px)', pointerEvents: 'none' }} />
                        <div style={{ position: 'relative', zIndex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                <div style={{ background: bg, border: `1px solid ${border}`, borderRadius: '0.75rem', padding: '0.65rem', display: 'flex', boxShadow: `0 4px 12px ${color}30` }}>
                                    <Icon size={22} color={color} />
                                </div>
                                <Zap size={14} color={color} style={{ opacity: 0.4, marginTop: '0.25rem' }} />
                            </div>
                            <p style={{ margin: '0 0 0.25rem', fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</p>
                            <p style={{ margin: '0 0 0.25rem', fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 900, color: 'white', lineHeight: 1, letterSpacing: '-1.5px' }}>
                                {loading ? '–' : value}
                            </p>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{sub}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Bottom: Ring Chart + Recent Activity ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr)', gap: '1.25rem' }}>
                {/* Completion Rate with Ring */}
                <div className="card-3d" style={{ padding: '1.5rem', border: '1px solid rgba(99,102,241,0.2)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ padding: '0.5rem', background: 'rgba(99,102,241,0.1)', borderRadius: '0.75rem', border: '1px solid rgba(99,102,241,0.2)', display: 'flex' }}>
                                <TrendingUp size={20} color="var(--primary)" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Completion Rate</h3>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Overall delivery performance</p>
                            </div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                            <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                                <RingChart percentage={loading ? 0 : completionRate} size={100} strokeWidth={9} />
                                <div style={{ position: 'absolute', textAlign: 'center' }}>
                                    <p style={{ margin: 0, fontSize: '1.4rem', fontWeight: 900, color: completionRate >= 70 ? '#10b981' : completionRate >= 40 ? '#f59e0b' : '#ef4444', lineHeight: 1 }}>
                                        {completionRate}%
                                    </p>
                                </div>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                                {[
                                    { label: 'Completed', val: stats.completed, color: '#10b981' },
                                    { label: 'Pending', val: stats.pending, color: '#f59e0b' },
                                    { label: 'In Progress', val: stats.inProgress, color: '#8b5cf6' },
                                ].map(({ label, val, color }) => (
                                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}80`, flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{label}</span>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'white', marginLeft: 'auto', paddingLeft: '0.5rem' }}>{val}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    {/* Progress bar */}
                    <div className="progress-track">
                        <div className="progress-fill" style={{
                            width: `${completionRate}%`,
                            background: completionRate >= 70
                                ? 'linear-gradient(to right, #10b981, #34d399)'
                                : completionRate >= 40
                                    ? 'linear-gradient(to right, #f59e0b, #fbbf24)'
                                    : 'linear-gradient(to right, #ef4444, #f87171)',
                        }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.5rem', fontSize: '0.7rem', color: 'var(--text-subtle)' }}>
                        <span>0%</span>
                        <span>{stats.completed} of {stats.total} tasks completed</span>
                        <span>100%</span>
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="card-3d" style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ padding: '0.5rem', background: 'rgba(139,92,246,0.1)', borderRadius: '0.75rem', border: '1px solid rgba(139,92,246,0.2)', display: 'flex' }}>
                                <Activity size={20} color="var(--accent-purple)" />
                            </div>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700 }}>Recent Activity</h3>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Latest task updates</p>
                            </div>
                        </div>
                        <Link to="/admin/tasks" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--primary)', fontWeight: 600 }}>
                            View All <ArrowRight size={14} />
                        </Link>
                    </div>

                    {loading ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="shimmer" style={{ height: '56px', borderRadius: '0.75rem' }} />
                            ))}
                        </div>
                    ) : recentTasks.length === 0 ? (
                        <div className="empty-state" style={{ padding: '2.5rem 1rem' }}>
                            <div className="empty-icon"><Package size={32} color="var(--primary)" style={{ opacity: 0.6 }} /></div>
                            <h3 style={{ fontSize: '1rem' }}>No tasks yet</h3>
                            <p style={{ fontSize: '0.875rem' }}>Create your first assignment to get started!</p>
                            <Link to="/admin/create" className="btn-primary" style={{ textDecoration: 'none', marginTop: '1rem' }}>
                                <Plus size={16} /> Create Task
                            </Link>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                            {recentTasks.map((task, i) => {
                                const isCompleted = task.status === 'completed'
                                const statusColor = isCompleted ? '#10b981' : task.status === 'in-progress' ? '#8b5cf6' : '#f59e0b'
                                return (
                                    <div key={task.id} style={{
                                        display: 'flex', alignItems: 'center', gap: '0.875rem',
                                        padding: '0.875rem 1rem', borderRadius: '0.875rem',
                                        background: 'rgba(6,11,24,0.5)', border: '1px solid rgba(255,255,255,0.05)',
                                        transition: 'background 0.2s, border-color 0.2s',
                                        animation: `fadeIn 0.35s ease ${i * 0.04}s both`,
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)' }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(6,11,24,0.5)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)' }}
                                    >
                                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: statusColor, boxShadow: `0 0 8px ${statusColor}aa`, flexShrink: 0 }} />
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</p>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                                                {task.location_address && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                                                        <MapPin size={10} />{task.location_address.slice(0, 28)}…
                                                    </span>
                                                )}
                                                {task.assigned_to?.full_name && (
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                                                        <User size={10} />{task.assigned_to.full_name}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem', flexShrink: 0 }}>
                                            <span style={{
                                                padding: '0.2rem 0.6rem', borderRadius: '999px', fontSize: '0.65rem',
                                                fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
                                                color: statusColor, background: `${statusColor}18`, border: `1px solid ${statusColor}35`,
                                            }}>
                                                {task.status}
                                            </span>
                                            <span style={{ fontSize: '0.68rem', color: 'var(--text-subtle)' }}>{timeAgo(task.created_at)}</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
