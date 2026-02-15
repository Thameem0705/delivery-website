
import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from '../context/AuthContext'
import { MapPin, CheckCircle, Navigation, Package, Clock, Truck } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function DeliveryDashboard() {
    const { user } = useAuth()
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (user) {
            fetchTasks()

            // Subscribe to my tasks
            const channel = supabase
                .channel('public:tasks:delivery')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks', filter: `assigned_to=eq.${user.id}` }, (payload) => {
                    if (payload.eventType === 'INSERT') {
                        setTasks(prev => [payload.new, ...prev])
                        toast('New task assigned!', { icon: '🔔' })
                    } else if (payload.eventType === 'UPDATE') {
                        setTasks(prev => prev.map(task => task.id === payload.new.id ? payload.new : task))
                    }
                })
                .subscribe()

            return () => {
                supabase.removeChannel(channel)
            }
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
            console.error('Error fetching tasks:', error)
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
            toast.success('Task marked as completed!')
            // Optimistic update
            setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: 'completed' } : t))
        } catch (error) {
            toast.error('Failed to update task')
        }
    }

    if (loading) return (
        <div className="flex-center" style={{ height: '50vh', color: 'var(--text-muted)' }}>
            <div style={{ animation: 'spin 1s linear infinite' }}>
                <Truck size={32} />
            </div>
            <span style={{ marginLeft: '1rem' }}>Loading assignments...</span>
        </div>
    )

    return (
        <div className="page-container">
            <Toaster position="top-right" />

            <header style={{ marginBottom: '2.5rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '1rem' }}>
                <h2 style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '2rem' }}>
                    <div style={{ background: 'var(--primary)', padding: '0.5rem', borderRadius: '0.5rem', display: 'flex' }}>
                        <Truck size={24} color="white" />
                    </div>
                    My Assignments
                </h2>
                <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '1.1rem' }}>
                    Manage your delivery tasks and track progress.
                </p>
            </header>

            <div style={{ display: 'grid', gap: '1.5rem' }}>
                {tasks.map(task => (
                    <div key={task.id} className="glass-panel" style={{
                        padding: '2rem',
                        borderLeft: `6px solid ${task.status === 'completed' ? 'var(--success)' : 'var(--warning)'}`,
                        transition: 'transform 0.2s',
                        position: 'relative',
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            position: 'absolute',
                            top: 0,
                            right: 0,
                            background: task.status === 'completed' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                            padding: '0.5rem 1rem',
                            borderBottomLeftRadius: '1rem',
                            fontWeight: 'bold',
                            fontSize: '0.8rem',
                            color: task.status === 'completed' ? 'var(--success)' : 'var(--warning)',
                            borderLeft: `1px solid ${task.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`,
                            borderBottom: `1px solid ${task.status === 'completed' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)'}`
                        }}>
                            {task.status.toUpperCase()}
                        </div>

                        <div style={{ marginBottom: '1.5rem' }}>
                            <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.4rem' }}>{task.title}</h3>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                                <Clock size={14} />
                                <span>Assigned on {new Date(task.created_at).toLocaleDateString()} at {new Date(task.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            </div>
                        </div>

                        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: '1.6' }}>{task.description}</p>

                        <div style={{
                            background: 'rgba(15, 23, 42, 0.4)',
                            padding: '1.25rem',
                            borderRadius: '0.75rem',
                            marginBottom: '1.5rem',
                            border: '1px solid rgba(255,255,255,0.05)'
                        }}>
                            <div style={{ display: 'flex', alignItems: 'start', gap: '0.75rem', color: 'var(--text-main)' }}>
                                <MapPin size={20} color="var(--accent-blue)" style={{ marginTop: '0.1rem' }} />
                                <div>
                                    <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '0.25rem' }}>Delivery Location</span>
                                    <span style={{ fontWeight: '500', fontSize: '1.05rem' }}>{task.location_address}</span>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '2rem', flexWrap: 'wrap' }}>
                            <a
                                href={task.google_maps_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="btn-secondary"
                                style={{
                                    textDecoration: 'none',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '0.5rem',
                                    flex: 1,
                                    justifyContent: 'center'
                                }}
                            >
                                <Navigation size={18} />
                                Open Maps
                            </a>

                            {task.status !== 'completed' && (
                                <button
                                    onClick={() => markAsCompleted(task.id)}
                                    className="btn-primary"
                                    style={{
                                        background: 'linear-gradient(135deg, var(--success), #059669)',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        flex: 2,
                                        justifyContent: 'center'
                                    }}
                                >
                                    <CheckCircle size={18} />
                                    Mark Delivered
                                </button>
                            )}
                        </div>
                    </div>
                ))}

                {tasks.length === 0 && (
                    <div style={{ textAlign: 'center', padding: '4rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }} className="glass-panel">
                        <div style={{
                            background: 'rgba(255,255,255,0.05)',
                            padding: '1.5rem',
                            borderRadius: '50%',
                            marginBottom: '1.5rem'
                        }}>
                            <CheckCircle size={48} color="var(--success)" style={{ opacity: 0.8 }} />
                        </div>
                        <h3 style={{ marginBottom: '0.5rem' }}>All Caught Up!</h3>
                        <p style={{ color: 'var(--text-muted)' }}>No pending tasks assigned to you right now.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
