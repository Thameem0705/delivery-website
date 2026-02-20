
import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    LogOut, Package, LayoutDashboard, Truck, User,
    Menu, X, List, Plus, Users, ChevronLeft, ChevronRight
} from 'lucide-react'

export default function Layout() {
    const { signOut, user, profile } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()

    // UI State
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

    // Handle window resize
    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024
            setIsMobile(mobile)
            if (mobile) {
                setIsSidebarCollapsed(false) // Reset on mobile
            }
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    const handleSignOut = async () => {
        await signOut()
        navigate('/login')
    }

    const navigation = [
        // Admin Links
        ...(profile?.role === 'admin' ? [
            { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
            { name: 'Task List', href: '/admin/tasks', icon: List },
            { name: 'New Task', href: '/admin/create', icon: Plus },
            { name: 'Delivery Team', href: '/admin/users', icon: Users },
        ] : [
            // Delivery Links
            { name: 'My Deliveries', href: '/delivery', icon: Truck },
        ]),
    ]

    const sidebarWidth = isSidebarCollapsed ? '5rem' : '16rem'

    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-color)' }}>

            {/* Mobile Sidebar Overlay */}
            {isMobileMenuOpen && (
                <div
                    style={{
                        position: 'fixed', inset: 0,
                        background: 'rgba(15, 23, 42, 0.6)',
                        backdropFilter: 'blur(4px)',
                        zIndex: 40
                    }}
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar Navigation */}
            <aside
                className={`glass-panel sidebar-transition`}
                style={{
                    position: 'fixed',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: isMobile ? '16rem' : sidebarWidth,
                    margin: isMobile ? 0 : '1rem',
                    padding: '1.5rem',
                    display: 'flex',
                    flexDirection: 'column',
                    zIndex: 50,
                    transform: isMobile
                        ? (isMobileMenuOpen ? 'translateX(0)' : 'translateX(-100%)')
                        : 'none',
                    borderRadius: isMobile ? 0 : '1rem',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    borderRight: isMobile ? '1px solid var(--glass-border)' : undefined,
                    height: isMobile ? '100%' : 'calc(100vh - 2rem)'
                }}
            >
                {/* Header */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: isSidebarCollapsed && !isMobile ? 'center' : 'space-between',
                    marginBottom: '2rem',
                    height: '3rem'
                }}>
                    {(!isSidebarCollapsed || isMobile) ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                background: 'linear-gradient(135deg, var(--primary), var(--accent-purple))',
                                padding: '0.5rem',
                                borderRadius: '0.5rem',
                                display: 'flex',
                                boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                            }}>
                                <Package size={24} color="white" />
                            </div>
                            <h1 style={{
                                fontSize: '1.25rem', margin: 0, fontWeight: 800,
                                letterSpacing: '-0.5px', whiteSpace: 'nowrap'
                            }}>
                                Delivery<span className="gradient-text">Pro</span>
                            </h1>
                        </div>
                    ) : (
                        <div style={{
                            background: 'linear-gradient(135deg, var(--primary), var(--accent-purple))',
                            padding: '0.5rem',
                            borderRadius: '0.5rem',
                            display: 'flex',
                            boxShadow: '0 4px 12px rgba(99, 102, 241, 0.3)'
                        }}>
                            <Package size={24} color="white" />
                        </div>
                    )}

                    {/* Close button removed as requested */}
                </div>

                {/* Navigation Links */}
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href
                        return (
                            <Link
                                key={item.name}
                                to={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                title={isSidebarCollapsed ? item.name : ''}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: isSidebarCollapsed && !isMobile ? 'center' : 'flex-start',
                                    gap: '0.75rem',
                                    padding: '0.75rem 1rem',
                                    borderRadius: '0.75rem',
                                    color: isActive ? 'white' : 'var(--text-muted)',
                                    background: isActive ? 'rgba(99, 102, 241, 0.15)' : 'transparent',
                                    border: isActive ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
                                    textDecoration: 'none',
                                    fontWeight: 500,
                                    transition: 'all 0.2s',
                                    position: 'relative',
                                    overflow: 'hidden'
                                }}
                            >
                                <item.icon size={20} color={isActive ? 'var(--primary)' : 'currentColor'} style={{ flexShrink: 0 }} />
                                {(!isSidebarCollapsed || isMobile) && (
                                    <span style={{ whiteSpace: 'nowrap', opacity: 1, transition: 'opacity 0.2s' }}>
                                        {item.name}
                                    </span>
                                )}
                                {isActive && (
                                    <div style={{
                                        position: 'absolute',
                                        left: 0,
                                        top: '50%',
                                        transform: 'translateY(-50%)',
                                        width: '3px',
                                        height: '60%',
                                        background: 'var(--primary)',
                                        borderTopRightRadius: '3px',
                                        borderBottomRightRadius: '3px'
                                    }} />
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer / User Profile */}
                <div style={{
                    borderTop: '1px solid var(--glass-border)',
                    paddingTop: '1.5rem',
                    marginTop: 'auto',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '1rem'
                }}>
                    {/* Collapse Toggle (Desktop Only) */}
                    {!isMobile && (
                        <button
                            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            style={{
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid var(--glass-border)',
                                color: 'var(--text-muted)',
                                cursor: 'pointer',
                                padding: '0.5rem',
                                borderRadius: '0.5rem',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                width: '100%',
                                transition: 'all 0.2s'
                            }}
                            className="hover:bg-white/10"
                        >
                            {isSidebarCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                        </button>
                    )}

                    <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.75rem',
                        justifyContent: isSidebarCollapsed && !isMobile ? 'center' : 'flex-start',
                        padding: '0 0.25rem'
                    }}>
                        <div style={{
                            width: '2.5rem',
                            height: '2.5rem',
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            border: '1px solid var(--glass-border)',
                            flexShrink: 0
                        }}>
                            <User size={18} />
                        </div>
                        {(!isSidebarCollapsed || isMobile) && (
                            <div style={{ overflow: 'hidden' }}>
                                <p style={{ margin: 0, fontSize: '0.9rem', fontWeight: 600, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                                    {profile?.full_name || 'User'}
                                </p>
                                <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                                    {profile?.role}
                                </p>
                            </div>
                        )}
                    </div>

                    {(!isSidebarCollapsed || isMobile) && (
                        <button
                            onClick={handleSignOut}
                            className="btn-danger w-full"
                            style={{ justifyContent: 'center' }}
                        >
                            <LogOut size={18} />
                            Sign Out
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <main style={{
                flex: 1,
                marginLeft: isMobile ? 0 : sidebarWidth,
                padding: '1.5rem',
                minWidth: 0, // Prevent flex overflow
                transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                width: '100%'
            }}>

                {/* Mobile Header Toggle */}
                {isMobile && (
                    <div className="glass-panel" style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: '1.5rem',
                        padding: '1rem'
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                background: 'linear-gradient(135deg, var(--primary), var(--accent-purple))',
                                padding: '0.4rem',
                                borderRadius: '0.4rem',
                                display: 'flex'
                            }}>
                                <Package size={20} color="white" />
                            </div>
                            <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 800 }}>
                                Delivery<span className="gradient-text">Pro</span>
                            </h1>
                        </div>
                        <button
                            onClick={() => setIsMobileMenuOpen(true)}
                            style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: '0.25rem' }}
                        >
                            <Menu size={24} />
                        </button>
                    </div>
                )}

                <Outlet />
            </main>
        </div>
    )
}
