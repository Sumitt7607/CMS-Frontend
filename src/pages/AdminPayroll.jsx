import { useState, useEffect } from 'react';
import { Plus, DollarSign, Calendar, User, FileText, Check, X, Search, CreditCard, TrendingUp, AlertCircle, Trash2, Clock } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

const AdminPayroll = () => {
    const [payrolls, setPayrolls] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [leaves, setLeaves] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [formData, setFormData] = useState({
        userId: '',
        month: new Date().getMonth(),
        year: new Date().getFullYear(),
        base: 0,
        bonus: 0,
        extraDays: 0,
        tax: 0,
        deductions: 0
    });

    const { token } = useAuth();
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [payrollRes, employeeRes, leaveRes] = await Promise.all([
                axios.get(`${API_URL}/payroll/all`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/employees`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${API_URL}/leaves/all`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            setPayrolls(payrollRes.data);
            setEmployees(employeeRes.data.filter(emp => emp.role === 'employee'));
            setLeaves(leaveRes.data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching payroll data:', err);
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (id, status) => {
        try {
            await axios.put(`${API_URL}/payroll/${id}/status`, { status }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            fetchData();
        } catch (err) {
            console.error('Error updating payroll status:', err);
        }
    };

    const calculateAutoDeduction = (userId, mIndex, yr) => {
        if (!userId || mIndex === undefined || !yr) return 0;

        const selectedEmp = employees.find(e => e._id === userId);
        if (!selectedEmp) return 0;

        const approvedLeaves = leaves.filter(l =>
            String(l.userId?._id || l.userId) === String(userId) &&
            l.status === 'Approved' &&
            l.type === 'Unpaid Leave'
        );

        let unpaidDays = 0;
        const monthIndex = parseInt(mIndex);
        const year = parseInt(yr);

        approvedLeaves.forEach(leave => {
            const start = new Date(leave.startDate);
            const end = new Date(leave.endDate);

            // Check if leave overlaps with the selected month/year
            if (start.getMonth() === monthIndex && start.getFullYear() === year) {
                const diffTime = Math.abs(end - start);
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                unpaidDays += diffDays;
            }
        });

        if (unpaidDays > 0) {
            const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();
            const deduction = ((selectedEmp.baseSalary || 0) / daysInMonth) * unpaidDays;
            return Math.round(deduction);
        }
        return 0;
    };

    const handleEmployeeSelect = (userId) => {
        const selectedEmp = employees.find(emp => emp._id === userId);
        const base = selectedEmp ? (selectedEmp.baseSalary || 0) : 0;

        // Use current month/year if not set
        const m = formData.month || new Date().getMonth();
        const y = formData.year || new Date().getFullYear();

        const ded = calculateAutoDeduction(userId, m, y);
        setFormData({ ...formData, userId, base, deductions: ded, month: m, year: y });
    };

    const handleDateChange = (type, value) => {
        const newMonth = type === 'month' ? value : formData.month;
        const newYear = type === 'year' ? value : formData.year;
        const ded = calculateAutoDeduction(formData.userId, newMonth, newYear);
        
        // Recalculate bonus if extraDays exists
        let newBonus = formData.bonus;
        if (formData.userId && formData.extraDays > 0) {
            const daysInMonth = new Date(newYear, newMonth + 1, 0).getDate();
            newBonus = Math.round((formData.base / daysInMonth) * formData.extraDays);
        }

        setFormData({ ...formData, month: newMonth, year: newYear, deductions: ded, bonus: newBonus });
    };

    const handleExtraDaysChange = (days) => {
        const extraDays = Number(days);
        let bonus = formData.bonus;
        
        if (formData.userId && extraDays >= 0) {
            const daysInMonth = new Date(formData.year, formData.month + 1, 0).getDate();
            bonus = Math.round((formData.base / daysInMonth) * extraDays);
        }
        
        setFormData({ ...formData, extraDays, bonus });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
            const payrollData = {
                ...formData,
                month: `${months[formData.month]} ${formData.year}`
            };
            await axios.post(`${API_URL}/payroll`, payrollData, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setIsFormOpen(false);
            setFormData({
                userId: '',
                month: new Date().getMonth(),
                year: new Date().getFullYear(),
                base: 0,
                bonus: 0,
                extraDays: 0,
                tax: 0,
                deductions: 0
            });
            fetchData();
        } catch (err) {
            console.error('Error creating payroll:', err);
        }
    };

    // Summary Stats
    const totalPaid = (payrolls || [])
        .filter(p => p && p.status === 'Paid')
        .reduce((acc, curr) => acc + (curr.netPay || 0), 0);

    const pendingPayroll = (payrolls || [])
        .filter(p => p && p.status === 'Pending')
        .reduce((acc, curr) => acc + (curr.netPay || 0), 0);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0
        }).format(amount);
    };

    const filteredPayrolls = payrolls.filter(p =>
        p.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        String(p.month).toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800', color: 'var(--text-main)', margin: 0 }}>Payroll Management</h1>
                <div style={{ display: 'flex', gap: '12px' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <Search size={18} style={{ position: 'absolute', left: '16px', color: '#94a3b8' }} />
                        <input
                            type="text"
                            placeholder="Search by name or month..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                padding: '10px 16px 10px 48px',
                                borderRadius: '12px',
                                border: '1px solid var(--border)',
                                background: 'white',
                                fontSize: '14px',
                                width: '300px',
                                fontWeight: '500'
                            }}
                        />
                    </div>
                    <button
                        onClick={() => setIsFormOpen(!isFormOpen)}
                        className="btn-primary"
                        style={{ padding: '10px 20px', borderRadius: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <Plus size={18} />
                        <span style={{ fontWeight: '600' }}>Manual Entry</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                <motion.div
                    whileHover={{ y: -4 }}
                    className="card"
                    style={{
                        padding: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '24px',
                        border: '1px solid var(--border)',
                        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                        borderRadius: '24px'
                    }}
                >
                    <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(22, 163, 74, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#16a34a' }}>
                        <span style={{ fontSize: '24px', fontWeight: '800' }}>₹</span>
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Paid</p>
                        <h3 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>{formatCurrency(totalPaid)}</h3>
                    </div>
                </motion.div>

                <motion.div
                    whileHover={{ y: -4 }}
                    className="card"
                    style={{
                        padding: '28px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '24px',
                        border: '1px solid var(--border)',
                        background: 'linear-gradient(135deg, #ffffff 0%, #fffcf5 100%)',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
                        borderRadius: '24px'
                    }}
                >
                    <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(245, 158, 11, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}>
                        <Clock size={32} />
                    </div>
                    <div>
                        <p style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Pending Payroll</p>
                        <h3 style={{ fontSize: '32px', fontWeight: '800', color: 'var(--text-main)', margin: 0, letterSpacing: '-0.02em' }}>{formatCurrency(pendingPayroll)}</h3>
                    </div>
                </motion.div>
            </div>

            {/* Manual Entry Form */}
            <AnimatePresence>
                {isFormOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                        animate={{ height: 'auto', opacity: 1, marginBottom: 32 }}
                        exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                        style={{ overflow: 'hidden' }}
                    >
                        <div className="card" style={{ padding: '32px', border: '1px solid var(--border)', background: '#ffffff', borderRadius: '32px', boxShadow: '0 20px 40px rgba(0,0,0,0.06)' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '16px', background: 'var(--primary-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--primary)' }}>
                                        <FileText size={24} />
                                    </div>
                                    <div>
                                        <h3 style={{ fontSize: '22px', fontWeight: '800', color: 'var(--text-main)', marginBottom: '4px' }}>Generate Payroll Entry</h3>
                                        <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>Manually calculate and record salary details for an employee.</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsFormOpen(false)}
                                    style={{ width: '40px', height: '40px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f8fafc', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                                >
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                                {/* Info Section */}
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '24px', background: '#f8fafc', padding: '24px', borderRadius: '24px', border: '1px solid #f1f5f9' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <User size={14} /> EMPLOYEE
                                        </label>
                                        <select
                                            required
                                            className="input-field"
                                            value={formData.userId}
                                            onChange={(e) => handleEmployeeSelect(e.target.value)}
                                            style={{ background: 'white', height: '52px', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '0 16px', fontWeight: '600' }}
                                        >
                                            <option value="">Select Employee</option>
                                            {employees.map(emp => (
                                                <option key={emp._id} value={emp._id}>{emp.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        <label style={{ fontSize: '12px', fontWeight: '800', color: '#64748b', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Calendar size={14} /> PAYMENT PERIOD
                                        </label>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                            <select
                                                required
                                                className="input-field"
                                                value={formData.month}
                                                onChange={(e) => handleDateChange('month', parseInt(e.target.value))}
                                                style={{ background: 'white', height: '52px', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '0 16px', fontWeight: '600' }}
                                            >
                                                {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map((m, i) => (
                                                    <option key={m} value={i}>{m}</option>
                                                ))}
                                            </select>
                                            <select
                                                required
                                                className="input-field"
                                                value={formData.year}
                                                onChange={(e) => handleDateChange('year', parseInt(e.target.value))}
                                                style={{ background: 'white', height: '52px', borderRadius: '14px', border: '1px solid #e2e8f0', padding: '0 16px', fontWeight: '600' }}
                                            >
                                                {[new Date().getFullYear() - 1, new Date().getFullYear(), new Date().getFullYear() + 1].map(y => (
                                                    <option key={y} value={y}>{y}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '32px' }}>
                                    {/* Earnings Group */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <TrendingUp size={16} /> EARNINGS
                                        </h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>BASE SALARY (₹)</label>
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    value={formData.base}
                                                    onChange={(e) => setFormData({ ...formData, base: Number(e.target.value) })}
                                                    style={{ background: 'white', borderRadius: '14px', height: '48px', border: '1px solid #dcfce7', fontWeight: '700' }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>EXTRA DAYS</label>
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    value={formData.extraDays}
                                                    onChange={(e) => handleExtraDaysChange(e.target.value)}
                                                    style={{ background: 'white', borderRadius: '14px', height: '48px', border: '1px solid #dcfce7', fontWeight: '700', color: '#16a34a' }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>BONUS (₹)</label>
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    value={formData.bonus}
                                                    onChange={(e) => setFormData({ ...formData, bonus: Number(e.target.value) })}
                                                    style={{ background: 'white', borderRadius: '14px', height: '48px', border: '1px solid #dcfce7', fontWeight: '700', color: '#16a34a' }}
                                                />
                                                {formData.extraDays > 0 && (
                                                    <p style={{ margin: 0, fontSize: '10px', color: '#16a34a', fontStyle: 'italic', marginTop: '4px' }}>
                                                        Auto-calculated from {formData.extraDays} extra days
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Deductions Group */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                        <h4 style={{ fontSize: '14px', fontWeight: '800', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                            <AlertCircle size={16} /> ADJUSTMENTS
                                        </h4>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>TAX (₹)</label>
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    value={formData.tax}
                                                    onChange={(e) => setFormData({ ...formData, tax: Number(e.target.value) })}
                                                    style={{ background: 'white', borderRadius: '14px', height: '48px', border: '1px solid #fee2e2', fontWeight: '700', color: '#dc2626' }}
                                                />
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <label style={{ fontSize: '11px', fontWeight: '700', color: '#64748b' }}>DEDUCTIONS (₹)</label>
                                                <input
                                                    type="number"
                                                    className="input-field"
                                                    value={formData.deductions}
                                                    onChange={(e) => setFormData({ ...formData, deductions: Number(e.target.value) })}
                                                    style={{ background: 'white', borderRadius: '14px', height: '48px', border: '1px solid #fee2e2', fontWeight: '700', color: '#dc2626' }}
                                                />
                                                {formData.userId && (
                                                    <p style={{ margin: 0, fontSize: '10px', color: '#64748b', fontStyle: 'italic', marginTop: '4px' }}>
                                                        {(() => {
                                                            const approvedLeaves = leaves.filter(l =>
                                                                String(l.userId?._id || l.userId) === String(formData.userId) &&
                                                                l.status === 'Approved' &&
                                                                l.type === 'Unpaid Leave'
                                                            );
                                                            let unpaidDays = 0;
                                                            approvedLeaves.forEach(leave => {
                                                                const start = new Date(leave.startDate);
                                                                if (start.getMonth() === formData.month && start.getFullYear() === formData.year) {
                                                                    const diffTime = Math.abs(new Date(leave.endDate) - start);
                                                                    unpaidDays += Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
                                                                }
                                                            });
                                                            return unpaidDays > 0 ? `Found ${unpaidDays} unpaid days (Logic: (Base/DaysInMonth) * Days)` : 'No approved unpaid leaves found for this period.';
                                                        })()}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Summary & Preview Area */}
                                <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    padding: '24px 32px',
                                    background: 'linear-gradient(135deg, var(--primary) 0%, #3b82f6 100%)',
                                    borderRadius: '24px',
                                    color: 'white',
                                    boxShadow: '0 8px 30px rgba(59, 130, 246, 0.2)'
                                }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                        <p style={{ fontSize: '12px', fontWeight: '700', opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Estimated Net Pay</p>
                                        <h3 style={{ fontSize: '32px', fontWeight: '800', margin: 0 }}>
                                            {formatCurrency(Number(formData.base) + Number(formData.bonus) - Number(formData.tax) - Number(formData.deductions))}
                                        </h3>
                                    </div>
                                    <div style={{ display: 'flex', gap: '16px' }}>
                                        <button
                                            type="button"
                                            onClick={() => setIsFormOpen(false)}
                                            style={{ padding: '14px 24px', borderRadius: '14px', background: 'rgba(255,255,255,0.1)', border: '1px solid rgba(255,255,255,0.2)', color: 'white', fontWeight: '700', cursor: 'pointer', transition: 'all 0.2s' }}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            style={{
                                                padding: '14px 40px',
                                                borderRadius: '14px',
                                                background: 'white',
                                                border: 'none',
                                                color: 'var(--primary)',
                                                fontWeight: '800',
                                                fontSize: '15px',
                                                cursor: 'pointer',
                                                boxShadow: '0 4px 15px rgba(0,0,0,0.1)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: '8px'
                                            }}
                                        >
                                            <Check size={18} />
                                            Generate Payroll
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Payroll Table */}
            <div className="card" style={{ overflowX: 'auto', border: '1px solid var(--border)', borderRadius: '24px', background: 'var(--bg-main)', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
                {loading ? (
                    <div style={{ padding: '80px', textAlign: 'center' }}>
                        <div style={{ width: '40px', height: '40px', border: '3px solid #f1f5f9', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>Aggregating payroll data...</p>
                    </div>
                ) : payrolls.length === 0 ? (
                    <div style={{ padding: '80px', textAlign: 'center' }}>
                        <div style={{ width: '64px', height: '64px', background: '#f8fafc', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', color: '#94a3b8' }}>
                            <CreditCard size={32} />
                        </div>
                        <h3 style={{ fontSize: '18px', fontWeight: '700', color: 'var(--text-main)', marginBottom: '8px' }}>No Payroll Records</h3>
                        <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '300px', margin: '0 auto' }}>Generate your first manual payroll entry to see it here.</p>
                    </div>
                ) : (
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, textAlign: 'left', minWidth: '1100px' }}>
                        <thead>
                            <tr style={{ background: '#f8fafc' }}>
                                <th style={{ padding: '20px 24px', fontWeight: '700', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Employee</th>
                                <th style={{ padding: '20px 24px', fontWeight: '700', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Month</th>
                                <th style={{ padding: '20px 24px', fontWeight: '700', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Status</th>
                                <th style={{ padding: '20px 24px', fontWeight: '700', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Base</th>
                                <th style={{ padding: '20px 24px', fontWeight: '700', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Bonus</th>
                                <th style={{ padding: '20px 24px', fontWeight: '700', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Financials</th>
                                <th style={{ padding: '20px 24px', fontWeight: '700', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Net Pay</th>
                                <th style={{ padding: '20px 24px', textAlign: 'right', fontWeight: '700', color: '#64748b', fontSize: '12px', textTransform: 'uppercase', borderBottom: '1px solid var(--border)' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredPayrolls.map((payroll) => (
                                <tr key={payroll._id} className="table-row-hover" style={{ transition: 'background 0.2s' }}>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: '700', color: 'var(--primary)' }}>
                                                {payroll.userId?.name?.[0].toUpperCase()}
                                            </div>
                                            <span style={{ fontWeight: '700', color: '#1e293b', fontSize: '14px' }}>{payroll.userId?.name || 'Unknown'}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                                        <span style={{ color: '#64748b', fontSize: '14px', fontWeight: '500' }}>{payroll.month}</span>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                                        <span style={{
                                            background: payroll.status === 'Paid' ? '#f0fdf4' : '#fffbeb',
                                            color: payroll.status === 'Paid' ? '#16a34a' : '#f59e0b',
                                            padding: '6px 14px',
                                            borderRadius: '20px',
                                            fontSize: '11px',
                                            fontWeight: '800',
                                            border: `1px solid ${payroll.status === 'Paid' ? '#dcfce7' : '#fef3c7'}`,
                                            display: 'inline-flex',
                                            alignItems: 'center',
                                            gap: '4px'
                                        }}>
                                            {payroll.status === 'Paid' && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'currentColor' }} />}
                                            {payroll.status}
                                        </span>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                                        <span style={{ color: '#1e293b', fontSize: '14px', fontWeight: '600' }}>₹{(payroll.base || 0).toLocaleString()}</span>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span style={{ color: '#16a34a', fontWeight: '700', fontSize: '14px' }}>+₹{(payroll.bonus || 0).toLocaleString()}</span>
                                            {payroll.extraDays > 0 && <span style={{ color: '#64748b', fontSize: '11px' }}>({payroll.extraDays} Extra Days)</span>}
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span style={{ color: '#dc2626', fontWeight: '600', fontSize: '12px' }}>Tax: -₹{(payroll.tax || 0).toLocaleString()}</span>
                                            <span style={{ color: '#dc2626', fontWeight: '600', fontSize: '12px' }}>Ded: -₹{(payroll.deductions || 0).toLocaleString()}</span>
                                        </div>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
                                        <span style={{ fontWeight: '800', color: 'var(--primary)', fontSize: '16px', letterSpacing: '-0.01em' }}>₹{(payroll.netPay || 0).toLocaleString()}</span>
                                    </td>
                                    <td style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>
                                        {payroll.status === 'Pending' ? (
                                            <button
                                                onClick={() => handleStatusUpdate(payroll._id, 'Paid')}
                                                style={{
                                                    background: 'var(--primary)',
                                                    color: 'white',
                                                    border: 'none',
                                                    cursor: 'pointer',
                                                    padding: '8px 16px',
                                                    borderRadius: '8px',
                                                    fontSize: '12px',
                                                    fontWeight: '700',
                                                    transition: 'all 0.2s'
                                                }}
                                                onMouseOver={(e) => e.target.style.opacity = '0.9'}
                                                onMouseOut={(e) => e.target.style.opacity = '1'}
                                            >
                                                Mark Paid
                                            </button>
                                        ) : (
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', color: '#16a34a' }}>
                                                <Check size={20} />
                                            </div>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default AdminPayroll;
