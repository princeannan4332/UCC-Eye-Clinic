import React from 'react';
import { Eye, ShieldCheck, Activity, Sparkles, CheckCircle2, ArrowRight, Stethoscope, HeartPulse, Layers, Zap } from 'lucide-react';

export default function ServicesPage({ onNavigate }) {
    const mainServices = [
        {
            id: 'glaucoma',
            badge: 'Specialized Care',
            title: 'Glaucoma Care & Advanced Tonometry',
            icon: Eye,
            color: 'bg-emerald-500',
            description: 'Early detection and ongoing management of intraocular pressure (IOP) to prevent optic nerve damage and gradual visual field loss.',
            features: [
                'Non-contact Goldmann Applanation Tonometry',
                'Visual field perimeter mapping & optic disc analysis',
                'Custom drop compliance & pressure monitoring schedules'
            ]
        },
        {
            id: 'pediatric',
            badge: 'Children & Youth',
            title: 'Pediatric Optometry & Vision Care',
            icon: Stethoscope,
            color: 'bg-teal-500',
            description: 'Dedicated pediatric eye exams designed for children and young students to detect amblyopia (lazy eye), strabismus, and early refractive errors.',
            features: [
                'Child-friendly ocular alignment & motility evaluation',
                'Specialized pediatric refraction & color vision testing',
                'Myopia control & visual performance counseling'
            ]
        },
        {
            id: 'screening',
            badge: 'Preventive Health',
            title: 'Digital Eye Screening & Retinal Imaging',
            icon: Activity,
            color: 'bg-emerald-600',
            description: 'Comprehensive high-resolution digital imaging of the retina, macular region, and blood vessels for preventive diagnostic monitoring.',
            features: [
                'High-resolution digital fundus photography',
                'Diabetic retinopathy & macular degeneration screening',
                'Automated digital archiving for longitudinal comparison'
            ]
        }
    ];

    const additionalServices = [
        {
            title: 'Comprehensive Refraction Test',
            desc: 'Precision computer-assisted visual acuity testing to determine exact spectacle lens prescriptions.',
            icon: Zap
        },
        {
            title: 'Cataract & Lens Assessment',
            desc: 'Slit-lamp biomicroscopic evaluation of lens clarity and surgical referral consultation.',
            icon: Layers
        },
        {
            title: 'Contact Lens Fitting & Care',
            desc: 'Corneal topography measurement, lens trial fitting, and contact lens hygiene training.',
            icon: ShieldCheck
        },
        {
            title: 'Low Vision Rehabilitation',
            desc: 'Specialized visual aids, magnifiers, and assistive technology assessment for low vision patients.',
            icon: HeartPulse
        },
        {
            title: 'Red Eye & Infection Treatment',
            desc: 'Urgent diagnostic evaluation for conjunctivitis, ocular allergies, foreign bodies, and corneal abrasions.',
            icon: Sparkles
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans">

            {/* Page Banner Header */}
            <section className="bg-gradient-to-b from-[#103B29] to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-emerald-950">
                <div className="max-w-7xl mx-auto text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-900/60 border border-emerald-700/50 text-[#6FCF97] text-xs font-bold uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-[#6FCF97]" />
                        UCC Eye Clinic Clinical Services
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
                        Our Specialized <span className="text-[#6FCF97]">Eye Care Services</span>
                    </h1>
                    <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                        Providing comprehensive, state-of-the-art optometric examinations, glaucoma monitoring, pediatric vision therapy, and digital screening to the UCC community.
                    </p>
                </div>
            </section>

            {/* Main Featured Services Section */}
            <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                <div className="text-center max-w-xl mx-auto space-y-2">
                    <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                        Primary Clinical Specializations
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-600">
                        Advanced diagnostic procedures conducted by expert optometrists.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {mainServices.map((service) => {
                        const Icon = service.icon;
                        return (
                            <div key={service.id} className="bg-white rounded-3xl p-8 border border-emerald-100 shadow-xl space-y-6 flex flex-col justify-between hover:border-emerald-300 transition-all transform hover:-translate-y-1">
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className={`w-14 h-14 rounded-2xl ${service.color} text-white flex items-center justify-center shadow-md`}>
                                            <Icon className="w-7 h-7" />
                                        </div>
                                        <span className="px-3 py-1 bg-emerald-50 text-emerald-800 text-[10px] font-bold uppercase rounded-full border border-emerald-200">
                                            {service.badge}
                                        </span>
                                    </div>

                                    <h3 className="text-xl font-bold text-slate-900 leading-tight">
                                        {service.title}
                                    </h3>

                                    <p className="text-xs text-slate-600 leading-relaxed font-normal">
                                        {service.description}
                                    </p>

                                    <ul className="space-y-2 pt-2 border-t border-slate-100 text-xs text-slate-700 font-medium">
                                        {service.features.map((feat, idx) => (
                                            <li key={idx} className="flex items-start gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-[#27AE60] flex-shrink-0 mt-0.5" />
                                                <span>{feat}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                <button
                                    onClick={() => onNavigate && onNavigate('signup')}
                                    className="w-full py-3 bg-[#103B29] hover:bg-emerald-900 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
                                >
                                    Book This Service <ArrowRight className="w-4 h-4 text-[#6FCF97]" />
                                </button>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* Other Services Section */}
            <section className="py-16 bg-white border-t border-slate-200/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                    <div className="text-center max-w-xl mx-auto space-y-2">
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900">
                            Other Comprehensive Eye Services
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600">
                            Full spectrum optometric care tailored for students, staff, and general patients.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {additionalServices.map((item, index) => {
                            const Icon = item.icon;
                            return (
                                <div key={index} className="p-6 bg-slate-50 rounded-2xl border border-slate-200/80 hover:bg-emerald-50/40 hover:border-emerald-200 transition-all space-y-3">
                                    <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 text-[#27AE60] flex items-center justify-center shadow-xs">
                                        <Icon className="w-5 h-5" />
                                    </div>
                                    <h4 className="font-bold text-slate-900 text-base">{item.title}</h4>
                                    <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Bottom Call to Action */}
            <section className="py-16 bg-[#103B29] text-white text-center px-4">
                <div className="max-w-3xl mx-auto space-y-6">
                    <h2 className="text-3xl font-black">Ready to Schedule Your Eye Examination?</h2>
                    <p className="text-slate-300 text-xs sm:text-sm">
                        Select your preferred service, check real-time available time slots, and lock in your appointment with instant notification updates.
                    </p>
                    <button
                        onClick={() => onNavigate && onNavigate('signup')}
                        className="px-8 py-4 bg-[#6FCF97] hover:bg-[#52c17d] text-slate-900 font-extrabold rounded-2xl transition-all cursor-pointer shadow-lg text-sm inline-flex items-center gap-2"
                    >
                        Book Appointment Now <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </section>

        </div>
    );
}
