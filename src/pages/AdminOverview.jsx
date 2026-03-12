import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Briefcase, Users, UserPlus, Layers, Gift } from 'lucide-react';

const AdminOverview = ({ setActiveTab }) => {
    const { token } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                const res = await axios.get(`${API_URL}/employees`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                setEmployees(res.data);
                setLoading(false);
            } catch (err) {
                console.error('Error fetching employees:', err);
                setLoading(false);
            }
        };
        fetchEmployees();
    }, [token]);

    const getUpcomingBirthdays = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return employees
            .filter(emp => emp.dob)
            .map(emp => {
                const dob = new Date(emp.dob);
                const nextBday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());

                if (nextBday < today) {
                    nextBday.setFullYear(today.getFullYear() + 1);
                }

                const diffTime = Math.abs(nextBday - today);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

                return { ...emp, nextBday, diffDays };
            })
            .sort((a, b) => a.diffDays - b.diffDays)
            .slice(0, 5);
    };

    const getUpcomingAnniversaries = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        return employees
            .filter(emp => emp.doj)
            .map(emp => {
                const doj = new Date(emp.doj);
                const nextAnniv = new Date(today.getFullYear(), doj.getMonth(), doj.getDate());

                if (nextAnniv < today) {
                    nextAnniv.setFullYear(today.getFullYear() + 1);
                }

                const diffTime = Math.abs(nextAnniv - today);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                const years = today.getFullYear() - doj.getFullYear() + (nextAnniv > today ? 0 : 1);

                return { ...emp, nextAnniv, diffDays, years };
            })
            .sort((a, b) => a.diffDays - b.diffDays)
            .slice(0, 5);
    };

    const upcomingBirthdays = getUpcomingBirthdays();
    const upcomingAnniversaries = getUpcomingAnniversaries();

    const stats = [
        { label: 'Total Employees', value: employees.length.toString(), icon: Users, color: '#2563eb' },
        {
            label: 'New This Month', value: employees.filter(e => {
                const date = new Date(e.createdAt || Date.now());
                return date.getMonth() === new Date().getMonth();
            }).length.toString(), icon: UserPlus, color: '#10b981'
        },
        { label: "Departments", value: [...new Set(employees.map(e => e.department))].filter(Boolean).length.toString() || '5', icon: Layers, color: '#8b5cf6' },
        { label: "Upcoming Events", value: (upcomingBirthdays.length + upcomingAnniversaries.length).toString(), icon: Gift, color: '#f59e0b' },
    ];

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading dashboard...</div>;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px' }}>
                {stats.map((stat, i) => {
                    const Icon = stat.icon;
                    return (
                        <div key={i} className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px' }}>
                            <div style={{ padding: '12px', borderRadius: '12px', background: `${stat.color}10`, color: stat.color }}>
                                <Icon size={24} />
                            </div>
                            <div>
                                <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: '500', marginBottom: '2px' }}>{stat.label}</p>
                                <h3 style={{ fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>{stat.value}</h3>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                <div className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>Nearest Birthdays</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {upcomingBirthdays.length > 0 ? upcomingBirthdays.map((bday, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#fff1f2', border: '1px solid #fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e11d48' }}>
                                    <Gift size={20} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>{bday.name}</p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{bday.department || 'Employee'} • {bday.nextBday.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                </div>
                                <div style={{ marginLeft: 'auto', background: '#fff1f2', color: '#e11d48', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                                    {bday.diffDays === 0 ? 'Today' : bday.diffDays === 1 ? 'Tomorrow' : `In ${bday.diffDays} days`}
                                </div>
                            </div>
                        )) : (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', padding: '20px 0' }}>No upcoming birthdays found.</p>
                        )}
                    </div>
                </div>

                <div className="card" style={{ padding: '24px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '700', color: 'var(--text-main)' }}>Work Anniversaries</h3>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        {upcomingAnniversaries.length > 0 ? upcomingAnniversaries.map((anniv, i) => (
                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '4px 0' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: '#eff6ff', border: '1px solid #dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                                    <Briefcase size={20} />
                                </div>
                                <div>
                                    <p style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-main)' }}>{anniv.name}</p>
                                    <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{anniv.years} Year(s) • {anniv.nextAnniv.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</p>
                                </div>
                                <div style={{ marginLeft: 'auto', background: '#eff6ff', color: '#2563eb', padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: '700' }}>
                                    {anniv.diffDays === 0 ? 'Today' : anniv.diffDays === 1 ? 'Tomorrow' : `In ${anniv.diffDays} days`}
                                </div>
                            </div>
                        )) : (
                            <p style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '14px', padding: '20px 0' }}>No upcoming anniversaries found.</p>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};

export default AdminOverview;
