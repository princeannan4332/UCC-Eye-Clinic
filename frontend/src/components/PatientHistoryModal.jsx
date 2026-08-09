import React, { useState, useEffect } from 'react';
import { History, Calendar, Clock, Stethoscope, FileText, CheckCircle2, MapPin, User, X, AlertCircle } from 'lucide-react';
import { api } from '../lib/api';

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

export default function PatientHistoryModal({ patient, onClose }) {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const studentId = patient?.student_id || patient?.email || patient?.full_name || patient?.id;
        if (!studentId) return;

        const loadHistory = async () => {
            setLoading(true);
            try {
                const res = await api.getPatientHistory(studentId);
                if (res?.history) {
                    setHistory(res.history);
                }
            } catch (err) {
                console.error('Error loading patient history:', err);
            } finally {
                setLoading(false);
            }
        };

        loadHistory();
    }, [patient]);

    if (!patient) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 border border-slate-200 shadow-2xl overflow-y-auto max-h-[90vh] font-sans">
                
                {/* Header */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-100 text-blue-800 rounded-2xl">
                            <History className="w-5 h-5" />
                        </div>
                        <div>
                            <h4 className="font-extrabold text-slate-900 text-base">
                                Patient Medical Visit History
                            </h4>
                            <p className="text-xs text-slate-500 font-medium">
                                Patient: <strong className="text-slate-900">{patient.full_name}</strong> {patient.occupation ? `(${patient.occupation})` : ''}
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Patient Encounters Timeline */}
                {loading ? (
                    <div className="py-16 text-center text-xs text-slate-500 space-y-2 flex flex-col items-center justify-center">
                        <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        <p className="font-semibold">Retrieving patient hospital encounters...</p>
                    </div>
                ) : history.length === 0 ? (
                    <div className="py-16 text-center space-y-3">
                        <div className="p-3 bg-slate-100 rounded-2xl w-12 h-12 text-slate-400 mx-auto flex items-center justify-center">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <div className="text-xs text-slate-500 max-w-sm mx-auto">
                            No prior completed hospital encounters recorded for <strong className="text-slate-800">{patient.full_name}</strong>. This may be their initial clinical consultation.
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="text-xs font-black uppercase text-slate-400 tracking-wider flex justify-between items-center">
                            <span>Past Clinical Encounters ({history.length})</span>
                            <span className="text-[10px] bg-blue-50 text-blue-800 px-2 py-0.5 rounded-md font-bold">
                                Chronological Order
                            </span>
                        </div>

                        <div className="space-y-4 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                            {history.map((record, index) => (
                                <div key={record.id} className="relative pl-9 space-y-2">
                                    {/* Timeline Icon Node */}
                                    <div className="absolute left-1.5 top-1.5 w-5 h-5 bg-blue-600 text-white rounded-full flex items-center justify-center text-[10px] font-bold shadow-xs">
                                        {history.length - index}
                                    </div>

                                    <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2 shadow-2xs">
                                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-slate-200/60 pb-2">
                                            <div>
                                                <span className="font-extrabold text-slate-900 text-sm">
                                                    {record.case_type || record.service_type || 'Eye Examination'}
                                                </span>
                                                <div className="text-[11px] text-slate-500 flex items-center gap-3 mt-0.5">
                                                    <span>📅 {formatDate(record.appointment_date)}</span>
                                                    <span>⏰ {formatTime(record.appointment_time)}</span>
                                                    <span>📍 {record.location || 'Main Campus'}</span>
                                                </div>
                                            </div>

                                            <span className="px-2.5 py-1 bg-purple-100 text-purple-900 border border-purple-200 rounded-full font-extrabold text-[10px] uppercase">
                                                {record.case_outcome || 'Completed'}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                            {(() => {
                                                const isAssistant = Boolean(record.assistant_name || (record.doctor_name && record.doctor_name.includes('Assistant')));
                                                const clinicianTitle = isAssistant ? 'Attending Assistant' : 'Attending Doctor';
                                                const clinicianIcon = isAssistant ? '🩺' : '👨‍⚕️';
                                                const clinicianDisplayName = record.assistant_name 
                                                    ? `${record.assistant_name} (Doctor Assistant)` 
                                                    : record.doctor_name || 'Clinic Specialist';

                                                return (
                                                    <>
                                                        <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
                                                            <span className="text-[10px] font-bold uppercase text-slate-400 block">{clinicianTitle}</span>
                                                            <span className="font-bold text-emerald-800 flex items-center gap-1 mt-0.5">
                                                                {clinicianIcon} {clinicianDisplayName}
                                                            </span>
                                                        </div>

                                                        <div className="p-2.5 bg-white rounded-xl border border-slate-200/60">
                                                            <span className="text-[10px] font-bold uppercase text-slate-400 block">Time Spent</span>
                                                            <span className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                                                                <Clock className="w-3.5 h-3.5 text-blue-600" /> {record.duration_minutes || 15} minutes
                                                            </span>
                                                        </div>
                                                    </>
                                                );
                                            })()}
                                        </div>

                                        {record.clinical_notes && (
                                            <div className="p-3 bg-emerald-50/80 border border-emerald-200/80 rounded-xl space-y-1">
                                                <span className="text-[10px] font-black uppercase text-emerald-800 flex items-center gap-1">
                                                    <FileText className="w-3 h-3 text-[#27AE60]" /> {
                                                        (record.assistant_name || (record.doctor_name && record.doctor_name.includes('Assistant'))) 
                                                            ? 'Assistant Notes & Findings' 
                                                            : 'Doctor Prescription & Clinical Notes'
                                                    }
                                                </span>
                                                <p className="text-xs text-slate-800 font-medium leading-relaxed">
                                                    "{record.clinical_notes}"
                                                </p>
                                            </div>
                                        )}

                                        {record.symptom_notes && (
                                            <div className="text-[11px] text-slate-500 font-medium pt-1">
                                                <span className="font-bold text-slate-700">Initial Complaint:</span> "{record.symptom_notes}"
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <button
                    onClick={onClose}
                    className="w-full py-3 bg-[#103B29] hover:bg-emerald-900 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-xs"
                >
                    Close History View
                </button>

            </div>
        </div>
    );
}
