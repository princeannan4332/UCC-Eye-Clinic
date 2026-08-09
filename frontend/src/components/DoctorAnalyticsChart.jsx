import React from 'react';
import { Clock, Users, Stethoscope, CheckCircle2, Star, TrendingUp, BarChart2, PieChart, Calendar, Activity } from 'lucide-react';
import CustomSelect from './CustomSelect';

const formatMonthLabel = (monthKey) => {
    if (!monthKey || monthKey === 'all') return 'All Months (Lifetime)';
    const [y, m] = String(monthKey).split('-');
    if (!y || !m) return monthKey;
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const mName = months[parseInt(m, 10) - 1] || m;
    return `${mName} ${y}`;
};

export default function DoctorAnalyticsChart({ 
    analytics, 
    reviewsSummary, 
    reviewsList,
    selectedMonth = 'all',
    onMonthChange,
    availableMonths = []
}) {
    const metrics = analytics?.metrics || { total_attended: 0, scheduled_count: 0, avg_duration_minutes: 0 };
    const caseTypes = analytics?.case_types || [];
    const patientCases = analytics?.patient_cases || [];
    const caseOutcomes = analytics?.case_outcomes || [];
    const dbMonths = analytics?.available_months || availableMonths;

    const avgRating = reviewsSummary?.avg_rating || 0;
    const totalReviews = reviewsSummary?.total_reviews || 0;

    // Color Palette
    const colors = ['#27AE60', '#2F80ED', '#F2994A', '#9B51E0', '#EB5757', '#6FCF97', '#333333'];

    const maxCaseTypeCount = Math.max(...caseTypes.map(c => parseInt(c.count, 10)), 1);
    const maxPatientCaseCount = Math.max(...patientCases.map(c => parseInt(c.count, 10)), 1);
    const maxOutcomeCount = Math.max(...caseOutcomes.map(c => parseInt(c.count, 10)), 1);

    // Generate Month Options for Filter Dropdown
    const currentMonthKey = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const allMonthsSet = Array.from(new Set([currentMonthKey, ...(dbMonths || [])])).sort().reverse();

    const monthOptions = [
        { value: 'all', label: '🗓️ All Months (Lifetime Performance)' },
        ...allMonthsSet.map(m => ({
            value: m,
            label: `📅 ${formatMonthLabel(m)}`
        }))
    ];

    return (
        <div className="space-y-6 font-sans">
            
            {/* Filter Bar: Month Selection & Active Period Indicator */}
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-emerald-100 text-[#103B29] rounded-2xl">
                        <Calendar className="w-5 h-5 text-[#27AE60]" />
                    </div>
                    <div>
                        <h3 className="font-extrabold text-slate-900 text-sm">Monthly Clinical Analysis & Performance</h3>
                        <p className="text-xs text-slate-500">
                            Currently showing: <span className="font-bold text-emerald-800">{formatMonthLabel(selectedMonth)}</span>
                        </p>
                    </div>
                </div>

                <div className="w-full sm:w-64">
                    <CustomSelect
                        options={monthOptions}
                        value={selectedMonth}
                        onChange={onMonthChange}
                    />
                </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Patients Attended</span>
                        <Users className="w-5 h-5 text-[#27AE60]" />
                    </div>
                    <div className="text-3xl font-black text-slate-900">{metrics.total_attended}</div>
                    <p className="text-[10px] text-slate-500 font-semibold">
                        {selectedMonth === 'all' ? 'Total patients seen (All-time)' : `Patients seen in ${formatMonthLabel(selectedMonth)}`}
                    </p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Avg Consultation Time</span>
                        <Clock className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="text-3xl font-black text-slate-900">
                        {metrics.avg_duration_minutes || 15} <span className="text-sm font-semibold text-slate-500">mins</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold">Average duration per patient</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Active & Scheduled</span>
                        <Stethoscope className="w-5 h-5 text-amber-500" />
                    </div>
                    <div className="text-3xl font-black text-slate-900">{metrics.scheduled_count}</div>
                    <p className="text-[10px] text-slate-500 font-semibold">Patients awaiting / in consultation</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-1">
                    <div className="flex items-center justify-between text-slate-400">
                        <span className="text-[11px] font-bold uppercase tracking-wider">Patient Satisfaction</span>
                        <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
                    </div>
                    <div className="text-3xl font-black text-slate-900 flex items-baseline gap-1">
                        {avgRating || '5.0'} <span className="text-xs text-amber-500 font-bold">★</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-semibold">Based on {totalReviews} patient review(s)</p>
                </div>
            </div>

            {/* Visual Analytics Graphs */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Graph 1: Patient Cases Brought (Symptoms / Service Complaints) */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                            <Activity className="w-4 h-4 text-emerald-600" /> Patient Cases & Complaints Brought
                        </h3>
                        <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full">
                            Reported Services / Complaints
                        </span>
                    </div>

                    {patientCases.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-400">
                            No patient case complaint data available for {formatMonthLabel(selectedMonth)}.
                        </div>
                    ) : (
                        <div className="space-y-3 pt-2">
                            {patientCases.map((item, index) => {
                                const count = parseInt(item.count, 10);
                                const percentage = Math.round((count / maxPatientCaseCount) * 100);
                                const barColor = colors[index % colors.length];

                                return (
                                    <div key={item.complaint_type || index} className="space-y-1">
                                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                                            <span>{item.complaint_type}</span>
                                            <span className="font-bold text-slate-900">{count} patient(s)</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${percentage}%`, backgroundColor: barColor }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Graph 2: Diagnosed Cases Breakdown */}
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                            <BarChart2 className="w-4 h-4 text-[#27AE60]" /> Doctor Diagnosed Cases
                        </h3>
                        <span className="text-[10px] bg-[#27AE60]/10 text-emerald-900 font-bold px-2.5 py-0.5 rounded-full">
                            Clinical Diagnosis Distribution
                        </span>
                    </div>

                    {caseTypes.length === 0 ? (
                        <div className="py-12 text-center text-xs text-slate-400">
                            No clinical diagnosis recorded for {formatMonthLabel(selectedMonth)}. Complete consultations to view diagnosis analysis.
                        </div>
                    ) : (
                        <div className="space-y-3 pt-2">
                            {caseTypes.map((item, index) => {
                                const count = parseInt(item.count, 10);
                                const percentage = Math.round((count / maxCaseTypeCount) * 100);
                                const barColor = colors[(index + 1) % colors.length];

                                return (
                                    <div key={item.case_type || index} className="space-y-1">
                                        <div className="flex justify-between text-xs font-semibold text-slate-700">
                                            <span>{item.case_type}</span>
                                            <span className="font-bold text-slate-900">{count} patient(s)</span>
                                        </div>
                                        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden flex">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${percentage}%`, backgroundColor: barColor }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Graph 3: Case Outcomes & Resolutions */}
                <div className="lg:col-span-2 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                    <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                        <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                            <PieChart className="w-4 h-4 text-blue-600" /> Case Resolution & Treatment Actions
                        </h3>
                        <span className="text-[10px] bg-blue-50 text-blue-800 font-bold px-2.5 py-0.5 rounded-full">
                            Treatment Resolution Summary
                        </span>
                    </div>

                    {caseOutcomes.length === 0 ? (
                        <div className="py-10 text-center text-xs text-slate-400">
                            No outcome resolution data available for {formatMonthLabel(selectedMonth)}.
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                            {caseOutcomes.map((item, index) => {
                                const count = parseInt(item.count, 10);
                                const percentage = Math.round((count / maxOutcomeCount) * 100);
                                const barColor = colors[(index + 3) % colors.length];

                                return (
                                    <div key={item.case_outcome || index} className="p-3 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-1.5">
                                        <div className="flex justify-between text-xs font-bold text-slate-800">
                                            <span>{item.case_outcome}</span>
                                            <span className="text-emerald-800 font-black">{count} case(s)</span>
                                        </div>
                                        <div className="w-full bg-slate-200/70 rounded-full h-2.5 overflow-hidden flex">
                                            <div
                                                className="h-full rounded-full transition-all duration-500"
                                                style={{ width: `${percentage}%`, backgroundColor: barColor }}
                                            ></div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

            </div>

            {/* Patient Feedback & Star Reviews */}
            {reviewsList && reviewsList.length > 0 && (
                <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4">
                    <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-3">
                        <Star className="w-4 h-4 text-amber-400 fill-amber-400" /> Patient Feedback & Rating History
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {reviewsList.slice(0, 4).map((rev) => (
                            <div key={rev.id} className="p-4 bg-amber-50/40 rounded-2xl border border-amber-100 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-slate-900 text-xs">{rev.patient_name || 'Anonymous Patient'}</span>
                                    <div className="flex text-amber-400 text-xs">
                                        {'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}
                                    </div>
                                </div>
                                <p className="text-xs text-slate-700 italic">"{rev.comment || 'No comment provided.'}"</p>
                                <div className="text-[10px] text-slate-400">
                                    Service: {rev.service_type || 'Eye Examination'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

        </div>
    );
}
