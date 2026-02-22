
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import {
    MapPin, CheckCircle, Navigation, Package, Clock,
    Truck, Sun, Sunset, Moon, Star, TrendingUp, Zap
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
                })
                .subscribe()
            return () => supabase.removeChannel(channel)
        }
    }, [user])

    const fetchTasks = async () => {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('assigned_to', user.id)
                .order('created_at', { ascending: false })
            if (error) throw error
            setTasks(data)
        } catch {
            toast.error('Failed to load tasks')
        } finally {
            setLoading(false)
        }
    }

    const markAsCompleted = async (taskId) => {
        setCompleting(taskId)
        try {
            const { error } = await supabase
                .from('tasks')
                .update({ status: 'completed' })
                .eq('id', taskId)
            if (error) throw error
            toast.success('✅ Task marked as completed!')
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t))
        } catch {
            toast.error('Failed to update task')
        } finally {
            setCompleting(null)
        }
    }

    const pending = tasks.filter(t => t.status === 'pending').length
    const inProgress = tasks.filter(t => t.status === 'in-progress').length
    const completed = tasks.filter(t => t.status === 'completed').length
    const completionRate = tasks.length > 0 ? Math.round((completed / tasks.length) * 100) : 0

    const filteredTasks = activeFilter === 'all' ? tasks
        : tasks.filter(t => t.status === activeFilter)

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '1rem', color: 'var(--text-muted)' }}>
            <div style={{ animation: 'spin 1s linear infinite' }}><Truck size={32} /></div>
            <span>Loading assignments...</span>
        </div>
    )

    return (
        <div className="page-container" style={{ paddingTop: '0.5rem' }}>
            <Toaster position="top-right" />

            {/* ── Greeting Header ── */}
            <div className="glass-panel" style={{
                padding: '1.5rem 1.75rem',
                marginBottom: '1.5rem',
                background: 'linear-gradient(135deg, rgba(99,102,241,0.1), rgba(139,92,246,0.08))',
                border: '1px solid rgba(99,102,241,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '1rem',
            }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                        <GreetIcon size={20} color={greeting.color} />
                        <span style={{ color: greeting.color, fontWeight: 600, fontSize: '0.9rem' }}>{greeting.text}</span>
                    </div>
                    <h2 style={{ margin: 0, fontSize: 'clamp(1.3rem, 4vw, 2rem)', fontWeight: 800, letterSpacing: '-0.5px' }}>
                        {profile?.full_name?.split(' ')[0] || 'Driver'} 👋
                    </h2>
                    <p style={{ margin: '0.3rem 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        You have <strong style={{ color: 'white' }}>{pending}</strong> pending {pending === 1 ? 'delivery' : 'deliveries'} today.
                    </p>
                </div>
                {/* Completion badge */}
                <div style={{
                    textAlign: 'center',
                    background: 'rgba(16,185,129,0.08)',
                    border: '1px solid rgba(16,185,129,0.2)',
                    borderRadius: '1rem',
                    padding: '0.75rem 1.25rem',
                    minWidth: '120px',
                }}>
                    <p style={{ margin: 0, fontSize: '2rem', fontWeight: 900, color: '#10b981', lineHeight: 1 }}>{completionRate}%</p>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Completed</p>
                </div>
            </div>

            {/* ── Stats Row ── */}
            <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
                {[
                    { label: 'Total', value: tasks.length, icon: Package, color: '#6366f1', bg: 'rgba(99,102,241,0.1)' },
                    { label: 'Pending', value: pending, icon: Clock, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
                    { label: 'Done', value: completed, icon: CheckCircle, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
                ].map(({ label, value, icon: Icon, color, bg }) => (
                    <div key={label} className="glass-panel" style={{ padding: '1.2rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: bg, border: `1px solid ${color}30`, borderRadius: '0.75rem', padding: '0.6rem', display: 'flex', flexShrink: 0 }}>
                            <Icon size={20} color={color} />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</p>
                            <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'white', lineHeight: 1.1 }}>{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Progress Bar ── */}
            {tasks.length > 0 && (
                <div className="glass-panel" style={{ padding: '1.25rem 1.5rem', marginBottom: '1.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <TrendingUp size={16} color="#6366f1" />
                            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--text-muted)' }}>Daily Progress</span>
                        </div>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{completed} / {tasks.length} tasks</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(255,255,255,0.06)', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{
                            height: '100%',
                            width: `${completionRate}%`,
                            borderRadius: '6px',
                            background: completionRate >= 70
                                ? 'linear-gradient(to right, #10b981, #34d399)'
                                : completionRate >= 40
                                    ? 'linear-gradient(to right, #6366f1, #8b5cf6)'
                                    : 'linear-gradient(to right, #f59e0b, #fbbf24)',
                            transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
                        }} />
                    </div>
                </div>
            )}

            {/* ── Filter Tabs ── */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(15,23,42,0.5)', padding: '0.35rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.07)', width: 'fit-content', flexWrap: 'wrap' }}>
                {[
                    { key: 'all', label: `All (${tasks.length})` },
                    { key: 'pending', label: `Pending (${pending})` },
                    { key: 'in-progress', label: `Active (${inProgress})` },
                    { key: 'completed', label: `Done (${completed})` },
                ].map(({ key, label }) => (
                    <button
                        key={key}
                        onClick={() => setActiveFilter(key)}
                        style={{
                            padding: '0.45rem 1rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.8rem',
                            transition: 'all 0.2s',
                            background: activeFilter === key
                                ? 'linear-gradient(135deg, var(--primary), var(--accent-purple))'
                                : 'transparent',
                            color: activeFilter === key ? 'white' : 'var(--text-muted)',
                        }}
                    >
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Task Cards ── */}
            <div style={{ display: 'grid', gap: '1.25rem' }}>
                {filteredTasks.map((task, i) => (
                    <div
                        key={task.id}
                        className="glass-panel"
                        style={{
                            padding: 'clamp(1rem,4vw,1.75rem)',
                            borderLeft: `4px solid ${task.status === 'completed' ? '#10b981' : task.status === 'in-progress' ? '#8b5cf6' : '#f59e0b'}`,
                            position: 'relative',
                            overflow: 'hidden',
                            transition: 'transform 0.25s, box-shadow 0.25s',
                            animation: `fadeIn 0.4s ease ${i * 0.07}s both`,
                        }}
                    >
                        {/* Ambient glow */}
                        <div style={{
                            position: 'absolute', top: 0, right: 0, width: '200px', height: '200px',
                            background: task.status === 'completed'
                                ? 'radial-gradient(circle, rgba(16,185,129,0.06) 0%, transparent 70%)'
                                : 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 70%)',
                            pointerEvents: 'none',
                        }} />

                        {/* Status ribbon */}
                        <div style={{
                            position: 'absolute', top: 0, right: 0,
                            padding: '0.3rem 0.9rem',
                            borderBottomLeftRadius: '0.75rem',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            letterSpacing: '0.1em',
                            color: task.status === 'completed' ? '#10b981' : task.status === 'in-progress' ? '#8b5cf6' : '#f59e0b',
                            background: task.status === 'completed'
                                ? 'rgba(16,185,129,0.1)' : task.status === 'in-progress'
                                    ? 'rgba(139,92,246,0.1)' : 'rgba(245,158,11,0.1)',
                            border: `1px solid ${task.status === 'completed' ? 'rgba(16,185,129,0.2)' : task.status === 'in-progress' ? 'rgba(139,92,246,0.2)' : 'rgba(245,158,11,0.2)'}`,
                            borderTop: 'none', borderRight: 'none',
                        }}>
                            {task.status.toUpperCase()}
                        </div>

                        {/* Title + elapsed time */}
                        <div style={{ marginBottom: '0.75rem', paddingRight: 'clamp(3rem,8vw,6rem)' }}>
                            <h3 style={{ margin: '0 0 0.35rem', fontSize: '1.2rem', fontWeight: 700 }}>{task.title}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)', flexWrap: 'wrap' }}>
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
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', lineHeight: 1.6, fontSize: '0.925rem' }}>
                                {task.description}
                            </p>
                        )}

                        {/* Location */}
                        <div style={{
                            background: 'rgba(15,23,42,0.5)',
                            padding: '0.9rem 1.1rem',
                            borderRadius: '0.75rem',
                            marginBottom: '1.25rem',
                            border: '1px solid rgba(255,255,255,0.05)',
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: '0.75rem',
                        }}>
                            <MapPin size={18} color="var(--accent-blue)" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                            <div>
                                <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--text-muted)', marginBottom: '0.2rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                                    Delivery Location
                                </span>
                                <span style={{ fontWeight: 500, fontSize: '0.95rem' }}>{task.location_address}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <a
                                href={task.google_maps_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-secondary"
                                style={{ textDecoration: 'none', flex: 1, justifyContent: 'center', minWidth: '120px' }}
                            >
                                <Navigation size={16} />
                                Open Maps
                            </a>
                            {task.status !== 'completed' && (
                                <button
                                    onClick={() => markAsCompleted(task.id)}
                                    disabled={completing === task.id}
                                    className="btn-primary"
                                    style={{
                                        background: 'linear-gradient(135deg, #10b981, #059669)',
                                        flex: 2,
                                        justifyContent: 'center',
                                        minWidth: '140px',
                                        opacity: completing === task.id ? 0.7 : 1,
                                    }}
                                >
                                    {completing === task.id ? (
                                        <><Zap size={16} /> Saving...</>
                                    ) : (
                                        <><CheckCircle size={16} /> Mark Delivered</>
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {/* Empty State */}
                {filteredTasks.length === 0 && (
                    <div className="glass-panel" style={{
                        textAlign: 'center', padding: '4rem 2rem',
                        display: 'flex', flexDirection: 'column', alignItems: 'center',
                        background: 'rgba(15,23,42,0.3)',
                    }}>
                        <div style={{
                            width: '80px', height: '80px',
                            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.1))',
                            borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            marginBottom: '1.5rem',
                            border: '1px solid rgba(99,102,241,0.2)',
                        }}>
                            <CheckCircle size={36} color="var(--success)" style={{ opacity: 0.7 }} />
                        </div>
                        <h3 style={{ marginBottom: '0.5rem', fontSize: '1.3rem' }}>
                            {activeFilter === 'all' ? 'All Caught Up! 🎉' : `No ${activeFilter} tasks`}
                        </h3>
                        <p style={{ color: 'var(--text-muted)', maxWidth: '300px' }}>
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
