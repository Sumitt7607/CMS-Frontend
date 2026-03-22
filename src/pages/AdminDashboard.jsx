import { useState } from 'react';
import { Menu } from 'lucide-react';
import Sidebar from '../components/Sidebar';
import AdminOverview from './AdminOverview';
import EmployeeList from './EmployeeList';
import AdminAttendance from './AdminAttendance'; // Keep it imported if needed elsewhere, but we'll use Timesheet
import AdminTimesheet from './AdminTimesheet';
import AdminLeave from './AdminLeave';
import AdminHoliday from './AdminHoliday';
import AdminPayroll from './AdminPayroll';
import { motion, AnimatePresence } from 'framer-motion';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <AdminOverview setActiveTab={setActiveTab} />;
            case 'employees': return <EmployeeList />;
            case 'attendance': return <AdminTimesheet />;
            case 'leave': return <AdminLeave />;
            case 'holidays': return <AdminHoliday />;
            case 'payroll': return <AdminPayroll />;
            default: return (
                <div className="card" style={{ padding: '60px', textAlign: 'center', background: 'var(--bg-main)' }}>
                    <h2 style={{ color: 'var(--text-main)', fontSize: '20px', fontWeight: '700' }}>{activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Module</h2>
                    <p style={{ marginTop: '12px', color: 'var(--text-muted)' }}>We are currently building this featured module. Check back soon!</p>
                </div>
            );
        }
    };

    return (
        <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-subtle)', position: 'relative', overflow: 'hidden' }}>
            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isSidebarOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsSidebarOpen(false)}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            background: 'rgba(0,0,0,0.3)',
                            backdropFilter: 'blur(4px)',
                            zIndex: 999
                        }}
                        className="mobile-only"
                    />
                )}
            </AnimatePresence>

            {/* Adjusted Sidebar for Responsiveness */}
            <div style={{
                position: 'relative',
                zIndex: 1000,
                display: 'flex',
                transition: 'transform 0.3s ease'
            }} className={isSidebarOpen ? '' : 'desktop-only'}>
                <Sidebar activeTab={activeTab} setActiveTab={(tab) => { setActiveTab(tab); setIsSidebarOpen(false); }} onClose={() => setIsSidebarOpen(false)} />
            </div>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                {/* Mobile Header */}
                <header className="mobile-only" style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '16px 24px',
                    background: 'white',
                    borderBottom: '1px solid var(--border)',
                    position: 'sticky',
                    top: 0,
                    zIndex: 900
                }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
    <div style={{ background: 'var(--primary)', width: '28px', height: '28px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
        <Menu size={16} />
    </div>

    <img 
        src="/c60e662c-d159-4b54-b83e-50ed164cd42c.jpg" 
        alt="logo"
        style={{ 
            height: '32px',
            width: '40px',
            objectFit: 'contain'
        }} 
    />
</div>
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}
                    >
                        <Menu size={24} />
                    </button>
                </header>

                <main style={{ flex: 1, padding: '32px', overflowY: 'auto' }}>
                    <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
                        {renderContent()}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminDashboard;
