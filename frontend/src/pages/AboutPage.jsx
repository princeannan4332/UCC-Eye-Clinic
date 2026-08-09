import React from 'react';
import { Eye, Sparkles, CheckCircle2 } from 'lucide-react';

import docKwame from '../assets/doc_kwame.png';
import docAbena from '../assets/doc_abena.png';
import docEmmanuel from '../assets/doc_emmanuel.png';
import aboutFacility from '../assets/about_facility.png';

export const specialists = [
    {
        id: 'dr-kwame-mensah',
        name: 'Dr. Kwame Mensah, OD',
        title: 'Chief Consultant Ophthalmologist & Glaucoma Specialist',
        degree: 'Doctor of Optometry (UCC), FWACS',
        experience: '14+ Years Clinical Experience',
        bio: 'Specializes in high-precision intraocular pressure assessment, advanced glaucoma management, and computerized visual field analysis.',
        avatarBg: 'bg-[#103B29]',
        initials: 'KM',
        image: docKwame
    },
    {
        id: 'dr-abena-osei',
        name: 'Dr. Abena Osei, OD',
        title: 'Head of Pediatric & Refraction Unit',
        degree: 'Doctor of Optometry (KNUST), M.Sc Vision Science',
        experience: '10+ Years Clinical Experience',
        bio: 'Expert in pediatric visual development, functional amblyopia correction, binocular vision disorders, and specialty contact lens fitting.',
        avatarBg: 'bg-emerald-700',
        initials: 'AO',
        image: docAbena
    },
    {
        id: 'dr-emmanuel-kofi',
        name: 'Dr. Emmanuel Kofi, OD',
        title: 'Senior Clinical Optometrist & Retinal Specialist',
        degree: 'Doctor of Optometry (UCC), FAAO',
        experience: '8+ Years Clinical Experience',
        bio: 'Focuses on digital retinal imaging, ocular emergency diagnosis, diabetic eye screening, and digital campus navigation integration.',
        avatarBg: 'bg-teal-700',
        initials: 'EK',
        image: docEmmanuel
    }
];

export default function AboutPage({ onNavigate }) {
    return (
        <div className="min-h-screen bg-slate-50 font-sans">

            {/* Hero Banner Header */}
            <section className="bg-gradient-to-b from-[#103B29] to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-emerald-950">
                <div className="max-w-7xl mx-auto text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-900/60 border border-emerald-700/50 text-[#6FCF97] text-xs font-bold uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-[#6FCF97]" />
                        Excellence in Eye Health Education & Care
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
                        About <span className="text-[#6FCF97]">UCC Eye Clinic</span>
                    </h1>
                    <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                        Dedicated to providing world-class optometric diagnosis, modern eye equipment testing, student clinical training, and digital healthcare accessibility.
                    </p>
                </div>
            </section>

            {/* Mission & Facility Section */}
            <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-6">
                        <span className="px-3.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs uppercase rounded-full tracking-wider">
                            Our Mission & Purpose
                        </span>
                        <h2 className="text-3xl font-black text-slate-900 leading-tight">
                            Pioneering Digital Optometry & Patient-Centric Care
                        </h2>
                        <p className="text-slate-600 text-sm leading-relaxed">
                            Established within the Department of Optometry at the University of Cape Coast, the UCC Eye Clinic combines clinical expertise with modern digital workflow systems to eliminate booking wait times and enhance campus patient experiences.
                        </p>

                        <div className="space-y-3 text-xs text-slate-700 font-semibold">
                            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs">
                                <CheckCircle2 className="w-5 h-5 text-[#27AE60]" />
                                <span>Advanced Glaucoma & Retinal Diagnostic Technologies</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs">
                                <CheckCircle2 className="w-5 h-5 text-[#27AE60]" />
                                <span>Turn-by-Turn Campus Digital Navigation Assistance</span>
                            </div>
                            <div className="flex items-center gap-3 p-3 bg-white rounded-xl border border-slate-200/80 shadow-xs">
                                <CheckCircle2 className="w-5 h-5 text-[#27AE60]" />
                                <span>Voice-to-Voice Multilingual English ↔ Akan Translation</span>
                            </div>
                        </div>
                    </div>

                    {/* Facility Image Card */}
                    <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-slate-200 group">
                        <img
                            src={aboutFacility}
                            alt="UCC Eye Clinic Facility"
                            className="w-full h-96 object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                        <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                            <div className="text-lg font-bold">State-of-the-Art Optometry Reception</div>
                            <p className="text-xs text-slate-300">Department of Optometry, University of Cape Coast</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Meet Our Specialist Section */}
            <section className="py-16 bg-white border-t border-slate-200/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                    <div className="text-center max-w-xl mx-auto space-y-3">
                        <span className="px-3.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs uppercase rounded-full tracking-wider">
                            Clinical Team
                        </span>
                        <h2 className="text-3xl font-black text-slate-900">
                            Meet Our Experienced Specialists
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-600">
                            Licensed doctors of optometry committed to protecting your vision.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {specialists.map((doc) => (
                            <div key={doc.id} className="bg-slate-50 rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between group">

                                {/* Doctor Image Header */}
                                <div className="relative h-64 overflow-hidden border-b border-slate-200">
                                    <img
                                        src={doc.image}
                                        alt={doc.name}
                                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                                    <div className="absolute bottom-3 left-4 right-4 text-white">
                                        <div className="font-black text-lg drop-shadow">{doc.name}</div>
                                        <div className="text-xs text-emerald-300 font-bold">{doc.degree}</div>
                                    </div>
                                </div>

                                <div className="p-6 space-y-4 flex-1 flex flex-col justify-between">
                                    <div className="space-y-3">
                                        <div className="text-xs font-bold text-[#103B29] bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 inline-block">
                                            {doc.title}
                                        </div>

                                        <p className="text-xs text-slate-600 leading-relaxed font-normal">
                                            {doc.bio}
                                        </p>
                                    </div>

                                    <div className="pt-3 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500 font-medium">
                                        <span>🏅 {doc.experience}</span>
                                        <button
                                            onClick={() => onNavigate && onNavigate('signup')}
                                            className="text-[#27AE60] font-bold hover:underline cursor-pointer"
                                        >
                                            Book Consult ➔
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

        </div>
    );
}
