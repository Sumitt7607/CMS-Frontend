import { useState, useEffect } from 'react';
import { Search, Plus, Check, X, Calendar } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const AdminTimesheet = () => {
    const [entries, setEntries] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // ✅ Filters
    const [fromDate, setFromDate] = useState('');
    const [toDate, setToDate] = useState('');
    const [selectedEmployee, setSelectedEmployee] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
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
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await axios.get(`${API_URL}/employees`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setEmployees(res.data);
        } catch (err) {}
    };

    // ✅ FILTER LOGIC
    const filteredEntries = entries.filter(entry => {
        const matchesSearch =
            entry.userId?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.project?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.module?.toLowerCase().includes(searchTerm.toLowerCase());

        const entryDate = new Date(entry.date);

        const matchesDate =
            (!fromDate || entryDate >= new Date(fromDate)) &&
            (!toDate || entryDate <= new Date(toDate));

        const matchesEmployee =
            !selectedEmployee || entry.userId?._id === selectedEmployee;

        return matchesSearch && matchesDate && matchesEmployee;
    });

    // ✅ EXPORT
    const exportToExcel = () => {
        const data = filteredEntries.map(entry => ({
            Employee: entry.userId?.name,
            Project: entry.project,
            Module: entry.module,
            Phase: entry.phase,
            Date: entry.date,
            Status: entry.status
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Timesheets");

        const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        const file = new Blob([buffer], { type: 'application/octet-stream' });

        saveAs(file, 'Timesheets.xlsx');
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* HEADER */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '12px'
            }}>
                <h1 style={{ fontSize: '24px', fontWeight: '800' }}>
                    Timesheet Management
                </h1>

                <button
                    onClick={exportToExcel}
                    className="btn-primary"
                    style={{ padding: '10px 18px', borderRadius: '10px' }}
                >
                    Export Excel
                </button>
            </div>

            {/* FILTERS (RESPONSIVE) */}
            <div style={{
                display: 'flex',
                gap: '12px',
                flexWrap: 'wrap'
            }}>
                <div className="card" style={{ padding: '8px 12px' }}>
                    <input
                        type="date"
                        value={fromDate}
                        onChange={(e) => setFromDate(e.target.value)}
                        style={{ border: 'none', outline: 'none' }}
                    />
                </div>

                <div className="card" style={{ padding: '8px 12px' }}>
                    <input
                        type="date"
                        value={toDate}
                        onChange={(e) => setToDate(e.target.value)}
                        style={{ border: 'none', outline: 'none' }}
                    />
                </div>

                <div className="card" style={{ padding: '8px 12px' }}>
                    <select
                        value={selectedEmployee}
                        onChange={(e) => setSelectedEmployee(e.target.value)}
                        style={{ border: 'none', outline: 'none' }}
                    >
                        <option value="">All Employees</option>
                        {employees.map(emp => (
                            <option key={emp._id} value={emp._id}>
                                {emp.name}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* SEARCH + ADD */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap'
            }}>
                <div className="card" style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 16px',
                    width: '300px'
                }}>
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Search..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            border: 'none',
                            outline: 'none',
                            padding: '10px',
                            width: '100%'
                        }}
                    />
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="btn-primary"
                >
                    <Plus size={16} /> Add Entry
                </button>
            </div>

            {/* TABLE */}
            <div className="card" style={{ overflowX: 'auto' }}>
                {loading ? (
                    <p style={{ padding: '40px' }}>Loading...</p>
                ) : (
                    <table style={{
                        width: '100%',
                        minWidth: '800px',
                        borderCollapse: 'collapse'
                    }}>
                        <thead>
                            <tr>
                                <th>Employee</th>
                                <th>Project</th>
                                <th>Module</th>
                                <th>Phase</th>
                                <th>Date</th>
                                <th>Status</th>
                            </tr>
                        </thead>

                        <tbody>
                            {filteredEntries.map(entry => (
                                <tr key={entry._id}>
                                    <td>{entry.userId?.name}</td>
                                    <td>{entry.project}</td>
                                    <td>{entry.module}</td>
                                    <td>{entry.phase}</td>
                                    <td>{entry.date}</td>
                                    <td>{entry.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

        </div>
    );
};

export default AdminTimesheet;