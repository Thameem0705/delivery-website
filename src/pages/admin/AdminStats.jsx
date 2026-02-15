
import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'
import { Package, Clock, Truck, CheckCircle } from 'lucide-react'

export default function AdminStats() {
    const [stats, setStats] = useState({ total: 0, pending: 0, inProgress: 0, completed: 0 })
    const [recentActivity, setRecentActivity] = useState([])

    useEffect(() => {
        fetchStats()

        // Subscribe to changes for real-time updates
        const channel = supabase
            .channel('public:tasks')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
                fetchStats()
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    const fetchStats = async () => {
        try {
            const { data: tasks, error } = await supabase.from('tasks').select('status')
            if (error) throw error

            setStats({
                total: tasks.length,
                pending: tasks.filter(t => t.status === 'pending').length,
                inProgress: tasks.filter(t => t.status === 'in-progress').length,
                completed: tasks.filter(t => t.status === 'completed').length
            })
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 animate-fadeIn">
            <h2 className="text-2xl font-bold mb-4">Dashboard Overview</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="Total Assignments" value={stats.total} icon={Package} color="blue" />
                <StatCard title="Pending" value={stats.pending} icon={Clock} color="amber" />
                <StatCard title="In Progress" value={stats.inProgress} icon={Truck} color="purple" />
                <StatCard title="Completed" value={stats.completed} icon={CheckCircle} color="emerald" />
            </div>

            {/* Placeholder for future charts or activity feed */}
            <div className="glass-panel p-6 mt-8">
                <h3 className="text-xl font-semibold mb-4">Recent Activity</h3>
                <p className="text-gray-400">Activity feed coming soon...</p>
            </div>
        </div>
    )
}

function StatCard({ title, value, icon: Icon, color }) {
    const colors = {
        blue: 'bg-blue-500 text-blue-400',
        amber: 'bg-amber-500 text-amber-400',
        purple: 'bg-purple-500 text-purple-400',
        emerald: 'bg-emerald-500 text-emerald-400'
    }

    return (
        <div className="glass-panel p-6 flex flex-col justify-between relative overflow-hidden h-32">
            <div className={`absolute -right-4 -top-4 p-8 rounded-full opacity-5 ${colors[color].split(' ')[0]}`} />

            <div className="flex justify-between items-start z-10">
                <div>
                    <p className="text-sm text-gray-400 font-medium">{title}</p>
                    <h3 className="text-3xl font-bold text-white mt-1">{value}</h3>
                </div>
                <div className={`p-2 rounded-lg bg-slate-800/50 border border-white/5 ${colors[color].split(' ')[1]}`}>
                    <Icon size={24} />
                </div>
            </div>
        </div>
    )
}
