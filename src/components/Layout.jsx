
import { useState, useEffect } from 'react'
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    LogOut, Package, LayoutDashboard, Truck, User,
    Menu, X, List, Plus, Users, ChevronLeft, ChevronRight, ShieldCheck
} from 'lucide-react'

export default function Layout() {
    const { signOut, user, profile } = useAuth()
    const navigate = useNavigate()
    const location = useLocation()
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
    const [isMobile, setIsMobile] = useState(window.innerWidth < 1024)

    useEffect(() => {
        const handleResize = () => {
            const mobile = window.innerWidth < 1024
            setIsMobile(mobile)
            if (mobile) setIsSidebarCollapsed(false)
        }
        window.addEventListener('resize', handleResize)
        return () => window.removeEventListener('resize', handleResize)
    }, [])

    // Close mobile menu on route change
    useEffect(() => { setIsMobileMenuOpen(false) }, [location.pathname])

    const handleSignOut = async () => {
        await signOut()
        navigate('/login')
    }

    const navigation = [
        ...(profile?.role === 'admin' ? [
            { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
            { name: 'Task List', href: '/admin/tasks', icon: List },
            { name: 'New Task', href: '/admin/create', icon: Plus },
            { name: 'Delivery Team', href: '/admin/users', icon: Users },
            { name: 'Permissions', href: '/admin/permissions', icon: ShieldCheck },
        ] : [
            { name: 'My Deliveries', href: '/delivery', icon: Truck },
            { name: 'Permissions', href: '/delivery/permissions', icon: ShieldCheck },
        ]),
    ]

    const sidebarWidth = isSidebarCollapsed ? '5rem' : '16rem'
    const isAdmin = profile?.role === 'admin'

    return (
        <div style={{ minHeight: '100vh', display: 'flex', background: 'var(--bg-color)' }}>

            {/* Mobile Overlay */}
            {isMobileMenuOpen && (
                <div
                    style={{
                        position: 'fixed', inset: 0, background: 'rgba(6,11,24,0.7)',
                        backdropFilter: 'blur(6px)', zIndex: 40,
                        animation: 'fadeIn 0.2s ease',
                    }}
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className="sidebar-transition"
                style={{
                    position: 'fixed', left: 0, top: 0, bottom: 0,
                    width: isMobile ? '16.5rem' : sidebarWidth,
                    margin: isMobile ? 0 : '0.75rem',
                    padding: isSidebarCollapsed && !isMobile ? '1.25rem 0.75rem' : '1.25rem',
                    display: 'flex', flexDirection: 'column',
                    zIndex: 50,
                    transform: isMobile
                        ? (isMobileMenuOpen ? 'translateX(0)' : 'translateX(-110%)')
                        : 'none',
                    borderRadius: isMobile ? 0 : '1.25rem',
                    height: isMobile ? '100%' : 'calc(100vh - 1.5rem)',
                    background: 'rgba(13,21,38,0.9)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.07)',
                    boxShadow: '4px 0 30px rgba(0,0,0,0.3)',
                }}
            >
                {/* Logo */}
                <div style={{
                    display: 'flex', alignItems: 'center',
                    justifyContent: isSidebarCollapsed && !isMobile ? 'center' : 'space-between',
                    marginBottom: '1.75rem', height: '3rem',
                }}>
                    {(!isSidebarCollapsed || isMobile) ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{
                                background: 'linear-gradient(135deg, var(--primary), var(--accent-purple))',
                                padding: '0.5rem', borderRadius: '0.625rem', display: 'flex',
                                boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                            }}>
                                <Package size={22} color="white" />
                            </div>
                            <h1 style={{ fontSize: '1.1rem', margin: 0, fontWeight: 800, letterSpacing: '-0.5px', whiteSpace: 'nowrap' }}>
                                Delivery<span className="gradient-text">Pro</span>
                            </h1>
                        </div>
                    ) : (
                        <div style={{
                            background: 'linear-gradient(135deg, var(--primary), var(--accent-purple))',
                            padding: '0.5rem', borderRadius: '0.625rem', display: 'flex',
                            boxShadow: '0 4px 16px rgba(99,102,241,0.35)',
                        }}>
                            <Package size={22} color="white" />
                        </div>
                    )}
                    {/* Mobile close */}
                    {isMobile && (
                        <button onClick={() => setIsMobileMenuOpen(false)}
                            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', display: 'flex' }}>
                            <X size={22} />
                        </button>
                    )}
                </div>

                {/* Role badge */}
                {(!isSidebarCollapsed || isMobile) && (
                    <div style={{
                        display: 'inline-flex', alignItems: 'center', gap: '0.4rem', alignSelf: 'flex-start',
                        padding: '0.25rem 0.7rem', borderRadius: '999px', marginBottom: '1.25rem',
                        fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase',
                        background: isAdmin ? 'rgba(99,102,241,0.12)' : 'rgba(16,185,129,0.12)',
                        color: isAdmin ? 'var(--primary)' : 'var(--success)',
                        border: isAdmin ? '1px solid rgba(99,102,241,0.25)' : '1px solid rgba(16,185,129,0.25)',
                    }}>
                        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: isAdmin ? 'var(--primary)' : 'var(--success)', boxShadow: isAdmin ? '0 0 6px rgba(99,102,241,0.8)' : '0 0 6px rgba(16,185,129,0.8)' }} />
                        {isAdmin ? 'Admin' : 'Delivery'}
                    </div>
                )}

                {/* Nav links */}
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href ||
                            (item.href !== '/' && location.pathname.startsWith(item.href) && item.href.length > 1)
                        return (
                            <Link key={item.name} to={item.href}
                                title={isSidebarCollapsed && !isMobile ? item.name : ''}
                                style={{
                                    display: 'flex', alignItems: 'center',
                                    justifyContent: isSidebarCollapsed && !isMobile ? 'center' : 'flex-start',
                                    gap: '0.75rem', padding: '0.7rem 0.875rem',
                                    borderRadius: '0.75rem',
                                    color: isActive ? 'white' : 'var(--text-muted)',
                                    background: isActive ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.12))' : 'transparent',
                                    border: isActive ? '1px solid rgba(99,102,241,0.3)' : '1px solid transparent',
                                    boxShadow: isActive ? '0 4px 16px rgba(99,102,241,0.12), inset 0 1px 0 rgba(255,255,255,0.06)' : 'none',
                                    textDecoration: 'none', fontWeight: 500,
                                    transition: 'all 0.2s cubic-bezier(0.2,0.8,0.2,1)',
                                    position: 'relative', overflow: 'hidden',
                                }}
                                onMouseEnter={e => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                                        e.currentTarget.style.color = 'var(--text-main)'
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isActive) {
                                        e.currentTarget.style.background = 'transparent'
                                        e.currentTarget.style.color = 'var(--text-muted)'
                                    }
                                }}
                            >
                                {/* Active left glow bar */}
                                {isActive && (
                                    <div style={{
                                        position: 'absolute', left: 0, top: '20%', bottom: '20%',
                                        width: '3px', borderRadius: '0 3px 3px 0',
                                        background: 'linear-gradient(to bottom, var(--primary), var(--accent-purple))',
                                        boxShadow: '0 0 8px rgba(99,102,241,0.6)',
                                    }} />
                                )}
                                <item.icon size={19}
                                    color={isActive ? 'var(--primary)' : 'currentColor'}
                                    style={{ flexShrink: 0, filter: isActive ? 'drop-shadow(0 0 4px rgba(99,102,241,0.5))' : 'none' }}
                                />
                                {(!isSidebarCollapsed || isMobile) && (
                                    <span style={{ whiteSpace: 'nowrap', fontSize: '0.9rem' }}>{item.name}</span>
                                )}
                            </Link>
                        )
                    })}
                </nav>

                {/* Footer */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: '1.25rem', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                    {/* Collapse toggle (desktop only) */}
                    {!isMobile && (
                        <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                            style={{
                                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                                color: 'var(--text-muted)', cursor: 'pointer', padding: '0.5rem',
                                borderRadius: '0.625rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                width: '100%', transition: 'all 0.2s',
                            }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                        >
                            {isSidebarCollapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
                        </button>
                    )}

                    {/* User info */}
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '0.75rem',
                        justifyContent: isSidebarCollapsed && !isMobile ? 'center' : 'flex-start',
                        padding: '0 0.25rem',
                    }}>
                        {/* Avatar with ring */}
                        <div style={{ position: 'relative', flexShrink: 0 }}>
                            <div style={{
                                width: '2.5rem', height: '2.5rem', borderRadius: '50%',
                                background: 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                border: '2px solid rgba(99,102,241,0.3)',
                                overflow: 'hidden',
                            }}>
                                {profile?.avatar_url ? (
                                    <img src={profile.avatar_url} alt={profile.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
                                ) : (
                                    <User size={17} color="var(--primary)" />
                                )}
                            </div>
                            {/* Online dot */}
                            <div style={{
                                position: 'absolute', bottom: '1px', right: '1px',
                                width: '8px', height: '8px', borderRadius: '50%',
                                background: 'var(--success)',
                                border: '1.5px solid rgba(13,21,38,0.9)',
                                boxShadow: '0 0 6px rgba(16,185,129,0.7)',
                            }} />
                        </div>

                        {(!isSidebarCollapsed || isMobile) && (
                            <div style={{ overflow: 'hidden', minWidth: 0 }}>
                                <p style={{ margin: 0, fontSize: '0.875rem', fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {profile?.full_name || 'User'}
                                </p>
                                <p style={{ margin: 0, fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    {profile?.role}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Sign Out */}
                    {(!isSidebarCollapsed || isMobile) && (
                        <button onClick={handleSignOut} style={{
                            width: '100%', boxSizing: 'border-box',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                            padding: '0.6rem 1rem', borderRadius: '0.65rem',
                            border: '1px solid rgba(239,68,68,0.25)', background: 'rgba(239,68,68,0.08)',
                            color: '#f87171', cursor: 'pointer', fontWeight: 700, fontSize: '0.875rem',
                            transition: 'all 0.2s',
                        }}
                            onMouseEnter={e => {
                                e.currentTarget.style.background = 'rgba(239,68,68,0.18)'
                                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.5)'
                                e.currentTarget.style.color = 'white'
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.background = 'rgba(239,68,68,0.08)'
                                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)'
                                e.currentTarget.style.color = '#f87171'
                            }}
                        >
                            <LogOut size={16} /> Sign Out
                        </button>
                    )}
                </div>
            </aside>

            {/* Main Content */}
            <main style={{
                flex: 1,
                marginLeft: isMobile ? 0 : `calc(${sidebarWidth} + 0.75rem)`,
                padding: '0.75rem',
                minWidth: 0,
                transition: 'margin-left 0.3s cubic-bezier(0.4,0,0.2,1)',
                display: 'flex',
                flexDirection: 'column'
            }}>
                {/* Mobile top bar */}
                {isMobile && (
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '0.875rem 1.1rem', marginBottom: '1rem', borderRadius: '1rem',
                        background: 'rgba(13,21,38,0.9)', backdropFilter: 'blur(16px)',
                        border: '1px solid rgba(255,255,255,0.07)', boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div style={{ background: 'linear-gradient(135deg, var(--primary), var(--accent-purple))', padding: '0.4rem', borderRadius: '0.5rem', display: 'flex', boxShadow: '0 4px 12px rgba(99,102,241,0.3)' }}>
                                <Package size={19} color="white" />
                            </div>
                            <h1 style={{ fontSize: '1rem', margin: 0, fontWeight: 800 }}>
                                Delivery<span className="gradient-text">Pro</span>
                            </h1>
                        </div>
                        <button onClick={() => setIsMobileMenuOpen(true)}
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '0.5rem', color: 'white', cursor: 'pointer', padding: '0.45rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Menu size={22} />
                        </button>
                    </div>
                )}

                <div key={location.pathname} className="page-enter" style={{ flex: 1 }}>
                    <Outlet />
                </div>

                <div style={{
                    marginTop: 'auto',
                    paddingTop: '2rem',
                    paddingBottom: '0.25rem',
                    textAlign: 'center',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                }}>
                    &copy; {new Date().getFullYear()} Ansari-Karthi. All rights reserved.
                </div>
            </main>
        </div>
    )
}
