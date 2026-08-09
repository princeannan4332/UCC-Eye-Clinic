import React, { useState, useEffect } from 'react';
import { 
    Users, UserCheck, Stethoscope, ShieldCheck, Plus, Trash2, Search, Filter, 
    Calendar, CheckCircle2, AlertCircle, RefreshCw, Mail, Phone, MapPin, Building,
    Sparkles, ArrowRight, ShieldAlert, Award, UserCog
} from 'lucide-react';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';

export default function SuperAdminDashboard({ onNavigate }) {
    const { showToast } = useToast();

    // State
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState(null);
    const [recentAppointments, setRecentAppointments] = useState([]);
    const [staffList, setStaffList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [roleFilter, setRoleFilter] = useState('all');

    // Role Change Modal state
    const [roleModalStaff, setRoleModalStaff] = useState(null);
    const [editRole, setEditRole] = useState('doctor');
    const [editSupervisorId, setEditSupervisorId] = useState('');
    const [submittingRole, setSubmittingRole] = useState(false);

    // Delete Confirmation Modal state
    const [deletingStaff, setDeletingStaff] = useState(null);
    const [submittingDelete, setSubmittingDelete] = useState(false);

    // Add Staff Modal / Form state
    const [showAddModal, setShowAddModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [newStaff, setNewStaff] = useState({
        email: '',
        full_name: '',
        role: 'doctor',
        phone: '',
        assigned_location: 'Main Campus',
        supervisor_doctor_id: ''
    });

    const loadData = async () => {
        setLoading(true);
        try {
            const overviewRes = await api.getSuperAdminOverview();
            if (overviewRes.stats) {
                setStats(overviewRes.stats);
                setRecentAppointments(overviewRes.recentAppointments || []);
            }

            const staffRes = await api.getAllStaff();
            if (staffRes.staff) {
                setStaffList(staffRes.staff);
            }
        } catch (err) {
            console.error('Error loading Super Admin dashboard:', err);
            showToast('Failed to load system data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreateStaff = async (e) => {
        e.preventDefault();
        if (!newStaff.email || !newStaff.full_name) {
            showToast('Email and Full Name are required', 'warning');
            return;
        }

        if (newStaff.role === 'doctor_assistant' && !newStaff.supervisor_doctor_id) {
            showToast('Please select a Supervising Doctor for this assistant', 'warning');
            return;
        }

        const cleanEmail = newStaff.email.trim().toLowerCase();
        const existsInDirectory = staffList.some(s => (s.email || '').toLowerCase() === cleanEmail);
        if (existsInDirectory) {
            showToast(`An account with email '${cleanEmail}' already exists in the system.`, 'error');
            return;
        }

        setSubmitting(true);
        try {
            const res = await api.createStaffMember(newStaff);
            if (res.error) {
                showToast(res.error, 'error');
            } else {
                showToast(res.message || 'Staff member added successfully!', 'success');
                setShowAddModal(false);
                setNewStaff({
                    email: '',
                    full_name: '',
                    role: 'doctor',
                    phone: '',
                    assigned_location: 'Main Campus',
                    supervisor_doctor_id: ''
                });
                loadData();
            }
        } catch (err) {
            showToast('Failed to add staff member', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenRoleModal = (member) => {
        setRoleModalStaff(member);
        setEditRole(member.role || 'doctor');
        setEditSupervisorId(member.supervisor_doctor_id || '');
    };

    const handleSaveRoleModalSubmit = async (e) => {
        e.preventDefault();
        if (!roleModalStaff) return;

        if (editRole === 'doctor_assistant' && !editSupervisorId) {
            showToast('Please select a Supervising Doctor for this assistant.', 'warning');
            return;
        }

        setSubmittingRole(true);
        try {
            const res = await api.updateStaffRole(roleModalStaff.id, {
                role: editRole,
                supervisor_doctor_id: editRole === 'doctor_assistant' ? editSupervisorId : null
            });

            if (res.error) {
                showToast(res.error, 'error');
            } else {
                showToast(res.message || 'Staff role updated successfully!', 'success');
                setRoleModalStaff(null);
                loadData();
            }
        } catch (err) {
            console.error('Error updating role:', err);
            showToast('Failed to update staff role', 'error');
        } finally {
            setSubmittingRole(false);
        }
    };

    const handleConfirmDeleteStaff = async () => {
        if (!deletingStaff) return;
        setSubmittingDelete(true);
        try {
            const res = await api.deleteStaffMember(deletingStaff.id);
            if (res.error) {
                showToast(res.error, 'error');
            } else {
                showToast(`Staff member ${deletingStaff.full_name} deleted successfully`, 'success');
                setDeletingStaff(null);
                loadData();
            }
        } catch (err) {
            showToast('Failed to remove staff member', 'error');
        } finally {
            setSubmittingDelete(false);
        }
    };

    // Filter staff list
    const filteredStaff = staffList.filter(s => {
        const matchesSearch = s.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              s.email.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesRole = roleFilter === 'all' || s.role === roleFilter;
        return matchesSearch && matchesRole;
    });

    const doctorsOnly = staffList.filter(s => s.role === 'doctor');

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-8">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                    <RefreshCw className="w-8 h-8 animate-spin text-[#27AE60]" />
                    <p className="text-sm font-semibold">Loading Super Admin System Overview...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 font-sans pb-12">
            
            {/* Header Banner */}
            <div className="bg-gradient-to-r from-slate-900 via-[#103B29] to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-950/60">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[#6FCF97] text-xs font-extrabold uppercase tracking-wider">
                            <ShieldCheck className="w-4 h-4 text-[#6FCF97]" />
                            Super Administrator Portal
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
                            System Control & Staff Governance
                        </h1>
                        <p className="text-slate-300 text-xs sm:text-sm max-w-xl">
                            Overview of UCC Eye Clinic platform metrics, doctor & assistant credential provisioning, and real-time appointment logs.
                        </p>
                    </div>

                    <button
                        onClick={() => setShowAddModal(true)}
                        className="px-6 py-3.5 bg-[#6FCF97] hover:bg-[#52c17d] text-slate-900 font-black text-xs rounded-2xl shadow-lg transition-all cursor-pointer inline-flex items-center gap-2 transform hover:-translate-y-0.5"
                    >
                        <Plus className="w-4 h-4" /> Add Doctor or Assistant
                    </button>
                </div>
            </div>

            {/* Overview Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Patients</span>
                        <div className="text-3xl font-black text-slate-900">{stats?.totalPatients || 0}</div>
                        <span className="text-[11px] text-emerald-600 font-semibold">Registered Accounts</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#27AE60] flex items-center justify-center font-bold">
                        <Users className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Clinical Doctors</span>
                        <div className="text-3xl font-black text-slate-900">{stats?.totalDoctors || 0}</div>
                        <span className="text-[11px] text-teal-600 font-semibold">Active Specialists</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
                        <Stethoscope className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Doctor Assistants</span>
                        <div className="text-3xl font-black text-slate-900">{stats?.totalAssistants || 0}</div>
                        <span className="text-[11px] text-blue-600 font-semibold">Assigned Care Assistants</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-700 flex items-center justify-center font-bold">
                        <UserCheck className="w-6 h-6" />
                    </div>
                </div>

                <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-center justify-between">
                    <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Appointments</span>
                        <div className="text-3xl font-black text-slate-900">{stats?.totalAppointments || 0}</div>
                        <span className="text-[11px] text-emerald-600 font-semibold">{stats?.completedAppointments || 0} Completed</span>
                    </div>
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center font-bold">
                        <Calendar className="w-6 h-6" />
                    </div>
                </div>
            </div>

            {/* Staff Management Section */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-6">
                
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-5">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Users className="w-5 h-5 text-[#27AE60]" />
                            Staff Directory & Account Management
                        </h2>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Provision credentials for doctors and assistants. Default login password is <strong className="text-slate-800">Test</strong>.
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                        {/* Search Input */}
                        <div className="relative flex-1 sm:w-64">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                            <input
                                type="text"
                                placeholder="Search by name or email..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#6FCF97]"
                            />
                        </div>

                        {/* Filter Pill */}
                        <select
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:outline-none focus:border-[#6FCF97]"
                        >
                            <option value="all">All Roles</option>
                            <option value="doctor">Doctors Only</option>
                            <option value="doctor_assistant">Assistants Only</option>
                        </select>

                        <button
                            onClick={loadData}
                            className="p-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                            title="Refresh Staff List"
                        >
                            <RefreshCw className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Staff Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider bg-slate-50/80">
                                <th className="p-3.5 rounded-l-xl">Staff Name & Email</th>
                                <th className="p-3.5">Role</th>
                                <th className="p-3.5">Assigned Location</th>
                                <th className="p-3.5">Supervising Doctor</th>
                                <th className="p-3.5">Default Password</th>
                                <th className="p-3.5 text-right rounded-r-xl">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredStaff.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-8 text-center text-slate-500">
                                        No staff members found matching your search.
                                    </td>
                                </tr>
                            ) : (
                                filteredStaff.map((member) => (
                                    <tr key={member.id} className="hover:bg-slate-50/60 transition-colors">
                                        
                                        <td className="p-3.5">
                                            <div className="font-bold text-slate-900 text-sm">{member.full_name}</div>
                                            <div className="text-slate-500 text-[11px]">{member.email}</div>
                                            {member.phone && <div className="text-slate-400 text-[10px]">📞 {member.phone}</div>}
                                        </td>

                                        <td className="p-3.5">
                                            {member.role === 'doctor' ? (
                                                <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-[10px] uppercase rounded-full border border-emerald-200">
                                                    👨‍⚕️ Doctor
                                                </span>
                                            ) : (
                                                <span className="px-2.5 py-1 bg-blue-100 text-blue-800 font-extrabold text-[10px] uppercase rounded-full border border-blue-200">
                                                    🩺 Doctor Assistant
                                                </span>
                                            )}
                                        </td>

                                        <td className="p-3.5 font-semibold text-slate-700">
                                            <div className="flex items-center gap-1.5">
                                                <MapPin className="w-3.5 h-3.5 text-slate-400" />
                                                {member.assigned_location || 'Main Campus'}
                                            </div>
                                        </td>

                                        <td className="p-3.5">
                                            {member.role === 'doctor_assistant' ? (
                                                member.supervisor_doctor_name ? (
                                                    <span className="font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200 text-[11px]">
                                                        Assigned to: {member.supervisor_doctor_name}
                                                    </span>
                                                ) : (
                                                    <span className="text-amber-600 font-semibold text-[11px]">Unassigned</span>
                                                )
                                            ) : (
                                                <span className="text-slate-400 text-[11px]">— Primary Specialist —</span>
                                            )}
                                        </td>

                                        <td className="p-3.5">
                                            <span className="font-mono text-xs font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                                                Test
                                            </span>
                                        </td>

                                        <td className="p-3.5 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenRoleModal(member)}
                                                    className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                                    title="Change Role & Doctor Supervision"
                                                >
                                                    <UserCog className="w-3.5 h-3.5 text-blue-600" /> Change Role
                                                </button>
                                                <button
                                                    onClick={() => setDeletingStaff(member)}
                                                    className="p-1.5 text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer border border-rose-200/60"
                                                    title="Delete Staff Member"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>

                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Recent Appointments Audit */}
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <h3 className="text-lg font-bold text-slate-900">Recent Platform Appointments</h3>
                    <span className="text-xs text-slate-500">Live system booking logs</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {recentAppointments.slice(0, 6).map((appt) => (
                        <div key={appt.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-start justify-between gap-3">
                            <div className="space-y-1">
                                <div className="font-bold text-slate-900 text-sm">{appt.patient_name || 'Patient'}</div>
                                <div className="text-xs text-slate-600 font-medium">{appt.service_type}</div>
                                <div className="text-[11px] text-slate-500">
                                    🗓️ {appt.appointment_date} at {appt.appointment_time} ({appt.location})
                                </div>
                                <div className="text-[11px] text-emerald-800 font-semibold">
                                    Doctor: {appt.doctor_name || 'Assigned Specialist'}
                                </div>
                            </div>
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                                appt.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                                appt.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                                'bg-amber-100 text-amber-800'
                            }`}>
                                {appt.status}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Staff Modal */}
            {showAddModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-6">
                        
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Add Doctor or Assistant</h3>
                                <p className="text-xs text-slate-500">Default password for new staff is set to <strong className="text-slate-800">Test</strong></p>
                            </div>
                            <button
                                onClick={() => setShowAddModal(false)}
                                className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleCreateStaff} className="space-y-4 text-xs font-semibold text-slate-700">
                            
                            <div>
                                <label className="block mb-1 text-slate-900">Staff Role</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setNewStaff({ ...newStaff, role: 'doctor', supervisor_doctor_id: '' })}
                                        className={`p-3 rounded-2xl border flex items-center justify-center gap-2 cursor-pointer font-bold transition-all ${
                                            newStaff.role === 'doctor'
                                                ? 'bg-emerald-50 border-[#27AE60] text-[#103B29]'
                                                : 'bg-slate-50 border-slate-200 text-slate-600'
                                        }`}
                                    >
                                        <Stethoscope className="w-4 h-4 text-[#27AE60]" /> Doctor
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setNewStaff({ ...newStaff, role: 'doctor_assistant' })}
                                        className={`p-3 rounded-2xl border flex items-center justify-center gap-2 cursor-pointer font-bold transition-all ${
                                            newStaff.role === 'doctor_assistant'
                                                ? 'bg-blue-50 border-blue-500 text-blue-900'
                                                : 'bg-slate-50 border-slate-200 text-slate-600'
                                        }`}
                                    >
                                        <UserCheck className="w-4 h-4 text-blue-600" /> Doctor Assistant
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block mb-1 text-slate-900">Email Address (Login Username)</label>
                                <input
                                    type="email"
                                    required
                                    placeholder="e.g. doctorjane@gmail.com"
                                    value={newStaff.email}
                                    onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-[#6FCF97]"
                                />
                            </div>

                            <div>
                                <label className="block mb-1 text-slate-900">Full Name</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="e.g. Dr. Jane Doe or Alex Smith"
                                    value={newStaff.full_name}
                                    onChange={(e) => setNewStaff({ ...newStaff, full_name: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-[#6FCF97]"
                                />
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                    <label className="block mb-1 text-slate-900">Phone Number (Optional)</label>
                                    <input
                                        type="text"
                                        placeholder="0240000000"
                                        value={newStaff.phone}
                                        onChange={(e) => setNewStaff({ ...newStaff, phone: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-[#6FCF97]"
                                    />
                                </div>

                                <div>
                                    <label className="block mb-1 text-slate-900">Assigned Location</label>
                                    <select
                                        value={newStaff.assigned_location}
                                        onChange={(e) => setNewStaff({ ...newStaff, assigned_location: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:outline-none focus:border-[#6FCF97]"
                                    >
                                        <option value="Main Campus">Main Campus</option>
                                        <option value="Old Site">Old Site</option>
                                    </select>
                                </div>
                            </div>

                            {/* Supervising Doctor dropdown if role is doctor_assistant */}
                            {newStaff.role === 'doctor_assistant' && (
                                <div>
                                    <label className="block mb-1 text-[#103B29] font-bold">Assign to Supervising Doctor</label>
                                    <select
                                        required
                                        value={newStaff.supervisor_doctor_id}
                                        onChange={(e) => setNewStaff({ ...newStaff, supervisor_doctor_id: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-blue-50/60 border border-blue-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-500"
                                    >
                                        <option value="">-- Select Supervising Doctor --</option>
                                        {doctorsOnly.map((doc) => (
                                            <option key={doc.id} value={doc.id}>
                                                {doc.full_name} ({doc.email} - {doc.assigned_location || 'Main Campus'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
                                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    Account password will automatically default to <strong className="font-mono bg-amber-100 px-1 py-0.5 rounded text-amber-950">Test</strong> upon creation.
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowAddModal(false)}
                                    className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-6 py-2.5 bg-[#6FCF97] hover:bg-[#52c17d] text-slate-900 font-black rounded-xl cursor-pointer transition-all shadow-md"
                                >
                                    {submitting ? 'Creating Staff...' : 'Create Account'}
                                </button>
                            </div>

                        </form>

                    </div>
                </div>
            )}

            {/* ── Change Role Modal ────────────────────────────────────── */}
            {roleModalStaff && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 border border-slate-200 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-blue-100 text-blue-800 rounded-xl">
                                    <UserCog className="w-5 h-5 text-blue-700" />
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-slate-900 text-base">Change Staff Role</h4>
                                    <p className="text-xs text-slate-500 font-medium">{roleModalStaff.full_name} ({roleModalStaff.email})</p>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handleSaveRoleModalSubmit} className="space-y-4 text-xs font-semibold">
                            <div>
                                <label className="block mb-1.5 text-slate-900 font-bold">Select Assigned Role</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setEditRole('doctor')}
                                        className={`p-3 rounded-2xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                                            editRole === 'doctor'
                                                ? 'bg-emerald-50 border-emerald-500 text-emerald-900 shadow-xs'
                                                : 'bg-slate-50 border-slate-200 text-slate-600'
                                        }`}
                                    >
                                        👨‍⚕️ Clinical Doctor
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setEditRole('doctor_assistant')}
                                        className={`p-3 rounded-2xl border font-bold flex items-center justify-center gap-2 cursor-pointer transition-all ${
                                            editRole === 'doctor_assistant'
                                                ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs'
                                                : 'bg-slate-50 border-slate-200 text-slate-600'
                                        }`}
                                    >
                                        🩺 Doctor Assistant
                                    </button>
                                </div>
                            </div>

                            {editRole === 'doctor_assistant' && (
                                <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-2xl space-y-1.5">
                                    <label className="block text-[#103B29] font-extrabold">Assign to Supervising Doctor</label>
                                    <select
                                        required
                                        value={editSupervisorId}
                                        onChange={(e) => setEditSupervisorId(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-white border border-blue-300 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600 text-xs"
                                    >
                                        <option value="">-- Select Supervising Doctor --</option>
                                        {doctorsOnly.map((doc) => (
                                            <option key={doc.id} value={doc.id}>
                                                {doc.full_name} ({doc.email})
                                            </option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-blue-800 font-medium">
                                        This assistant will report directly to the selected doctor and manage their patient queue.
                                    </p>
                                </div>
                            )}

                            <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setRoleModalStaff(null)}
                                    className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingRole}
                                    className="px-6 py-2.5 bg-[#103B29] hover:bg-emerald-950 text-white font-bold rounded-xl cursor-pointer transition-all shadow-md"
                                >
                                    {submittingRole ? 'Saving...' : 'Save Role & Assignment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Confirm Delete Staff Modal ────────────────────────────── */}
            {deletingStaff && (
                <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 border border-slate-200 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-red-100 text-red-700 rounded-2xl">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-extrabold text-slate-900 text-lg">Confirm Delete Staff Account</h4>
                                <p className="text-xs text-slate-500 font-medium">Permanent Staff Directory Removal</p>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-700 space-y-1.5">
                            <p>Are you sure you want to delete <strong className="text-slate-900 font-bold">{deletingStaff.full_name}</strong> (<span className="text-slate-600 font-mono">{deletingStaff.email}</span>)?</p>
                            <p className="text-red-700 font-bold text-[11px]">⚠️ Warning: This staff account will be permanently removed from the system.</p>
                        </div>

                        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setDeletingStaff(null)}
                                className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={submittingDelete}
                                onClick={handleConfirmDeleteStaff}
                                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl cursor-pointer transition-all shadow-md text-xs flex items-center gap-2"
                            >
                                <Trash2 className="w-4 h-4" />
                                {submittingDelete ? 'Deleting...' : 'Delete Staff Account'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
