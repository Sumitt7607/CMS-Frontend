import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { useState, useEffect } from 'react';
import { Search, Plus, Check, X, Filter, MoreHorizontal, Clock, AlertCircle, Calendar, Briefcase, Tag, Hash } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const AdminTimesheet = () => {
    const [entries, setEntries] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        userId: '',
        project: '',
        module: '',
        phase: '',
        date: new Date().toISOString().split('T')[0]
    });
    const [error, setError] = useState('');

    const { token } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        fetchEntries();
        fetchEmployees();
    }, []);

    const fetchEntries = async () => {
        try {
            const res = await axios.get(`${API_URL}/timesheets/all`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEntries(res.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching timesheets:', err);
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await axios.get(`${API_URL}/employees`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEmployees(res.data);
        } catch (err) {
            console.error('Error fetching employees:', err);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await axios.put(`${API_URL}/timesheets/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchEntries();
        } catch (err) {
            console.error('Error updating status:', err);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            await axios.post(`${API_URL}/timesheets`, formData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsModalOpen(false);
            setFormData({
                userId: '',
                project: '',
                module: '',
                phase: '',
                date: new Date().toISOString().split('T')[0]
            });
            fetchEntries();
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong');
        }
    };

    const filteredEntries = entries.filter(entry =>
        entry.userId?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.module.toLowerCase().includes(searchTerm.toLowerCase())
    );

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


const exportToExcel = () => {
    const data = filteredEntries.map(entry => ({
        Employee: entry.userId?.name || "Unknown",
        Project: entry.project,
        Module: entry.module,
        Phase: entry.phase,
        Date: entry.date,
        Status: entry.status
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, "Timesheets");

    const excelBuffer = XLSX.write(workbook, {
        bookType: "xlsx",
        type: "array"
    });

    const fileData = new Blob([excelBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    });

    saveAs(fileData, "Timesheets.xlsx");
};
    

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Timesheet Management</h1>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '12px', flex: 1 }}>
                    <div className="card" style={{ display: 'flex', alignItems: 'center', padding: '0 16px', background: 'var(--bg-main)', border: '1px solid var(--border)', borderRadius: '10px', width: '360px' }}>
                        <Search size={18} color="var(--text-muted)" />
                        <input
                            type="text"
                            placeholder="Search by employee or project..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{ border: 'none', background: 'transparent', padding: '12px', color: 'var(--text-main)', width: '100%', outline: 'none', fontSize: '14px' }}
                        />
                    </div>
                </div>

                <button
    onClick={exportToExcel}
    className="btn-primary"
    style={{ padding: '10px 20px', borderRadius: '10px' }}
>
    Export Excel
</button>

                <button onClick={() => setIsModalOpen(true)} className="btn-primary" style={{ padding: '10px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Plus size={18} />
                    <span style={{ fontWeight: '600' }}>Add Entry</span>
                </button>
            </div>

            <div className="card" style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '16px', background: 'var(--bg-main)', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                {loading ? (
                    <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading timesheets...</div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '1000px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                                <th style={{ padding: '16px 24px', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Employee</th>
                                <th style={{ padding: '16px 24px', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Project</th>
                                <th style={{ padding: '16px 24px', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Module</th>
                                <th style={{ padding: '16px 24px', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Phase</th>
                                <th style={{ padding: '16px 24px', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</th>
                                <th style={{ padding: '16px 24px', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Status</th>
                                <th style={{ padding: '16px 24px', textAlign: 'right', fontWeight: '600', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEntries.map((entry) => {
                                const status = getStatusStyle(entry.status);
                                return (
                                    <tr key={entry._id} style={{ borderBottom: '1px solid var(--border)', transition: 'background 0.2s' }}>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>{entry.userId?.name || 'Unknown'}</span>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ color: '#64748b', fontSize: '14px' }}>{entry.project}</span>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ color: '#64748b', fontSize: '14px' }}>{entry.module}</span>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ color: '#64748b', fontSize: '14px' }}>{entry.phase}</span>
                                        </td>
                                        <td style={{ padding: '16px 24px' }}>
                                            <span style={{ color: '#64748b', fontSize: '14px' }}>{entry.date}</span>
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
                                                {entry.status}
                                            </span>
                                        </td>
                                        <td style={{ padding: '16px 24px', textAlign: 'right' }}>
                                            {entry.status === 'Pending' ? (
                                                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                    <button
                                                        onClick={() => handleStatusUpdate(entry._id, 'Approved')}
                                                        style={{ background: '#f0fdf4', border: '1px solid #dcfce7', color: '#16a34a', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
                                                    >
                                                        <Check size={14} strokeWidth={3} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(entry._id, 'Rejected')}
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

            {/* Add Entry Modal */}
            <AnimatePresence>
                {isModalOpen && (
                    <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(0,0,0,0.3)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000, backdropFilter: 'blur(4px)' }}>
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="card"
                            style={{ width: '100%', maxWidth: '600px', padding: '32px', position: 'relative' }}
                        >
                            <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '24px', right: '24px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}>
                                <X size={20} />
                            </button>

                            <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '8px', color: 'var(--text-main)' }}>Add Timesheet Entry</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginBottom: '24px' }}>Submit work hours for a project.</p>

                            {error && (
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', background: '#fee2e2', color: '#b91c1c', borderRadius: '8px', marginBottom: '24px', fontSize: '13px' }}>
                                    <AlertCircle size={16} />
                                    <span>{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                                        Employee
                                    </label>
                                    <select
                                        required
                                        value={formData.userId}
                                        onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '14px', background: 'var(--bg-main)' }}
                                    >
                                        <option value="">Select Employee</option>
                                        {employees.map(emp => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
                                    </select>
                                </div>

                                <div style={{ gridColumn: 'span 2' }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                                        <Briefcase size={14} /> Project
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.project}
                                        onChange={(e) => setFormData({ ...formData, project: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '14px', background: 'var(--bg-main)' }}
                                        placeholder="Customer Portal"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                                        <Tag size={14} /> Module
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.module}
                                        onChange={(e) => setFormData({ ...formData, module: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '14px', background: 'var(--bg-main)' }}
                                        placeholder="Dashboard"
                                    />
                                </div>

                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                                        Phase
                                    </label>
                                    <select
                                        value={formData.phase}
                                        onChange={(e) => setFormData({ ...formData, phase: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '14px', background: 'var(--bg-main)' }}
                                    >
                                        <option value="">Select Phase</option>
                                        <option value="Development">Development</option>
                                        <option value="Testing">Testing</option>
                                        <option value="Design">Design</option>
                                        <option value="Deployment">Deployment</option>
                                    </select>
                                </div>

                                <div>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                                        <Calendar size={14} /> Date
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border)', outline: 'none', fontSize: '14px', background: 'var(--bg-main)' }}
                                    />
                                </div>

                                <div style={{ display: 'flex', gap: '12px', marginTop: '12px', gridColumn: 'span 2' }}>
                                    <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', background: 'transparent', fontWeight: '600', cursor: 'pointer' }}>Cancel</button>
                                    <button type="submit" className="btn-primary" style={{ flex: 1, padding: '14px' }}>Submit Entry</button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default AdminTimesheet;
