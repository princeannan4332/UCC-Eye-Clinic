import React, { useState, useEffect } from 'react';
import {
    UserCheck, Stethoscope, Clock, Calendar, CheckCircle2, AlertCircle,
    Search, RefreshCw, FileText, Activity, Eye, HeartPulse, Sparkles, Send,
    Play, CheckSquare, BarChart2, User, Phone, History, ChevronRight
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { api } from '../lib/api';
import { useToast } from '../components/Toast';
import PatientDossierModal from '../components/PatientDossierModal';
import CustomSelect from '../components/CustomSelect';

const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const clean = String(dateStr).split('T')[0];
    const parts = clean.split('-');
    if (parts.length !== 3) return dateStr;
    const [y, m, d] = parts;
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[parseInt(m, 10) - 1] || m} ${parseInt(d, 10)}, ${y}`;
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
    const mo = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${mo}-${d}`;
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

const statusColors = {
    pending:   'bg-slate-100 text-slate-700 border-slate-200',
    approved:  'bg-amber-100 text-amber-800 border-amber-300',
    active:    'bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse',
    completed: 'bg-purple-100 text-purple-800 border-purple-200',
    cancelled: 'bg-red-50 text-red-700 border-red-200',
    rescheduled: 'bg-blue-50 text-blue-700 border-blue-200',
};

const statusLabel = {
    pending:   '📋 Pending',
    approved:  '⏳ Scheduled',
    active:    '🟢 Active',
    completed: '✅ Completed',
    cancelled: '❌ Cancelled',
    rescheduled: '📅 Rescheduled',
};

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

export default function AssistantDashboard({ onNavigate }) {
    const { profile } = useAuth();
    const { showToast } = useToast();

    const [view, setView] = useState('dashboard'); // 'dashboard', 'consultations', 'activity'
    const [loading, setLoading] = useState(true);
    const [assistantData, setAssistantData] = useState(null);
    const [appointments, setAppointments] = useState([]);
    const [activityLogs, setActivityLogs] = useState([]);
    const [stats, setStats] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');

    // Pre-Exam Vitals Modal state
    const [selectedAppt, setSelectedAppt] = useState(null);
    const [savingVitals, setSavingVitals] = useState(false);
    const [vitalsForm, setVitalsForm] = useState({
        iop: '', visual_acuity: '', blood_pressure: '', pre_notes: ''
    });

    // Complete Consultation Modal state
    const [completingAppt, setCompletingAppt] = useState(null);
    const [caseType, setCaseType] = useState('Refraction & Visual Acuity Test');
    const [caseOutcome, setCaseOutcome] = useState('Capably Treated / Discharged');
    const [clinicalNotes, setClinicalNotes] = useState('');
    const [customDuration, setCustomDuration] = useState(15);
    const [isSubmittingDone, setIsSubmittingDone] = useState(false);

    // Patient Dossier
    const [dossierAppt, setDossierAppt] = useState(null);

    const todayStr = getTodayLocalStr();

    const loadAssistantDashboard = async () => {
        if (!profile?.id) return;
        setLoading(true);
        try {
            const [overviewRes, statsRes] = await Promise.all([
                api.getAssistantOverview(profile.id),
                api.getAssistantStats(profile.id),
            ]);
            if (overviewRes.assistant) {
                setAssistantData(overviewRes.assistant);
                setAppointments(overviewRes.appointments || []);
                setActivityLogs(overviewRes.activityLogs || []);
            }
            if (statsRes.stats) {
                setStats(statsRes.stats);
            }
        } catch (err) {
            console.error('Error loading assistant dashboard:', err);
            showToast('Failed to load assistant portal data', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAssistantDashboard();
    }, [profile?.id]);

    const todayAppointments = appointments.filter(a => String(a.appointment_date).split('T')[0] === todayStr);
    const filteredAppointments = appointments.filter(a =>
        (a.student_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.service_type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (a.status || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ── Check-In Patient ──────────────────────────────────────────────────────
    const handleCheckInPatient = async (appt) => {
        try {
            const res = await api.updateAppointmentStatus(appt.id, {
                status: 'approved',
                reschedule_reason: 'Patient checked in by Doctor Assistant'
            });
            if (res.error) { showToast(res.error, 'error'); return; }

            await api.logAssistantActivity({
                assistant_id: profile.id,
                assistant_name: profile.full_name,
                doctor_id: assistantData?.supervisor_doctor_id,
                patient_id: appt.student_id,
                appointment_id: appt.id,
                action_type: 'CHECK_IN_PATIENT',
                description: `Checked in patient ${appt.student_name || 'Patient'} for ${appt.service_type} (${appt.appointment_time})`
            });

            showToast(`Patient ${appt.student_name} checked in successfully!`, 'success');
            loadAssistantDashboard();
        } catch (err) {
            showToast('Failed to check in patient', 'error');
        }
    };

    // ── Start Consultation ────────────────────────────────────────────────────
    const handleStartConsultation = async (appt) => {
        try {
            const res = await api.startConsultation(appt.id);
            if (res.error) { showToast(res.error, 'error'); return; }

            await api.logAssistantActivity({
                assistant_id: profile.id,
                assistant_name: profile.full_name,
                doctor_id: assistantData?.supervisor_doctor_id,
                patient_id: appt.student_id,
                appointment_id: appt.id,
                action_type: 'START_CONSULTATION',
                description: `Started consultation for ${appt.student_name || 'Patient'} — ${appt.service_type}`
            });

            showToast(`Consultation started for ${appt.student_name}`, 'success');
            loadAssistantDashboard();
        } catch (err) {
            showToast('Failed to start consultation', 'error');
        }
    };

    // ── Open Complete Modal ───────────────────────────────────────────────────
    const openCompleteModal = (appt) => {
        setCompletingAppt(appt);
        setCaseType('Refraction & Visual Acuity Test');
        setCaseOutcome('Capably Treated / Discharged');
        setClinicalNotes('');
        setCustomDuration(15);
    };

    // ── Submit Complete Consultation ─────────────────────────────────────────
    const handleCompleteConsultation = async (e) => {
        e.preventDefault();
        if (!completingAppt) return;
        if (!clinicalNotes.trim()) {
            showToast('Please enter clinical notes before completing.', 'warning');
            return;
        }
        setIsSubmittingDone(true);
        try {
            const res = await api.completeConsultation(completingAppt.id, {
                case_type: caseType,
                case_outcome: caseOutcome,
                clinical_notes: clinicalNotes,
                duration_minutes: customDuration
            });
            if (res.error) { showToast(res.error, 'error'); return; }

            await api.logAssistantActivity({
                assistant_id: profile.id,
                assistant_name: profile.full_name,
                doctor_id: assistantData?.supervisor_doctor_id,
                patient_id: completingAppt.student_id,
                appointment_id: completingAppt.id,
                action_type: 'COMPLETE_CONSULTATION',
                description: `Completed consultation for ${completingAppt.student_name || 'Patient'} — ${caseType}. Outcome: ${caseOutcome}`
            });

            showToast('Consultation completed and patient record updated!', 'success');
            setCompletingAppt(null);
            loadAssistantDashboard();
        } catch (err) {
            showToast('Failed to complete consultation', 'error');
        } finally {
            setIsSubmittingDone(false);
        }
    };

    // ── Pre-Exam Vitals ───────────────────────────────────────────────────────
    const handleOpenVitalsModal = (appt) => {
        setSelectedAppt(appt);
        const existing = appt.pre_exam_vitals || {};
        setVitalsForm({
            iop: existing.iop || '',
            visual_acuity: existing.visual_acuity || '',
            blood_pressure: existing.blood_pressure || '',
            pre_notes: existing.pre_notes || ''
        });
    };

    const handleSaveVitals = async (e) => {
        e.preventDefault();
        if (!selectedAppt) return;
        setSavingVitals(true);
        try {
            const res = await api.updatePreExamVitals(selectedAppt.id, {
                assistant_id: profile.id,
                assistant_name: profile.full_name,
                doctor_id: assistantData?.supervisor_doctor_id,
                pre_exam_vitals: vitalsForm
            });
            if (res.error) {
                showToast(res.error, 'error');
            } else {
                showToast('Pre-exam vitals & notes recorded for Doctor review!', 'success');
                setSelectedAppt(null);
                loadAssistantDashboard();
            }
        } catch (err) {
            showToast('Failed to save vitals', 'error');
        } finally {
            setSavingVitals(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-8">
                <div className="flex flex-col items-center gap-3 text-slate-500">
                    <RefreshCw className="w-8 h-8 animate-spin text-[#27AE60]" />
                    <p className="text-sm font-semibold">Loading Assistant Portal...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 font-sans pb-12">

            {/* ── Header Banner ─────────────────────────────────────────── */}
            <div className="bg-gradient-to-r from-[#103B29] via-emerald-950 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl border border-emerald-900">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-[#6FCF97] text-xs font-extrabold uppercase tracking-wider">
                            <UserCheck className="w-4 h-4 text-[#6FCF97]" />
                            Doctor Assistant Portal
                        </div>
                        <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
                            Assitant Dashboard
                        </h1>
                        <p className="text-slate-300 text-xs sm:text-sm">
                            Assisting <strong className="text-white font-bold">{assistantData?.supervisor_name || 'Assigned Specialist'}</strong> at {assistantData?.assigned_location || 'Main Campus'}.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            onClick={loadAssistantDashboard}
                            className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-bold transition-colors cursor-pointer border border-white/20 flex items-center gap-2"
                        >
                            <RefreshCw className="w-4 h-4" /> Refresh
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Tab Nav ───────────────────────────────────────────────── */}
            <div className="flex items-center gap-2 flex-wrap">
                {[
                    { id: 'dashboard', label: 'Overview', icon: <Activity className="w-3.5 h-3.5" /> },
                    { id: 'consultations', label: 'All Appointments', icon: <Calendar className="w-3.5 h-3.5" /> },
                    { id: 'activity', label: 'Activity Log', icon: <History className="w-3.5 h-3.5" /> },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setView(tab.id)}
                        className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all cursor-pointer ${
                            view === tab.id ? 'bg-[#103B29] text-white shadow' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                    >
                        {tab.icon} {tab.label}
                    </button>
                ))}
            </div>

            {/* ── OVERVIEW TAB ──────────────────────────────────────────── */}
            {view === 'dashboard' && (
                <div className="space-y-6">

                    {/* Stats Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                        {[
                            { label: "Today's Total", value: stats?.today_total ?? '-', icon: <Calendar className="w-5 h-5" />, color: 'bg-slate-50 border-slate-200 text-slate-800' },
                            { label: 'Waiting / Scheduled', value: (parseInt(stats?.today_pending || 0) + parseInt(stats?.today_approved || 0)), icon: <Clock className="w-5 h-5 text-amber-500" />, color: 'bg-amber-50 border-amber-200 text-amber-800' },
                            { label: 'Active Now', value: stats?.today_active ?? '-', icon: <Activity className="w-5 h-5 text-emerald-600" />, color: 'bg-emerald-50 border-emerald-200 text-emerald-800' },
                            { label: 'Completed Today', value: stats?.today_completed ?? '-', icon: <CheckCircle2 className="w-5 h-5 text-purple-600" />, color: 'bg-purple-50 border-purple-200 text-purple-800' },
                        ].map((s, i) => (
                            <div key={i} className={`p-5 rounded-2xl border ${s.color} flex flex-col gap-2`}>
                                {s.icon}
                                <div className="text-3xl font-black">{s.value}</div>
                                <div className="text-xs font-bold opacity-70">{s.label}</div>
                            </div>
                        ))}
                    </div>

                    {/* Supervisor Doctor Card */}
                    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#103B29] flex items-center justify-center font-bold">
                                <Stethoscope className="w-6 h-6" />
                            </div>
                            <div>
                                <div className="text-xs font-bold text-slate-500 uppercase">Supervising Specialist</div>
                                <div className="text-lg font-black text-slate-900">{assistantData?.supervisor_name || 'Not Assigned'}</div>
                                <div className="text-xs text-slate-600 font-medium">{assistantData?.supervisor_email} • {assistantData?.assigned_location || 'Main Campus'}</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="px-3.5 py-1.5 bg-emerald-50 text-[#27AE60] text-xs font-bold rounded-xl border border-emerald-200">
                                {appointments.length} Total Appointments
                            </span>
                        </div>
                    </div>

                    {/* Assigned Patient Queue */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                        <div className="border-b border-slate-100 pb-3 flex justify-between items-center flex-wrap gap-2">
                            <div>
                                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-[#27AE60]" />
                                    Assigned Patient Queue
                                    <span className="ml-1 px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold rounded-full">{appointments.length}</span>
                                </h2>
                                <p className="text-xs text-slate-500 mt-0.5">Manage consultations, record vitals and complete cases assigned to you.</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            {appointments.length === 0 ? (
                                <div className="py-8 text-center text-slate-400 text-xs font-semibold">No appointments assigned to your queue yet.</div>
                            ) : (
                                appointments.map(appt => (
                                    <AppointmentCard
                                        key={appt.id}
                                        appt={appt}
                                        assistantData={assistantData}
                                        onCheckIn={handleCheckInPatient}
                                        onStart={handleStartConsultation}
                                        onComplete={openCompleteModal}
                                        onVitals={handleOpenVitalsModal}
                                        onDossier={setDossierAppt}
                                    />
                                ))
                            )}
                        </div>
                    </div>

                    {/* Recent Activity */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-3">
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                            <FileText className="w-4 h-4 text-slate-500" /> Recent Activity (visible to Doctor)
                        </h3>
                        {activityLogs.slice(0, 5).length === 0 ? (
                            <p className="text-xs text-slate-400">No activity recorded yet today.</p>
                        ) : (
                            activityLogs.slice(0, 5).map((log) => (
                                <div key={log.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-start gap-3 text-xs">
                                    <CheckCircle2 className="w-4 h-4 text-[#27AE60] flex-shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-bold text-slate-900">{log.description}</div>
                                        <div className="text-[10px] text-slate-400 mt-0.5">{new Date(log.created_at).toLocaleString()}</div>
                                    </div>
                                </div>
                            ))
                        )}
                        {activityLogs.length > 5 && (
                            <button onClick={() => setView('activity')} className="text-xs text-emerald-700 font-bold flex items-center gap-1 hover:underline cursor-pointer">
                                View all {activityLogs.length} activities <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* ── CONSULTATIONS TAB ─────────────────────────────────────── */}
            {view === 'consultations' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-[#27AE60]" />
                                All Appointments
                            </h2>
                            <p className="text-xs text-slate-500">Manage all upcoming consultations assigned to you or your supervising doctor.</p>
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                            <input
                                type="text"
                                placeholder="Search patient or service..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#6FCF97]"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        {filteredAppointments.length === 0 ? (
                            <div className="p-8 text-center text-slate-400 text-xs font-semibold">No appointments found.</div>
                        ) : (
                            filteredAppointments.map(appt => (
                                <AppointmentCard
                                    key={appt.id}
                                    appt={appt}
                                    assistantData={assistantData}
                                    onCheckIn={handleCheckInPatient}
                                    onStart={handleStartConsultation}
                                    onComplete={openCompleteModal}
                                    onVitals={handleOpenVitalsModal}
                                    onDossier={setDossierAppt}
                                />
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ── ACTIVITY LOG TAB ──────────────────────────────────────── */}
            {view === 'activity' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                    <h3 className="text-base font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                        <History className="w-4 h-4 text-slate-500" />
                        Your Full Activity Log
                        <span className="text-xs text-slate-400 font-normal ml-1">(Tracked by supervising doctor)</span>
                    </h3>
                    {activityLogs.length === 0 ? (
                        <p className="text-xs text-slate-400 py-6 text-center">No assistant activity recorded yet.</p>
                    ) : (
                        activityLogs.map((log) => (
                            <div key={log.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/60 flex items-start gap-3 text-xs">
                                <CheckCircle2 className="w-4 h-4 text-[#27AE60] flex-shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <div className="font-bold text-slate-900">{log.description}</div>
                                    {log.patient_name && <div className="text-[10px] text-slate-500 mt-0.5">Patient: {log.patient_name} {log.service_type ? `• ${log.service_type}` : ''}</div>}
                                    <div className="text-[10px] text-slate-400 mt-0.5">{new Date(log.created_at).toLocaleString()}</div>
                                </div>
                                <span className="text-[9px] font-bold uppercase px-2 py-0.5 rounded-full bg-slate-200 text-slate-600">{log.action_type?.replace(/_/g, ' ')}</span>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* ── Pre-Exam Vitals Modal ─────────────────────────────────── */}
            {selectedAppt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-slate-200 space-y-5">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Pre-Exam Vitals & Triage</h3>
                                <p className="text-xs text-slate-500">Patient: <strong className="text-slate-800">{selectedAppt.student_name}</strong></p>
                            </div>
                            <button onClick={() => setSelectedAppt(null)} className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer">✕</button>
                        </div>

                        <form onSubmit={handleSaveVitals} className="space-y-4 text-xs font-semibold text-slate-700">
                            <div>
                                <label className="block mb-1 text-slate-900">Intraocular Pressure (IOP - mmHg)</label>
                                <input type="text" placeholder="e.g. 14 mmHg (RE) / 15 mmHg (LE)" value={vitalsForm.iop}
                                    onChange={(e) => setVitalsForm({ ...vitalsForm, iop: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-[#6FCF97]" />
                            </div>
                            <div>
                                <label className="block mb-1 text-slate-900">Visual Acuity (VA)</label>
                                <input type="text" placeholder="e.g. 6/6 (RE) / 6/9 (LE)" value={vitalsForm.visual_acuity}
                                    onChange={(e) => setVitalsForm({ ...vitalsForm, visual_acuity: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-[#6FCF97]" />
                            </div>
                            <div>
                                <label className="block mb-1 text-slate-900">Blood Pressure (Optional)</label>
                                <input type="text" placeholder="e.g. 120/80 mmHg" value={vitalsForm.blood_pressure}
                                    onChange={(e) => setVitalsForm({ ...vitalsForm, blood_pressure: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-[#6FCF97]" />
                            </div>
                            <div>
                                <label className="block mb-1 text-slate-900">Pre-Assessment Notes for Doctor</label>
                                <textarea rows={3} placeholder="Add pre-screening notes or patient chief complaints..." value={vitalsForm.pre_notes}
                                    onChange={(e) => setVitalsForm({ ...vitalsForm, pre_notes: e.target.value })}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-[#6FCF97] resize-none" />
                            </div>
                            <div className="pt-2 flex justify-end gap-3">
                                <button type="button" onClick={() => setSelectedAppt(null)}
                                    className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer">
                                    Cancel
                                </button>
                                <button type="submit" disabled={savingVitals}
                                    className="px-6 py-2.5 bg-[#103B29] hover:bg-emerald-950 text-white font-bold rounded-xl cursor-pointer transition-all shadow-md flex items-center gap-2">
                                    <Send className="w-4 h-4 text-[#6FCF97]" /> {savingVitals ? 'Saving...' : 'Save & Notify Doctor'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Complete Consultation Modal ───────────────────────────── */}
            {completingAppt && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
                    <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-slate-200 space-y-5 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <div>
                                <h3 className="text-lg font-bold text-slate-900">Complete Consultation</h3>
                                <p className="text-xs text-slate-500">Patient: <strong className="text-slate-800">{completingAppt.student_name}</strong> • {completingAppt.service_type}</p>
                            </div>
                            <button onClick={() => setCompletingAppt(null)} className="text-slate-400 hover:text-slate-700 text-xl font-bold cursor-pointer">✕</button>
                        </div>

                        <form onSubmit={handleCompleteConsultation} className="space-y-4 text-xs font-semibold text-slate-700">
                            <div>
                                <label className="block mb-1 text-slate-900">Case / Diagnosis Type</label>
                                <CustomSelect options={caseTypeOptions} value={caseType} onChange={setCaseType} />
                            </div>
                            <div>
                                <label className="block mb-1 text-slate-900">Clinical Outcome</label>
                                <CustomSelect options={caseOutcomeOptions} value={caseOutcome} onChange={setCaseOutcome} />
                            </div>
                            <div>
                                <label className="block mb-1 text-slate-900">Clinical Notes (Required)</label>
                                <textarea rows={4} required placeholder="Enter full clinical notes, findings, and any prescriptions issued..."
                                    value={clinicalNotes} onChange={(e) => setClinicalNotes(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-[#6FCF97] resize-none" />
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
                            <div className="pt-2 flex justify-end gap-3 border-t border-slate-100">
                                <button type="button" onClick={() => setCompletingAppt(null)}
                                    className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 cursor-pointer">
                                    Cancel
                                </button>
                                <button type="submit" disabled={isSubmittingDone}
                                    className="px-6 py-2.5 bg-[#103B29] hover:bg-emerald-950 text-white font-bold rounded-xl cursor-pointer transition-all shadow-md flex items-center gap-2">
                                    <CheckSquare className="w-4 h-4 text-[#6FCF97]" />
                                    {isSubmittingDone ? 'Completing...' : 'Mark as Complete'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ── Patient Dossier Modal ─────────────────────────────────── */}
            {dossierAppt && (
                <PatientDossierModal
                    appt={dossierAppt}
                    onClose={() => setDossierAppt(null)}
                />
            )}

        </div>
    );
}

// ── Appointment Card Sub-Component ──────────────────────────────────────────
function AppointmentCard({ appt, assistantData, onCheckIn, onStart, onComplete, onVitals, onDossier }) {
    const statusBadge = statusColors[appt.status] || 'bg-slate-100 text-slate-600 border-slate-200';
    const label = statusLabel[appt.status] || appt.status;

    return (
        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200/80 hover:border-emerald-200 hover:shadow-sm transition-all space-y-3">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-black text-slate-900 text-base">{appt.student_name || 'Patient'}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${statusBadge}`}>
                            {label}
                        </span>
                        {appt.pre_exam_vitals && (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                                ✓ Vitals Recorded
                            </span>
                        )}
                    </div>
                    <div className="text-xs text-slate-700 font-semibold">{appt.service_type}</div>
                    <div className="text-xs text-slate-500">
                        🗓️ {formatDate(appt.appointment_date)} at {formatTime(appt.appointment_time)} • {appt.location}
                    </div>
                    {appt.status === 'active' && appt.consultation_start_time && (
                        <div className="pt-1">
                            <LiveConsultationTimer startTime={appt.consultation_start_time} className="text-xs text-emerald-900 bg-emerald-100/80 px-2.5 py-1 rounded-xl border border-emerald-200" />
                        </div>
                    )}
                    {appt.symptom_notes && (
                        <p className="text-xs text-slate-600 italic bg-white p-2.5 rounded-xl border border-slate-200/60 max-w-xl">
                            "{appt.symptom_notes}"
                        </p>
                    )}
                    {appt.pre_exam_vitals && (
                        <div className="flex flex-wrap gap-2 text-[11px] font-bold pt-1">
                            <span className="bg-emerald-100 text-emerald-900 px-2.5 py-1 rounded-lg">👁️ IOP: {appt.pre_exam_vitals.iop || 'N/A'}</span>
                            <span className="bg-blue-100 text-blue-900 px-2.5 py-1 rounded-lg">👓 VA: {appt.pre_exam_vitals.visual_acuity || 'N/A'}</span>
                        </div>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    {/* Dossier always available */}
                    <button
                        onClick={() => onDossier(appt)}
                        className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-[11px] font-bold cursor-pointer transition-colors"
                    >
                        📋 Dossier
                    </button>

                    {/* Vitals */}
                    {(appt.status === 'pending' || appt.status === 'approved') && (
                        <button
                            onClick={() => onVitals(appt)}
                            className="px-3 py-2 bg-[#103B29] hover:bg-emerald-950 text-white rounded-xl text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1.5"
                        >
                            <Activity className="w-3 h-3 text-[#6FCF97]" /> Record Vitals
                        </button>
                    )}

                    {/* Check-In */}
                    {appt.status === 'pending' && (
                        <button
                            onClick={() => onCheckIn(appt)}
                            className="px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-[11px] font-bold cursor-pointer transition-colors"
                        >
                            Check-In
                        </button>
                    )}

                    {/* Start Consultation */}
                    {appt.status === 'approved' && (
                        <button
                            onClick={() => onStart(appt)}
                            className="px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1.5"
                        >
                            <Play className="w-3 h-3" /> Start
                        </button>
                    )}

                    {/* Complete Consultation */}
                    {appt.status === 'active' && (
                        <button
                            onClick={() => onComplete(appt)}
                            className="px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1.5"
                        >
                            <CheckSquare className="w-3 h-3" /> Complete
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
