import React, { useState, useEffect } from 'react';
import { Stethoscope, Calendar, Clock, User, FileText, CheckCircle2, RefreshCw, AlertCircle, Phone, Search, Play, CheckSquare, BarChart2, Star, ThumbsUp, History, UserX } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';
import PatientDossierModal from '../components/PatientDossierModal';
import PatientHistoryModal from '../components/PatientHistoryModal';
import DoctorAnalyticsChart from '../components/DoctorAnalyticsChart';
import CustomSelect from '../components/CustomSelect';

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

const getTodayLocalStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const caseTypeOptions = [
    { value: 'Refraction & Visual Acuity Test', label: 'Refraction & Spectacle Prescription' },
    { value: 'Glaucoma Evaluation & IOP', label: 'Glaucoma Evaluation & IOP' },
    { value: 'Cataract Screening', label: 'Cataract Screening' },
    { value: 'Ocular Infection / Allergy', label: 'Ocular Infection / Allergy' },
    { value: 'Dry Eye & Fatigue Syndrome', label: 'Dry Eye & Fatigue Syndrome' },
    { value: 'General Routine Eye Exam', label: 'General Routine Eye Exam' }
];

const caseOutcomeOptions = [
    { value: 'Capably Treated / Discharged', label: 'Capably Treated / Discharged' },
    { value: 'Referred to Ophthalmologist / Specialist', label: 'Referred to Specialist' },
    { value: 'Prescription Issued & Spectacles Fitted', label: 'Prescription Issued & Fitted' },
    { value: 'Follow-up Required in 2 Weeks', label: 'Follow-up Required' },
    { value: 'Medically Fit / No Treatment Required', label: 'Medically Fit / Clear' }
];

function LiveConsultationTimer({ startTime, className = "" }) {
    const [seconds, setSeconds] = useState(0);

    useEffect(() => {
        if (!startTime) return;
        const startMs = new Date(startTime).getTime();
        
        const updateTimer = () => {
            const now = Date.now();
            const elapsed = Math.max(0, Math.floor((now - startMs) / 1000));
            setSeconds(elapsed);
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [startTime]);

    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    const formattedMins = String(mins).padStart(2, '0');
    const formattedSecs = String(secs).padStart(2, '0');

    return (
        <span className={`inline-flex items-center gap-1.5 font-mono font-bold ${className}`}>
            <Clock className="w-3.5 h-3.5 text-emerald-600 animate-spin" />
            <span>{formattedMins}:{formattedSecs}</span>
            <span className="text-[10px] font-sans font-medium text-slate-500">({mins}m {secs}s)</span>
        </span>
    );
}

export default function DoctorDashboard({ activeTab = 'dashboard', onNavigate }) {
    const { profile } = useAuth();
    const { showToast } = useToast();
    const [view, setView] = useState(activeTab); // 'dashboard', 'consultations', 'analytics'
    const [appointments, setAppointments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    // realDoctorId resolves the actual DB UUID — the stored profile.id may be a hardcoded
    // seed UUID that differs from what the DB assigned when the row was first created.
    const [realDoctorId, setRealDoctorId] = useState(null);
    
    // Dossier & History Modal state
    const [selectedDossierAppt, setSelectedDossierAppt] = useState(null);
    const [selectedHistoryPatient, setSelectedHistoryPatient] = useState(null);

    // Complete Consultation Modal State
    const [completingAppt, setCompletingAppt] = useState(null);
    const [caseType, setCaseType] = useState('Refraction & Visual Acuity Test');
    const [caseOutcome, setCaseOutcome] = useState('Capably Treated / Discharged');
    const [clinicalNotes, setClinicalNotes] = useState('');
    const [customDuration, setCustomDuration] = useState(15);
    const [isSubmittingDone, setIsSubmittingDone] = useState(false);

    // Doctor Analytics & Reviews state
    const [analyticsData, setAnalyticsData] = useState(null);
    const [reviewsSummary, setReviewsSummary] = useState(null);
    const [reviewsList, setReviewsList] = useState([]);
    const [selectedAnalyticsMonth, setSelectedAnalyticsMonth] = useState('all');

    // Assistant Tracker state
    const [assignedAssistants, setAssignedAssistants] = useState([]);
    const [assistantActivityLogs, setAssistantActivityLogs] = useState([]);

    // Doctor Availability state
    const [isAvailable, setIsAvailable] = useState(profile?.is_available !== false);

    // Assign Patient to Assistant Modal State
    const [assigningAssistantAppt, setAssigningAssistantAppt] = useState(null);
    const [selectedAssistantId, setSelectedAssistantId] = useState('');
    const [submittingAssignAssistant, setSubmittingAssignAssistant] = useState(false);

    useEffect(() => {
        if (profile?.is_available !== undefined) {
            setIsAvailable(profile.is_available !== false);
        }
    }, [profile]);

    const handleToggleAvailability = async () => {
        const doctorId = realDoctorId || profile?.id;
        if (!doctorId) return;
        const nextStatus = !isAvailable;
        try {
            const res = await api.updateDoctorAvailability(doctorId, nextStatus);
            if (res.profile) {
                setIsAvailable(nextStatus);
                showToast(`Availability status updated: You are now ${nextStatus ? 'Available for consultations' : 'Marked as Unavailable (Out of Office)'}`, 'success');
            } else {
                showToast(res.error || 'Failed to update availability status', 'error');
            }
        } catch (err) {
            showToast('Error updating availability status', 'error');
        }
    };

    const handleAssignAssistantSubmit = async (e) => {
        e.preventDefault();
        if (!assigningAssistantAppt || !selectedAssistantId) {
            showToast('Please select an Assistant to assign.', 'warning');
            return;
        }

        if (assigningAssistantAppt.assistant_id === selectedAssistantId) {
            showToast('This patient is already assigned to this assistant.', 'warning');
            return;
        }

        setSubmittingAssignAssistant(true);
        try {
            const doctorId = realDoctorId || profile?.id;
            const res = await api.assignPatientToAssistant(assigningAssistantAppt.id, {
                assistant_id: selectedAssistantId,
                doctor_id: doctorId
            });

            if (res.error) {
                showToast(res.error, 'error');
            } else {
                showToast(res.message || 'Patient successfully assigned to assistant!', 'success');
                setAssigningAssistantAppt(null);
                setSelectedAssistantId('');
                loadDoctorData();
            }
        } catch (err) {
            showToast('Failed to assign patient to assistant', 'error');
        } finally {
            setSubmittingAssignAssistant(false);
        }
    };

    useEffect(() => {
        setView(activeTab);
    }, [activeTab]);

    const loadDoctorData = async () => {
        if (!profile?.email) return;
        setLoading(true);
        try {
            // Resolve the REAL DB profile id (the stored profile.id may be a hardcoded seed UUID
            // that doesn't match what's in appointments.doctor_id — always use the DB's actual id)
            let doctorId = realDoctorId;
            if (!doctorId) {
                const profileRes = await api.getProfileByEmail(profile.email);
                if (profileRes?.profile?.id) {
                    doctorId = profileRes.profile.id;
                    setRealDoctorId(doctorId);
                } else {
                    doctorId = profile.id; // fallback
                }
            }

            const res = await api.getDoctorAppointments(doctorId);
            if (res?.appointments) {
                setAppointments(res.appointments);
            }

            // Load Doctor Analytics & Reviews
            const analyticsRes = await api.getDoctorAnalytics(doctorId, selectedAnalyticsMonth);
            if (analyticsRes) {
                setAnalyticsData(analyticsRes);
            }

            const reviewsRes = await api.getDoctorReviews(doctorId);
            if (reviewsRes) {
                setReviewsSummary(reviewsRes.summary);
                setReviewsList(reviewsRes.reviews || []);
            }

            // Load Doctor Assistant activity logs
            const assistantRes = await api.getDoctorAssistantLogs(doctorId);
            if (assistantRes) {
                setAssignedAssistants(assistantRes.assistants || []);
                setAssistantActivityLogs(assistantRes.activityLogs || []);
            }
        } catch (err) {
            console.error('Error loading doctor data:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleMonthFilterChange = async (monthVal) => {
        setSelectedAnalyticsMonth(monthVal);
        if (!profile?.id) return;
        try {
            const analyticsRes = await api.getDoctorAnalytics(profile.id, monthVal);
            if (analyticsRes) {
                setAnalyticsData(analyticsRes);
            }
        } catch (err) {
            console.error('Error fetching analytics for month:', err);
        }
    };

    useEffect(() => {
        loadDoctorData();
    }, [profile]);

    const handleStartConsultation = async (appt) => {
        try {
            const res = await api.startConsultation(appt.id);
            if (res.appointment) {
                showToast(`Consultation started for ${appt.full_name}. Status is now Active.`, 'success');
                loadDoctorData();
            } else {
                showToast(res.error || 'Failed to start consultation', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Error starting consultation', 'error');
        }
    };

    const handleMarkAsDoneSubmit = async (e) => {
        e.preventDefault();
        if (!completingAppt) return;
        setIsSubmittingDone(true);
        try {
            const payload = {
                case_type: caseType,
                case_outcome: caseOutcome,
                clinical_notes: clinicalNotes.trim(),
                duration_minutes: parseInt(customDuration, 10) || 15
            };

            const res = await api.completeConsultation(completingAppt.id, payload);
            if (res.appointment) {
                showToast(`Patient ${completingAppt.full_name} marked as Done! Report recorded.`, 'success');
                setCompletingAppt(null);
                setClinicalNotes('');
                loadDoctorData();
            } else {
                showToast(res.error || 'Failed to complete consultation', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Error recording completed consultation', 'error');
        } finally {
            setIsSubmittingDone(false);
        }
    };

    // Assistant Removal state
    const [removingAssistant, setRemovingAssistant] = useState(null);
    const [isSubmittingRemove, setIsSubmittingRemove] = useState(false);

    const handleConfirmRemoveAssistant = async () => {
        const doctorId = realDoctorId || profile?.id;
        if (!doctorId || !removingAssistant) return;
        setIsSubmittingRemove(true);
        try {
            const res = await api.removeDoctorAssistant(doctorId, removingAssistant.id);
            if (res.message) {
                showToast(res.message, 'success');
                setRemovingAssistant(null);
                loadDoctorData();
            } else {
                showToast(res.error || 'Failed to remove assistant', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Error removing assistant', 'error');
        } finally {
            setIsSubmittingRemove(false);
        }
    };

    const filteredAppointments = appointments.filter((appt) => {
        const query = searchQuery.toLowerCase();
        return (
            (appt.full_name && appt.full_name.toLowerCase().includes(query)) ||
            (appt.service_type && appt.service_type.toLowerCase().includes(query)) ||
            (appt.appointment_date && appt.appointment_date.includes(query))
        );
    });

    return (
        <div className="space-y-6 font-sans">
            
            {/* Doctor Header Banner */}
            <div className="bg-[#103B29] text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#6FCF97]/20 text-[#6FCF97] rounded-full text-xs font-bold border border-[#6FCF97]/30">
                        <Stethoscope className="w-4 h-4" /> Allocated Doctor Portal
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                        Welcome, {profile?.full_name || 'Doctor'} 👋
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300">
                        Assigned Patient Queue (Max 9/day), Clinical Dossier Records, and Performance Analytics
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap">
                    <button
                        onClick={handleToggleAvailability}
                        className={`px-4 py-2 rounded-2xl text-xs font-black flex items-center gap-2 transition-all cursor-pointer shadow-md border ${
                            isAvailable 
                                ? 'bg-emerald-500/20 text-[#6FCF97] border-[#6FCF97]/40 hover:bg-emerald-500/30' 
                                : 'bg-red-500/20 text-red-300 border-red-400/40 hover:bg-red-500/30'
                        }`}
                        title="Click to toggle your availability for patient assignment by receptionists"
                    >
                        {isAvailable ? '🟢 Available for Patients' : '🔴 Unavailable (Out of Office)'}
                    </button>

                    <button
                        onClick={() => { setView('dashboard'); if (onNavigate) onNavigate('dashboard'); }}
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                            view === 'dashboard'
                                ? 'bg-[#6FCF97] text-[#103B29] shadow-xs'
                                : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                        }`}
                    >
                        Overview Queue
                    </button>
                    <button
                        onClick={() => { setView('consultations'); if (onNavigate) onNavigate('doctor-dashboard'); }}
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                            view === 'consultations'
                                ? 'bg-[#6FCF97] text-[#103B29] shadow-xs'
                                : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                        }`}
                    >
                        Assigned Patients ({appointments.length})
                    </button>
                    <button
                        onClick={() => setView('analytics')}
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                            view === 'analytics'
                                ? 'bg-[#6FCF97] text-[#103B29] shadow-xs'
                                : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                        }`}
                    >
                        Analytics & Reports 📊
                    </button>
                    <button
                        onClick={() => setView('assistant-tracker')}
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                            view === 'assistant-tracker'
                                ? 'bg-[#6FCF97] text-[#103B29] shadow-xs'
                                : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                        }`}
                    >
                        Assistant Tracker 🩺
                    </button>
                    <button
                        onClick={loadDoctorData}
                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20 transition-colors cursor-pointer"
                        title="Refresh List"
                    >
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* TAB 1: OVERVIEW DASHBOARD & LIVE QUEUE */}
            {view === 'dashboard' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 rounded-xl text-[#27AE60]">
                                <User className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-[11px] font-bold uppercase text-slate-400">Total Allocated Patients</span>
                                <div className="text-2xl font-black text-slate-900">{appointments.length}</div>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-[11px] font-bold uppercase text-slate-400">Active Consultations</span>
                                <div className="text-2xl font-black text-slate-900">
                                    {appointments.filter(a => a.status === 'active').length}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                            <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-[11px] font-bold uppercase text-slate-400">Completed (Done)</span>
                                <div className="text-2xl font-black text-slate-900">
                                    {appointments.filter(a => a.status === 'completed').length}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 space-y-6 shadow-xs">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                            <div>
                                <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-[#27AE60]" /> Upcoming Patient Consultations
                                </h2>
                                <p className="text-xs text-slate-500">Live queue of patients allocated to your desk</p>
                            </div>
                            <button
                                onClick={() => setView('consultations')}
                                className="px-3.5 py-1.5 bg-[#103B29] hover:bg-emerald-900 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                            >
                                View Full Queue ➔
                            </button>
                        </div>

                        {loading ? (
                            <div className="py-12 text-center text-slate-400 text-xs">Loading upcoming schedule...</div>
                        ) : appointments.length === 0 ? (
                            <div className="py-12 text-center text-slate-400 text-xs">No patients assigned to your schedule currently.</div>
                        ) : (
                            <div className="space-y-3">
                                {appointments.slice(0, 5).map((appt) => (
                                    <div key={appt.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-extrabold text-slate-900 text-sm">{appt.full_name}</span>
                                                <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                                                    appt.status === 'completed' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                                    appt.status === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse' :
                                                    appt.status === 'approved' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {appt.status === 'active' ? '🟢 Active' :
                                                     appt.status === 'completed' ? '✅ Completed (Done)' :
                                                     appt.status === 'approved' ? '⏳ Waiting for Doctor' : appt.status}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-500 flex items-center gap-3">
                                                <span>📍 {appt.location || 'Main Campus'}</span>
                                                <span>📅 {formatDate(appt.appointment_date)}</span>
                                                <span>⏰ {formatTime(appt.appointment_time)}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => setSelectedHistoryPatient(appt)}
                                                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-2xs"
                                            >
                                                <History className="w-3.5 h-3.5 text-blue-600" /> View History
                                            </button>

                                            <button
                                                onClick={() => setSelectedDossierAppt(appt)}
                                                className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-emerald-50 text-emerald-800 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
                                            >
                                                <FileText className="w-3.5 h-3.5 text-[#27AE60]" /> Patient Dossier
                                            </button>

                                            {appt.status === 'approved' && (
                                                <button
                                                    onClick={() => handleStartConsultation(appt)}
                                                    className="px-3 py-1.5 bg-[#103B29] hover:bg-emerald-900 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1"
                                                >
                                                    <Play className="w-3.5 h-3.5" /> Start
                                                </button>
                                            )}

                                            {appt.status === 'active' && (
                                                <button
                                                    onClick={() => setCompletingAppt(appt)}
                                                    className="px-3 py-1.5 bg-[#6FCF97] hover:bg-[#52c17d] text-slate-900 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                                                >
                                                    <CheckSquare className="w-3.5 h-3.5" /> Mark as Done
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: FULL CONSULTATIONS QUEUE */}
            {view === 'consultations' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 space-y-6 shadow-xs">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                        <div>
                            <h2 className="text-lg font-extrabold text-slate-900">Assigned Patient Queue</h2>
                            <p className="text-xs text-slate-500">Patients allocated to you by clinic administration (Max 9/day limit enforced)</p>
                        </div>

                        <div className="relative w-full sm:w-72">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                            <input
                                type="text"
                                placeholder="Search patient name, date..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#27AE60]"
                            />
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-12 text-center text-slate-400 text-xs">Loading assigned patient schedule...</div>
                    ) : filteredAppointments.length === 0 ? (
                        <div className="py-12 text-center text-slate-400 text-xs">No allocated patients found matching your search.</div>
                    ) : (
                        <div className="overflow-x-auto border border-slate-200/80 rounded-2xl">
                            <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200/80 text-slate-500 font-bold uppercase tracking-wider">
                                        <th className="p-3.5">Patient Name & Occupation</th>
                                        <th className="p-3.5">Service Requested</th>
                                        <th className="p-3.5">Scheduled Time</th>
                                        <th className="p-3.5">Live Status</th>
                                        <th className="p-3.5 text-right">Actions & Clinical Care</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {filteredAppointments.map((appt) => (
                                        <tr key={appt.id} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="p-3.5 font-bold text-slate-900">
                                                {appt.full_name}
                                                <span className="block text-[10px] text-emerald-700 font-medium">
                                                    {appt.occupation || 'Student'} {appt.student_id ? `• ID: ${appt.student_id}` : ''}
                                                </span>
                                            </td>
                                            <td className="p-3.5 font-medium text-slate-700">{appt.service_type}</td>
                                            <td className="p-3.5 font-semibold text-slate-900 whitespace-nowrap">
                                                <div>{formatDate(appt.appointment_date)}</div>
                                                <div className="text-[10px] text-emerald-700 font-semibold">{formatTime(appt.appointment_time)}</div>
                                            </td>
                                            <td className="p-3.5">
                                                <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] uppercase ${
                                                    appt.status === 'completed' ? 'bg-purple-100 text-purple-800 border border-purple-200' :
                                                    appt.status === 'active' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse' :
                                                    appt.status === 'approved' ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-700'
                                                }`}>
                                                    {appt.status === 'active' ? '🟢 Active Consultation' :
                                                     appt.status === 'completed' ? '✅ Completed (Done)' :
                                                     appt.status === 'approved' ? '⏳ Waiting for Doctor' : appt.status}
                                                </span>
                                            </td>
                                            <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                                                <button
                                                    onClick={() => setSelectedHistoryPatient(appt)}
                                                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-xl font-bold transition-colors cursor-pointer text-xs inline-flex items-center gap-1 shadow-2xs"
                                                >
                                                    <History className="w-3.5 h-3.5 text-blue-600" /> View History
                                                </button>

                                                <button
                                                    onClick={() => setSelectedDossierAppt(appt)}
                                                    className="px-3 py-1.5 bg-[#103B29] hover:bg-emerald-900 text-white rounded-xl font-bold transition-colors cursor-pointer text-xs flex items-center gap-1 inline-flex"
                                                >
                                                    <FileText className="w-3.5 h-3.5" /> Patient Dossier
                                                </button>

                                                {appt.assistant_id ? (
                                                    <span className="px-2.5 py-1 bg-blue-50 text-blue-900 border border-blue-200 rounded-xl font-bold text-xs inline-flex items-center gap-1">
                                                        🩺 {appt.assistant_name || 'Assistant Assigned'}
                                                    </span>
                                                ) : (
                                                    appt.status !== 'completed' && (
                                                        <button
                                                            onClick={() => { setAssigningAssistantAppt(appt); setSelectedAssistantId(''); }}
                                                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer inline-flex items-center gap-1 shadow-2xs"
                                                            title="Assign patient to a doctor assistant"
                                                        >
                                                            🩺 Assign Assistant
                                                        </button>
                                                    )
                                                )}

                                                {appt.status === 'approved' && (
                                                    <button
                                                        onClick={() => handleStartConsultation(appt)}
                                                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs cursor-pointer inline-flex items-center gap-1"
                                                    >
                                                        <Play className="w-3.5 h-3.5" /> Start
                                                    </button>
                                                )}

                                                {appt.status === 'active' && (
                                                    <button
                                                        onClick={() => setCompletingAppt(appt)}
                                                        className="px-3 py-1.5 bg-[#6FCF97] hover:bg-[#52c17d] text-slate-900 rounded-xl font-bold text-xs cursor-pointer inline-flex items-center gap-1 shadow-xs"
                                                    >
                                                        <CheckSquare className="w-3.5 h-3.5" /> Mark as Done
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {/* TAB 3: DOCTOR ANALYTICS & REPORTS */}
            {view === 'analytics' && (
                <DoctorAnalyticsChart
                    analytics={analyticsData}
                    reviewsSummary={reviewsSummary}
                    reviewsList={reviewsList}
                    selectedMonth={selectedAnalyticsMonth}
                    onMonthChange={handleMonthFilterChange}
                />
            )}

            {/* TAB 4: ASSISTANT WORK TRACKER */}
            {view === 'assistant-tracker' && (
                <div className="space-y-6">
                    {/* Assigned Assistants Card */}
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <User className="w-5 h-5 text-[#27AE60]" /> Assigned Doctor Assistants
                                </h3>
                                <p className="text-xs text-slate-500">Care assistants registered under your clinical supervision</p>
                            </div>
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-full border border-emerald-200">
                                {assignedAssistants.length} Active Assistant(s)
                            </span>
                        </div>

                        {assignedAssistants.length === 0 ? (
                            <div className="p-6 bg-slate-50 rounded-2xl text-center text-xs text-slate-500">
                                No doctor assistants are currently assigned to your profile. Contact the Super Admin to assign an assistant.
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {assignedAssistants.map((asst) => (
                                    <div key={asst.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between gap-3">
                                        <div className="space-y-1">
                                            <div className="font-bold text-slate-900 text-sm">{asst.full_name}</div>
                                            <div className="text-xs text-slate-500">{asst.email}</div>
                                            {asst.phone && <div className="text-[11px] text-slate-400">📞 {asst.phone}</div>}
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-[10px] font-extrabold uppercase rounded-full border border-blue-200">
                                                Assigned Assistant
                                            </span>
                                            <button
                                                onClick={() => setRemovingAssistant(asst)}
                                                className="px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl font-bold text-xs transition-colors cursor-pointer border border-red-200 flex items-center gap-1 shadow-2xs"
                                                title="Remove assistant from your supervision"
                                            >
                                                <UserX className="w-3.5 h-3.5" /> Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Real-time Activity Tracker Log */}
                    <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-sm space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <History className="w-5 h-5 text-[#27AE60]" /> Assistant Activity Tracker Feed
                                </h3>
                                <p className="text-xs text-slate-500">Live log of patient check-ins, preliminary vitals entries, and pre-assessments</p>
                            </div>
                        </div>

                        {assistantActivityLogs.length === 0 ? (
                            <div className="p-8 text-center text-xs text-slate-500">
                                No assistant activities recorded yet.
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {assistantActivityLogs.map((log) => (
                                    <div key={log.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200/70 flex items-start justify-between gap-4">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-bold text-slate-900 text-sm">{log.assistant_name || 'Assistant'}</span>
                                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded text-[10px] font-extrabold uppercase">
                                                    {log.action_type}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-700 font-medium">{log.description}</p>
                                            {log.patient_name && (
                                                <div className="text-[11px] text-slate-500">Patient: <strong className="text-slate-800">{log.patient_name}</strong></div>
                                            )}
                                        </div>
                                        <div className="text-[11px] text-slate-400 font-semibold whitespace-nowrap">
                                            {new Date(log.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Unified Patient Medical Dossier Modal */}
            <PatientDossierModal appt={selectedDossierAppt} onClose={() => setSelectedDossierAppt(null)} />

            {/* Patient Clinical History Modal */}
            <PatientHistoryModal patient={selectedHistoryPatient} onClose={() => setSelectedHistoryPatient(null)} />

            {/* Modal: Mark Consultation as Done & Record Clinical Findings */}
            {completingAppt && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 border border-slate-200 shadow-2xl font-sans">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                                <CheckSquare className="w-5 h-5 text-[#27AE60]" /> Mark Consultation as Done
                            </h4>
                            <button onClick={() => setCompletingAppt(null)} className="text-slate-400 font-bold p-1">✕</button>
                        </div>

                        <div className="p-3.5 bg-emerald-50 rounded-2xl text-xs space-y-1">
                            <div className="font-bold text-slate-900">Patient: {completingAppt.full_name}</div>
                            <div className="text-slate-700">Requested Service: {completingAppt.service_type}</div>
                        </div>

                        <form onSubmit={handleMarkAsDoneSubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Diagnosed Case Type</label>
                                <CustomSelect options={caseTypeOptions} value={caseType} onChange={setCaseType} />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Clinical Outcome & Action</label>
                                <CustomSelect options={caseOutcomeOptions} value={caseOutcome} onChange={setCaseOutcome} />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Doctor Prescription / Clinical Notes</label>
                                <textarea
                                    rows={3}
                                    placeholder="Enter diagnosis summary or optical prescription notes..."
                                    value={clinicalNotes}
                                    onChange={(e) => setClinicalNotes(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#27AE60] resize-none"
                                ></textarea>
                            </div>

                            <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-1">
                                <span className="text-[10px] font-black uppercase text-emerald-800 flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5 text-[#27AE60] animate-spin" /> Automatically Tracked Consultation Duration
                                </span>
                                <div className="text-xs font-black text-slate-900 flex items-center justify-between pt-0.5">
                                    <span>Live Time Tracked:</span>
                                    {completingAppt.consultation_start_time ? (
                                        <LiveConsultationTimer startTime={completingAppt.consultation_start_time} className="text-emerald-800 bg-white px-2.5 py-1 rounded-xl border border-emerald-200 shadow-2xs" />
                                    ) : (
                                        <span className="text-xs text-slate-600 font-bold bg-white px-2.5 py-1 rounded-xl border border-slate-200">⏱️ ~15 minutes</span>
                                    )}
                                </div>
                                <p className="text-[10px] text-slate-500 italic">Duration is automatically recorded from when you clicked "Start".</p>
                            </div>

                            <button
                                type="submit"
                                disabled={isSubmittingDone}
                                className="w-full py-3.5 bg-[#6FCF97] hover:bg-[#52c17d] text-slate-900 font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-xs flex items-center justify-center gap-2"
                            >
                                {isSubmittingDone ? (
                                    <span className="inline-block animate-spin border-2 border-slate-900 border-t-transparent rounded-full w-4 h-4"></span>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-4 h-4" /> Save Report & Mark Patient as Done
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Confirm Remove Assistant Modal ────────────────────────────── */}
            {removingAssistant && (
                <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 border border-slate-200 shadow-2xl">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-red-100 text-red-700 rounded-2xl">
                                <UserX className="w-6 h-6" />
                            </div>
                            <div>
                                <h4 className="font-extrabold text-slate-900 text-lg">Remove Doctor Assistant</h4>
                                <p className="text-xs text-slate-500 font-medium">Supervision Unlinking</p>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs text-slate-700 space-y-1.5">
                            <p>Are you sure you want to remove <strong className="text-slate-900 font-bold">{removingAssistant.full_name}</strong> from your clinical supervision?</p>
                            <p className="text-slate-500 text-[11px]">They will be unlinked from your dashboard profile but remain registered in the clinic directory.</p>
                        </div>

                        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setRemovingAssistant(null)}
                                className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer text-xs"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                disabled={isSubmittingRemove}
                                onClick={handleConfirmRemoveAssistant}
                                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl cursor-pointer transition-all shadow-md text-xs flex items-center gap-2"
                            >
                                <UserX className="w-4 h-4" />
                                {isSubmittingRemove ? 'Removing...' : 'Remove Assistant'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ── Assign Patient to Assistant Modal ────────────────────────────── */}
            {assigningAssistantAppt && (
                <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn font-sans">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 border border-slate-200 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div className="flex items-center gap-2">
                                <div className="p-2.5 bg-blue-100 text-blue-800 rounded-2xl">
                                    <UserCheck className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-extrabold text-slate-900 text-base">Assign Patient to Assistant</h4>
                                    <p className="text-xs text-slate-500 font-medium">Doctor Assistant Clinical Delegation</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200/80 text-xs space-y-1">
                            <div>Patient: <strong className="text-slate-900 font-bold">{assigningAssistantAppt.full_name}</strong></div>
                            <div>Service: <span className="font-medium text-slate-700">{assigningAssistantAppt.service_type}</span></div>
                            <div>Scheduled: <span className="font-medium text-slate-700">{formatDate(assigningAssistantAppt.appointment_date)} @ {formatTime(assigningAssistantAppt.appointment_time)}</span></div>
                        </div>

                        <form onSubmit={handleAssignAssistantSubmit} className="space-y-4 text-xs font-semibold">
                            <div>
                                <label className="block mb-1.5 text-slate-900 font-bold">Select Care Assistant under your Supervision</label>
                                {assignedAssistants.length === 0 ? (
                                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-xs">
                                        No doctor assistants are currently assigned to your profile. Please contact the Super Admin to register care assistants under your supervision.
                                    </div>
                                ) : (
                                    <select
                                        required
                                        value={selectedAssistantId}
                                        onChange={(e) => setSelectedAssistantId(e.target.value)}
                                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-blue-600 text-xs"
                                    >
                                        <option value="">-- Select Care Assistant --</option>
                                        {assignedAssistants.map((asst) => {
                                            const isAlreadyAssigned = assigningAssistantAppt.assistant_id === asst.id;
                                            return (
                                                <option key={asst.id} value={asst.id} disabled={isAlreadyAssigned}>
                                                    🩺 {asst.full_name} {isAlreadyAssigned ? '(Currently Assigned)' : ''}
                                                </option>
                                            );
                                        })}
                                    </select>
                                )}
                            </div>

                            <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setAssigningAssistantAppt(null)}
                                    className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submittingAssignAssistant || assignedAssistants.length === 0}
                                    className="px-6 py-2.5 bg-[#103B29] hover:bg-emerald-950 text-white font-bold rounded-xl cursor-pointer transition-all shadow-md"
                                >
                                    {submittingAssignAssistant ? 'Assigning...' : 'Confirm Assignment'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
