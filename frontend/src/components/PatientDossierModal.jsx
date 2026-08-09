import React from 'react';
import { Stethoscope, User, Calendar, Phone, ShieldAlert, HeartPulse, Pill, Hash, Briefcase, MapPin, X } from 'lucide-react';

export const calculateAge = (dobStr) => {
    if (!dobStr) return 'N/A';
    const clean = String(dobStr).split('T')[0];
    const birthDate = new Date(clean);
    if (isNaN(birthDate.getTime())) return dobStr;
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return `${age} yrs old`;
};

export default function PatientDossierModal({ appt, onClose }) {
    if (!appt) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/65 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
            <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 border border-slate-200 shadow-2xl overflow-y-auto max-h-[90vh] font-sans">
                
                {/* Modal Header */}
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-emerald-100 text-[#103B29] rounded-xl">
                            <Stethoscope className="w-5 h-5 text-[#27AE60]" />
                        </div>
                        <div>
                            <h4 className="font-extrabold text-slate-900 text-base">
                                Patient Clinical Medical Dossier
                            </h4>
                            <p className="text-[11px] text-slate-400 font-medium">UCC Eye Clinic Confidential Record</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 font-bold p-1 cursor-pointer transition-colors">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Patient Primary Badge Card */}
                <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-100/80 space-y-2">
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="font-black text-slate-900 text-lg leading-tight">{appt.full_name}</div>
                            <div className="text-xs text-slate-600 font-medium">
                                Email: <span className="font-bold text-slate-800">{appt.email}</span>
                            </div>
                        </div>
                        <span className="px-2.5 py-1 bg-[#103B29] text-white rounded-full text-[10px] font-bold uppercase tracking-wider">
                            {appt.status || 'Active'}
                        </span>
                    </div>

                    <div className="space-y-1.5 pt-2 border-t border-emerald-100/80 text-xs">
                        <div className="flex items-center gap-1.5 text-slate-700">
                            <Calendar className="w-3.5 h-3.5 text-[#27AE60] shrink-0" />
                            <span className="font-bold">Age:</span>
                            <span className="font-semibold text-slate-900">{calculateAge(appt.dob)}</span>
                        </div>
                        <div className="flex items-start gap-1.5 text-slate-700">
                            <Briefcase className="w-3.5 h-3.5 text-[#27AE60] shrink-0 mt-0.5" />
                            <div>
                                <span className="font-bold">Occupation:</span>{' '}
                                <span className="font-semibold text-slate-900">{appt.occupation || 'Student'}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Patient Information Grid */}
                <div className="space-y-4">
                    <h5 className="text-xs font-black uppercase text-slate-400 tracking-wider border-b border-slate-100 pb-1">
                        Medical Background & Details
                    </h5>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Gender</span>
                            <span className="font-bold text-slate-900 text-xs">{appt.gender || 'Not Specified'}</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                            <span className="text-slate-400 font-semibold block text-[10px] uppercase">Blood Group</span>
                            <span className="font-bold text-emerald-700 text-xs">{appt.blood_group || 'None'}</span>
                        </div>
                    </div>

                    {appt.student_id && (
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 flex items-center justify-between">
                            <span className="text-slate-400 font-semibold text-[10px] uppercase">Student / Index ID</span>
                            <span className="font-bold text-emerald-800 text-xs">{appt.student_id}</span>
                        </div>
                    )}

                    <div className="p-3.5 bg-red-50/80 border border-red-200 rounded-2xl space-y-1">
                        <span className="text-red-800 font-bold block text-[10px] uppercase flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5 text-red-600" /> Existing Medical Conditions
                        </span>
                        <p className="text-xs text-red-950 font-semibold">{appt.medical_conditions || 'None Reported'}</p>
                    </div>

                    <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-1">
                        <span className="text-amber-900 font-bold block text-[10px] uppercase flex items-center gap-1">
                            <Pill className="w-3.5 h-3.5 text-amber-600" /> Current Medications & Allergies
                        </span>
                        <p className="text-xs text-amber-950 font-medium leading-relaxed">
                            <span className="font-bold">Allergies:</span> {appt.allergies || 'None'}<br />
                            <span className="font-bold">Medications:</span> {appt.current_medications || 'None'}
                        </p>
                    </div>

                    <div className="p-3.5 bg-[#103B29]/5 border border-[#103B29]/15 rounded-2xl space-y-1">
                        <span className="text-[#103B29] font-bold block text-[10px] uppercase flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-[#27AE60]" /> Booking Location & Symptoms
                        </span>
                        <p className="text-xs text-slate-800 font-medium">
                            <span className="font-bold text-[#103B29]">Clinic Location:</span> {appt.location || 'Main Campus'}<br />
                            <span className="font-bold text-slate-700">Service:</span> {appt.service_type}<br />
                            <span className="font-bold text-slate-700">Notes:</span> "{appt.symptom_notes}"
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                            <span className="text-slate-400 font-semibold block text-[10px] uppercase flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" /> Personal Phone
                            </span>
                            <span className="font-bold text-slate-800 text-xs">{appt.phone || appt.personal_contact || 'N/A'}</span>
                        </div>
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                            <span className="text-slate-400 font-semibold block text-[10px] uppercase flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3 text-slate-400" /> Emergency Contact
                            </span>
                            <span className="font-bold text-slate-800 text-xs">{appt.emergency_contact || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                <button
                    onClick={onClose}
                    className="w-full py-3 bg-[#103B29] hover:bg-emerald-900 text-white font-bold text-xs rounded-xl cursor-pointer transition-colors shadow-xs"
                >
                    Close Dossier
                </button>

            </div>
        </div>
    );
}
