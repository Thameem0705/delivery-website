import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { User, Search, Mail, Calendar, Hash, Truck } from 'lucide-react'
import { Toaster } from 'react-hot-toast'

export default function DeliveryUsers() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')

    useEffect(() => {
        fetchUsers()
    }, [])

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

    const filteredUsers = users.filter(user =>
        (user.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.username || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchQuery.toLowerCase())
    )

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
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
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

            {/* Search Bar */}
            <div className="relative group max-w-2xl">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex items-center bg-slate-900/80 border border-white/10 rounded-2xl p-2 shadow-2xl backdrop-blur-xl focus-within:border-primary/50 focus-within:bg-slate-900 transition-all duration-300">
                    <div className="p-3 bg-white/5 rounded-xl text-gray-400 group-focus-within:text-primary group-focus-within:bg-primary/10 transition-colors">
                        <Search size={24} />
                    </div>
                    <input
                        className="w-full bg-transparent border-none px-4 py-3 text-lg text-white placeholder-gray-500 focus:outline-none focus:ring-0"
                        placeholder="Search drivers by name, username..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="p-2 text-gray-500 hover:text-white transition-colors"
                        >
                            ✕
                        </button>
                    )}
                </div>
            </div>

            {/* Users Grid */}
            {loading ? (
                <div className="flex justify-center py-36">
                    <div className="relative">
                        <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
                        <div className="absolute inset-0 flex items-center justify-center">
                            <Truck size={20} className="text-primary animate-pulse" />
                        </div>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-x-8 gap-y-24">
                    {filteredUsers.map(user => (
                        <div
                            key={user.id}
                            className="group relative bg-[#0f172a] rounded-2xl p-6 overflow-hidden transition-all duration-300 hover:-translate-y-1"
                            style={{
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                border: '1px solid rgba(255, 255, 255, 0.1)'
                            }}
                        >
                            {/* Hover Gradient Border Effect */}
                            <div className="absolute inset-0 rounded-2xl p-[1px] bg-gradient-to-br from-transparent via-transparent to-transparent group-hover:from-blue-500 group-hover:via-purple-500 group-hover:to-blue-500 transition-all duration-500 pointer-events-none opacity-0 group-hover:opacity-100"></div>

                            {/* Inner Content */}
                            <div className="relative z-10 flex flex-col h-full">

                                {/* Profile Header Card - Left Border Style */}
                                <div
                                    className="relative bg-white/[0.03] rounded-r-xl rounded-l-sm p-4 mb-6 transition-all duration-300 group/header hover:bg-white/[0.05] hover:translate-x-1"
                                    style={{
                                        borderLeft: '5px solid #10b981', // Emerald 500
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                    }}
                                >
                                    {/* Header: Avatar & Badge */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="relative">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 p-[1px] shadow-lg group-hover/header:shadow-emerald-500/20 transition-all duration-300">
                                                <div className="w-full h-full rounded-2xl bg-[#0f172a] flex items-center justify-center overflow-hidden">
                                                    <User size={28} className="text-slate-400 group-hover/header:text-emerald-400 transition-colors duration-300" />
                                                </div>
                                            </div>
                                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#0f172a] rounded-full flex items-center justify-center border border-white/5">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
                                            </div>
                                        </div>
                                        <span className="px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 text-[10px] font-bold uppercase tracking-wider rounded-full border border-emerald-500/20 shadow-sm">
                                            Active
                                        </span>
                                    </div>

                                    {/* Main Info */}
                                    <div>
                                        <h3 className="text-lg font-bold text-white tracking-tight group-hover/header:text-emerald-100 transition-all duration-300 truncate">
                                            {user.full_name || 'Unnamed User'}
                                        </h3>
                                        <div className="flex items-center gap-1.5 text-slate-400 text-sm font-medium mt-1">
                                            <Hash size={12} className="text-slate-500" />
                                            <span className="truncate opacity-80 group-hover/header:opacity-100 transition-opacity">@{user.username || 'unknown'}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Details Cards - The Requested "Reference Image" Style */}
                                <div className="space-y-4 mt-auto">
                                    {/* Email Card - Left Border Style */}
                                    <div
                                        className="relative bg-white/[0.03] rounded-r-xl rounded-l-sm p-4 flex items-center gap-3 transition-all duration-300 group/item hover:bg-white/[0.05] hover:translate-x-1"
                                        style={{
                                            borderLeft: '5px solid #10b981', // Emerald 500
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                    >
                                        <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 border border-blue-500/10 shrink-0 group-hover/item:text-white group-hover/item:bg-blue-500 transition-all duration-300">
                                            <Mail size={16} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">Email</span>
                                            <span className="text-sm text-slate-300 truncate font-medium group-hover/item:text-white transition-colors">
                                                {user.email}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Joined Date Card - Left Border Style */}
                                    <div
                                        className="relative bg-white/[0.03] rounded-r-xl rounded-l-sm p-4 flex items-center gap-3 transition-all duration-300 group/item hover:bg-white/[0.05] hover:translate-x-1"
                                        style={{
                                            borderLeft: '5px solid #10b981', // Emerald 500
                                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                                        }}
                                    >
                                        <div className="p-2 bg-purple-500/10 rounded-lg text-purple-400 border border-purple-500/10 shrink-0 group-hover/item:text-white group-hover/item:bg-purple-500 transition-all duration-300">
                                            <Calendar size={16} />
                                        </div>
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">Joined</span>
                                            <span className="text-sm text-slate-300 truncate font-medium group-hover/item:text-white transition-colors">
                                                {new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Ambient Glow Background */}
                                <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none group-hover:bg-purple-500/10 transition-colors duration-500"></div>
                                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/5 rounded-full blur-3xl -ml-24 -mb-24 pointer-events-none group-hover:bg-blue-500/10 transition-colors duration-500"></div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {!loading && filteredUsers.length === 0 && (
                <div className="flex flex-col items-center justify-center py-32 text-center">
                    <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 animate-pulse">
                        <Search size={40} className="text-gray-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">No Verified Drivers Found</h3>
                    <p className="text-gray-400 max-w-md mx-auto">
                        We couldn't find any delivery partners matching "{searchQuery}". Try different keywords or check your spelling.
                    </p>
                </div>
            )}
        </div>
    )
}
