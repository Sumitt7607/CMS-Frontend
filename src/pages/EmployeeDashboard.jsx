import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import { Clock, CheckCircle, Calendar, Briefcase, CreditCard, Check, AlertCircle, ChevronRight, LayoutGrid, FileText, Gift, Plus } from 'lucide-react';
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

const AttendanceTracker = ({ data, handleCheckIn, handleCheckOut, error }) => {
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
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDayOfMonth; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    const getDayData = (day) => {
        if (!day) return null;
        const dateStr = `${currentYear}-${(currentMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
        const dayTimesheets = timesheets.filter(ts => ts.date === dateStr);
        const totalHours = dayTimesheets.reduce((acc, curr) => acc + (curr.hours || 0), 0);
        const att = attendanceHistory.find(ah => ah.date === dateStr);
        const isHoliday = holidays.find(h => h.date === dateStr);

        let status = 'none';
        if (isHoliday) status = 'holiday';
        else if (totalHours >= 8) status = 'completed';
        else if (totalHours > 4) status = 'under';
        else if (totalHours > 0 || att) status = 'half';

        return { hours: totalHours, status, isHoliday };
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
                    <h3 style={{ fontSize: '16px', fontWeight: '800', color: '#1e293b', marginBottom: '24px' }}>
                        {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })} — Monthly Overview
                    </h3>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '10px' }}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} style={{ textAlign: 'center', fontSize: '13px', fontWeight: '700', color: '#64748b', paddingBottom: '12px' }}>{d}</div>
                        ))}
                        {days.map((day, i) => {
                            const data = getDayData(day);
                            const isToday = day === today.getDate();

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
                                } else if (data.status === 'under') {
                                    styles.background = '#fffbeb';
                                    styles.border = '1px solid #f59e0b';
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
                                                background: data.status === 'completed' ? '#10b981' : data.status === 'under' ? '#f59e0b' : data.status === 'holiday' ? '#a855f7' : '#94a3b8'
                                            }} />
                                            {data.hours > 0 && (
                                                <span style={{ fontSize: '11px', fontWeight: '800', color: '#1e293b' }}>{data.hours}h</span>
                                            )}
                                        </>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', gap: '24px', marginTop: '24px' }}>
                        {[
                            { color: '#10b981', label: '100% completed' },
                            { color: '#f59e0b', label: 'Under required' },
                            { color: '#94a3b8', label: 'Half day / Leave' },
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
const DashboardHome = ({ data, handleCheckIn, handleCheckOut, error }) => {
    const { user } = useAuth();
    const { timesheets, leaves, holidays } = data;
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
                <AttendanceTracker data={data} handleCheckIn={handleCheckIn} handleCheckOut={handleCheckOut} error={error} />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
                    {[
                        { label: 'Present Days', value: timesheets.length, icon: Check, color: '#10b981', bg: '#ecfdf5' },
                        { label: 'Total Hours', value: `${timesheets.reduce((acc, curr) => acc + (curr.hours || 0), 0)}h`, icon: Briefcase, color: '#3b82f6', bg: '#eff6ff' }
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
                                        <p style={{ fontSize: '14px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>{ts.hours}h</p>
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
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        project: '',
        module: '',
        phase: '',
        date: new Date().toISOString().split('T')[0],
        hours: '',
        comment: ''
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
                date: new Date().toISOString().split('T')[0],
                hours: '',
                comment: ''
            });
            setShowForm(false);
            fetchDashboardData();
        } catch (err) {
            setStatus({ type: 'error', msg: err.response?.data?.message || 'Failed to add entry' });
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>My Timesheet</h2>
                <button
                    onClick={() => setShowForm(!showForm)}
                    className="btn-primary"
                    style={{ padding: '10px 20px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <Plus size={18} /> {showForm ? 'Cancel' : 'Add Entry'}
                </button>
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
                        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
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
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>Hours</label>
                                <input required type="number" step="0.5" value={formData.hours} onChange={e => setFormData({ ...formData, hours: e.target.value })} placeholder="8" style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }} />
                            </div>
                            <div style={{ gridColumn: 'span 3' }}>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>Comment (Optional)</label>
                                <textarea
                                    value={formData.comment}
                                    onChange={e => setFormData({ ...formData, comment: e.target.value })}
                                    placeholder="Add any additional notes here..."
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-subtle)', resize: 'vertical', minHeight: '80px' }}
                                />
                            </div>
                            <div style={{ display: 'flex', alignItems: 'flex-end', gridColumn: 'span 3' }}>
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
                    {timesheets.map((ts, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid var(--border)' }}>
                            <div style={{ flex: 1 }}>
                                <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{ts.project}</p>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>{ts.module} • {ts.phase}</p>
                                {ts.comment && (
                                    <p style={{ fontSize: '12px', color: '#64748b', marginTop: '8px', fontStyle: 'italic', paddingLeft: '8px', borderLeft: '2px solid #e2e8f0' }}>" {ts.comment} "</p>
                                )}
                            </div>
                            <div style={{ textAlign: 'right', marginRight: '40px' }}>
                                <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{ts.hours} Hours</p>
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
    const { token } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    // Summary calculations with dynamic accrual (2 days per month)
    const currentMonth = new Date().getMonth(); // 0 for Jan, 2 for Mar, etc.
    const accruedPaidLeave = (currentMonth + 1) * 2;
    const paidLeavesUsed = leaves.filter(l => l.type === 'Paid Leave' && l.status === 'Approved').length;
    const paidLeavesRemaining = Math.max(0, accruedPaidLeave - paidLeavesUsed);

    // Form States
    const [leaveForm, setLeaveForm] = useState({
        startDate: '',
        endDate: '',
        type: paidLeavesRemaining > 0 ? 'Paid Leave' : 'Unpaid Leave',
        reason: ''
    });
    const [compForm, setCompForm] = useState({ date: '', toDate: '', type: 'Full Day', reason: '' });
    const [status, setStatus] = useState({ type: '', msg: '' });

    const stats = [
        { label: 'Paid Leave', used: paidLeavesUsed, limit: accruedPaidLeave },
        { label: 'Unpaid Leave', used: leaves.filter(l => l.type === 'Unpaid Leave' && l.status === 'Approved').length, limit: '∞' },
    ];

    // Update form type if paid leaves run out
    useEffect(() => {
        if (paidLeavesRemaining <= 0 && leaveForm.type === 'Paid Leave') {
            setLeaveForm(prev => ({ ...prev, type: 'Unpaid Leave' }));
        }
    }, [paidLeavesRemaining]);

    const handleSubmit = async (formData, isCompOff = false) => {
        setStatus({ type: '', msg: '' });
        try {
            const payload = isCompOff ? {
                startDate: formData.date,
                endDate: formData.toDate || formData.date,
                type: 'Comp Off',
                reason: formData.reason
            } : formData;

            // Simple validation
            if (!payload.startDate || !payload.endDate || !payload.reason) {
                setStatus({ type: 'error', msg: 'Please fill in all required fields (Dates and Reason).' });
                return;
            }

            await axios.post(`${API_URL}/leaves`, payload, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setStatus({ type: 'success', msg: `${isCompOff ? 'Comp Off' : 'Leave'} applied successfully!` });
            fetchDashboardData();
            if (isCompOff) setCompForm({ date: '', toDate: '', type: 'Full Day', reason: '' });
            else setLeaveForm({ startDate: '', endDate: '', type: 'Paid Leave', reason: '' });
        } catch (err) {
            setStatus({ type: 'error', msg: err.response?.data?.message || 'Submission failed' });
        }
    };

    return (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <h2 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Leave & Comp Off</h2>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                {stats.map((stat, i) => (
                    <div key={i} className="card" style={{ padding: '24px', background: 'white', border: '1px solid var(--border)' }}>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>{stat.label}</p>
                        <h3 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>
                            {stat.used} <span style={{ color: 'var(--text-muted)', fontSize: '18px', fontWeight: '500' }}>/ {stat.limit}</span>
                        </h3>
                    </div>
                ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                {/* Apply for Leave Form */}
                <div className="card" style={{ padding: '32px', background: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <Calendar size={20} color="var(--primary)" />
                        <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Apply for Leave</h3>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>From Date</label>
                            <input type="date" value={leaveForm.startDate} onChange={e => setLeaveForm({ ...leaveForm, startDate: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>To Date</label>
                            <input type="date" value={leaveForm.endDate} onChange={e => setLeaveForm({ ...leaveForm, endDate: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }} />
                        </div>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>Leave Type</label>
                        <select value={leaveForm.type} onChange={e => setLeaveForm({ ...leaveForm, type: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                            {paidLeavesRemaining > 0 && <option value="Paid Leave">Paid Leave</option>}
                            <option value="Unpaid Leave">Unpaid Leave</option>
                        </select>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>Reason</label>
                        <textarea rows="3" value={leaveForm.reason} onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })} placeholder="Enter reason..." style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-subtle)', resize: 'none' }} />
                    </div>
                    <button onClick={() => handleSubmit(leaveForm)} className="btn-primary" style={{ width: 'wrap-content', padding: '12px 32px', borderRadius: '10px', gap: '8px' }}>
                        <Check size={18} /> Submit
                    </button>
                </div>

                {/* Apply for Comp Off Form */}
                <div className="card" style={{ padding: '32px', background: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <Calendar size={20} color="#f59e0b" />
                        <h3 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>Apply for Comp Off</h3>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '24px' }}>ⓘ Can only be applied on weekends or company holidays</p>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>Date</label>
                            <input type="date" value={compForm.date} onChange={e => setCompForm({ ...compForm, date: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }} />
                        </div>
                        <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>To Date</label>
                            <input type="date" value={compForm.toDate} onChange={e => setCompForm({ ...compForm, toDate: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }} />
                        </div>
                    </div>
                    <div style={{ marginBottom: '20px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>Type</label>
                        <select value={compForm.type} onChange={e => setCompForm({ ...compForm, type: e.target.value })} style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-subtle)' }}>
                            <option>Full Day</option>
                            <option>Half Day</option>
                        </select>
                    </div>
                    <div style={{ marginBottom: '24px' }}>
                        <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: 'var(--text-muted)', marginBottom: '8px' }}>Reason</label>
                        <textarea rows="3" value={compForm.reason} onChange={e => setCompForm({ ...compForm, reason: e.target.value })} placeholder="Enter reason..." style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid var(--border)', background: 'var(--bg-subtle)', resize: 'none' }} />
                    </div>
                    <button onClick={() => handleSubmit(compForm, true)} className="btn-primary" style={{ width: 'wrap-content', padding: '12px 32px', borderRadius: '10px', background: '#f59e0b', gap: '8px' }}>
                        <Check size={18} /> Submit
                    </button>
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

const PayrollView = ({ payrolls }) => (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: '32px', borderRadius: '24px' }}>
        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '24px' }}>Payroll History</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {payrolls.map((payroll, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '20px', background: '#f8fafc', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)', margin: 0 }}>{payroll.month}</p>
                        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>Monthly Salary</p>
                    </div>
                    <div style={{ textAlign: 'right', marginRight: '40px' }}>
                        <p style={{ fontSize: '18px', fontWeight: '800', color: 'var(--primary)', margin: 0 }}>
                            {formatCurrency(payroll.netPay || 0)}
                        </p>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Net Pay</p>
                    </div>
                    <span style={{
                        padding: '6px 12px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '700',
                        background: payroll.status === 'Paid' ? '#f0fdf4' : '#fffbeb',
                        color: payroll.status === 'Paid' ? '#16a34a' : '#f59e0b'
                    }}>
                        {payroll.status}
                    </span>
                </div>
            ))}
        </div>
    </motion.div>
);

const EmployeeDashboard = () => {
    const [activeTab, setActiveTab] = useState('dashboard');
    const [time, setTime] = useState(new Date().toLocaleTimeString());
    const [attendance, setAttendance] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Dynamic Data States
    const [timesheets, setTimesheets] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [payrolls, setPayrolls] = useState([]);
    const [attendanceHistory, setAttendanceHistory] = useState([]);

    const { user, token } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        const timer = setInterval(() => setTime(new Date().toLocaleTimeString()), 1000);
        fetchDashboardData();
        return () => clearInterval(timer);
    }, []);

    const fetchDashboardData = async () => {
        try {
            const [attRes, tsRes, lvRes, hlRes, pyRes, histRes] = await Promise.all([
                axios.get(`${API_URL}/attendance/status`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/timesheets/my`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/leaves/my`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/holidays`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/payroll/my`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/attendance/history`, { headers: { Authorization: `Bearer ${token}` } })
            ]);

            setAttendance(attRes.data?.checkIn ? attRes.data : null);
            setTimesheets(tsRes.data);
            setLeaves(lvRes.data);
            setHolidays(hlRes.data);
            setPayrolls(pyRes.data);
            setAttendanceHistory(histRes.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching dashboard data:', err);
            setLoading(false);
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
        const data = { timesheets, leaves, holidays, payrolls, attendance, attendanceHistory };
        switch (activeTab) {
            case 'dashboard':
                return <DashboardHome data={data} time={time} handleCheckIn={handleCheckIn} handleCheckOut={handleCheckOut} error={error} />;
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
            case 'payroll':
                return <PayrollView payrolls={payrolls} />;
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
        <div style={{ display: 'flex', height: '100vh', background: 'var(--bg-subtle)', overflow: 'hidden' }}>
            <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
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
    );
};

export default EmployeeDashboard;
