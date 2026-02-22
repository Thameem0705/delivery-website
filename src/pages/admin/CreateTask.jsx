import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Plus, MapPin, User, CheckCircle, Truck, FileText, ArrowLeft } from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

export default function CreateTask() {
    const navigate = useNavigate()
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [address, setAddress] = useState('')
    const [assignedTo, setAssignedTo] = useState('')
    const [deliveryUsers, setDeliveryUsers] = useState([])
    const [loading, setLoading] = useState(false)

    useEffect(() => { fetchDeliveryUsers() }, [])

    const fetchDeliveryUsers = async () => {
        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('role', 'delivery')
            if (error) throw error
            setDeliveryUsers(data)
        } catch (e) { console.error(e) }
    }

    const handleCreateTask = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
            const { error } = await supabase.from('tasks').insert([{
                title, description, location_address: address, google_maps_url: mapsUrl,
                assigned_to: assignedTo || null, status: 'pending',
            }])
            if (error) throw error
            toast.success('Task created successfully! 🎉')
            setTimeout(() => navigate('/admin/tasks'), 1000)
        } catch (error) {
            toast.error(error.message)
            setLoading(false)
        }
    }

    return (
        <div className="page-container">
            <Toaster position="top-right" toastOptions={{ style: { background: '#1e2942', color: '#f1f5f9', border: '1px solid rgba(255,255,255,0.1)' } }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.75rem', flexWrap: 'wrap' }}>
                <button onClick={() => navigate('/admin/tasks')} className="btn-icon" title="Back to tasks">
                    <ArrowLeft size={18} />
                </button>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div className="section-icon section-icon-primary">
                        <Plus size={20} color="white" />
                    </div>
                    <div>
                        <h2 style={{ margin: 0, fontSize: 'clamp(1.25rem,3vw,1.75rem)' }}>
                            New <span className="gradient-text">Assignment</span>
                        </h2>
                        <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>Fill in the details to assign a delivery task</p>
                    </div>
                </div>
            </div>

            <form onSubmit={handleCreateTask}>
                {/* Main form card */}
                <div className="card-3d" style={{ padding: 'clamp(1.25rem,4vw,2rem)', marginBottom: '1.25rem' }}>

                    {/* Section: Task Details */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                        <FileText size={16} color="var(--primary)" />
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Task Details</span>
                    </div>

                    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: '1fr' }}>
                        {/* Title */}
                        <div className="form-group">
                            <label>Task Title <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <input className="input-field" placeholder="E.g., Urgent Medicine Delivery to Hospital"
                                value={title} onChange={e => setTitle(e.target.value)} required />
                        </div>

                        {/* Description */}
                        <div className="form-group">
                            <label>Description / Special Instructions</label>
                            <textarea className="input-field" style={{ minHeight: '90px', resize: 'vertical', fontFamily: 'inherit' }}
                                placeholder="Additional details, access codes, contact info…"
                                value={description} onChange={e => setDescription(e.target.value)} />
                        </div>
                    </div>

                    {/* Section: Location + Driver */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', margin: '1.5rem 0 1.25rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                        <MapPin size={16} color="var(--accent-blue)" />
                        <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>Delivery Info</span>
                    </div>

                    <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 260px), 1fr))' }}>
                        {/* Address */}
                        <div className="form-group">
                            <label>Delivery Address <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <div style={{ position: 'relative' }}>
                                <MapPin size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none' }} />
                                <input className="input-field" style={{ paddingLeft: '2.5rem' }}
                                    placeholder="Full delivery address" value={address}
                                    onChange={e => setAddress(e.target.value)} required />
                            </div>
                        </div>

                        {/* Assign Driver */}
                        <div className="form-group">
                            <label>Assign Driver <span style={{ color: 'var(--danger)' }}>*</span></label>
                            <div style={{ position: 'relative' }}>
                                <Truck size={15} style={{ position: 'absolute', left: '0.875rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-subtle)', pointerEvents: 'none' }} />
                                <select className="input-field" style={{ paddingLeft: '2.5rem', cursor: 'pointer' }}
                                    value={assignedTo} onChange={e => setAssignedTo(e.target.value)} required>
                                    <option value="">Select a delivery agent…</option>
                                    {deliveryUsers.map(u => (
                                        <option key={u.id} value={u.id}>{u.full_name || u.username}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Preview box */}
                    {(title || address) && (
                        <div style={{
                            marginTop: '1.5rem', padding: '1rem',
                            background: 'rgba(99,102,241,0.05)', borderRadius: '0.875rem',
                            border: '1px solid rgba(99,102,241,0.15)',
                        }}>
                            <p style={{ margin: '0 0 0.5rem', fontSize: '0.75rem', color: 'var(--text-subtle)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Preview</p>
                            {title && <p style={{ margin: '0 0 0.25rem', fontWeight: 700, fontSize: '0.95rem' }}>{title}</p>}
                            {address && <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}><MapPin size={13} /> {address}</div>}
                            {deliveryUsers.find(u => u.id === assignedTo)?.full_name && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                                    <User size={13} /> {deliveryUsers.find(u => u.id === assignedTo)?.full_name}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Action buttons */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 180px), 1fr))', gap: '0.75rem' }}>
                    <button type="button" onClick={() => navigate('/admin/tasks')} className="btn-secondary btn-tall btn-full">
                        <ArrowLeft size={18} /> Cancel
                    </button>
                    <button type="submit" className="btn-primary btn-tall btn-full" disabled={loading}>
                        {loading
                            ? <><div className="spinner" style={{ width: '20px', height: '20px' }} /> Creating…</>
                            : <><CheckCircle size={20} /> Create Task</>
                        }
                    </button>
                </div>
            </form>
        </div>
    )
}
