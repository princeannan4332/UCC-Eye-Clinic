import React, { useState, useEffect, useRef } from 'react';
import { Calendar, Clock, FileText, CheckCircle2, AlertCircle, RefreshCw, Eye, Sparkles, ChevronRight, Activity, MapPin, Star, ThumbsUp, X } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import CustomSelect from '../components/CustomSelect';
import { useToast } from '../components/Toast';

const parseLocalDate = (dateStr) => {
    if (!dateStr) return new Date();
    const clean = String(dateStr).split('T')[0];
    const parts = clean.split('-');
    if (parts.length !== 3) return new Date(dateStr);
    const [y, m, d] = parts.map(n => parseInt(n, 10));
    return new Date(y, m - 1, d);
};

const getTodayLocalStr = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, '0');
    const d = String(now.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
};

const getNowTimeStr = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    return `${h}:${m}:00`;
};

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

const locationOptions = [
    { value: 'Main Campus', label: 'Main Campus (Health Services Center)' },
    { value: 'Old Site', label: 'Old Site Clinic Annex' }
];

export default function StudentDashboard({ activeTab = 'dashboard', onNavigate }) {
    const { profile } = useAuth();
    const { showToast } = useToast();
    const [view, setView] = useState(activeTab); // 'dashboard', 'booking', or 'track'
    const [statusFilter, setStatusFilter] = useState('all');

    useEffect(() => {
        if (profile && profile.role === 'student' && !profile.onboarding_completed) {
            if (onNavigate) onNavigate('onboarding');
        }
    }, [profile]);

    useEffect(() => {
        setView(activeTab);
    }, [activeTab]);

    // Booking state
    const [selectedLocation, setSelectedLocation] = useState('Main Campus');
    const [capacitySlots, setCapacitySlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [selectedDate, setSelectedDate] = useState('');

    const selectedDateRef = useRef(selectedDate);
    selectedDateRef.current = selectedDate;

    const selectedSlotRef = useRef(selectedSlot);
    selectedSlotRef.current = selectedSlot;

    const [serviceType, setServiceType] = useState('General Eye Examination');
    
    // Fillable Symptoms State
    const [primaryComplaint, setPrimaryComplaint] = useState('Blurry Vision (Reading or Distance)');
    const [duration, setDuration] = useState('1 - 2 Weeks');
    const [severity, setSeverity] = useState('Moderate');
    const [additionalNotes, setAdditionalNotes] = useState('');

    const [loading, setLoading] = useState(true);
    const [bookingSuccess, setBookingSuccess] = useState(null);
    const [submitting, setSubmitting] = useState(false);

    // Appointments tracking state
    const [myAppointments, setMyAppointments] = useState([]);

    // Cancel modal state
    const [cancellingAppt, setCancellingAppt] = useState(null);
    const [cancelReason, setCancelReason] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);

    // Review & Star Rating Modal State
    const [reviewingAppt, setReviewingAppt] = useState(null);
    const [starRating, setStarRating] = useState(5);
    const [reviewComment, setReviewComment] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewedAppts, setReviewedAppts] = useState({});

    // Notifications state
    const [notifications, setNotifications] = useState([]);

    const handleMarkNotificationRead = async (notifId) => {
        try {
            await api.markNotificationRead(notifId);
            setNotifications(prev => prev.filter(n => n.id !== notifId));
            showToast('Notification dismissed.', 'success');
        } catch (e) {
            console.error('Error marking notification read:', e);
        }
    };

    const handleCancelAppointment = async () => {
        if (!cancellingAppt || !profile?.id) return;
        setIsCancelling(true);
        try {
            const res = await api.cancelAppointment(cancellingAppt.id, profile.id, cancelReason);
            if (res.error) {
                showToast(res.error, 'error');
            } else {
                showToast('Appointment cancelled successfully! The slot has been freed.', 'success');
                setCancellingAppt(null);
                setCancelReason('');
                fetchSlotsAndAppointments();
            }
        } catch (e) {
            console.error(e);
            showToast('Failed to cancel appointment.', 'error');
        } finally {
            setIsCancelling(false);
        }
    };

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        if (!reviewingAppt || !profile?.id) return;
        setSubmittingReview(true);
        try {
            const payload = {
                appointment_id: reviewingAppt.id,
                patient_id: profile.id,
                doctor_id: reviewingAppt.doctor_id,
                rating: starRating,
                comment: reviewComment.trim()
            };

            const res = await api.submitReview(payload);
            if (res.review) {
                showToast('Thank you! Your doctor rating & review has been submitted.', 'success');
                setReviewedAppts(prev => ({ ...prev, [reviewingAppt.id]: true }));
                setReviewingAppt(null);
                setStarRating(5);
                setReviewComment('');
            } else {
                showToast(res.error || 'Failed to submit review', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Error submitting review', 'error');
        } finally {
            setSubmittingReview(false);
        }
    };

    const serviceOptions = [
        { value: 'General Eye Examination', label: 'General Eye Examination' },
        { value: 'Refraction & Visual Acuity Test', label: 'Refraction & Visual Acuity Test' },
        { value: 'Glaucoma Screening & IOP', label: 'Glaucoma Screening & IOP' },
        { value: 'Frame & Lens Fitting', label: 'Frame & Lens Fitting' },
        { value: 'Contact Lens Consultation', label: 'Contact Lens Consultation' },
        { value: 'Red Eye / Infection Evaluation', label: 'Red Eye / Infection Evaluation' }
    ];

    const complaintOptions = [
        { value: 'Blurry Vision (Reading or Distance)', label: 'Blurry Vision (Reading or Distance)' },
        { value: 'Eye Strain & Digital Fatigue', label: 'Eye Strain & Digital Fatigue' },
        { value: 'Itching, Redness & Discomfort', label: 'Itching, Redness & Discomfort' },
        { value: 'Frequent Headaches when Reading', label: 'Frequent Headaches when Reading' },
        { value: 'Glaucoma Check / High IOP History', label: 'Glaucoma Check / High IOP History' },
        { value: 'Double Vision / Light Sensitivity', label: 'Double Vision / Light Sensitivity' },
        { value: 'Red Eye / Infection Evaluation', label: 'Red Eye / Infection Evaluation' },
        { value: 'Other Eye Complaint', label: 'Other Eye Complaint' }
    ];

    const durationOptions = ['< 3 Days', '1 - 2 Weeks', '3 - 4 Weeks', '> 1 Month'];
    const severityOptions = ['Mild', 'Moderate', 'Severe'];

    const fetchSlotsAndAppointments = async (silent = false) => {
        if (!silent) setLoading(true);
        try {
            const capRes = await api.getCapacity(selectedLocation);
            if (capRes.capacity) {
                const todayStr = getTodayLocalStr();
                const nowTimeStr = getNowTimeStr();
                const validSlots = capRes.capacity.filter(s => {
                    const cleanDate = String(s.slot_date).split('T')[0];
                    if (cleanDate < todayStr) return false;
                    if (cleanDate === todayStr && s.end_time) {
                        if (String(s.end_time).slice(0, 5) <= nowTimeStr.slice(0, 5)) {
                            return false;
                        }
                    }
                    return true;
                });
                setCapacitySlots(validSlots);
                const dates = Array.from(new Set(validSlots.map(s => String(s.slot_date).split('T')[0]))).sort();
                const currentSelDate = selectedDateRef.current;
                if (dates.length > 0 && (!currentSelDate || !dates.includes(currentSelDate))) {
                    setSelectedDate(dates[0]);
                }

                if (selectedSlotRef.current) {
                    const match = validSlots.find(s => s.id === selectedSlotRef.current.id);
                    if (!match || match.slot_date !== selectedSlotRef.current.slot_date || match.start_time !== selectedSlotRef.current.start_time) {
                        setSelectedSlot(null);
                        showToast('The selected time slot was updated or removed by administration. Please select another slot.', 'warning');
                    }
                }
            }

            if (profile?.id) {
                const apptRes = await api.getStudentAppointments(profile.id);
                if (apptRes.appointments) {
                    setMyAppointments(apptRes.appointments);

                    // Check which completed appointments already have reviews
                    apptRes.appointments.forEach(async (a) => {
                        if (a.status === 'completed') {
                            const revRes = await api.getAppointmentReview(a.id);
                            if (revRes?.review) {
                                setReviewedAppts(prev => ({ ...prev, [a.id]: true }));
                            }
                        }
                    });
                }

                const notifRes = await api.getNotifications(profile.id);
                if (notifRes?.notifications) {
                    setNotifications(notifRes.notifications.filter(n => !n.is_read));
                }
            }
        } catch (err) {
            console.error('Error loading patient dashboard data:', err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    useEffect(() => {
        fetchSlotsAndAppointments();
        const interval = setInterval(() => {
            fetchSlotsAndAppointments(true);
        }, 10000);
        return () => clearInterval(interval);
    }, [profile, selectedLocation]);

    const todayStr = getTodayLocalStr();
    const nowTimeStr = getNowTimeStr();
    const validPatientSlots = capacitySlots.filter(s => {
        const cleanDate = String(s.slot_date).split('T')[0];
        if (cleanDate < todayStr) return false;
        if (cleanDate === todayStr && s.end_time) {
            if (String(s.end_time).slice(0, 5) <= nowTimeStr.slice(0, 5)) return false;
        }
        return true;
    });
    const uniqueDates = Array.from(new Set(validPatientSlots.map(s => String(s.slot_date).split('T')[0]))).sort();

    const handleBookSubmit = async (e) => {
        e.preventDefault();
        if (!selectedSlot) {
            showToast('Please select an available time slot from the schedule.', 'warning');
            return;
        }

        const structuredSymptoms = `Complaint: ${primaryComplaint} | Duration: ${duration} | Severity: ${severity}${additionalNotes.trim() ? ` | Notes: ${additionalNotes.trim()}` : ''}`;

        setSubmitting(true);
        try {
            const payload = {
                student_id: profile.id,
                capacity_id: selectedSlot.id,
                appointment_date: selectedSlot.slot_date,
                appointment_time: selectedSlot.start_time,
                location: selectedLocation,
                service_type: serviceType,
                symptom_notes: structuredSymptoms
            };

            const res = await api.bookAppointment(payload);
            if (res.appointment) {
                showToast('Appointment booked successfully!', 'success');
                setBookingSuccess(res.appointment);
                setSelectedSlot(null);
                setAdditionalNotes('');
                fetchSlotsAndAppointments();
            } else {
                showToast(res.error || 'Failed to book appointment slot.', 'error');
            }
        } catch (err) {
            console.error(err);
            showToast('Error booking appointment.', 'error');
        } finally {
            setSubmitting(false);
        }
    };

    const filteredAppointments = myAppointments.filter(a => {
        if (statusFilter === 'all') return true;
        return a.status === statusFilter;
    });

    return (
        <div className="space-y-6 font-sans">
            
            {/* Header Banner */}
            <div className="bg-[#103B29] text-white rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#6FCF97]/20 text-[#6FCF97] rounded-full text-xs font-bold border border-[#6FCF97]/30">
                        <Eye className="w-4 h-4" /> Patient Care Portal
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                        Welcome back, {profile?.full_name || 'Patient'} 👋
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300">
                        UCC Eye Clinic — Book appointments, track consultation status, and rate your care
                    </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                    <button
                        onClick={() => { setView('dashboard'); if (onNavigate) onNavigate('dashboard'); }}
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                            view === 'dashboard'
                                ? 'bg-[#6FCF97] text-[#103B29] shadow-xs'
                                : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                        }`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => { setView('booking'); if (onNavigate) onNavigate('student-booking'); }}
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                            view === 'booking'
                                ? 'bg-[#6FCF97] text-[#103B29] shadow-xs'
                                : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                        }`}
                    >
                        Book Appointment
                    </button>
                    <button
                        onClick={() => { setView('track'); if (onNavigate) onNavigate('student-track'); }}
                        className={`px-3.5 py-2 rounded-xl font-bold text-xs transition-colors cursor-pointer ${
                            view === 'track'
                                ? 'bg-[#6FCF97] text-[#103B29] shadow-xs'
                                : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                        }`}
                    >
                        My Appointments ({myAppointments.length})
                    </button>
                </div>
            </div>

            {/* PATIENT NOTIFICATIONS ALERT CENTER */}
            {notifications.length > 0 && (
                <div className="space-y-3">
                    {notifications.map((notif) => (
                        <div 
                            key={notif.id} 
                            className="p-4 bg-amber-50 border border-amber-300 rounded-2xl flex items-start justify-between gap-4 shadow-sm"
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-2 bg-amber-100 rounded-xl text-amber-700 mt-0.5">
                                    <AlertCircle className="w-5 h-5" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="font-extrabold text-xs text-amber-900 uppercase tracking-wider flex items-center gap-2">
                                        {notif.title}
                                    </h4>
                                    <p className="text-xs font-semibold text-slate-800 leading-relaxed">
                                        {notif.message}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleMarkNotificationRead(notif.id)}
                                className="px-3 py-1.5 bg-white border border-amber-200 hover:bg-amber-100 text-amber-800 font-bold rounded-xl text-xs transition-colors cursor-pointer whitespace-nowrap shadow-2xs"
                            >
                                Dismiss ✓
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {/* TAB 1: OVERVIEW DASHBOARD */}
            {view === 'dashboard' && (
                <div className="space-y-6">
                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                            <div className="p-3 bg-emerald-50 rounded-xl text-[#27AE60]">
                                <Calendar className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-[11px] font-bold uppercase text-slate-400">Total Bookings</span>
                                <div className="text-2xl font-black text-slate-900">{myAppointments.length}</div>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                            <div className="p-3 bg-blue-50 rounded-xl text-blue-600">
                                <Clock className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-[11px] font-bold uppercase text-slate-400">Upcoming Appointments</span>
                                <div className="text-2xl font-black text-slate-900">
                                    {myAppointments.filter(a => a.status === 'approved' || a.status === 'pending' || a.status === 'active').length}
                                </div>
                            </div>
                        </div>

                        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                            <div className="p-3 bg-purple-50 rounded-xl text-purple-600">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div>
                                <span className="text-[11px] font-bold uppercase text-slate-400">Completed Consultations</span>
                                <div className="text-2xl font-black text-slate-900">
                                    {myAppointments.filter(a => a.status === 'completed').length}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions / Recent Bookings */}
                    <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                                <Activity className="w-4 h-4 text-[#27AE60]" /> My Recent Eye Care Consultations
                            </h2>
                            <button
                                onClick={() => { setView('booking'); if (onNavigate) onNavigate('student-booking'); }}
                                className="px-3.5 py-1.5 bg-[#103B29] hover:bg-emerald-900 text-white rounded-xl font-bold text-xs transition-colors cursor-pointer"
                            >
                                + Book New Appointment
                            </button>
                        </div>

                        {loading ? (
                            <div className="py-12 flex flex-col items-center justify-center space-y-2 text-xs text-slate-500">
                                <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                                <span className="font-semibold">Loading your bookings...</span>
                            </div>
                        ) : myAppointments.length === 0 ? (
                            <div className="py-12 text-center text-xs text-slate-400 space-y-2">
                                <p>You haven't booked any eye care appointments yet.</p>
                                <button
                                    onClick={() => { setView('booking'); if (onNavigate) onNavigate('student-booking'); }}
                                    className="px-4 py-2 bg-[#6FCF97] text-slate-900 font-bold rounded-xl text-xs cursor-pointer inline-block"
                                >
                                    Select Clinic Slot & Book
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {myAppointments.slice(0, 3).map((appt) => (
                                    <div key={appt.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-extrabold text-slate-900 text-sm">{appt.service_type}</span>
                                                <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] uppercase ${
                                                    appt.status === 'completed' ? 'bg-purple-100 text-purple-800' :
                                                    appt.status === 'active' ? 'bg-emerald-100 text-emerald-800 animate-pulse' :
                                                    appt.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                                }`}>
                                                    {appt.status}
                                                </span>
                                            </div>
                                            <div className="text-xs text-slate-500 flex items-center gap-3">
                                                <span>📍 {appt.location || 'Main Campus'}</span>
                                                <span>📅 {formatDate(appt.appointment_date)}</span>
                                                <span>⏰ {formatTime(appt.appointment_time)}</span>
                                                {appt.assistant_name ? (
                                                    <span>🩺 {appt.assistant_name} (Assistant)</span>
                                                ) : appt.doctor_name ? (
                                                    <span>{appt.doctor_name.includes('Assistant') ? '🩺' : '👨‍⚕️'} {appt.doctor_name}</span>
                                                ) : null}
                                            </div>
                                        </div>

                                        {appt.status === 'completed' && !reviewedAppts[appt.id] && (
                                            <button
                                                onClick={() => setReviewingAppt(appt)}
                                                className="px-3.5 py-1.5 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1 shadow-xs"
                                            >
                                                <Star className="w-3.5 h-3.5 fill-slate-900" /> Rate & Review Doctor
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: BOOK APPOINTMENT */}
            {view === 'booking' && (
                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
                    <div className="border-b border-slate-100 pb-4 space-y-1">
                        <h2 className="text-xl font-extrabold text-slate-900">Book Eye Care Appointment</h2>
                        <p className="text-xs text-slate-500">Select preferred location, clinical service, and available time slot (8:00 AM – 4:00 PM)</p>
                    </div>

                    {bookingSuccess ? (
                        <div className="p-6 bg-emerald-50 border border-emerald-200 rounded-3xl text-center space-y-4">
                            <div className="w-14 h-14 bg-[#6FCF97] rounded-full text-slate-900 flex items-center justify-center mx-auto shadow-md">
                                <CheckCircle2 className="w-8 h-8 text-slate-900" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">Appointment Request Received!</h3>
                                <p className="text-xs text-slate-600 max-w-md mx-auto mt-1">
                                    Your booking for <span className="font-bold text-emerald-800">{bookingSuccess.service_type}</span> at <span className="font-bold text-slate-800">{bookingSuccess.location || selectedLocation}</span> on <span className="font-bold text-slate-800">{formatDate(bookingSuccess.appointment_date)}</span> at <span className="font-bold text-slate-800">{formatTime(bookingSuccess.appointment_time)}</span> has been recorded.
                                </p>
                            </div>
                            <div className="flex justify-center gap-3 pt-2">
                                <button
                                    onClick={() => setBookingSuccess(null)}
                                    className="px-4 py-2 bg-[#103B29] text-white font-bold rounded-xl text-xs cursor-pointer"
                                >
                                    Book Another Appointment
                                </button>
                                <button
                                    onClick={() => { setBookingSuccess(null); setView('track'); }}
                                    className="px-4 py-2 bg-white border border-slate-300 text-slate-800 font-bold rounded-xl text-xs cursor-pointer"
                                >
                                    View My Appointments
                                </button>
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleBookSubmit} className="space-y-6">
                            
                            {/* Step 1: Select Clinic Location */}
                            <div className="space-y-2">
                                <label className="block text-xs font-black uppercase text-[#27AE60] tracking-wider">
                                    1. Select Clinic Location <span className="text-red-500">*</span>
                                </label>
                                <CustomSelect
                                    options={locationOptions}
                                    value={selectedLocation}
                                    onChange={(val) => {
                                        setSelectedLocation(val);
                                        setSelectedSlot(null);
                                    }}
                                />
                            </div>

                            {/* Step 2: Select Eye Service */}
                            <div className="space-y-2">
                                <label className="block text-xs font-black uppercase text-[#27AE60] tracking-wider">
                                    2. Select Required Service <span className="text-red-500">*</span>
                                </label>
                                <CustomSelect
                                    options={serviceOptions}
                                    value={serviceType}
                                    onChange={setServiceType}
                                />
                            </div>

                            {/* Step 3: Select Date & Available Time Slot */}
                            <div className="space-y-3">
                                <label className="block text-xs font-black uppercase text-[#27AE60] tracking-wider">
                                    3. Choose Available Time Slot (8:00 AM – 4:00 PM) <span className="text-red-500">*</span>
                                </label>

                                {loading ? (
                                    <div className="py-8 text-center text-xs text-slate-400">Loading available clinic slots...</div>
                                ) : uniqueDates.length === 0 ? (
                                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-800">
                                        No active clinic capacity slots available for {selectedLocation} currently. Please check back soon or try another location.
                                    </div>
                                ) : (
                                    <div className="space-y-3">
                                        {/* Date selector tabs */}
                                        <div className="flex gap-2 overflow-x-auto pb-2">
                                            {uniqueDates.map((dateStr) => (
                                                <button
                                                    key={dateStr}
                                                    type="button"
                                                    onClick={() => { setSelectedDate(dateStr); setSelectedSlot(null); }}
                                                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                                                        selectedDate === dateStr
                                                            ? 'bg-[#103B29] text-white shadow-xs'
                                                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                                    }`}
                                                >
                                                    {formatDate(dateStr)}
                                                </button>
                                            ))}
                                        </div>

                                        {/* Slot Buttons for selected date */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                                            {validPatientSlots
                                                .filter(s => String(s.slot_date).split('T')[0] === selectedDate)
                                                .map((slot) => {
                                                    const isSelected = selectedSlot?.id === slot.id;
                                                    const isFull = slot.slots_remaining <= 0;

                                                    return (
                                                        <button
                                                            key={slot.id}
                                                            type="button"
                                                            disabled={isFull}
                                                            onClick={() => setSelectedSlot(slot)}
                                                            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
                                                                isFull
                                                                    ? 'bg-slate-100 border-slate-200 opacity-50 cursor-not-allowed'
                                                                    : isSelected
                                                                    ? 'bg-emerald-50 border-[#27AE60] ring-2 ring-[#27AE60]/30 shadow-xs'
                                                                    : 'bg-white border-slate-200 hover:border-emerald-300'
                                                            }`}
                                                        >
                                                            <div className="font-extrabold text-slate-900 text-xs">
                                                                {formatTime(slot.start_time)} – {formatTime(slot.end_time)}
                                                            </div>
                                                            <div className="text-[10px] text-slate-500 mt-1 flex justify-between">
                                                                <span>{isFull ? 'Full' : `${slot.slots_remaining} slot(s) left`}</span>
                                                                <span className="font-bold text-[#27AE60]">{slot.location}</span>
                                                            </div>
                                                        </button>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Step 4: Eye Symptoms Details */}
                            <div className="space-y-3 pt-2">
                                <label className="block text-xs font-black uppercase text-[#27AE60] tracking-wider">
                                    4. Describe Your Eye Symptoms
                                </label>

                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Primary Complaint</label>
                                        <CustomSelect options={complaintOptions} value={primaryComplaint} onChange={setPrimaryComplaint} />
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Symptom Duration</label>
                                        <select
                                            value={duration}
                                            onChange={(e) => setDuration(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#27AE60]"
                                        >
                                            {durationOptions.map(d => <option key={d} value={d}>{d}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Severity</label>
                                        <select
                                            value={severity}
                                            onChange={(e) => setSeverity(e.target.value)}
                                            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-[#27AE60]"
                                        >
                                            {severityOptions.map(s => <option key={s} value={s}>{s}</option>)}
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Additional Symptom Notes (Optional)</label>
                                    <textarea
                                        rows={2}
                                        placeholder="Any specific discomfort or history..."
                                        value={additionalNotes}
                                        onChange={(e) => setAdditionalNotes(e.target.value)}
                                        className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#27AE60] resize-none"
                                    ></textarea>
                                </div>
                            </div>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={submitting || !selectedSlot}
                                className="w-full py-3.5 bg-[#6FCF97] hover:bg-[#52c17d] text-slate-900 font-bold rounded-2xl transition-all cursor-pointer shadow-lg shadow-emerald-100 disabled:opacity-50 text-sm flex items-center justify-center gap-2"
                            >
                                {submitting ? (
                                    <span className="inline-block animate-spin border-2 border-slate-900 border-t-transparent rounded-full w-5 h-5"></span>
                                ) : (
                                    <>
                                        <CheckCircle2 className="w-5 h-5" /> Confirm Appointment Booking
                                    </>
                                )}
                            </button>

                        </form>
                    )}
                </div>
            )}

            {/* TAB 3: MY APPOINTMENTS TRACKING */}
            {view === 'track' && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-6">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
                        <div>
                            <h2 className="text-lg font-extrabold text-slate-900">My Eye Care Appointments</h2>
                            <p className="text-xs text-slate-500">Track appointment status, doctor allocations, and leave reviews</p>
                        </div>

                        <div className="flex gap-2">
                            {['all', 'approved', 'active', 'completed', 'pending', 'cancelled'].map((st) => (
                                <button
                                    key={st}
                                    onClick={() => setStatusFilter(st)}
                                    className={`px-3 py-1 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                                        statusFilter === st
                                            ? 'bg-[#103B29] text-white'
                                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                >
                                    {st}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="py-12 flex flex-col items-center justify-center space-y-2 text-xs text-slate-500">
                            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin"></div>
                            <span className="font-semibold">Loading your appointments...</span>
                        </div>
                    ) : filteredAppointments.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-400">
                            No appointments found matching "{statusFilter}".
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {filteredAppointments.map((appt) => (
                                <div key={appt.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-extrabold text-slate-900 text-sm">{appt.service_type}</span>
                                            <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] uppercase border ${
                                                appt.status === 'completed' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                                appt.status === 'active' ? 'bg-emerald-100 text-emerald-800 border-emerald-300 animate-pulse' :
                                                appt.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                                appt.status === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                                {appt.status}
                                            </span>
                                        </div>
                                        <div className="text-xs text-slate-600 flex flex-wrap items-center gap-x-4 gap-y-1 font-medium">
                                            <span>📍 Location: <strong className="text-slate-800">{appt.location || 'Main Campus'}</strong></span>
                                            <span>📅 Date: <strong className="text-slate-800">{formatDate(appt.appointment_date)}</strong></span>
                                            <span>⏰ Time: <strong className="text-slate-800">{formatTime(appt.appointment_time)}</strong></span>
                                            {appt.assistant_name ? (
                                                <span>🩺 Clinician: <strong className="text-emerald-800">{appt.assistant_name} (Doctor Assistant)</strong></span>
                                            ) : appt.doctor_name ? (
                                                <span>{appt.doctor_name.includes('Assistant') ? '🩺' : '👨‍⚕️'} Doctor: <strong className="text-emerald-800">{appt.doctor_name}</strong></span>
                                            ) : null}
                                        </div>
                                        <p className="text-xs text-slate-500 pt-1">Symptoms: "{appt.symptom_notes}"</p>
                                    </div>

                                    <div className="flex items-center gap-2 flex-wrap">
                                        {appt.status === 'completed' && !reviewedAppts[appt.id] && (
                                            <button
                                                onClick={() => setReviewingAppt(appt)}
                                                className="px-3.5 py-2 bg-amber-400 hover:bg-amber-500 text-slate-900 rounded-xl font-bold text-xs transition-colors cursor-pointer flex items-center gap-1.5 shadow-xs"
                                            >
                                                <Star className="w-4 h-4 fill-slate-900" /> Rate & Review Doctor
                                            </button>
                                        )}

                                        {appt.status === 'completed' && reviewedAppts[appt.id] && (
                                            <span className="px-3 py-1.5 bg-emerald-100 text-emerald-800 rounded-xl font-bold text-xs flex items-center gap-1">
                                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Reviewed ★
                                            </span>
                                        )}

                                        {appt.status !== 'completed' && appt.status !== 'cancelled' && (
                                            <button
                                                onClick={() => setCancellingAppt(appt)}
                                                className="px-3 py-1.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-xl font-bold text-xs transition-colors cursor-pointer"
                                            >
                                                Cancel Booking
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Cancel Appointment Modal */}
            {cancellingAppt && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 border border-slate-200 shadow-2xl">
                        <h4 className="font-extrabold text-slate-900 text-base">Cancel Appointment</h4>
                        <p className="text-xs text-slate-600">
                            Are you sure you want to cancel your appointment for <span className="font-bold">{cancellingAppt.service_type}</span> on {formatDate(cancellingAppt.appointment_date)}?
                        </p>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">Reason for cancellation (Optional)</label>
                            <input
                                type="text"
                                placeholder="e.g. Schedule conflict"
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#27AE60]"
                            />
                        </div>
                        <div className="flex gap-2 justify-end pt-2">
                            <button
                                onClick={() => setCancellingAppt(null)}
                                className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs cursor-pointer"
                            >
                                Keep Appointment
                            </button>
                            <button
                                onClick={handleCancelAppointment}
                                disabled={isCancelling}
                                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                            >
                                {isCancelling ? 'Cancelling...' : 'Confirm Cancellation'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Rate & Review Doctor Modal */}
            {reviewingAppt && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 space-y-6 border border-slate-200 shadow-2xl">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                            <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                                <Star className="w-5 h-5 text-amber-400 fill-amber-400" /> Rate & Review Doctor Care
                            </h4>
                            <button onClick={() => setReviewingAppt(null)} className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer">✕</button>
                        </div>

                        <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 text-xs space-y-1">
                            <div className="font-bold text-slate-900">Doctor: {reviewingAppt.doctor_name || 'Assigned Optometrist'}</div>
                            <div className="text-slate-600">Service: {reviewingAppt.service_type}</div>
                            <div className="text-slate-500">Date: {formatDate(reviewingAppt.appointment_date)}</div>
                        </div>

                        <form onSubmit={handleSubmitReview} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-2 text-center">
                                    How satisfied were you with your doctor's care?
                                </label>
                                <div className="flex justify-center gap-2">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button
                                            key={star}
                                            type="button"
                                            onClick={() => setStarRating(star)}
                                            className="p-1 cursor-pointer transition-transform hover:scale-110"
                                        >
                                            <Star className={`w-8 h-8 ${star <= starRating ? 'text-amber-400 fill-amber-400' : 'text-slate-200'}`} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">Your Review Comment (Optional)</label>
                                <textarea
                                    rows={3}
                                    placeholder="Share feedback on your consultation experience..."
                                    value={reviewComment}
                                    onChange={(e) => setReviewComment(e.target.value)}
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-[#27AE60] resize-none"
                                ></textarea>
                            </div>

                            <button
                                type="submit"
                                disabled={submittingReview}
                                className="w-full py-3 bg-[#6FCF97] hover:bg-[#52c17d] text-slate-900 font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-xs flex items-center justify-center gap-2"
                            >
                                {submittingReview ? (
                                    <span className="inline-block animate-spin border-2 border-slate-900 border-t-transparent rounded-full w-4 h-4"></span>
                                ) : (
                                    <>
                                        <ThumbsUp className="w-4 h-4" /> Submit Doctor Review
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
