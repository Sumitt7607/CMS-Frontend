import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { Clock, CheckCircle, Calendar, Briefcase, CreditCard, Check, AlertCircle, ChevronRight, LayoutGrid, FileText, Gift, Plus, ChevronLeft, Menu } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
};

// Mock/Simple views for now, can be expanded or moved to separate files
const CelebrationCard = ({ type, user, years }) => {
    const isBirthday = type === 'birthday';

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            style={{
                background: isBirthday
                    ? 'linear-gradient(135deg, #FF6B6B 0%, #FF8E53 100%)'
                    : 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                padding: '32px',
                borderRadius: '24px',
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                marginBottom: '32px',
                color: 'white',
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
            }}
        >
            <div style={{
                position: 'absolute',
                top: '-20px',
                right: '-20px',
                opacity: 0.2,
                transform: 'rotate(15deg)'
            }}>
                {isBirthday ? <Gift size={120} /> : <Briefcase size={120} />}
            </div>

            <div style={{
                width: '80px',
                height: '80px',
                borderRadius: '20px',
                background: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)'
            }}>
                {isBirthday ? <Gift size={40} /> : <CheckCircle size={40} />}
            </div>

            <div style={{ flex: 1 }}>
                <h2 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>
                    {isBirthday ? `Happy Birthday, ${user.name}!` : `Happy Work Anniversary!`}
                </h2>
                <p style={{ fontSize: '16px', opacity: 0.9, marginTop: '8px', fontWeight: '600' }}>
                    {isBirthday
                        ? "Wishing you a wonderful day filled with joy and celebration! 🎂✨"
                        : `Congratulations on completing ${years} year${years > 1 ? 's' : ''} with us! Thank you for your amazing contribution. 🚀🌟`}
                </p>
            </div>
        </motion.div>
    );
};

const AttendanceTracker = ({ data, handleCheckIn, handleCheckOut, error, viewDate, handlePrevMonth, handleNextMonth }) => {
    const { attendance, attendanceHistory, timesheets, holidays = [] } = data;
    const [elapsedTime, setElapsedTime] = useState('00:00:00');


    useEffect(() => {
        let interval;
        if (attendance?.checkIn && !attendance?.checkOut) {
            interval = setInterval(() => {
                const now = new Date();
                const [h, m, s] = attendance.checkIn.split(':').map(Number);
                const checkInDate = new Date();
                checkInDate.setHours(h, m, s, 0);

                const diff = now - checkInDate;
                if (diff > 0) {
                    const hours = Math.floor(diff / 3600000);
                    const minutes = Math.floor((diff % 3600000) / 60000);
                    const seconds = Math.floor((diff % 60000) / 1000);
                    setElapsedTime(
                        `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                    );
                }
            }, 1000);
        } else {
            setElapsedTime('00:00:00');
        }
        return () => clearInterval(interval);
    }, [attendance]);

    // Calendar logic
    const today = new Date();
    const currentMonth = viewDate.getMonth();
    const currentYear = viewDate.getFullYear();

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const getDayData = (day) => {
        if (!day) return null;
        const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const dayTimesheets = timesheets.filter(ts => ts.date === dateStr);
        const att = attendanceHistory.find(ah => ah.date === dateStr);
        const isHoliday = holidays.find(h => h.date === dateStr);

        let status = 'none';
        if (isHoliday) status = 'holiday';
        else if (att) status = 'completed';

        return { status, isHoliday };
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div className="card" style={{ padding: '24px', borderRadius: '20px', background: 'white', border: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '32px' }}>
                    <div>
                        <h2 style={{ fontSize: '20px', fontWeight: '800', color: '#1e293b', margin: 0, letterSpacing: '-0.02em' }}>Attendance Tracker</h2>
                        <p style={{ color: '#64748b', fontSize: '14px', marginTop: '4px' }}>Track your daily working hours</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ fontSize: '32px', fontWeight: '800', color: '#1e293b', fontVariantNumeric: 'tabular-nums' }}>{elapsedTime}</div>
                        {!attendance?.checkIn ? (
                            <button onClick={handleCheckIn} className="btn-primary" style={{ padding: '12px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', background: '#10b981', border: 'none', color: 'white', fontWeight: '700' }}>
                                <CheckCircle size={18} />
                                <span>Check In</span>
                            </button>
                        ) : !attendance?.checkOut ? (
                            <button onClick={handleCheckOut} className="btn-primary" style={{ padding: '10px 24px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px', background: '#ef4444', border: 'none', color: 'white', fontWeight: '700' }}>
                                <Clock size={18} />
                                <span>Check Out</span>
                            </button>
                        ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <CheckCircle size={18} color="#10b981" />
                                <span style={{ color: '#64748b', fontWeight: '700', fontSize: '14px' }}>Shift Completed</span>
                            </div>
                        )}
                    </div>
                </div>

                <div style={{ background: '#f8fafc', padding: '24px', borderRadius: '16px', marginTop: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', margin: 0 }}>
                            {viewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} — Monthly Overview
                        </h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button 
                                onClick={handlePrevMonth} 
                                style={{ 
                                    padding: '8px', 
                                    borderRadius: '8px', 
                                    border: '1px solid #e2e8f0', 
                                    background: 'white', 
                                    cursor: 'pointer', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    opacity: viewDate.getFullYear() * 12 + viewDate.getMonth() <= (new Date().getFullYear() * 12 + new Date().getMonth() - 4) ? 0.5 : 1,
                                    pointerEvents: viewDate.getFullYear() * 12 + viewDate.getMonth() <= (new Date().getFullYear() * 12 + new Date().getMonth() - 4) ? 'none' : 'auto'
                                }} 
                                title="Previous Month"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button 
                                onClick={handleNextMonth} 
                                style={{ 
                                    padding: '8px', 
                                    borderRadius: '8px', 
                                    border: '1px solid #e2e8f0', 
                                    background: 'white', 
                                    cursor: 'pointer', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    justifyContent: 'center',
                                    opacity: viewDate.getFullYear() * 12 + viewDate.getMonth() >= (new Date().getFullYear() * 12 + new Date().getMonth() + 4) ? 0.5 : 1,
                                    pointerEvents: viewDate.getFullYear() * 12 + viewDate.getMonth() >= (new Date().getFullYear() * 12 + new Date().getMonth() + 4) ? 'none' : 'auto'
                                }} 
                                title="Next Month"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} style={{ textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#64748b', paddingBottom: '12px' }}>{d}</div>
                        ))}
                        {days.map((day, i) => {
                            const data = getDayData(day);
                            const isToday = day === today.getDate() && currentMonth === today.getMonth() && currentYear === today.getFullYear();

                            const getStyles = () => {
                                if (!day) return { visibility: 'hidden' };
                                let styles = {
                                    aspectRatio: '1.8',
                                    borderRadius: '12px',
                                    padding: '8px',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '4px',
                                    background: '#f8fafc',
                                    border: '1px solid #e2e8f0',
                                    transition: 'all 0.2s ease'
                                };

                                if (isToday) {
                                    styles.border = '2px solid #3b82f6';
                                    styles.background = 'white';
                                    styles.boxShadow = '0 4px 12px rgba(59, 130, 146, 0.1)';
                                } else if (data.status === 'completed') {
                                    styles.background = '#f0fdf4';
                                    styles.border = '1px solid #10b981';
                                } else if (data.status === 'holiday') {
                                    styles.background = '#f3e8ff';
                                    styles.border = '1px solid #d8b4fe';
                                }

                                return styles;
                            };

                            return (
                                <div key={i} style={getStyles()}>
                                    {day && (
                                        <>
                                            <span style={{ fontSize: '13px', fontWeight: '800', color: '#475569' }}>{day}</span>
                                            <div style={{
                                                width: '6px',
                                                height: '6px',
                                                borderRadius: '50%',
                                                background: data.status === 'completed' ? '#10b981' : data.status === 'holiday' ? '#a855f7' : '#94a3b8'
                                            }} />
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', gap: '24px', marginTop: '24px' }}>
                        {[
                            { color: '#10b981', label: 'Present' },
                            { color: '#94a3b8', label: 'Absent / Leave' },
                            { color: '#a855f7', label: 'Public Holiday' }
                        ].map(item => (
                            <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: item.color }} />
                                <span style={{ fontSize: '13px', color: '#64748b', fontWeight: '600' }}>{item.label}</span>
                            </div>
                        ))}
                    </div>
                </div>
                {error && <p style={{ color: '#ef4444', fontSize: '13px', marginTop: '16px', fontWeight: '600', textAlign: 'center' }}>{error}</p>}
            </div>
        </div>
    );
};
const DashboardHome = ({ data, handleCheckIn, handleCheckOut, error, viewDate, handlePrevMonth, handleNextMonth }) => {
    const { user } = useAuth();
    const { timesheets, leaves, holidays, attendanceHistory } = data;
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            {/* Header Section */}
            <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px rgba(16, 185, 129, 0.4)' }} />
                        <span style={{ fontSize: '12px', fontWeight: '800', color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em' }}>System Active</span>
                    </div>
                    <h1 style={{ fontSize: '36px', fontWeight: '800', color: '#0f172a', letterSpacing: '-0.04em', margin: 0, display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {currentTime.getHours() < 12 ? 'Good morning' : currentTime.getHours() < 17 ? 'Good afternoon' : 'Good evening'}, {user?.name.split(' ')[0]} ✨
                    </h1>
                    <p style={{ color: '#64748b', fontSize: '16px', marginTop: '8px', fontWeight: '600' }}>
                        {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>
                <div style={{
                    background: '#f1f5f9',
                    padding: '12px 24px',
                    borderRadius: '16px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    border: '1px solid #e2e8f0'
                }}>
                    <Clock size={20} color="#3b82f6" />
                    <span style={{ fontSize: '18px', fontWeight: '800', color: '#0f172a', fontVariantNumeric: 'tabular-nums' }}>
                        {currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
                    </span>
                </div>
            </header>

            {/* Celebration Cards */}
            {(() => {
                if (!user) return null;
                const today = new Date();
                const m = today.getMonth() + 1;
                const d = today.getDate();
                const cards = [];

                if (user.dob) {
                    const [bYear, bMonth, bDay] = user.dob.split('-').map(Number);
                    if (bMonth === m && bDay === d) {
                        cards.push(<CelebrationCard key="bday" type="birthday" user={user} />);
                    }
                }

                if (user.doj) {
                    const [jYear, jMonth, jDay] = user.doj.split('-').map(Number);
                    if (jMonth === m && jDay === d) {
                        const years = today.getFullYear() - jYear;
                        if (years > 0) {
                            cards.push(<CelebrationCard key="anniv" type="anniversary" user={user} years={years} />);
                        }
                    }
                }

                return cards;
            })()}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                {/* Attendance Tracker Core Section */}
                <AttendanceTracker
                    data={data}
                    handleCheckIn={handleCheckIn}
                    handleCheckOut={handleCheckOut}
                    error={error}
                    viewDate={viewDate}
                    handlePrevMonth={handlePrevMonth}
                    handleNextMonth={handleNextMonth}
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                    {[
                        { label: 'Present Days', value: attendanceHistory.length, icon: Check, color: '#10b981', bg: '#ecfdf5' },
                        { label: 'Logged Timesheets', value: timesheets.length, icon: Briefcase, color: '#3b82f6', bg: '#eff6ff' }
                    ].map((stat, i) => (
                        <div key={i} className="card" style={{ padding: '24px', background: '#ffffff', borderRadius: '24px', border: '1px solid #e2e8f0' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: stat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: stat.color, marginBottom: '16px' }}>
                                <stat.icon size={20} />
                            </div>
                            <p style={{ color: '#64748b', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', marginBottom: '4px' }}>{stat.label}</p>
                            <h3 style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', margin: 0 }}>{stat.value}</h3>
                        </div>
                    ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '32px' }}>
                    {/* Recent Activities */}
                    <div className="card" style={{ padding: '32px', background: '#ffffff', borderRadius: '24px', border: '1px solid var(--border)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                            <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Recent Activities</h2>
                            <button style={{ color: 'var(--primary)', fontSize: '13px', fontWeight: '700', background: 'none', border: 'none' }}>View All</button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {timesheets.slice(0, 5).map((ts, i) => (
                                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '16px', background: '#f8fafc', borderRadius: '16px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '16px', border: '1px solid var(--border)' }}>
                                        <Briefcase size={18} color="var(--primary)" />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{ts.project}</p>
                                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{ts.module} • {ts.phase}</p>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <p style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Logged</p>
                                        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{new Date(ts.date).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Utilization Indicator */}
                    <div className="card" style={{ padding: '32px', background: '#ffffff', borderRadius: '24px', border: '1px solid var(--border)' }}>
                        <h2 style={{ fontSize: '18px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '24px' }}>Employee Utilization</h2>
                        <div style={{ textAlign: 'center', padding: '20px 0' }}>
                            <div style={{ position: 'relative', width: '160px', height: '160px', margin: '0 auto' }}>
                                <svg width="160" height="160" viewBox="0 0 160 160">
                                    <circle cx="80" cy="80" r="70" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                                    <circle cx="80" cy="80" r="70" fill="none" stroke="var(--primary)" strokeWidth="12" strokeDasharray="440" strokeDashoffset={440 - (440 * (Math.min(timesheets.length, 22) / 22))} strokeLinecap="round" transform="rotate(-90 80 80)" />
                                </svg>
                                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', textAlign: 'center' }}>
                                    <h4 style={{ fontSize: '28px', fontWeight: '800', margin: 0 }}>{Math.round((Math.min(timesheets.length, 22) / 22) * 100)}%</h4>
                                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: '700', textTransform: 'uppercase' }}>Target achieved</p>
                                </div>
                            </div>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '24px', fontWeight: '500' }}>You have completed {timesheets.length} days this month.</p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const TimesheetView = ({ timesheets, attendanceHistory, fetchDashboardData }) => {
    const { token } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        project: '',
        module: '',
        phase: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [status, setStatus] = useState({ type: '', msg: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', msg: '' });
        try {
            await axios.post(`${API_URL}/timesheets`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatus({ type: 'success', msg: 'Timesheet entry added!' });
            setFormData({
                project: '',
                module: '',
                phase: '',
                date: new Date().toISOString().split('T')[0]
            });
            setShowForm(false);
            fetchDashboardData();
        } catch (err) {
            setStatus({ type: 'error', msg: err.response?.data?.message || 'Failed to add entry' });
        }
    };

    const filteredTimesheets = timesheets.filter(ts => {
    const tsDate = new Date(ts.date);

    const matchesStart = startDate ? tsDate >= new Date(startDate) : true;
    const matchesEnd = endDate ? tsDate <= new Date(endDate) : true;

    return matchesStart && matchesEnd;
});

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px' }}>

    <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
        My Timesheet
    </h2>

    <div style={{ display: 'flex', gap: '10px' }}>
        <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }}
        />

        <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--border)' }}
        />

        <button
            onClick={() => {
                setStartDate('');
                setEndDate('');
            }}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--border)' }}
        >
            Clear
        </button>

        {/* 👉 ye important hai (Add Entry button wapas lagana) */}
        <button
            onClick={() => setShowForm(!showForm)}
            className="btn-primary"
            style={{ padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
            <Plus size={18} />
            {showForm ? 'Cancel' : 'Add Entry'}
        </button>
    </div>
</div>
            <AnimatePresence>
                {showForm && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="card"
                        style={{ padding: '24px', background: 'white', overflow: 'hidden' }}
                    >
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>Project Name</label>
                                <input required type="text" value={formData.project} onChange={e => setFormData({ ...formData, project: e.target.value })} placeholder="e.g. Website Redesign" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>Module</label>
                                <input required type="text" value={formData.module} onChange={e => setFormData({ ...formData, module: e.target.value })} placeholder="e.g. Frontend" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>Phase</label>
                                <input required type="text" value={formData.phase} onChange={e => setFormData({ ...formData, phase: e.target.value })} placeholder="e.g. Development" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>Date</label>
                                <input required type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }} />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gridColumn: 'span 2' }}>
                                <button type="submit" className="btn-primary" style={{ width: '100%', padding: '12px', borderRadius: '8px', fontWeight: '700' }}>Submit Entry</button>
                            </div>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>

            {status.msg && (
                <div style={{ padding: '12px', borderRadius: '8px', background: status.type === 'success' ? '#f0fdf4' : '#fef2f2', color: status.type === 'success' ? '#16a34a' : '#ef4444', fontSize: '14px', fontWeight: '600' }}>
                    {status.msg}
                </div>
            )}

            <div className="card" style={{ padding: '32px', borderRadius: '24px', background: 'white' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  filteredTimesheets.map((ts, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid var(--border)' }}>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{ts.project}</p>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{ts.module} • {ts.phase}</p>
                            </div>
                            <div style={{ textAlign: 'right', marginRight: '40px' }}>
                                <p style={{ fontSize: '14px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>Date</p>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{new Date(ts.date).toLocaleDateString()}</p>
                            </div>
                            <span style={{
                                padding: '6px 12px',
                                borderRadius: '20px',
                                fontSize: '12px',
                                fontWeight: '700',
                                background: ts.status === 'Approved' ? '#f0fdf4' : ts.status === 'Rejected' ? '#fef2f2' : '#fffbeb',
                                color: ts.status === 'Approved' ? '#16a34a' : ts.status === 'Rejected' ? '#ef4444' : '#f59e0b'
                            }}>
                                {ts.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Attendance Logs Section */}
            <div className="card" style={{ background: 'white', borderRadius: '24px', overflow: 'hidden' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Clock size={20} color="var(--primary)" />
                    <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Attendance Logs</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Date</th>
                                <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Check In</th>
                                <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Check Out</th>
                                <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {attendanceHistory.map((record, i) => (
                                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                    <td style={{ padding: '20px 32px', fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>
                                        {new Date(record.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                    </td>
                                    <td style={{ padding: '20px 32px', fontSize: '14px', color: '#16a34a', fontWeight: '700' }}>
                                        {record.checkIn || '--:--'}
                                    </td>
                                    <td style={{ padding: '20px 32px', fontSize: '14px', color: '#dc2626', fontWeight: '700' }}>
                                        {record.checkOut || '--:--'}
                                    </td>
                                    <td style={{ padding: '20px 32px' }}>
                                        <span style={{
                                            padding: '4px 12px',
                                            borderRadius: '20px',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            background: '#f0fdf4',
                                            color: '#16a34a',
                                            border: '1px solid #dcfce7'
                                        }}>
                                            {record.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {attendanceHistory.length === 0 && (
                                <tr>
                                    <td colSpan="4" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No attendance logs found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};

const LeaveView = ({ leaves, fetchDashboardData }) => {
    const { token, user } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    // Summary calculations with dynamic accrual based on DOJ (2 days per month)
    const getAccruedLeave = () => {
        if (!user?.createdAt) return 0;
        const createdDate = new Date(user.createdAt);
        const now = new Date();
        const months = (now.getFullYear() - createdDate.getFullYear()) * 12 + (now.getMonth() - createdDate.getMonth());
        return Math.max(0, months * 2);
    };

    const accruedPaidLeave = getAccruedLeave();

    const calculateDuration = (start, end) => {
        if (!start || !end) return 0;
        const s = new Date(start);
        const e = new Date(end);
        if (isNaN(s) || isNaN(e)) return 0;
        const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
        return diff > 0 ? diff : 0;
    };

    const rawPaidLeavesUsed = leaves
        .filter(l => l.type === 'Paid Leave' && l.status === 'Approved')
        .reduce((sum, l) => sum + calculateDuration(l.startDate, l.endDate), 0);

    const paidLeavesUsedDisplay = Math.min(rawPaidLeavesUsed, accruedPaidLeave);
    const paidLeavesRemaining = Math.max(0, accruedPaidLeave - rawPaidLeavesUsed);

    // Form States
    const [leaveForm, setLeaveForm] = useState({
        startDate: '',
        endDate: '',
        type: 'Paid Leave',
        reason: ''
    });

    const [compForm, setCompForm] = useState({
        date: new Date().toISOString().split('T')[0],
        type: 'Full Day',
        reason: ''
    });

    const [status, setStatus] = useState({ type: '', msg: '' });

    const stats = [
        { label: 'Paid Leave', used: paidLeavesUsedDisplay, limit: accruedPaidLeave },
    ];

    // Update form type if paid leaves run out
    useEffect(() => {
        if (paidLeavesRemaining <= 0 && leaveForm.type === 'Paid Leave') {
            setLeaveForm(prev => ({ ...prev, type: 'Unpaid Leave' }));
        }
    }, [paidLeavesRemaining]);

    const handleSubmit = async (formData) => {
        setStatus({ type: '', msg: '' });
        try {
            const payload = formData;

            // Simple validation
            if (!payload.startDate || !payload.endDate || !payload.reason) {
                setStatus({ type: 'error', msg: 'Please fill in all required fields (Dates and Reason).' });
                return;
            }

            // Paid Leave Balance Validation
            const duration = calculateDuration(payload.startDate, payload.endDate);
            if (payload.type === 'Paid Leave' && duration > paidLeavesRemaining) {
                setStatus({ type: 'error', msg: `Insufficient Paid Leave balance. You only have ${paidLeavesRemaining} day(s) left. Please apply for excess days as Unpaid Leave.` });
                return;
            }

            await axios.post(`${API_URL}/leaves`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatus({ type: 'success', msg: 'Leave applied successfully!' });
            fetchDashboardData();
            setLeaveForm({ startDate: '', endDate: '', type: 'Paid Leave', reason: '' });
        } catch (err) {
            setStatus({ type: 'error', msg: err.response?.data?.message || 'Submission failed' });
        }
    };

    const handleCompSubmit = async (e) => {
        e.preventDefault();
        setStatus({ type: '', msg: '' });
        try {
            if (!compForm.reason) {
                setStatus({ type: 'error', msg: 'Please provide a reason for Comp Off.' });
                return;
            }
            await axios.post(`${API_URL}/leaves`, {
                startDate: compForm.date,
                endDate: compForm.date,
                type: 'Comp Off',
                reason: compForm.reason
            }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatus({ type: 'success', msg: 'Comp Off request submitted!' });
            setCompForm({ date: new Date().toISOString().split('T')[0], type: 'Full Day', reason: '' });
            fetchDashboardData();
        } catch (err) {
            setStatus({ type: 'error', msg: err.response?.data?.message || 'Submission failed' });
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Leave Management</h2>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px' }}>
                {stats.map((stat, i) => (
                    <div key={i} className="card" style={{ padding: '24px', background: 'white', borderRadius: '24px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '20px' }}>
                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: i === 0 ? '#eff6ff' : '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: i === 0 ? '#3b82f6' : '#64748b' }}>
                            {i === 0 ? <Briefcase size={24} /> : <Calendar size={24} />}
                        </div>
                        <div>
                            <p style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>{stat.label}</p>
                            <h3 style={{ fontSize: '28px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                                {stat.used} <span style={{ color: 'var(--text-muted)', fontSize: '18px', fontWeight: '500' }}>/ {stat.limit}</span>
                            </h3>
                        </div>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
                {/* Apply for Leave Form */}
                <div className="card" style={{ padding: '32px', background: 'white', borderRadius: '24px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                            <Calendar size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>Apply for Leave</h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Request time off from your manager</p>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px', marginBottom: '24px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.025em' }}>From Date</label>
                            <input type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '14px', fontWeight: '500' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.025em' }}>To Date</label>
                            <input type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '14px', fontWeight: '500' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.025em' }}>Leave Type</label>
                            <select value={leaveForm.type} onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                                {paidLeavesRemaining > 0 && <option value="Paid Leave">Paid Leave</option>}
                                <option value="Unpaid Leave">Unpaid Leave</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: '32px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.025em' }}>Reason for Leave</label>
                        <textarea rows="4" value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} placeholder="Please provide a brief reason for your leave request..." style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '14px', lineHeight: '1.6', resize: 'none' }} />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '14px', fontWeight: '700', color: 'var(--primary)' }}>
                            {leaveForm.startDate && leaveForm.endDate && (
                                <span>Duration: {calculateDuration(leaveForm.startDate, leaveForm.endDate)} day(s)</span>
                            )}
                        </div>
                        <button onClick={() => handleSubmit(leaveForm)} className="btn-primary" style={{ padding: '14px 40px', borderRadius: '12px', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <Check size={18} />
                            <span>Submit Request</span>
                        </button>
                    </div>
                </div>

                {/* Apply for Comp Off Card */}
                <div className="card" style={{ padding: '32px', background: 'white', borderRadius: '24px', border: '1px solid var(--border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                            <Clock size={20} />
                        </div>
                        <div>
                            <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0, color: 'var(--text-main)' }}>Apply for Comp Off</h3>
                            <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' }}>Request compensatory leave for extra work</p>
                        </div>
                    </div>

                    <form onSubmit={handleCompSubmit}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px', marginBottom: '24px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.025em' }}>Comp Off Date</label>
                                <input required type="date" value={compForm.date} onChange={e => setCompForm({ ...compForm, date: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '14px', fontWeight: '500' }} />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.025em' }}>Type</label>
                                <select value={compForm.type} onChange={e => setCompForm({ ...compForm, type: e.target.value })} style={{ width: '100%', padding: '12px 16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '14px', fontWeight: '500', cursor: 'pointer' }}>
                                    <option value="Full Day">Full Day</option>
                                    <option value="Half Day">Half Day</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ marginBottom: '32px' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-main)', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '0.025em' }}>Reason</label>
                            <textarea required rows="4" value={compForm.reason} onChange={e => setCompForm({ ...compForm, reason: e.target.value })} placeholder="Briefly explain the reason for comp-off..." style={{ width: '100%', padding: '16px', borderRadius: '12px', border: '1px solid var(--border)', background: '#f8fafc', fontSize: '14px', lineHeight: '1.6', resize: 'none' }} />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                            <button type="submit" className="btn-primary" style={{ padding: '14px 40px', borderRadius: '12px', fontSize: '15px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px', background: '#f59e0b', border: 'none' }}>
                                <Check size={18} />
                                <span>Request Comp Off</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {status.msg && (
                <div style={{ padding: '12px 20px', borderRadius: '10px', background: status.type === 'success' ? '#f0fdf4' : '#fef2f2', color: status.type === 'success' ? '#16a34a' : '#ef4444', fontWeight: '600', fontSize: '14px' }}>
                    {status.msg}
                </div>
            )}

            {/* Leave History Table */}
            <div className="card" style={{ background: 'white', borderRadius: '24px', overflow: 'hidden' }}>
                <div style={{ padding: '24px 32px', borderBottom: '1px solid var(--border)' }}>
                    <h3 style={{ fontSize: '18px', fontWeight: '800', margin: 0 }}>Leave History</h3>
                </div>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Type</th>
                                <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>From</th>
                                <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>To</th>
                                <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Duration</th>
                                <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Reason</th>
                                <th style={{ padding: '16px 32px', textAlign: 'left', fontSize: '12px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaves.map((leave, i) => {
                                const start = new Date(leave.startDate);
                                const end = new Date(leave.endDate);
                                const duration = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
                                return (
                                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                                        <td style={{ padding: '20px 32px', fontSize: '14px', fontWeight: '700', color: 'var(--text-main)' }}>{leave.type}</td>
                                        <td style={{ padding: '20px 32px', fontSize: '14px', color: 'var(--text-muted)' }}>{start.toLocaleDateString()}</td>
                                        <td style={{ padding: '20px 32px', fontSize: '14px', color: 'var(--text-muted)' }}>{end.toLocaleDateString()}</td>
                                        <td style={{ padding: '20px 32px', fontSize: '14px', color: 'var(--text-main)', fontWeight: '600' }}>{duration} day(s)</td>
                                        <td style={{ padding: '20px 32px', fontSize: '14px', color: 'var(--text-muted)' }}>{leave.reason}</td>
                                        <td style={{ padding: '20px 32px' }}>
                                            <span style={{
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '11px',
                                                fontWeight: '800',
                                                background: leave.status === 'Approved' ? '#f0fdf4' : leave.status === 'Rejected' ? '#fef2f2' : '#fffbeb',
                                                color: leave.status === 'Approved' ? '#16a34a' : leave.status === 'Rejected' ? '#ef4444' : '#f59e0b'
                                            }}>
                                                {leave.status}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
};


const EmployeeDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [time, setTime] = useState(new Date().toLocaleTimeString());
    const [attendance, setAttendance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [viewDate, setViewDate] = useState(new Date());

    // Dynamic Data States
    const [timesheets, setTimesheets] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [attendanceHistory, setAttendanceHistory] = useState([]);

    const { user, token } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    const fetchDashboardData = useCallback(async () => {
        try {
            const params = {
                month: viewDate.getMonth() + 1,
                year: viewDate.getFullYear()
            };

            const [attRes, tsRes, lvRes, hlRes, histRes] = await Promise.all([
                axios.get(`${API_URL}/attendance/status`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/timesheets/my`, { params, headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/leaves/my`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/holidays`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/attendance/history`, { params, headers: { Authorization: `Bearer ${token}` } })
            ]);

            setAttendance(attRes.data?.checkIn ? attRes.data : null);
            setTimesheets(tsRes.data);
            setLeaves(lvRes.data);
            setHolidays(hlRes.data);
            setAttendanceHistory(histRes.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setLoading(false);
        }
    }, [token, viewDate, API_URL]);

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
        if (token) {
            fetchDashboardData();
        }
        return () => clearInterval(timer);
    }, [token, fetchDashboardData]);

    const handlePrevMonth = () => {
        const now = new Date();
        const currentTotalMonths = now.getFullYear() * 12 + now.getMonth();
        const viewTotalMonths = viewDate.getFullYear() * 12 + viewDate.getMonth();
        
        if (viewTotalMonths > currentTotalMonths - 4) {
            setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
        }
    };

    const handleNextMonth = () => {
        const now = new Date();
        const currentTotalMonths = now.getFullYear() * 12 + now.getMonth();
        const viewTotalMonths = viewDate.getFullYear() * 12 + viewDate.getMonth();
        
        if (viewTotalMonths < currentTotalMonths + 4) {
            setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
        }
    };

    const handleCheckIn = async () => {
        setError('');
        try {
            const res = await axios.post(`${API_URL}/attendance/check-in`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAttendance(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Check-in failed');
        }
    };

    const handleCheckOut = async () => {
        setError('');
        try {
            const res = await axios.post(`${API_URL}/attendance/check-out`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setAttendance(res.data);
        } catch (err) {
            setError(err.response?.data?.message || 'Check-out failed');
        }
    };

    const renderContent = () => {
        const data = { timesheets, leaves, holidays, attendance, attendanceHistory };
        switch (activeTab) {
            case 'dashboard':
                return (
                    <DashboardHome
                        data={data}
                        time={time}
                        handleCheckIn={handleCheckIn}
                        handleCheckOut={handleCheckOut}
                        error={error}
                        viewDate={viewDate}
                        handlePrevMonth={handlePrevMonth}
                        handleNextMonth={handleNextMonth}
                    />
                );
            case 'attendance':
                return <TimesheetView timesheets={timesheets} attendanceHistory={attendanceHistory} fetchDashboardData={fetchDashboardData} />;
            case 'leave':
                return <LeaveView leaves={leaves} fetchDashboardData={fetchDashboardData} />;
            case 'holidays':
                return (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Public Holidays</h2>

                        <div className="card" style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '16px', background: 'var(--bg-main)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                                <thead>
                                    <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                                        <th style={{ padding: '16px 24px', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em', width: '80px' }}>S.No</th>
                                        <th style={{ padding: '16px 24px', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                                        <th style={{ padding: '16px 24px', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Holiday Name</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {holidays.map((holiday, index) => (
                                        <tr key={holiday._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                            <td style={{ padding: '16px 24px', color: '#64748b', fontSize: '14px' }}>{index + 1}</td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>
                                                    {new Date(holiday.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                                </span>
                                            </td>
                                            <td style={{ padding: '16px 24px' }}>
                                                <span style={{ color: '#64748b', fontSize: '14px' }}>{holiday.name}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {holidays.length === 0 && (
                                        <tr>
                                            <td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>No holidays found.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </motion.div>
                );
            default:
                return <DashboardHome data={data} time={time} handleCheckIn={handleCheckIn} handleCheckOut={handleCheckOut} error={error} />;
        }
    };

    if (loading) return (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-subtle)' }}>
            <div style={{ width: '40px', height: '40px', border: '3px solid #f1f5f9', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        </div>
    );

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
                            <LayoutGrid size={16} />
                        </div>
                        <h2 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>CMS Cloud</h2>
                    </div>
                    <button 
                        onClick={() => setIsSidebarOpen(true)}
                        style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer' }}
                    >
                        <Menu size={24} />
                    </button>
                </header>

                <main style={{ flex: 1, padding: '40px', overflowY: 'auto' }}>
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            transition={{ duration: 0.2 }}
                        >
                            {renderContent()}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>
        </div>
    );
};

export default EmployeeDashboard;
