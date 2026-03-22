import {
    LayoutGrid,
    Clock,
    Calendar,
    Gift,
    DollarSign,
    FileText,
    Users,
    LogOut,
    ChevronRight,
    BarChart3,
    X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ activeTab, setActiveTab, onClose }) => {
    const { logout, user } = useAuth();
    const navigate = useNavigate();

    const menuItems = user?.role === 'admin' ? [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
        { id: 'employees', label: 'Employees', icon: Users },
        { id: 'attendance', label: 'Timesheets', icon: Clock },
        { id: 'leave', label: 'Leave Requests', icon: Calendar },
        { id: 'holidays', label: 'Holidays', icon: Gift },
        { id: 'payroll', label: 'Payroll', icon: DollarSign },
        { id: 'templates', label: 'Templates', icon: FileText, isExternal: true, url: 'https://www.portfolio.manshulearning.com/Index.html' },
    ] : [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutGrid },
        { id: 'attendance', label: 'Timesheet', icon: Clock },
        { id: 'leave', label: 'Leave & Comp Off', icon: Calendar },
        { id: 'holidays', label: 'Holidays', icon: Gift },
        { id: 'templates', label: 'Templates', icon: FileText, isExternal: true, url: 'https://www.portfolio.manshulearning.com/Index.html' },
    ];

    return (
        <div className="card sidebar-container" style={{ 
            width: '280px', 
            height: 'calc(100vh - 32px)', 
            margin: '16px', 
            display: 'flex', 
            flexDirection: 'column', 
            padding: '24px', 
            position: 'sticky', 
            top: '16px',
            zIndex: 1000,
            transition: 'transform 0.3s ease'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', paddingLeft: '8px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
<div style={{ 
    width: '32px', 
    height: '32px', 
    borderRadius: '8px', 
    overflow: 'hidden',
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center'
}}>
    <img 
        src="/c60e662c-d159-4b54-b83e-50ed164cd42c.jpg" 
        alt="logo" 
        style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
    />
</div>
                    <h2 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', letterSpacing: '-0.02em' }}>CMS <span style={{ color: 'var(--primary)' }}>{user?.role === 'admin' ? 'Admin' : 'Cloud'}</span></h2>
                </div>
                
                {onClose && (
                    <button onClick={onClose} className="mobile-only" style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}>
                        <X size={20} />
                    </button>
                )}
            </div>

            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = activeTab === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => {
                                if (item.isExternal) {
                                    window.open(item.url, '_blank', 'noopener,noreferrer');
                                } else {
                                    setActiveTab(item.id);
                                }
                            }}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '12px',
                                padding: '10px 16px',
                                borderRadius: '8px',
                                border: 'none',
                                background: isActive ? 'var(--primary-soft)' : 'transparent',
                                color: isActive ? 'var(--primary)' : 'var(--text-muted)',
                                cursor: 'pointer',
                                transition: 'all 0.2s ease',
                                textAlign: 'left',
                                width: '100%',
                                fontWeight: isActive ? '600' : '500'
                            }}
                        >
                            <Icon size={18} />
                            <span style={{ fontSize: '14px' }}>{item.label}</span>
                            {isActive && <ChevronRight size={14} style={{ marginLeft: 'auto' }} />}
                        </button>
                    );
                })}
            </nav>

            <div style={{ marginTop: 'auto', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px', paddingLeft: '8px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: 'var(--bg-subtle)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '600', color: 'var(--text-main)' }}>
                        {user?.name?.[0].toUpperCase()}
                    </div>
                    <div>
                        <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-main)' }}>{user?.name}</p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{user?.role}</p>
                    </div>
                </div>
                <button
                    onClick={() => { logout(); navigate('/login'); }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '10px 16px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'transparent',
                        color: 'var(--danger)',
                        cursor: 'pointer',
                        width: '100%',
                        fontWeight: '600',
                        fontSize: '14px'
                    }}
                >
                    <LogOut size={18} />
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
