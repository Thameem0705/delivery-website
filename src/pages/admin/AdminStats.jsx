
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Package, Clock, Truck, CheckCircle, TrendingUp, Activity, MapPin, User } from 'lucide-react'

export default function AdminStats() {
    const [stats, setStats] = useState({ total: 0, pending: 0, completed: 0 })
    const [recentTasks, setRecentTasks] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchData()
        const channel = supabase
            .channel('admin-stats')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => fetchData())
            .subscribe()
        return () => supabase.removeChannel(channel)
    }, [])

    const fetchData = async () => {
        try {
            const { data: tasks, error } = await supabase
                .from('tasks')
                .select('*, assigned_to(full_name)')
                .order('created_at', { ascending: false })
            if (error) throw error

            setStats({
                total: tasks.length,
                pending: tasks.filter(t => t.status === 'pending').length,
                completed: tasks.filter(t => t.status === 'completed').length,
            })
            setRecentTasks(tasks.slice(0, 8))
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    const completionRate = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0

    return (
        <div className="w-full max-w-7xl mx-auto space-y-8 animate-fadeIn">

            {/* Page Header */}
            <div>
                <h2 className="text-3xl font-bold flex items-center gap-3">
                    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 p-3 rounded-2xl shadow-xl shadow-purple-500/20">
                        <Activity size={28} className="text-white" />
                    </div>
                    <span style={{ background: 'linear-gradient(to right, #fff, #94a3b8)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                        Dashboard Overview
                    </span>
                </h2>
                <p className="text-gray-400 mt-2 ml-16">Real-time insights into your delivery operations.</p>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard
                    title="Total Tasks"
                    value={stats.total}
                    icon={Package}
                    gradient="from-blue-500 to-indigo-600"
                    glow="shadow-blue-500/20"
                    sub="All assignments created"
                />
                <StatCard
                    title="Pending"
                    value={stats.pending}
                    icon={Clock}
                    gradient="from-amber-500 to-orange-500"
                    glow="shadow-amber-500/20"
                    sub="Awaiting completion"
                />
                <StatCard
                    title="Completed"
                    value={stats.completed}
                    icon={CheckCircle}
                    gradient="from-emerald-500 to-teal-500"
                    glow="shadow-emerald-500/20"
                    sub="Successfully delivered"
                />
            </div>

            {/* Completion Rate */}
            <div
                className="glass-panel p-6"
                style={{ border: '1px solid rgba(99,102,241,0.2)', boxShadow: '0 0 40px rgba(99,102,241,0.05)' }}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 rounded-xl border border-indigo-500/20">
                            <TrendingUp size={20} className="text-indigo-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-white">Completion Rate</h3>
                            <p className="text-xs text-gray-500">Overall delivery performance</p>
                        </div>
                    </div>
                    <span className="text-3xl font-extrabold" style={{ color: completionRate >= 70 ? '#10b981' : completionRate >= 40 ? '#f59e0b' : '#ef4444' }}>
                        {completionRate}%
                    </span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                    <div
                        className="h-3 rounded-full transition-all duration-700"
                        style={{
                            width: `${completionRate}%`,
                            background: completionRate >= 70
                                ? 'linear-gradient(to right, #10b981, #34d399)'
                                : completionRate >= 40
                                    ? 'linear-gradient(to right, #f59e0b, #fbbf24)'
                                    : 'linear-gradient(to right, #ef4444, #f87171)',
                        }}
                    />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                    <span>0%</span>
                    <span>{stats.completed} of {stats.total} tasks completed</span>
                    <span>100%</span>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="glass-panel p-6">
                <h3 className="text-xl font-bold text-white mb-5 flex items-center gap-2">
                    <Activity size={18} className="text-purple-400" />
                    Recent Activity
                </h3>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                    </div>
                ) : recentTasks.length === 0 ? (
                    <div className="text-center py-10 text-gray-500">
                        <Package size={40} className="mx-auto mb-3 opacity-30" />
                        <p>No tasks yet. Create your first assignment!</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recentTasks.map(task => (
                            <div
                                key={task.id}
                                className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover:bg-white/[0.04]"
                                style={{ border: '1px solid rgba(255,255,255,0.05)', background: 'rgba(15,23,42,0.4)' }}
                            >
                                {/* Status dot */}
                                <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${task.status === 'completed' ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.6)]' : 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]'}`} />

                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">{task.title}</p>
                                    <div className="flex items-center gap-3 mt-0.5">
                                        <span className="flex items-center gap-1 text-xs text-gray-500">
                                            <MapPin size={10} />
                                            {task.location_address?.slice(0, 30) || 'No address'}…
                                        </span>
                                        {task.assigned_to?.full_name && (
                                            <span className="flex items-center gap-1 text-xs text-gray-500">
                                                <User size={10} />
                                                {task.assigned_to.full_name}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 shrink-0">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${task.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                                        {task.status}
                                    </span>
                                    <span className="text-xs text-gray-600 font-mono hidden sm:block">
                                        {new Date(task.created_at).toLocaleDateString()}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function StatCard({ title, value, icon: Icon, gradient, glow, sub }) {
    return (
        <div
            className={`glass-panel p-6 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 shadow-xl ${glow}`}
            style={{ border: '1px solid rgba(255,255,255,0.08)' }}
        >
            {/* Background glow */}
            <div className={`absolute -right-8 -top-8 w-32 h-32 rounded-full bg-gradient-to-br ${gradient} opacity-10 blur-xl group-hover:opacity-20 transition-opacity`} />

            <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}>
                        <Icon size={22} className="text-white" />
                    </div>
                </div>
                <p className="text-sm text-gray-400 font-medium">{title}</p>
                <h3 className="text-4xl font-black text-white mt-1 tracking-tight">{value}</h3>
                <p className="text-xs text-gray-600 mt-1">{sub}</p>
            </div>
        </div>
    )
}
