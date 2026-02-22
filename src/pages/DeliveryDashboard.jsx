
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import {
    MapPin, CheckCircle, Navigation, Package, Clock,
    Truck, Sun, Sunset, Moon, Star, TrendingUp, Zap, ArrowRight
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

function getGreeting() {
    const hour = new Date().getHours()
    if (hour < 12) return { text: 'Good Morning', icon: Sun, color: '#f59e0b' }
    if (hour < 17) return { text: 'Good Afternoon', icon: Sun, color: '#f97316' }
    if (hour < 20) return { text: 'Good Evening', icon: Sunset, color: '#ec4899' }
    return { text: 'Good Night', icon: Moon, color: '#8b5cf6' }
}

function timeAgo(dateStr) {
    const diff = Date.now() - new Date(dateStr).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24) return `${hrs}h ago`
    return `${Math.floor(hrs / 24)}d ago`
}

const statusConfig = {
    pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.2)', borderLeft: '#f59e0b', label: 'Pending' },
    'in-progress': { color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', border: 'rgba(139,92,246,0.2)', borderLeft: '#8b5cf6', label: 'In Progress' },
    completed: { color: '#10b981', bg: 'rgba(16,185,129,0.08)', border: 'rgba(16,185,129,0.2)', borderLeft: '#10b981', label: 'Completed' },
}

export default function DeliveryDashboard() {
    const { user, profile } = useAuth()
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeFilter, setActiveFilter] = useState('all')
    const [completing, setCompleting] = useState(null)

    const greeting = getGreeting()
    const GreetIcon = greeting.icon

    useEffect(() => {
        if (user) {
            fetchTasks()
            const channel = supabase
                .channel('delivery-tasks')
                .on('postgres_changes', {
                    event: '*', schema: 'public', table: 'tasks',
                    filter: `assigned_to=eq.${user.id}`
                }, (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setTasks(prev => [payload.new, ...prev])
                        toast('🔔 New task assigned to you!', { duration: 4000 })
                    } else if (payload.eventType === 'UPDATE') {
                        setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new : t))
                    }
                }).subscribe()
            return () => supabase.removeChannel(channel)
        }
    }, [user])

    const fetchTasks = async () => {
        try {
            const { data, error } = await supabase
                .from('tasks').select('*')
                .eq('assigned_to', user.id)
                .order('created_at', { ascending: false })
            if (error) throw error
            setTasks(data)
        } catch { toast.error('Failed to load tasks') }
        finally { setLoading(false) }
    }

    const markAsCompleted = async (taskId) => {
        setCompleting(taskId)
        try {
            const { error } = await supabase.from('tasks').update({ status: 'completed' }).eq('id', taskId)
            if (error) throw error
            toast.success('✅ Task marked as completed!')
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t))
        } catch { toast.error('Failed to update task') }
        finally { setCompleting(null) }
    }

    const pending = tasks.filter(t => t.status === 'pending').length
    const inProgress = tasks.filter(t => t.status === 'in-progress').length
    const completed = tasks.filter(t => t.status === 'completed').length
    const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0
    const filteredTasks = activeFilter === 'all' ? tasks : tasks.filter(t => t.status === activeFilter)

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: '1rem', color: 'var(--text-muted)' }}>
            <div style={{ animation: 'spin 1s linear infinite' }}><Truck size={32} color="var(--primary)" /></div>
            <span style={{ fontSize: '1.05rem', fontWeight: 500 }}>Loading assignments…</span>
        </div>
    )

    return (
        <div className="page-container" style={{ paddingTop: '0.5rem' }}>
            <Toaster position="top-right" toastOptions={{ style: { background: '#1e2942', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)' } }} />

            {/* ── 3D Hero Greeting ── */}
            <div className="hero-3d" style={{ padding: 'clamp(1.25rem,4vw,2rem)', marginBottom: '1.5rem' }}>
                {/* Background stars */}
                {[...Array(6)].map((_, i) => (
                    <div key={i} style={{
                        position: 'absolute', borderRadius: '50%',
                        width: `${2 + (i % 3)}px`, height: `${2 + (i % 3)}px`,
                        background: i % 2 === 0 ? 'rgba(99,102,241,0.6)' : 'rgba(6,182,212,0.5)',
                        top: `${15 + (i * 12)}%`, right: `${8 + (i * 5)}%`,
                        animation: `particleFloat ${3 + i * 0.4}s ease-in-out infinite ${i * 0.5}s`,
                        pointerEvents: 'none',
                    }} />
                ))}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', position: 'relative', zIndex: 1 }}>
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.4rem' }}>
                            <GreetIcon size={18} color={greeting.color} />
                            <span style={{ color: greeting.color, fontWeight: 600, fontSize: '0.875rem' }}>{greeting.text}</span>
                        </div>
                        <h2 style={{ margin: '0 0 0.4rem', fontSize: 'clamp(1.4rem,5vw,2.2rem)', fontWeight: 900, letterSpacing: '-1px' }}>
                            {profile?.full_name?.split(' ')[0] || 'Driver'} 👋
                        </h2>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                            You have <strong style={{ color: 'white' }}>{pending}</strong> pending {pending === 1 ? 'delivery' : 'deliveries'} today
                        </p>
                    </div>
                    {/* Completion orb */}
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.35rem' }}>
                            <svg width="80" height="80" style={{ transform: 'rotate(-90deg)' }}>
                                <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                                <circle cx="40" cy="40" r="32" fill="none"
                                    stroke={completionRate >= 70 ? '#10b981' : completionRate >= 40 ? '#f59e0b' : '#6366f1'}
                                    strokeWidth="6" strokeLinecap="round"
                                    strokeDasharray={2 * Math.PI * 32}
                                    strokeDashoffset={2 * Math.PI * 32 * (1 - completionRate / 100)}
                                    style={{ transition: 'stroke-dashoffset 0.8s ease', filter: 'drop-shadow(0 0 4px rgba(16,185,129,0.5))' }}
                                />
                            </svg>
                            <div style={{ position: 'absolute', textAlign: 'center' }}>
                                <p style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900, color: completionRate >= 70 ? '#10b981' : completionRate >= 40 ? '#f59e0b' : '#6366f1', lineHeight: 1 }}>{completionRate}%</p>
                            </div>
                        </div>
                        <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Done Today</p>
                    </div>
                </div>
            </div>

            {/* ── Stats Row ── */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total', value: tasks.length, icon: Package, color: '#6366f1', bg: 'rgba(99,102,241,0.12)', topBorder: '#6366f1' },
                    { label: 'Pending', value: pending, icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.12)', topBorder: '#f59e0b' },
                    { label: 'Done', value: completed, icon: CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.12)', topBorder: '#10b981' },
                ].map(({ label, value, icon: Icon, color, bg, topBorder }) => (
                    <div key={label} className="stat-card-3d" style={{ padding: '1rem 1.25rem', borderTop: `3px solid ${topBorder}`, display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
                        <div style={{ background: bg, border: `1px solid ${color}30`, borderRadius: '0.75rem', padding: '0.55rem', display: 'flex', flexShrink: 0 }}>
                            <Icon size={20} color={color} />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</p>
                            <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 900, color: 'white', lineHeight: 1.1, letterSpacing: '-0.5px' }}>{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Progress Bar ── */}
            {tasks.length > 0 && (
                <div className="card-3d" style={{ padding: '1.1rem 1.375rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.625rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TrendingUp size={15} color="var(--primary)" />
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Daily Progress</span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-subtle)' }}>{completed} / {tasks.length} tasks</span>
                    </div>
                    <div className="progress-track">
                        <div className="progress-fill" style={{
                            width: `${completionRate}%`,
                            background: completionRate >= 70
                                ? 'linear-gradient(to right, #10b981, #34d399)'
                                : completionRate >= 40
                                    ? 'linear-gradient(to right, #6366f1, #8b5cf6)'
                                    : 'linear-gradient(to right, #f59e0b, #fbbf24)',
                        }} />
                    </div>
                </div>
            )}

            {/* ── Filter Tabs ── */}
            <div className="filter-bar" style={{ marginBottom: '1.5rem' }}>
                {[
                    { key: 'all', label: `All (${tasks.length})` },
                    { key: 'pending', label: `Pending (${pending})` },
                    { key: 'in-progress', label: `Active (${inProgress})` },
                    { key: 'completed', label: `Done (${completed})` },
                ].map(({ key, label }) => (
                    <button key={key} className={`filter-tab ${activeFilter === key ? 'active' : ''}`} onClick={() => setActiveFilter(key)}>
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Task Cards ── */}
            <div style={{ display: 'grid', gap: '1.25rem' }}>
                {filteredTasks.map((task, i) => {
                    const sc = statusConfig[task.status] || statusConfig.pending
                    return (
                        <div key={task.id} className="card-3d" style={{
                            padding: 'clamp(1rem,4vw,1.5rem)',
                            borderLeft: `4px solid ${sc.borderLeft}`,
                            position: 'relative', overflow: 'hidden',
                            animation: `fadeIn 0.35s ease ${i * 0.06}s both`,
                        }}>
                            {/* Ambient glow */}
                            <div style={{
                                position: 'absolute', top: 0, right: 0, width: '180px', height: '180px',
                                background: `radial-gradient(circle, ${sc.bg} 0%, transparent 70%)`,
                                pointerEvents: 'none',
                            }} />

                            {/* Status badge */}
                            <div style={{
                                position: 'absolute', top: 0, right: 0,
                                padding: '0.25rem 0.75rem',
                                borderBottomLeftRadius: '0.75rem',
                                fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.08em',
                                color: sc.color, background: sc.bg, border: `1px solid ${sc.border}`,
                                borderTop: 'none', borderRight: 'none',
                            }}>
                                {sc.label.toUpperCase()}
                            </div>

                            {/* Title + time */}
                            <div style={{ marginBottom: '0.75rem', paddingRight: 'clamp(3rem,8vw,6rem)', position: 'relative' }}>
                                <h3 style={{ margin: '0 0 0.3rem', fontSize: 'clamp(1rem,3vw,1.2rem)', fontWeight: 700 }}>{task.title}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.78rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
                                    <Clock size={12} />
                                    <span>Assigned {timeAgo(task.created_at)}</span>
                                    {task.status === 'completed' && (
                                        <span style={{ color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                            <Star size={11} fill="#10b981" /> Delivered
                                        </span>
                                    )}
                                </div>
                            </div>

                            {/* Description */}
                            {task.description && (
                                <p className="line-clamp-2" style={{ color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6, fontSize: '0.9rem' }}>
                                    {task.description}
                                </p>
                            )}

                            {/* Location */}
                            <div style={{
                                background: 'rgba(0,0,0,0.3)', padding: '0.875rem 1rem', borderRadius: '0.75rem',
                                marginBottom: '1.125rem', border: '1px solid rgba(255,255,255,0.06)',
                                display: 'flex', alignItems: 'flex-start', gap: '0.75rem',
                            }}>
                                <MapPin size={17} color="var(--accent-blue)" style={{ marginTop: '1px', flexShrink: 0 }} />
                                <div>
                                    <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--text-subtle)', marginBottom: '0.2rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                        Delivery Location
                                    </span>
                                    <span style={{ fontWeight: 500, fontSize: '0.9rem' }}>{task.location_address}</span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                                <a href={task.google_maps_url} target="_blank" rel="noopener noreferrer"
                                    className="btn-secondary"
                                    style={{ textDecoration: 'none', flex: '1 1 120px', justifyContent: 'center', height: '44px' }}>
                                    <Navigation size={16} /> Open Maps
                                </a>
                                {task.status !== 'completed' && (
                                    <button
                                        onClick={() => markAsCompleted(task.id)}
                                        disabled={completing === task.id}
                                        className="btn-success"
                                        style={{ flex: '2 1 140px', justifyContent: 'center', height: '44px', position: 'relative', overflow: 'hidden' }}
                                    >
                                        {completing === task.id ? (
                                            <><div className="spinner" style={{ width: '18px', height: '18px' }} /> Saving…</>
                                        ) : (
                                            <><CheckCircle size={17} /> Mark Delivered</>
                                        )}
                                    </button>
                                )}
                                {task.status === 'completed' && (
                                    <div style={{ flex: '2 1 140px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', height: '44px', borderRadius: '0.75rem', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', color: '#10b981', fontSize: '0.9rem', fontWeight: 600 }}>
                                        <Star size={16} fill="#10b981" /> Delivered
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}

                {/* Empty State */}
                {filteredTasks.length === 0 && (
                    <div className="card-3d empty-state">
                        <div className="empty-icon">
                            <CheckCircle size={34} color="var(--success)" style={{ opacity: 0.7 }} />
                        </div>
                        <h3>{activeFilter === 'all' ? 'All Caught Up! 🎉' : `No ${activeFilter} tasks`}</h3>
                        <p>
                            {activeFilter === 'all'
                                ? 'No deliveries assigned yet. Check back soon!'
                                : `You have no ${activeFilter} deliveries right now.`}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
