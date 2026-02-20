
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Plus, MapPin, User, CheckCircle, Truck } from 'lucide-react'
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

    useEffect(() => {
        fetchDeliveryUsers()
    }, [])

    const fetchDeliveryUsers = async () => {
        try {
            const { data, error } = await supabase.from('profiles').select('*').eq('role', 'delivery')
            if (error) throw error
            setDeliveryUsers(data)
        } catch (error) {
            console.error('Error fetching users:', error)
        }
    }

    const handleCreateTask = async (e) => {
        e.preventDefault()
        setLoading(true)
        try {
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`
            const { error } = await supabase.from('tasks').insert([{
                title, description, location_address: address, google_maps_url: mapsUrl, assigned_to: assignedTo, status: 'pending'
            }])

            if (error) throw error
            toast.success('Task created successfully!')

            // Short delay before redirect
            setTimeout(() => {
                navigate('/admin/tasks')
            }, 1000)
        } catch (error) {
            toast.error(error.message)
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-3xl mx-auto animate-fadeSlideUp">
            <Toaster position="top-right" />

            <div className="glass-panel p-4" style={{ paddingInline: 'clamp(1rem, 5vw, 2rem)' }}>
                <h3 className="flex items-center gap-3 mb-8 text-2xl font-bold">
                    <div className="bg-primary p-2.5 rounded-xl flex items-center justify-center shadow-lg shadow-primary/20">
                        <Plus size={24} color="white" />
                    </div>
                    Create New Assignment
                </h3>

                <form onSubmit={handleCreateTask} className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-gray-300">Task Title</label>
                            <input
                                className="input-field"
                                placeholder="E.g., Urgent Medicine Delivery"
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                required
                            />
                        </div>

                        <div className="space-y-2 md:col-span-2">
                            <label className="text-sm font-semibold text-gray-300">Description</label>
                            <textarea
                                className="input-field min-h-[100px]"
                                placeholder="Additional details, special instructions..."
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-300">Delivery Address</label>
                            <div className="relative group">
                                <MapPin size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                                <input
                                    className="input-field pl-11"
                                    placeholder="Full address"
                                    value={address}
                                    onChange={e => setAddress(e.target.value)}
                                    required
                                    style={{ paddingLeft: '2.75rem' }}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-gray-300">Assign Driver</label>
                            <div className="relative group">
                                <Truck size={18} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                                <select
                                    className="input-field pl-11 cursor-pointer"
                                    value={assignedTo}
                                    onChange={e => setAssignedTo(e.target.value)}
                                    required
                                    style={{ paddingLeft: '2.75rem', appearance: 'none' }}
                                >
                                    <option value="">Select a Delivery Agent...</option>
                                    {deliveryUsers.map(u => (
                                        <option key={u.id} value={u.id}>{u.full_name || u.email}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="pt-6 border-t border-white/5 mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/admin/tasks')}
                            className="btn-secondary w-full py-4 text-base rounded-xl hover:bg-white/10"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn-primary w-full py-4 flex items-center justify-center gap-3 shadow-lg shadow-primary/25 disabled:opacity-70 disabled:cursor-not-allowed hover:scale-[1.01] transition-transform"
                            disabled={loading}
                        >
                            {loading ? 'Creating...' : (
                                <>
                                    <CheckCircle size={20} />
                                    <span className="text-lg">Create Task</span>
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
