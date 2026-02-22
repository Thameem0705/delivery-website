
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { MapPin, Truck, Search, Filter, AlertCircle, Calendar, Pencil, Trash2, User } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

export default function TaskList() {
    const [tasks, setTasks] = useState([])
    const [filteredTasks, setFilteredTasks] = useState([])
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [deliveryUsers, setDeliveryUsers] = useState([])

    // Edit State
    const [editingTask, setEditingTask] = useState(null)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        location_address: '',
        assigned_to: '',
    })
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        fetchTasks()
        fetchDeliveryUsers()

        const channel = supabase
            .channel('public:tasks')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setTasks(prev => [payload.new, ...prev])
                } else if (payload.eventType === 'UPDATE') {
                    setTasks(prev => prev.map(task => task.id === payload.new.id ? payload.new : task))
                } else if (payload.eventType === 'DELETE') {
                    setTasks(prev => prev.filter(t => t.id !== payload.old.id))
                }
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [])

    useEffect(() => {
        let result = tasks
        if (searchQuery) {
            const query = searchQuery.toLowerCase()
            result = result.filter(t =>
                t.title.toLowerCase().includes(query) ||
                t.location_address.toLowerCase().includes(query)
            )
        }
        if (statusFilter !== 'all') {
            result = result.filter(t => t.status === statusFilter)
        }
        setFilteredTasks(result)
    }, [tasks, searchQuery, statusFilter])

    const fetchTasks = async () => {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .select(`*, assigned_to ( id, full_name )`)
                .order('created_at', { ascending: false })
            if (error) throw error
            setTasks(data)
        } catch (error) {
            console.error('Error fetching tasks:', error)
        }
    }

    const fetchDeliveryUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name')
                .eq('role', 'delivery')
            if (error) throw error
            setDeliveryUsers(data || [])
        } catch (error) {
            console.error('Error fetching delivery users:', error)
        }
    }

    const handleEditClick = (task) => {
        setEditingTask(task)
        setFormData({
            title: task.title,
            description: task.description || '',
            location_address: task.location_address,
            assigned_to: task.assigned_to?.id || task.assigned_to || '',
        })
    }

    const handleSave = async () => {
        if (!editingTask) return
        setIsSaving(true)
        try {
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.location_address)}`
            const { error } = await supabase
                .from('tasks')
                .update({
                    title: formData.title,
                    description: formData.description,
                    location_address: formData.location_address,
                    google_maps_url: mapsUrl,
                    assigned_to: formData.assigned_to || null,
                })
                .eq('id', editingTask.id)
            if (error) throw error
            await fetchTasks() // Refresh to get updated join data
            setEditingTask(null)
            toast.success('Task updated!')
        } catch (error) {
            toast.error('Failed to update task')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelete = async (taskId) => {
        if (!window.confirm('Delete this task? This cannot be undone.')) return
        try {
            const { error } = await supabase.from('tasks').delete().eq('id', taskId)
            if (error) throw error
            setTasks(prev => prev.filter(t => t.id !== taskId))
            toast.success('Task deleted')
        } catch {
            toast.error('Failed to delete task')
        }
    }

    const getStatusStyle = (status) => {
        if (status === 'completed') return 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
        if (status === 'in-progress') return 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
        return 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
    }

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 animate-fadeIn relative">
            <Toaster position="top-right" />
            <h2 className="text-2xl font-bold mb-4">Task Management
                <span className="ml-3 text-sm font-normal px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                    {filteredTasks.length} tasks
                </span>
            </h2>

            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between bg-slate-800/30 p-4 rounded-xl border border-white/5 backdrop-blur-sm">
                <div className="relative flex-1 max-w-md group">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-primary transition-colors" />
                    <input
                        className="input-field pl-10 py-2.5 border-none bg-slate-900/50 focus:bg-slate-900 transition-all"
                        style={{ paddingLeft: '2.5rem' }}
                        placeholder="Search tasks by title or address..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter size={18} className="text-gray-400" />
                    <select
                        className="bg-slate-900/50 border border-white/10 rounded-lg px-4 py-2.5 text-sm text-gray-300 focus:outline-none focus:border-primary transition-all cursor-pointer hover:bg-slate-800"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                    >
                        <option value="all">All Status</option>
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
            </div>

            {/* Task Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTasks.map(task => (
                    <div key={task.id}
                        className="glass-panel p-6 group hover:border-primary/30 hover:translate-y-[-2px] hover:shadow-xl transition-all duration-300 flex flex-col h-full relative"
                        style={{ animationDelay: `${filteredTasks.indexOf(task) * 0.05}s` }}
                    >
                        {/* Status Badge & Date */}
                        <div className="flex justify-between items-start mb-4">
                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${getStatusStyle(task.status)}`}>
                                {task.status}
                            </span>
                            <span className="flex items-center gap-1.5 text-xs text-gray-500 font-mono">
                                <Calendar size={12} />
                                {new Date(task.created_at).toLocaleDateString()}
                            </span>
                        </div>

                        {/* Title & Desc */}
                        <div className="pr-8">
                            <h4 className="font-bold text-lg mb-2 text-white group-hover:text-primary transition-colors line-clamp-1" title={task.title}>
                                {task.title}
                            </h4>
                            <p className="text-sm text-gray-400 mb-6 line-clamp-2 min-h-[2.5em]">
                                {task.description || 'No description provided.'}
                            </p>
                        </div>

                        {/* Action Buttons — always visible, right-aligned */}

                        {/* Card footer: location, driver + action buttons */}
                        <div className="mt-auto border-t border-white/5 pt-4 space-y-3">
                            <div className="flex items-start gap-3 text-sm text-gray-300">
                                <MapPin size={16} className="text-blue-400 shrink-0 mt-0.5" />
                                <span className="truncate leading-relaxed">{task.location_address}</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-gray-300">
                                <Truck size={16} className="text-purple-400 shrink-0" />
                                <span className="truncate leading-relaxed">
                                    {task.assigned_to?.full_name || 'Unassigned'}
                                </span>
                            </div>

                            {/* Edit / Delete row */}
                            <div style={{
                                display: 'flex', gap: '0.5rem', paddingTop: '0.5rem',
                                borderTop: '1px solid rgba(255,255,255,0.05)', justifyContent: 'flex-end'
                            }}>
                                <button
                                    onClick={() => handleEditClick(task)}
                                    title="Edit Task"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                        padding: '0.45rem 0.9rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid rgba(99,102,241,0.3)',
                                        background: 'rgba(99,102,241,0.08)',
                                        color: '#818cf8',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem', fontWeight: 600,
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.08)'; e.currentTarget.style.borderColor = 'rgba(99,102,241,0.3)' }}
                                >
                                    <Pencil size={13} /> Edit
                                </button>
                                <button
                                    onClick={() => handleDelete(task.id)}
                                    title="Delete Task"
                                    style={{
                                        display: 'flex', alignItems: 'center', gap: '0.4rem',
                                        padding: '0.45rem 0.9rem',
                                        borderRadius: '0.5rem',
                                        border: '1px solid rgba(239,68,68,0.3)',
                                        background: 'rgba(239,68,68,0.08)',
                                        color: '#f87171',
                                        cursor: 'pointer',
                                        fontSize: '0.8rem', fontWeight: 600,
                                        transition: 'all 0.2s',
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.2)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.6)' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)' }}
                                >
                                    <Trash2 size={13} /> Delete
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center p-16 text-gray-500 bg-slate-800/20 rounded-2xl border border-dashed border-white/10 animate-fadeIn">
                    <AlertCircle size={48} className="mb-4 opacity-50" />
                    <p className="text-xl font-semibold mb-2">No tasks found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                </div>
            )}

            {/* Edit Modal */}
            {editingTask && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
                    <div className="glass-panel w-full max-w-lg p-0 overflow-hidden shadow-2xl animate-scaleIn"
                        onClick={e => e.stopPropagation()}>

                        {/* Modal Header */}
                        <div className="p-6 border-b border-white/10 bg-white/5">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                <Pencil size={20} className="text-primary" />
                                Edit Task
                            </h3>
                            <p className="text-sm text-gray-400 mt-1">Update task details, location and driver assignment.</p>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Task Title</label>
                                <input
                                    type="text"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    className="input-field"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Location Address</label>
                                <div className="relative">
                                    <MapPin className="absolute left-3 top-3 text-gray-500" size={18} />
                                    <input
                                        type="text"
                                        value={formData.location_address}
                                        onChange={e => setFormData({ ...formData, location_address: e.target.value })}
                                        className="input-field pl-10"
                                        placeholder="Enter full address"
                                    />
                                </div>
                            </div>

                            {/* ─── Assign Driver ─── */}
                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Assigned Driver</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                    <select
                                        value={formData.assigned_to}
                                        onChange={e => setFormData({ ...formData, assigned_to: e.target.value })}
                                        className="input-field pl-10 cursor-pointer"
                                        style={{ paddingLeft: '2.75rem', appearance: 'none' }}
                                    >
                                        <option value="">Unassigned</option>
                                        {deliveryUsers.map(u => (
                                            <option key={u.id} value={u.id}>{u.full_name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-300 mb-1.5">Description</label>
                                <textarea
                                    value={formData.description}
                                    onChange={e => setFormData({ ...formData, description: e.target.value })}
                                    className="input-field min-h-[100px] resize-none"
                                    placeholder="Add details..."
                                />
                            </div>
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end gap-4">
                            <button
                                onClick={() => setEditingTask(null)}
                                className="btn-secondary px-6 py-2 rounded-lg text-sm"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving}
                                className="btn-primary px-8 py-2 text-sm"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
