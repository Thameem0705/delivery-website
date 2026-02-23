import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { MapPin, Truck, Search, Filter, AlertCircle, Calendar, Pencil, Trash2, User, Plus, List, X } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { Link } from 'react-router-dom'

export default function TaskList() {
    const [tasks, setTasks] = useState([])
    const [filteredTasks, setFilteredTasks] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [deliveryUsers, setDeliveryUsers] = useState([])
    const [editingTask, setEditingTask] = useState(null)
    const [formData, setFormData] = useState({ title: '', description: '', location_address: '', assigned_to: '' })
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        fetchTasks(); fetchDeliveryUsers()
        const channel = supabase.channel('public:tasks')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, async (payload) => {
                if (payload.eventType === 'DELETE') {
                    setTasks(prev => prev.filter(t => t.id !== payload.old.id))
                    return
                }
                const { data } = await supabase.from('tasks').select(`*, assigned_to ( id, full_name )`).eq('id', payload.new.id).single()
                if (!data) return
                if (payload.eventType === 'INSERT') setTasks(prev => [data, ...prev])
                else if (payload.eventType === 'UPDATE') setTasks(prev => prev.map(t => t.id === data.id ? data : t))
            }).subscribe()
        return () => supabase.removeChannel(channel)
    }, [])

    useEffect(() => {
        let result = tasks
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            result = result.filter(t => t.title?.toLowerCase().includes(q) || t.location_address?.toLowerCase().includes(q))
        }
        if (statusFilter !== 'all') result = result.filter(t => t.status === statusFilter)
        setFilteredTasks(result)
    }, [tasks, searchQuery, statusFilter])

    const fetchTasks = async () => {
        try {
            const { data, error } = await supabase.from('tasks').select(`*, assigned_to ( id, full_name )`).order('created_at', { ascending: false })
            if (error) throw error
            setTasks(data)
        } catch (e) { console.error(e) }
    }

    const fetchDeliveryUsers = async () => {
        try {
            const { data, error } = await supabase.from('profiles').select('id, full_name').eq('role', 'delivery')
            if (error) throw error
            setDeliveryUsers(data || [])
        } catch (e) { console.error(e) }
    }

    const handleEditClick = (task) => {
        setEditingTask(task)
        setFormData({ title: task.title, description: task.description || '', location_address: task.location_address, assigned_to: task.assigned_to?.id || task.assigned_to || '' })
    }

    const handleSave = async () => {
        if (!editingTask) return
        setIsSaving(true)
        try {
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.location_address)}`
            const { error } = await supabase.from('tasks').update({
                title: formData.title, description: formData.description,
                location_address: formData.location_address, google_maps_url: mapsUrl,
                assigned_to: formData.assigned_to || null,
            }).eq('id', editingTask.id)
            if (error) throw error
            await fetchTasks()
            setEditingTask(null)
            toast.success('Task updated! ✅')
        } catch { toast.error('Failed to update task') }
        finally { setIsSaving(false) }
    }

    const handleDelete = async (taskId) => {
        if (!window.confirm('Delete this task? This cannot be undone.')) return
        try {
            const { error } = await supabase.from('tasks').delete().eq('id', taskId)
            if (error) throw error
            setTasks(prev => prev.filter(t => t.id !== taskId))
            toast.success('Task deleted')
        } catch { toast.error('Failed to delete task') }
    }

    const statusConfig = {
        pending: { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', label: 'Pending' },
        'in-progress': { color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)', border: 'rgba(139,92,246,0.25)', label: 'In Progress' },
        completed: { color: '#10b981', bg: 'rgba(16,185,129,0.1)', border: 'rgba(16,185,129,0.25)', label: 'Completed' },
    }

    const counts = { all: tasks.length, pending: tasks.filter(t => t.status === 'pending').length, 'in-progress': tasks.filter(t => t.status === 'in-progress').length, completed: tasks.filter(t => t.status === 'completed').length }

    return (
        <div className="page-container">
            <Toaster position="top-right" toastOptions={{ style: { background: '#1e2942', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)' } }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="section-icon section-icon-primary"><List size={20} color="white" /></div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 'clamp(1.25rem,3vw,1.75rem)' }}>
                            Task <span className="gradient-text">Management</span>
                        </h2>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>{filteredTasks.length} of {tasks.length} tasks</p>
                    </div>
                </div>
                <Link to="/admin/create" className="btn-primary" style={{ textDecoration: 'none' }}>
                    <Plus size={18} /> New Task
                </Link>
            </div>

            {/* Search + Filter Bar */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ position: 'relative', flex: '1', minWidth: '200px' }}>
                    <Search size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none' }} />
                    <input
                        className="input-field" style={{ paddingLeft: '2.5rem' }}
                        placeholder="Search tasks by title or address…"
                        value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div style={{ position: 'relative', minWidth: '160px' }}>
                    <Filter size={16} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none' }} />
                    <select className="input-field" style={{ paddingLeft: '2.5rem', cursor: 'pointer' }}
                        value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            {/* Filter chips */}
            <div className="filter-bar" style={{ marginBottom: '1.5rem', width: 'fit-content' }}>
                {[
                    { key: 'all', label: `All (${counts.all})` },
                    { key: 'pending', label: `Pending (${counts.pending})` },
                    { key: 'in-progress', label: `Active (${counts['in-progress']})` },
                    { key: 'completed', label: `Done (${counts.completed})` },
                ].map(({ key, label }) => (
                    <button key={key} className={`filter-tab ${statusFilter === key ? 'active' : ''}`} onClick={() => setStatusFilter(key)}>
                        {label}
                    </button>
                ))}
            </div>

            {/* Task Grid */}
            {filteredTasks.length === 0 ? (
                <div className="card-3d empty-state" style={{ borderStyle: 'dashed', borderColor: 'rgba(255,255,255,0.1)' }}>
                    <div className="empty-icon"><AlertCircle size={32} color="var(--text-muted)" style={{ opacity: 0.5 }} /></div>
                    <h3>No tasks found</h3>
                    <p>Try adjusting your search or filters, or create a new task.</p>
                    <Link to="/admin/create" className="btn-primary" style={{ textDecoration: 'none', marginTop: '1rem' }}><Plus size={16} /> Create Task</Link>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: '1.25rem' }}>
                    {filteredTasks.map((task, i) => {
                        const sc = statusConfig[task.status] || statusConfig.pending
                        return (
                            <div key={task.id} className="card-3d" style={{
                                padding: '1.25rem', borderTop: `3px solid ${sc.color}`,
                                display: 'flex', flexDirection: 'column', height: '100%',
                                animation: `fadeIn 0.3s ease ${i * 0.05}s both`,
                            }}>
                                {/* Top row */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.875rem' }}>
                                    <span style={{ padding: '0.25rem 0.7rem', borderRadius: '999px', fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: sc.color, background: sc.bg, border: `1px solid ${sc.border}` }}>
                                        {sc.label}
                                    </span>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.72rem', color: 'var(--text-subtle)' }}>
                                        <Calendar size={11} />{new Date(task.created_at).toLocaleDateString()}
                                    </span>
                                </div>

                                {/* Title + desc */}
                                <h4 style={{ margin: '0 0 0.4rem', fontWeight: 700, fontSize: '1rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={task.title}>
                                    {task.title}
                                </h4>
                                <p className="line-clamp-2" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6, minHeight: '2.7em', flex: 1, marginBottom: '1rem' }}>
                                    {task.description || 'No description provided.'}
                                </p>

                                {/* Details */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', padding: '0.875rem', background: 'rgba(0,0,0,0.25)', borderRadius: '0.75rem', marginBottom: '1rem', border: '1px solid rgba(255,255,255,0.05)' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                                        <MapPin size={14} color="var(--accent-blue)" style={{ flexShrink: 0, marginTop: '2px' }} />
                                        <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.location_address}</span>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                        <Truck size={14} color="var(--accent-purple)" style={{ flexShrink: 0 }} />
                                        <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.assigned_to?.full_name || 'Unassigned'}</span>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div style={{ display: 'flex', gap: '0.5rem' }}>
                                    <button onClick={() => handleEditClick(task)} style={{
                                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                                        height: '38px', borderRadius: '0.625rem', border: '1px solid rgba(99,102,241,0.3)',
                                        background: 'rgba(99,102,241,0.08)', color: '#818cf8', cursor: 'pointer',
                                        fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)' }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)' }}
                                    >
                                        <Pencil size={13} /> Edit
                                    </button>
                                    <button onClick={() => handleDelete(task.id)} style={{
                                        flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem',
                                        height: '38px', borderRadius: '0.625rem', border: '1px solid rgba(239,68,68,0.3)',
                                        background: 'rgba(239,68,68,0.08)', color: '#f87171', cursor: 'pointer',
                                        fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.2s',
                                    }}
                                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.6)' }}
                                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)' }}
                                    >
                                        <Trash2 size={13} /> Delete
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Edit Modal */}
            {editingTask && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)', animation: 'fadeIn 0.2s ease both' }}>
                    <div className="glass-panel" style={{ width: '100%', maxWidth: '520px', padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', maxHeight: '90vh', animation: 'scaleIn 0.25s cubic-bezier(0.2,0.8,0.2,1) both' }} onClick={e => e.stopPropagation()}>
                        {/* Modal header */}
                        <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ padding: '0.5rem', background: 'var(--primary-light)', borderRadius: '0.625rem', border: '1px solid rgba(99,102,241,0.25)', display: 'flex' }}>
                                    <Pencil size={18} color="var(--primary)" />
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>Edit Task</h3>
                                    <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)' }}>Update task details and assignment</p>
                                </div>
                            </div>
                            <button onClick={() => setEditingTask(null)} className="btn-icon"><X size={18} /></button>
                        </div>
                        {/* Modal body */}
                        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', overflowY: 'auto' }}>
                            <div className="form-group">
                                <label>Task Title</label>
                                <input type="text" className="input-field" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Task title" />
                            </div>
                            <div className="form-group">
                                <label>Delivery Address</label>
                                <div style={{ position: 'relative' }}>
                                    <MapPin size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none' }} />
                                    <input type="text" className="input-field" style={{ paddingLeft: '2.5rem' }} value={formData.location_address} onChange={e => setFormData({ ...formData, location_address: e.target.value })} placeholder="Full address" />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Assigned Driver</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none' }} />
                                    <select className="input-field" style={{ paddingLeft: '2.5rem', cursor: 'pointer' }} value={formData.assigned_to} onChange={e => setFormData({ ...formData, assigned_to: e.target.value })}>
                                        <option value="">Unassigned</option>
                                        {deliveryUsers.map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="form-group">
                                <label>Description</label>
                                <textarea className="input-field" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Add details or special instructions…" rows={3} />
                            </div>
                        </div>
                        {/* Modal footer */}
                        <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                            <button onClick={() => setEditingTask(null)} className="btn-secondary">Cancel</button>
                            <button onClick={handleSave} disabled={isSaving} className="btn-primary">
                                {isSaving ? <><div className="spinner" style={{ width: '16px', height: '16px' }} /> Saving…</> : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
