import React, { useState } from 'react';
import { Eye, Calendar, User, Hash, Briefcase, AlertCircle, HeartPulse, Pill, ShieldAlert, Phone, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import CustomSelect from '../components/CustomSelect';
import { validatePhoneNumber } from '../utils/validation';

const genderOptions = [

    { value: 'Male', label: 'Male' },
    { value: 'Female', label: 'Female' },
    { value: 'Other', label: 'Other' },
    { value: 'Prefer not to say', label: 'Prefer not to say' }
];

const bloodGroupOptions = [
    { value: 'None', label: 'None / Unknown' },
    { value: 'A+', label: 'A Positive (A+)' },
    { value: 'A-', label: 'A Negative (A-)' },
    { value: 'B+', label: 'B Positive (B+)' },
    { value: 'B-', label: 'B Negative (B-)' },
    { value: 'AB+', label: 'AB Positive (AB+)' },
    { value: 'AB-', label: 'AB Negative (AB-)' },
    { value: 'O+', label: 'O Positive (O+)' },
    { value: 'O-', label: 'O Negative (O-)' }
];

const occupationOptions = [
    { value: 'Student', label: 'Student' },
    { value: 'Trader / Merchant / Business Owner', label: 'Trader / Merchant / Business Owner' },
    { value: 'Manual Laborer / Hard Labor (Construction, Factory, Mining)', label: 'Manual Laborer / Hard Labor (Construction, Factory, Mining)' },
    { value: 'Artisan / Craftsperson (Carpenter, Mason, Mechanic, Welder)', label: 'Artisan / Craftsperson (Carpenter, Mason, Mechanic, Welder)' },
    { value: 'Driver / Transport Operator (Commercial Driver, Delivery)', label: 'Driver / Transport Operator (Commercial Driver, Delivery)' },
    { value: 'Teacher / Educator / Academic', label: 'Teacher / Educator / Academic' },
    { value: 'Civil Servant / Government Employee', label: 'Civil Servant / Government Employee' },
    { value: 'Healthcare Worker / Medical Professional', label: 'Healthcare Worker / Medical Professional' },
    { value: 'Farmer / Agriculturalist / Fisherman', label: 'Farmer / Agriculturalist / Fisherman' },
    { value: 'Security Officer / Law Enforcement', label: 'Security Officer / Law Enforcement' },
    { value: 'Engineer / IT / Tech Professional', label: 'Engineer / IT / Tech Professional' },
    { value: 'Hospitality / Food Service / Chef', label: 'Hospitality / Food Service / Chef' },
    { value: 'Corporate / Office Executive', label: 'Corporate / Office Executive' },
    { value: 'Self-Employed / Freelancer', label: 'Self-Employed / Freelancer' },
    { value: 'Unemployed / Retired', label: 'Unemployed / Retired' },
    { value: 'Other', label: 'Other' }
];

export default function OnboardingPage({ onNavigate }) {
    const { profile, updateProfileData } = useAuth();

    const [dob, setDob] = useState('');
    const [gender, setGender] = useState('Male');
    const [isStudent, setIsStudent] = useState(true);
    const [studentId, setStudentId] = useState('');
    const [occupation, setOccupation] = useState('Student');
    const [allergies, setAllergies] = useState('');
    const [medicalConditions, setMedicalConditions] = useState('');
    const [currentMedications, setCurrentMedications] = useState('');
    const [bloodGroup, setBloodGroup] = useState('None');
    const [emergencyContact, setEmergencyContact] = useState('');
    const [personalContact, setPersonalContact] = useState('');


    const [errorMsg, setErrorMsg] = useState('');
    const [fieldErrors, setFieldErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const validateOnboarding = () => {
        const errors = {};

        if (!dob) {
            errors.dob = 'Please select your Date of Birth.';
        } else {
            const birthDate = new Date(dob);
            const today = new Date();
            if (birthDate >= today) {
                errors.dob = 'Date of Birth must be in the past.';
            }
        }

        if (!gender) {
            errors.gender = 'Please select your Gender.';
        }

        const personalErr = validatePhoneNumber(personalContact, 'personal phone contact number');
        if (personalErr) {
            errors.personalContact = personalErr;
        }

        const emergencyErr = validatePhoneNumber(emergencyContact, 'emergency contact phone number');
        if (emergencyErr) {
            errors.emergencyContact = emergencyErr;
        }

        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setErrorMsg('');
        setFieldErrors({});

        const errors = validateOnboarding();
        setFieldErrors(errors);

        if (Object.keys(errors).length > 0) {
            if (errors.dob || errors.gender) {
                setErrorMsg('Please complete all required background fields.');
            }
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                dob,
                gender,
                is_student: isStudent,
                student_id: isStudent ? studentId : null,
                occupation,
                allergies: allergies.trim() || 'None',
                medical_conditions: medicalConditions.trim() || 'None',
                current_medications: currentMedications.trim() || 'None',
                blood_group: bloodGroup,
                emergency_contact: emergencyContact.trim(),
                personal_contact: personalContact.trim()
            };

            const res = await updateProfileData(payload);
            if (res.success) {
                onNavigate('portal');
            } else {
                const backendErr = res.error || 'Failed to submit onboarding profile.';
                const errLower = backendErr.toLowerCase();
                if (errLower.includes('personal phone') || errLower.includes('personal_contact')) {
                    setFieldErrors(prev => ({ ...prev, personalContact: backendErr }));
                } else if (errLower.includes('emergency contact') || errLower.includes('emergency_contact')) {
                    setFieldErrors(prev => ({ ...prev, emergencyContact: backendErr }));
                } else {
                    setErrorMsg(backendErr);
                }
            }
        } catch (err) {
            setErrorMsg('An error occurred during onboarding.');
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <div className="min-h-screen bg-[#F4F7F5] py-10 px-4 sm:px-6 lg:px-8 font-sans flex items-center justify-center">
            <div className="w-full max-w-2xl bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-xl space-y-8">

                {/* Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex w-14 h-14 rounded-2xl bg-[#6FCF97] items-center justify-center text-slate-900 font-bold mb-2 shadow-xs">
                        <Eye className="w-7 h-7 text-slate-900" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                        Complete Patient Medical Profile
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto font-medium">
                        Welcome to OptiFlow Eye Clinic! Please complete your medical background information so our doctors can provide precise clinical care.
                    </p>
                </div>

                {/* Error Banner */}
                {errorMsg && (
                    <div className="p-4 bg-red-50 border border-red-200 text-red-700 text-xs rounded-2xl flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-600" />
                        <span className="font-semibold">{errorMsg}</span>
                    </div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} noValidate className="space-y-6">


                    {/* Section 1: Personal Profile */}
                    <div className="space-y-4">
                        <h3 className="text-xs font-black uppercase tracking-wider text-[#27AE60] border-b border-slate-100 pb-2">
                            1. Personal & Contact Information
                        </h3>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Date of Birth (DOB) <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                                    <input
                                        type="date"
                                        required
                                        value={dob}
                                        onChange={(e) => setDob(e.target.value)}
                                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#6FCF97] focus:bg-white transition-all cursor-pointer"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Gender <span className="text-red-500">*</span>
                                </label>
                                <CustomSelect options={genderOptions} value={gender} onChange={setGender} />
                            </div>
                        </div>

                        {/* Occupation Dropdown */}
                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Occupation <span className="text-red-500">*</span>
                            </label>
                            <CustomSelect options={occupationOptions} value={occupation} onChange={setOccupation} />
                        </div>

                        {/* Student Status & Student ID */}
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-slate-800">Are you currently a student?</span>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => { setIsStudent(true); setOccupation('Student'); }}
                                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${isStudent ? 'bg-[#103B29] text-white' : 'bg-slate-200 text-slate-600'
                                            }`}
                                    >
                                        Yes
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setIsStudent(false)}
                                        className={`px-3 py-1 rounded-xl text-xs font-bold transition-all ${!isStudent ? 'bg-[#103B29] text-white' : 'bg-slate-200 text-slate-600'
                                            }`}
                                    >
                                        No
                                    </button>
                                </div>
                            </div>

                            {isStudent && (
                                <div className="pt-2 border-t border-slate-200/60">
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Student ID / Index Number <span className="text-slate-400 font-normal">(Optional)</span>
                                    </label>
                                    <div className="relative">
                                        <Hash className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                                        <input
                                            type="text"
                                            placeholder="e.g. PS/OPT/21/0042"
                                            value={studentId}
                                            onChange={(e) => setStudentId(e.target.value)}
                                            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#6FCF97] transition-all"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Personal Phone Number <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <Phone className={`w-4 h-4 absolute left-3.5 top-3 ${fieldErrors.personalContact ? 'text-red-500' : 'text-slate-400'}`} />
                                    <input
                                        type="tel"
                                        required
                                        placeholder="e.g. 024 123 4567"
                                        value={personalContact}
                                        onChange={(e) => {
                                            setPersonalContact(e.target.value);
                                            if (fieldErrors.personalContact) {
                                                setFieldErrors(prev => ({ ...prev, personalContact: null }));
                                            }
                                        }}
                                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium transition-all focus:outline-none ${fieldErrors.personalContact
                                                ? 'border-2 border-red-500 bg-red-50/40 text-red-900 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                                                : 'bg-slate-50 border border-slate-200 focus:border-[#6FCF97] focus:bg-white'
                                            }`}
                                    />
                                </div>
                                {fieldErrors.personalContact && (
                                    <p className="text-xs font-semibold text-red-600 mt-1.5 flex items-start gap-1 leading-tight">
                                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                        <span>{fieldErrors.personalContact}</span>
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Emergency Contact Number <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <ShieldAlert className={`w-4 h-4 absolute left-3.5 top-3 ${fieldErrors.emergencyContact ? 'text-red-500' : 'text-slate-400'}`} />
                                    <input
                                        type="tel"
                                        required
                                        placeholder="e.g. 020 987 6543 (Relative/Guardian)"
                                        value={emergencyContact}
                                        onChange={(e) => {
                                            setEmergencyContact(e.target.value);
                                            if (fieldErrors.emergencyContact) {
                                                setFieldErrors(prev => ({ ...prev, emergencyContact: null }));
                                            }
                                        }}
                                        className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-xs font-medium transition-all focus:outline-none ${fieldErrors.emergencyContact
                                                ? 'border-2 border-red-500 bg-red-50/40 text-red-900 focus:border-red-500 focus:ring-1 focus:ring-red-500'
                                                : 'bg-slate-50 border border-slate-200 focus:border-[#6FCF97] focus:bg-white'
                                            }`}
                                    />
                                </div>
                                {fieldErrors.emergencyContact && (
                                    <p className="text-xs font-semibold text-red-600 mt-1.5 flex items-start gap-1 leading-tight">
                                        <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                                        <span>{fieldErrors.emergencyContact}</span>
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>


                    {/* Section 2: Clinical Medical Profile */}
                    <div className="space-y-4 pt-2">
                        <h3 className="text-xs font-black uppercase tracking-wider text-[#27AE60] border-b border-slate-100 pb-2">
                            2. Clinical History & Medical Details
                        </h3>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Blood Group <span className="text-red-500">*</span>
                            </label>
                            <CustomSelect options={bloodGroupOptions} value={bloodGroup} onChange={setBloodGroup} />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Allergies <span className="text-slate-400 font-normal">(e.g. Penicillin, Eye Drop Preservatives, None)</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Type allergies or enter 'None'"
                                value={allergies}
                                onChange={(e) => setAllergies(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#6FCF97] focus:bg-white transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Existing Medical Conditions <span className="text-slate-400 font-normal">(e.g. Hypertension, Diabetes, Glaucoma, None)</span>
                            </label>
                            <input
                                type="text"
                                placeholder="Type medical conditions or enter 'None'"
                                value={medicalConditions}
                                onChange={(e) => setMedicalConditions(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#6FCF97] focus:bg-white transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-slate-700 mb-1">
                                Current Medication <span className="text-slate-400 font-normal">(Optional - Active eye drops or medications, or leave blank)</span>
                            </label>
                            <textarea
                                rows={3}
                                placeholder="Type note regarding active medications or leave blank..."
                                value={currentMedications}
                                onChange={(e) => setCurrentMedications(e.target.value)}
                                className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#6FCF97] focus:bg-white transition-all resize-none"
                            ></textarea>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full py-3.5 bg-[#6FCF97] hover:bg-[#52c17d] text-slate-900 font-bold rounded-2xl transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 text-sm disabled:opacity-60"
                    >

                        {isSubmitting ? (
                            <span className="inline-block animate-spin border-2 border-slate-900 border-t-transparent rounded-full w-5 h-5"></span>
                        ) : (
                            <>
                                <CheckCircle2 className="w-5 h-5" /> Save Medical Dossier & Enter Patient Portal
                            </>
                        )}
                    </button>

                </form>

            </div>
        </div>
    );
}
