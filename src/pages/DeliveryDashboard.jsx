
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { MapPin, CheckCircle, Navigation, Package, Clock, Truck } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function DeliveryDashboard() {
    const { user } = useAuth()
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)
    const [activeFilter, setActiveFilter] = useState('all')

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
        } catch (error) {
            toast.error('Failed to load tasks')
        } finally {
            setLoading(false)
        }
    }

    const markAsCompleted = async (taskId) => {
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
        }
    }

    const pending = tasks.filter(t => t.status === 'pending').length
    const completed = tasks.filter(t => t.status === 'completed').length

    const filteredTasks = activeFilter === 'all' ? tasks
        : tasks.filter(t => t.status === activeFilter)

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '50vh', gap: '1rem', color: 'var(--text-muted)' }}>
            <div style={{ animation: 'spin 1s linear infinite' }}><Truck size={32} /></div>
            <span>Loading assignments...</span>
        </div>
    )

    return (
        <div className="page-container">
            <Toaster position="top-right" />

            {/* Header */}
            <header style={{ marginBottom: '2rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '2rem', marginBottom: '0.25rem' }}>
                    <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent-purple))', padding: '0.5rem', borderRadius: '0.75rem', display: 'flex' }}>
                        <Truck size={24} color="white" />
                    </div>
                    My Assignments
                </h2>
                <p style={{ color: 'var(--text-muted)', marginLeft: '3.5rem' }}>Track and manage your delivery tasks.</p>
            </header>

            {/* Summary Stats Bar */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '2rem' }}>
                {[
                    { label: 'Total', value: tasks.length, icon: Package, color: '#6366f1' },
                    { label: 'Pending', value: pending, icon: Clock, color: '#f59e0b' },
                    { label: 'Completed', value: completed, icon: CheckCircle, color: '#10b981' },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="glass-panel" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ background: `${color}15`, border: `1px solid ${color}30`, borderRadius: '0.75rem', padding: '0.6rem', display: 'flex' }}>
                            <Icon size={20} color={color} />
                        </div>
                        <div>
                            <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>{label}</p>
                            <p style={{ margin: 0, fontSize: '1.75rem', fontWeight: 800, color: 'white', lineHeight: 1.1 }}>{value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Filter Tabs */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(15,23,42,0.5)', padding: '0.35rem', borderRadius: '0.75rem', border: '1px solid rgba(255,255,255,0.07)', width: 'fit-content' }}>
                {['all', 'pending', 'completed'].map(filter => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        style={{
                            padding: '0.45rem 1.25rem',
                            borderRadius: '0.5rem',
                            border: 'none',
                            cursor: 'pointer',
                            fontWeight: 600,
                            fontSize: '0.85rem',
                            textTransform: 'capitalize',
                            transition: 'all 0.2s',
                            background: activeFilter === filter
                                ? 'linear-gradient(135deg, var(--primary), var(--accent-purple))'
                                : 'transparent',
                            color: activeFilter === filter ? 'white' : 'var(--text-muted)',
                        }}
                    >
                        {filter} {filter === 'all' ? `(${tasks.length})` : filter === 'pending' ? `(${pending})` : `(${completed})`}
                    </button>
                ))}
            </div>

            {/* Tasks */}
            <div style={{ display: 'grid', gap: '1.25rem' }}>
                {filteredTasks.map(task => (
                    <div key={task.id} className="glass-panel" style={{
                        padding: '1.75rem 2rem',
                        borderLeft: `5px solid ${task.status === 'completed' ? '#10b981' : '#f59e0b'}`,
                        position: 'relative',
                        overflow: 'hidden',
                        transition: 'transform 0.2s, box-shadow 0.2s',
                    }}>
                        {/* Status ribbon */}
                        <div style={{
                            position: 'absolute', top: 0, right: 0,
                            background: task.status === 'completed' ? 'rgba(16,185,129,0.12)' : 'rgba(245,158,11,0.12)',
                            padding: '0.35rem 1rem',
                            borderBottomLeftRadius: '0.75rem',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            letterSpacing: '0.08em',
                            color: task.status === 'completed' ? '#10b981' : '#f59e0b',
                            border: `1px solid ${task.status === 'completed' ? 'rgba(16,185,129,0.2)' : 'rgba(245,158,11,0.2)'}`,
                            borderTop: 'none', borderRight: 'none',
                        }}>
                            {task.status.toUpperCase()}
                        </div>

                        {/* Title + date */}
                        <div style={{ marginBottom: '0.75rem', paddingRight: '6rem' }}>
                            <h3 style={{ margin: '0 0 0.35rem 0', fontSize: '1.3rem', fontWeight: 700 }}>{task.title}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                <Clock size={12} />
                                <span>Assigned {new Date(task.created_at).toLocaleDateString()} at {new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>

                        {/* Description */}
                        {task.description && (
                            <p style={{ color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.6, fontSize: '0.95rem' }}>
                                {task.description}
                            </p>
                        )}

                        {/* Location box */}
                        <div style={{ background: 'rgba(15,23,42,0.5)', padding: '1rem 1.25rem', borderRadius: '0.75rem', marginBottom: '1.25rem', border: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                            <MapPin size={18} color="var(--accent-blue)" style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                            <div>
                                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.2rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Delivery Location</span>
                                <span style={{ fontWeight: 500, fontSize: '1rem' }}>{task.location_address}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                            <a
                                href={task.google_maps_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-secondary"
                                style={{ textDecoration: 'none', flex: 1, justifyContent: 'center', minWidth: '140px' }}
                            >
                                <Navigation size={16} />
                                Open Maps
                            </a>
                            {task.status !== 'completed' && (
                                <button
                                    onClick={() => markAsCompleted(task.id)}
                                    className="btn-primary"
                                    style={{ background: 'linear-gradient(135deg, #10b981, #059669)', flex: 2, justifyContent: 'center', minWidth: '160px' }}
                                >
                                    <CheckCircle size={16} />
                                    Mark Delivered
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {filteredTasks.length === 0 && (
                    <div className="glass-panel" style={{ textAlign: 'center', padding: '4rem 2rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.5rem', borderRadius: '50%', marginBottom: '1.25rem' }}>
                            <CheckCircle size={48} color="var(--success)" style={{ opacity: 0.7 }} />
                        </div>
                        <h3 style={{ marginBottom: '0.5rem' }}>
                            {activeFilter === 'all' ? 'All Caught Up!' : `No ${activeFilter} tasks`}
                        </h3>
                        <p style={{ color: 'var(--text-muted)' }}>
                            {activeFilter === 'all'
                                ? 'No tasks assigned to you right now.'
                                : `You have no ${activeFilter} deliveries.`}
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
