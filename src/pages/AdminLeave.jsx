import { useState, useEffect } from 'react';
import { Search, Plus, Check, X, Filter, Sliders, Calendar, User, FileText, Clock, AlertCircle } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const AdminLeave = () => {
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const { token } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        fetchLeaves();
    }, []);

    const fetchLeaves = async () => {
        try {
            const res = await axios.get(`${API_URL}/leaves/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setLeaves(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching leaves:', err);
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await axios.put(`${API_URL}/leaves/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchLeaves();
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const calculateDuration = (start, end, dayType = 'Full Day') => {
        const s = new Date(start);
        const e = new Date(end);
        const diffTime = Math.abs(e - s);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        return dayType === 'Half Day' ? '0.5 day(s)' : `${diffDays} day(s)`;
    };

    const getStatusStyle = (status) => {
        switch (status) {
            case 'Approved':
                return { bg: '#f0fdf4', color: '#16a34a', border: '#dcfce7' };
            case 'Rejected':
                return { bg: '#fef2f2', color: '#dc2626', border: '#fee2e2' };
            case 'Pending':
            default:
                return { bg: '#fffbeb', color: '#f59e0b', border: '#fef3c7' };
        }
    };

    const filteredLeaves = leaves.filter(leave =>
        leave.userId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leave.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        leave.reason.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Leave Management</h1>
            </div>

            <div className="card" style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '16px', background: 'var(--bg-main)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading leave requests...</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '16px 24px', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employee</th>
                                <th style={{ padding: '16px 24px', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Leave Date</th>
                                <th style={{ padding: '16px 24px', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Type</th>
                                <th style={{ padding: '16px 24px', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Day Type</th>
                                <th style={{ padding: '16px 24px', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Duration</th>
                                <th style={{ padding: '16px 24px', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Reason</th>
                                <th style={{ padding: '16px 24px', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                                <th style={{ padding: '16px 24px', textAlign: 'right', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeaves.map((leave) => {
                                const status = getStatusStyle(leave.status);
                                return (
                                    <tr key={leave._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>{leave.userId?.name || 'Unknown'}</span>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ color: '#64748b', fontSize: '14px' }}>
                                                {leave.startDate} <span style={{ opacity: 0.5 }}>→</span> {leave.endDate}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ color: '#64748b', fontSize: '14px' }}>{leave.type}</span>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ 
                                                background: leave.dayType === 'Half Day' ? '#fef3c7' : '#f1f5f9',
                                                color: leave.dayType === 'Half Day' ? '#b45309' : '#475569',
                                                padding: '4px 8px',
                                                borderRadius: '6px',
                                                fontSize: '12px',
                                                fontWeight: '600'
                                            }}>{leave.dayType || 'Full Day'}</span>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>{calculateDuration(leave.startDate, leave.endDate, leave.dayType)}</span>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ color: '#64748b', fontSize: '14px' }}>{leave.reason}</span>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{
                                                background: status.bg,
                                                color: status.color,
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '11px',
                                                fontWeight: '700',
                                                border: `1px solid ${status.border}`
                                            }}>
                                                {leave.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                            {leave.status === 'Pending' ? (
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                    <button
                                                        onClick={() => handleStatusUpdate(leave._id, 'Approved')}
                                                        style={{ background: '#f0fdf4', border: '1px solid #dcfce7', color: '#16a34a', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                                                    >
                                                        <Check size={14} strokeWidth={3} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(leave._id, 'Rejected')}
                                                        style={{ background: '#fef2f2', border: '1px solid #fee2e2', color: '#dc2626', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                                                    >
                                                        <X size={14} strokeWidth={3} />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div style={{ width: '60px' }}></div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdminLeave;
