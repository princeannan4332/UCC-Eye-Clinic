import React, { useState, useEffect } from 'react';
import { Calendar, CheckSquare, Clock, Plus, RefreshCw, Filter, User, HeartPulse, Phone, ShieldAlert, FileText, AlertCircle, MapPin, XCircle, Activity } from 'lucide-react';
import { api } from '../lib/api';
import CustomSelect from '../components/CustomSelect';
import { useToast } from '../components/Toast';
import ConfirmModal from '../components/ConfirmModal';
import PatientDossierModal from '../components/PatientDossierModal';

const statusFilterOptions = [
    { value: 'all', label: 'All Statuses' },
    { value: 'pending', label: 'Pending Review' },
    { value: 'approved', label: 'Approved / Scheduled' },
    { value: 'active', label: 'Active Consultation' },
    { value: 'completed', label: 'Completed (Done)' },
    { value: 'slot_closed', label: '🚫 Slot Closed by Admin' },
    { value: 'rescheduled', label: 'Rescheduled' },
    { value: 'cancelled', label: 'Cancelled by Patient' }
];

const locationOptions = [
    { value: 'Main Campus', label: 'Main Campus Clinic' },
    { value: 'Old Site', label: 'Old Site Clinic Annex' }
];

const hourIntervalOptions = [
    { value: '08:00', end: '09:00', label: '08:00 AM – 09:00 AM' },
    { value: '09:00', end: '10:00', label: '09:00 AM – 10:00 AM' },
    { value: '10:00', end: '11:00', label: '10:00 AM – 11:00 AM' },
    { value: '11:00', end: '12:00', label: '11:00 AM – 12:00 PM' },
    { value: '12:00', end: '13:00', label: '12:00 PM – 01:00 PM' },
    { value: '13:00', end: '14:00', label: '01:00 PM – 02:00 PM' },
    { value: '14:00', end: '15:00', label: '02:00 PM – 03:00 PM' },
    { value: '15:00', end: '16:00', label: '03:00 PM – 04:00 PM' }
];

const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const clean = String(dateStr).split('T')[0];
    const parts = clean.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthName = months[parseInt(m, 10) - 1] || m;
    return `${monthName} ${parseInt(d, 10)}, ${y}`;
};

const formatTime = (timeStr) => {
    if (!timeStr) return '';
    const [h, m] = String(timeStr).split(':');
    if (!h || !m) return timeStr;
    let hour = parseInt(h, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return `${hour}:${m} ${ampm}`;
};

export default function AdminDashboard({ activeTab = 'bookings', onNavigate }) {
    const { showToast } = useToast();
    const [view, setView] = useState(activeTab); // 'bookings' or 'capacity'

    useEffect(() => {
        setView(activeTab);
    }, [activeTab]);

    // Bookings state
    const [appointments, setAppointments] = useState([]);
    const [mainCampusStatusFilter, setMainCampusStatusFilter] = useState('all');
    const [oldSiteStatusFilter, setOldSiteStatusFilter] = useState('all');
    const [filterLocation, setFilterLocation] = useState('all');
    const [loading, setLoading] = useState(true);

    // Doctors state
    const [doctorsList, setDoctorsList] = useState([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState('');
    const [assignLocation, setAssignLocation] = useState('Main Campus');
    const [loadingDoctors, setLoadingDoctors] = useState(false);

    // Reschedule / Action Modal State
    const [selectedAppt, setSelectedAppt] = useState(null);
    const [actionType, setActionType] = useState(null); // 'approve', 'cancel', 'reschedule'
    const [reason, setReason] = useState('');
    const [newDate, setNewDate] = useState('');
    const [newTime, setNewTime] = useState('');
    const [isUpdating, setIsUpdating] = useState(false);

    const openAssignDoctorModal = async (appt) => {
        setSelectedAppt(appt);
        setActionType('approve');
        const targetLoc = appt.location || 'Main Campus';
        setAssignLocation(targetLoc);
        setSelectedDoctorId('');
        setDoctorsList([]);
        setLoadingDoctors(true);
        try {
            const docRes = await api.getDoctors(targetLoc);
            if (docRes?.doctors) {
                setDoctorsList(docRes.doctors);
                if (docRes.doctors.length > 0) {
                    setSelectedDoctorId(docRes.doctors[0].id);
                }
            }
        } catch (err) {
            console.error('Error fetching doctors for location:', err);
        } finally {
            setLoadingDoctors(false);
        }
    };

    // Dossier Modal state
    const [dossierAppt, setDossierAppt] = useState(null);

    // Slot Capacity Creator & Closure Modal State
    const [editingSlotId, setEditingSlotId] = useState(null);
    const [slotDate, setSlotDate] = useState('');
    const [startTime, setStartTime] = useState('08:00');
    const [endTime, setEndTime] = useState('09:00');
    const [slotLocation, setSlotLocation] = useState('Main Campus');
    const [maxSlots, setMaxSlots] = useState(6);
    const [capacityList, setCapacityList] = useState([]);
    
    // Slot Closure modal with reason
    const [slotToClose, setSlotToClose] = useState(null);
    const [closureReasonInput, setClosureReasonInput] = useState('');
    const [isClosingSlot, setIsClosingSlot] = useState(false);

    const loadAdminData = async () => {
        setLoading(true);
        try {
            const apptRes = await api.getAllAppointments();
            if (apptRes.appointments) {
                setAppointments(apptRes.appointments);
            }

            const capRes = await api.getCapacity('', true);
            if (capRes.capacity) {
                setCapacityList(capRes.capacity);
            }

            const docRes = await api.getDoctors(assignLocation);
            if (docRes?.doctors) {
                setDoctorsList(docRes.doctors);
                if (docRes.doctors.length > 0 && !selectedDoctorId) {
                    setSelectedDoctorId(docRes.doctors[0].id);
                }
            }
        } catch (err) {
            console.error('Error loading admin data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleReopenSlot = async (slotId) => {
        try {
            const res = await api.reopenCapacity(slotId);
            if (res.slot || res.message) {
                showToast('Capacity slot re-opened successfully! Patients can now book this slot.', 'success');
                loadAdminData();
            } else if (res.error) {
                showToast(res.error, 'error');
            }
        } catch (err) {
            console.error('Error reopening capacity slot:', err);
            showToast('Failed to re-open capacity slot', 'error');
        }
    };

    useEffect(() => {
        loadAdminData();
    }, [assignLocation]);

    const handleSaveSlot = async (e) => {
        e.preventDefault();
        if (!slotDate || !startTime || !endTime) {
            showToast('Please select date and time range', 'warning');
            return;
        }

        const [startH] = startTime.split(':').map(Number);
        if (startH < 8 || startH >= 15) {
            showToast('Operating hours are 8:00 AM to 4:00 PM. Slot start time must be between 8:00 AM and 3:00 PM.', 'warning');
            return;
        }

        try {
            if (editingSlotId) {
                const res = await api.updateCapacity(editingSlotId, {
                    slot_date: slotDate,
                    start_time: startTime,
                    end_time: endTime,
                    location: slotLocation,
                    max_slots: parseInt(maxSlots, 10)
                });
                if (res.slot) {
                    showToast('Clinic capacity slot updated successfully!', 'success');
                    setEditingSlotId(null);
                    setSlotDate('');
                    loadAdminData();
                } else if (res.error) {
                    showToast(res.error, 'error');
                }
            } else {
                const res = await api.createCapacity({
                    slot_date: slotDate,
                    start_time: startTime,
                    end_time: endTime,
                    location: slotLocation,
                    max_slots: parseInt(maxSlots, 10)
                });
                if (res.slot) {
                    showToast('Clinic capacity slot added successfully!', 'success');
                    setSlotDate('');
                    loadAdminData();
                } else if (res.error) {
                    showToast(res.error, 'error');
                }
            }
        } catch (e) {
            console.error(e);
            showToast('Failed to save capacity slot.', 'error');
        }
    };

    const confirmExecuteSlotClose = async () => {
        if (!slotToClose) return;
        setIsClosingSlot(true);
        try {
            const res = await api.deleteCapacity(slotToClose.id, closureReasonInput);
            if (res.message) {
                showToast(`Slot closed! ${res.affected_patients || 0} booked patient(s) notified on dashboard.`, 'success');
                if (editingSlotId === slotToClose.id) {
                    setEditingSlotId(null);
                }
                setSlotToClose(null);
                setClosureReasonInput('');
                loadAdminData();
            } else if (res.error) {
                showToast(res.error, 'error');
            }
        } catch (err) {
            console.error('Error closing slot:', err);
            showToast('Failed to close capacity slot', 'error');
        } finally {
            setIsClosingSlot(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!selectedAppt || !actionType) return;

        let status = 'approved';
        if (actionType === 'cancel') status = 'cancelled';
        if (actionType === 'reschedule') status = 'rescheduled';

        if (status === 'approved' && !selectedDoctorId) {
            showToast('Please select an allocated doctor for this appointment.', 'warning');
            return;
        }

        const chosenStaff = doctorsList.find(d => d.id === selectedDoctorId);
        if (status === 'approved' && chosenStaff && chosenStaff.is_available === false) {
            showToast(`${chosenStaff.full_name} is currently marked as Unavailable. Receptionists cannot assign patients to unavailable staff members.`, 'error');
            return;
        }

        setIsUpdating(true);

        try {
            const payload = {
                status,
                reschedule_reason: reason,
                rescheduled_date: actionType === 'reschedule' ? newDate : null,
                rescheduled_time: actionType === 'reschedule' ? newTime : null,
                doctor_id: status === 'approved' ? selectedDoctorId : null
            };

            const res = await api.updateAppointmentStatus(selectedAppt.id, payload);
            if (res.appointment) {
                showToast(`Appointment status updated to ${status}`, 'success');
                loadAdminData();
                setSelectedAppt(null);
                setActionType(null);
                setReason('');
                setNewDate('');
                setNewTime('');
            } else {
                showToast(res.error || 'Failed to update status', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Error updating status', 'error');
        } finally {
            setIsUpdating(false);
        }
    };

    const matchesStatus = (appt, targetFilter) => {
        if (targetFilter === 'all') return true;
        const isClosedByAdmin = appt.status === 'cancelled' && appt.reschedule_reason && (
            appt.reschedule_reason.toLowerCase().includes('slot closed') || 
            appt.reschedule_reason.toLowerCase().includes('closed by administration')
        );
        if (targetFilter === 'slot_closed') return isClosedByAdmin;
        if (targetFilter === 'cancelled') return appt.status === 'cancelled' && !isClosedByAdmin;
        return appt.status === targetFilter;
    };

    const mainCampusAppointments = appointments.filter(a => {
        const loc = a.location || 'Main Campus';
        if (loc !== 'Main Campus') return false;
        return matchesStatus(a, mainCampusStatusFilter);
    });

    const oldSiteAppointments = appointments.filter(a => {
        if (a.location !== 'Old Site') return false;
        return matchesStatus(a, oldSiteStatusFilter);
    });

    const renderAppointmentTable = (apptsList, locationTitle, locationBadgeColor, locationIcon, currentStatusFilter, onStatusFilterChange) => (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3 flex-wrap">
                    <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                        <span>{locationIcon}</span> {locationTitle}
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${locationBadgeColor}`}>
                        {apptsList.length} Patient(s)
                    </span>
                </div>

                <div className="w-48">
                    <CustomSelect
                        options={statusFilterOptions}
                        value={currentStatusFilter}
                        onChange={onStatusFilterChange}
                    />
                </div>
            </div>

            {loading ? (
                <div className="py-10 text-center text-xs text-slate-400">Loading appointments...</div>
            ) : apptsList.length === 0 ? (
                <div className="py-10 text-center text-xs text-slate-400">No appointments recorded for this clinic location.</div>
            ) : (
                <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
                    <table className="w-full text-left text-xs border-collapse">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                                <th className="p-3.5">Patient Name & Occupation</th>
                                <th className="p-3.5">Location</th>
                                <th className="p-3.5">Service & Time</th>
                                <th className="p-3.5">Allocated Doctor</th>
                                <th className="p-3.5">Live Status</th>
                                <th className="p-3.5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {apptsList.map((appt) => {
                                const isSlotClosedByAdmin = appt.status === 'cancelled' && appt.reschedule_reason && (
                                    appt.reschedule_reason.toLowerCase().includes('slot closed') || 
                                    appt.reschedule_reason.toLowerCase().includes('closed by administration')
                                );

                                return (
                                    <tr key={appt.id} className="hover:bg-slate-50/80 transition-colors">
                                        <td className="p-3.5 font-bold text-slate-900">
                                            {appt.full_name}
                                            <span className="block text-[10px] text-slate-500 font-normal">
                                                {appt.occupation || 'Student'} • {appt.phone || appt.email}
                                            </span>
                                        </td>
                                        <td className="p-3.5 font-semibold text-slate-700">
                                            <span className="px-2 py-0.5 bg-slate-100 text-slate-800 rounded-md font-bold text-[10px]">
                                                📍 {appt.location || 'Main Campus'}
                                            </span>
                                        </td>
                                        <td className="p-3.5 font-medium text-slate-700">
                                            <div>{appt.service_type}</div>
                                            <div className="text-[10px] text-emerald-700 font-bold">
                                                {formatDate(appt.appointment_date)} @ {formatTime(appt.appointment_time)}
                                            </div>
                                        </td>
                                        <td className="p-3.5 font-bold text-slate-800">
                                            {appt.assistant_name ? (
                                                <span className="text-emerald-800">🩺 {appt.assistant_name} <span className="text-[10px] font-normal text-slate-500">(Assistant)</span></span>
                                            ) : appt.doctor_name ? (
                                                <span className="text-emerald-800">👨‍⚕️ {appt.doctor_name}</span>
                                            ) : (
                                                <span className="text-amber-600 italic">Unassigned</span>
                                            )}
                                        </td>
                                        <td className="p-3.5 whitespace-nowrap">
                                            <span className={`inline-flex items-center justify-center gap-1.5 px-3 py-1 rounded-full font-extrabold text-[10px] border whitespace-nowrap leading-tight shadow-2xs ${
                                                appt.status === 'completed' ? 'bg-purple-100 text-purple-800 border-purple-200' :
                                                appt.status === 'active' ? 'bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse' :
                                                appt.status === 'approved' ? 'bg-amber-100 text-amber-800 border-amber-300' :
                                                isSlotClosedByAdmin ? 'bg-red-100 text-red-900 border-red-300' :
                                                appt.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                                            }`}>
                                                {appt.status === 'active' ? '🟢 Active Consultation' :
                                                 appt.status === 'completed' ? '✅ Completed (Done)' :
                                                 appt.status === 'approved' ? '⏳ Waiting for Doctor' :
                                                 isSlotClosedByAdmin ? '🚫 Slot Closed by Admin' :
                                                 appt.status === 'cancelled' ? '❌ Cancelled' :
                                                 appt.status === 'pending' ? '📋 Pending Approval' : appt.status}
                                            </span>
                                            {isSlotClosedByAdmin && appt.reschedule_reason && (
                                                <span className="block text-[9px] text-red-700 font-bold mt-1 max-w-[170px] truncate" title={appt.reschedule_reason}>
                                                    ⚠️ {appt.reschedule_reason}
                                                </span>
                                            )}
                                        </td>
                                    <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                                        <button
                                            onClick={() => setDossierAppt(appt)}
                                            className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl font-bold transition-colors cursor-pointer text-[11px]"
                                        >
                                            Medical Dossier
                                        </button>

                                        {appt.status === 'pending' && (
                                            <button
                                                onClick={() => openAssignDoctorModal(appt)}
                                                className="px-2.5 py-1 bg-[#103B29] hover:bg-emerald-900 text-white rounded-xl font-bold transition-colors cursor-pointer text-[11px]"
                                            >
                                                Assign Doctor & Approve
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            );
                        })}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );

    return (
        <div className="space-y-6 font-sans">
            
            {/* Header Title & Actions Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">Admin Reception Portal</h1>
                    <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
                        Manage capacity slots (8 AM - 4 PM), assign doctors (max 9 patients/day), track active consultations, and close slots with patient notifications.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={() => { setView('bookings'); if (onNavigate) onNavigate('admin-bookings'); }}
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                            view === 'bookings' ? 'bg-[#103B29] text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        Patient Bookings ({appointments.length})
                    </button>
                    <button
                        onClick={() => { setView('capacity'); if (onNavigate) onNavigate('admin-capacity'); }}
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                            view === 'capacity' ? 'bg-[#103B29] text-white shadow-xs' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        Capacity Slots
                    </button>
                    <button
                        onClick={loadAdminData}
                        className="p-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 transition-colors cursor-pointer"
                        title="Refresh"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* TAB 1: BOOKINGS & DOCTOR ASSIGNMENT (SEPARATE TABLES FOR MAIN CAMPUS AND OLD SITE) */}
            {view === 'bookings' && (
                <div className="space-y-6">
                    {/* Location Filter Switcher Bar */}
                    <div className="flex items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex-wrap">
                        <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">Filter Display Table:</span>
                        <div className="flex items-center gap-2 flex-wrap">
                            <button
                                onClick={() => setFilterLocation('all')}
                                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                                    filterLocation === 'all' ? 'bg-[#103B29] text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                Show Both Tables (All Locations)
                            </button>
                            <button
                                onClick={() => setFilterLocation('Main Campus')}
                                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                                    filterLocation === 'Main Campus' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                🏥 Main Campus Only ({mainCampusAppointments.length})
                            </button>
                            <button
                                onClick={() => setFilterLocation('Old Site')}
                                className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${
                                    filterLocation === 'Old Site' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                            >
                                🏢 Old Site Annex Only ({oldSiteAppointments.length})
                            </button>
                        </div>
                    </div>

                    {/* TABLE 1: MAIN CAMPUS CLINIC */}
                    {(filterLocation === 'all' || filterLocation === 'Main Campus') && (
                        renderAppointmentTable(
                            mainCampusAppointments,
                            'Main Campus Eye Clinic Queue',
                            'bg-emerald-100 text-emerald-800',
                            '🏥',
                            mainCampusStatusFilter,
                            setMainCampusStatusFilter
                        )
                    )}

                    {/* TABLE 2: OLD SITE CLINIC ANNEX */}
                    {(filterLocation === 'all' || filterLocation === 'Old Site') && (
                        renderAppointmentTable(
                            oldSiteAppointments,
                            'Old Site Clinic Annex Queue',
                            'bg-blue-100 text-blue-800',
                            '🏢',
                            oldSiteStatusFilter,
                            setOldSiteStatusFilter
                        )
                    )}
                </div>
            )}

            {/* TAB 2: CAPACITY SLOTS MANAGEMENT */}
            {view === 'capacity' && (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left: Slot Configurator Form */}
                    <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                        <div className="border-b border-slate-100 pb-3">
                            <h3 className="font-extrabold text-slate-900 text-base">Configure Capacity Slot</h3>
                            <p className="text-xs text-slate-500">Clinic hours are 8:00 AM – 4:00 PM (Start time must be &lt;= 3:00 PM)</p>
                        </div>

                        <form onSubmit={handleSaveSlot} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Clinic Location</label>
                                <CustomSelect options={locationOptions} value={slotLocation} onChange={setSlotLocation} />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Slot Date</label>
                                <input
                                    type="date"
                                    required
                                    value={slotDate}
                                    onChange={(e) => setSlotDate(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#27AE60]"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Standard 1-Hour Time Slot (08:00 AM – 04:00 PM)</label>
                                <CustomSelect
                                    options={hourIntervalOptions}
                                    value={startTime}
                                    onChange={(val) => {
                                        setStartTime(val);
                                        const match = hourIntervalOptions.find(o => o.value === val);
                                        if (match) setEndTime(match.end);
                                    }}
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Max Patient Capacity</label>
                                <input
                                    type="number"
                                    min="1"
                                    max="20"
                                    required
                                    value={maxSlots}
                                    onChange={(e) => setMaxSlots(e.target.value)}
                                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#27AE60]"
                                />
                            </div>

                            <button
                                type="submit"
                                className="w-full py-3 bg-[#6FCF97] hover:bg-[#52c17d] text-slate-900 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
                            >
                                {editingSlotId ? 'Update Capacity Slot' : '+ Create Clinic Capacity Slot'}
                            </button>
                        </form>
                    </div>

                    {/* Right: Active Slots List */}
                    <div className="lg:col-span-7 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                        <div className="border-b border-slate-100 pb-3 flex justify-between items-center">
                            <h3 className="font-extrabold text-slate-900 text-base">Active Capacity Schedule</h3>
                            <span className="text-xs text-slate-400 font-bold">{capacityList.length} Slot(s)</span>
                        </div>

                        {capacityList.length === 0 ? (
                            <div className="py-12 text-center text-xs text-slate-400">No active capacity slots configured.</div>
                        ) : (
                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                                {capacityList.map((slot) => (
                                    <div key={slot.id} className={`p-4 border rounded-2xl flex justify-between items-center gap-3 transition-colors ${
                                        slot.is_active === false ? 'bg-red-50/60 border-red-200' : 'bg-slate-50 border-slate-200/80'
                                    }`}>
                                        <div className="space-y-1">
                                            <div className="font-bold text-slate-900 text-xs flex items-center gap-2 flex-wrap">
                                                <span>📅 {formatDate(slot.slot_date)}</span>
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md text-[10px]">
                                                    📍 {slot.location || 'Main Campus'}
                                                </span>
                                                {slot.is_active === false ? (
                                                    <span className="px-2 py-0.5 bg-red-100 text-red-800 rounded-md text-[10px] font-extrabold uppercase">
                                                        🔴 CLOSED
                                                    </span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-bold uppercase">
                                                        🟢 OPEN
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-xs text-slate-600">
                                                ⏰ {formatTime(slot.start_time)} – {formatTime(slot.end_time)} | Booked: <strong className="text-emerald-800">{slot.booked_slots}/{slot.max_slots}</strong>
                                            </div>
                                            {slot.is_active === false && slot.closure_reason && (
                                                <div className="text-[11px] text-red-700 font-semibold italic">
                                                    Reason: {slot.closure_reason}
                                                </div>
                                            )}
                                        </div>

                                        {slot.is_active === false ? (
                                            <button
                                                onClick={() => handleReopenSlot(slot.id)}
                                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                                            >
                                                <RefreshCw className="w-3.5 h-3.5" /> Re-open Slot
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => setSlotToClose(slot)}
                                                className="px-3 py-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                                            >
                                                <XCircle className="w-3.5 h-3.5" /> Close Slot
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal: Patient Medical Dossier */}
            <PatientDossierModal appt={dossierAppt} onClose={() => setDossierAppt(null)} />

            {/* Modal: Assign Doctor & Approve Appointment */}
            {selectedAppt && actionType === 'approve' && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl font-sans">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                            <h4 className="font-extrabold text-slate-900 text-base">Assign Clinical Staff & Confirm Booking</h4>
                            <button onClick={() => setSelectedAppt(null)} className="text-slate-400 font-bold">✕</button>
                        </div>

                        <div className="p-3.5 bg-emerald-50 rounded-2xl text-xs space-y-1">
                            <div className="font-bold text-slate-900">Patient: {selectedAppt.full_name} ({selectedAppt.occupation || 'Student'})</div>
                            <div className="text-slate-700">Service: {selectedAppt.service_type}</div>
                            <div className="text-slate-700">Location: {selectedAppt.location || 'Main Campus'}</div>
                            <div className="text-emerald-800 font-bold">Time: {formatDate(selectedAppt.appointment_date)} @ {formatTime(selectedAppt.appointment_time)}</div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Clinic Location</label>
                                <div className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-extrabold text-slate-900 flex items-center gap-2">
                                    <span>📍 {selectedAppt.location || 'Main Campus'}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Select Clinical Staff <span className="text-xs text-slate-400">(Max 9 Patients/Day)</span>
                                </label>
                                <p className="text-[10px] text-slate-400 mb-2">👨‍⚕️ = Doctor &nbsp;|&nbsp; 🩺 = Doctor Assistant (performs full clinical duties under supervising doctor)</p>
                                {loadingDoctors ? (
                                    <div className="py-3 px-4 flex items-center justify-center gap-2 text-xs text-slate-600 font-semibold bg-slate-50 rounded-xl border border-slate-200">
                                        <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                        <span>Loading staff available for {selectedAppt.location || 'Main Campus'}...</span>
                                    </div>
                                ) : doctorsList.length === 0 ? (
                                    <p className="text-xs text-red-600 font-semibold p-3 bg-red-50 rounded-xl border border-red-100">
                                        No clinical staff assigned to {selectedAppt.location || 'Main Campus'}.
                                    </p>
                                ) : (
                                    <CustomSelect
                                        options={doctorsList.map(d => {
                                            const isUnavail = d.is_available === false;
                                            return {
                                                value: d.id,
                                                label: isUnavail
                                                    ? (d.role === 'doctor_assistant'
                                                        ? `🔴 🩺 ${d.full_name} (Assistant · UNAVAILABLE)`
                                                        : `🔴 👨‍⚕️ ${d.full_name} (Doctor · UNAVAILABLE)`)
                                                    : (d.role === 'doctor_assistant'
                                                        ? `🩺 ${d.full_name} (Assistant · ${d.assigned_location || 'Main Campus'})`
                                                        : `👨‍⚕️ ${d.full_name} (Doctor · ${d.assigned_location || 'Main Campus'})`)
                                            };
                                        })}
                                        value={selectedDoctorId}
                                        onChange={(val) => setSelectedDoctorId(val)}
                                        placeholder="Select Clinical Staff..."
                                    />
                                )}
                            </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-3 border-t border-slate-100">
                            <button
                                onClick={() => setSelectedAppt(null)}
                                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleStatusUpdate}
                                disabled={isUpdating || !selectedDoctorId}
                                className="px-4 py-2 bg-[#103B29] hover:bg-emerald-900 text-white font-bold rounded-xl text-xs cursor-pointer"
                            >
                                {isUpdating ? 'Assigning...' : 'Approve & Assign Staff'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal: Close Slot with Reason */}
            {slotToClose && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl font-sans">
                        <h4 className="font-extrabold text-slate-900 text-base">Close Clinic Capacity Slot</h4>
                        <p className="text-xs text-slate-600">
                            Closing slot for <span className="font-bold">{formatDate(slotToClose.slot_date)}</span> ({formatTime(slotToClose.start_time)}). If patients booked this slot, they will be notified on their dashboard.
                        </p>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Reason for Closing (Optional)</label>
                            <input
                                type="text"
                                placeholder="e.g. Doctor emergency leave / Maintenance"
                                value={closureReasonInput}
                                onChange={(e) => setClosureReasonInput(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#27AE60]"
                            />
                        </div>
                        <div className="flex gap-2 justify-end pt-2">
                            <button
                                onClick={() => setSlotToClose(null)}
                                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                            >
                                Keep Slot Open
                            </button>
                            <button
                                onClick={confirmExecuteSlotClose}
                                disabled={isClosingSlot}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                            >
                                {isClosingSlot ? 'Closing...' : 'Close & Notify Patients'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
