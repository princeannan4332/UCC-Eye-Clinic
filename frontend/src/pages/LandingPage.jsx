import React, { useState, useEffect } from 'react';
import { Eye, Calendar, MapPin, Phone, Mail, Clock, Send, ArrowRight, CheckCircle2, Star, ShieldCheck, Sparkles, ChevronLeft, ChevronRight, Stethoscope, Award, Compass, HeartPulse, Mic } from 'lucide-react';
import { specialists } from './AboutPage';

import heroSlide1 from '../assets/hero_slide_1.png';
import heroSlide2 from '../assets/hero_slide_2.png';
import heroSlide3 from '../assets/hero_slide_3.png';
import aboutFacility from '../assets/about_facility.png';

export default function LandingPage({ onNavigate }) {
    // Carousel Slides State
    const [currentSlide, setCurrentSlide] = useState(0);

    // Contact Form State for Landing Page
    const [contactName, setContactName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [contactMessage, setContactMessage] = useState('');
    const [contactSubmitted, setContactSubmitted] = useState(false);

    const handleContactSubmit = (e) => {
        e.preventDefault();
        if (contactName && contactEmail && contactMessage) {
            setContactSubmitted(true);
            setContactName('');
            setContactEmail('');
            setContactMessage('');
        }
    };

    const slides = [
        {
            image: heroSlide1,
            title: "Smart Eye Care Booking & Clinic Flow",
            subtitle: "Next-Gen Optometry Management System",
            description: "UCC Eye Clinic's integrated platform for appointment booking, real-time status tracking, campus digital navigation, and voice assistance.",
            buttonText: "Book Appointment",
            badge: "Live Capacity Sync",
            bgGradient: "from-emerald-950 via-[#103B29] to-slate-900",
            graphicTitle: "UCC Eye Clinic Desk",
            graphicTag: "Slots Open"
        },
        {
            image: heroSlide2,
            title: "Glaucoma Screening & Retinal Diagnostics",
            subtitle: "Comprehensive Ocular Examinations",
            description: "State-of-the-art intraocular pressure measurement and visual field testing to safeguard your vision against silent glaucoma progression.",
            buttonText: "Explore Services",
            badge: "Modern Equipment",
            bgGradient: "from-[#103B29] via-emerald-900 to-slate-900",
            graphicTitle: "Tonometry & IOP Check",
            graphicTag: "Specialist Care"
        },
        {
            image: heroSlide3,
            title: "Turn-by-Turn Campus Digital Wayfinding",
            subtitle: "Interactive Campus Navigation Tour",
            description: "Never get lost on UCC campus! Navigate directly from Sam Jonah Library, Casely Hayford, or Hall of Residence to the Eye Clinic.",
            buttonText: "Start Campus Tour",
            badge: "9 UCC Landmarks",
            bgGradient: "from-[#103B29] via-teal-900 to-[#103B29]",
            graphicTitle: "UCC Digital Guide",
            graphicTag: "Audio Guidance"
        }
    ];

    useEffect(() => {
        const timer = setInterval(() => {
            setCurrentSlide((prev) => (prev + 1) % slides.length);
        }, 5000);
        return () => clearInterval(timer);
    }, [slides.length]);

    const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % slides.length);
    const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);

    // Why Choose Us Items
    const whyChooseUsItems = [
        {
            icon: Eye,
            title: "Modern Equipment",
            desc: "Equipped with advanced Goldmann applanation tonometers, digital fundus cameras, and automated visual field perimeters."
        },
        {
            icon: Compass,
            title: "Navigation Tour",
            desc: "Step-by-step digital wayfinding tour covering key UCC campus landmarks straight to the Eye Clinic reception desk."
        },
        {
            icon: Stethoscope,
            title: "Experienced Specialist",
            desc: "Board-certified optometrists and clinical specialists dedicated to pediatric care, glaucoma management, and visual rehabilitation."
        },
        {
            icon: Mic,
            title: "Multilingual Support",
            desc: "Voice-to-voice translation assistance bridging English and Akan (Twi/Fante) for accessible patient-doctor communication."
        },
        {
            icon: Calendar,
            title: "Seamless Booking",
            desc: "Real-time calendar slot locking with automated approval, reschedule alerts, and instant notification updates."
        }
    ];

    // Patient Testimonials Cards
    const patientTestimonials = [
        {
            name: "Ama Mensah",
            role: "Level 300 Student",
            rating: 5,
            review: "Booking my glaucoma screening on OptiFlow took less than a minute! I received instant confirmation and the campus navigation tour guided me straight to the room.",
            avatarBg: "bg-[#103B29]"
        },
        {
            name: "Kwesi Appiah",
            role: "UCC Faculty Member",
            rating: 5,
            review: "The specialists at UCC Eye Clinic are exceptionally thorough. Dr. Kwame Mensah performed a comprehensive refraction and prescribed perfect glasses.",
            avatarBg: "bg-emerald-700"
        },
        {
            name: "Abena Ofori",
            role: "Level 100 Student",
            rating: 5,
            review: "I loved the voice translation feature! The staff were warm and the onboarding process was smooth and friendly.",
            avatarBg: "bg-teal-700"
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 font-sans">

            {/* 1. HERO CAROUSEL / SLIDER SECTION */}
            <section className="relative overflow-hidden text-white bg-slate-950">

                {/* Horizontal Sliding Track Container */}
                <div
                    className="flex transition-transform duration-700 ease-in-out w-full"
                    style={{ transform: `translateX(-${currentSlide * 100}%)` }}
                >
                    {slides.map((slide, idx) => (
                        <div
                            key={idx}
                            className="w-full flex-shrink-0 relative min-h-[580px] lg:min-h-[640px] flex items-center"
                        >
                            {/* Slide Background Image */}
                            <img
                                src={slide.image}
                                alt={slide.title}
                                className="absolute inset-0 w-full h-full object-cover object-center"
                            />
                            {/* Dark Gradient Overlay for High Readability */}
                            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-[#103B29]/90 to-slate-900/80 backdrop-blur-[2px]"></div>

                            {/* Hero Foreground Content for Each Slide */}
                            <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
                                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">

                                    {/* Slide Left Text Content (7 cols) */}
                                    <div className="lg:col-span-7 space-y-6">
                                        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 border border-white/20 text-[#6FCF97] text-xs font-bold uppercase tracking-wider backdrop-blur-md">
                                            <Sparkles className="w-4 h-4 text-[#6FCF97]" />
                                            {slide.subtitle}
                                        </div>

                                        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight drop-shadow-md">
                                            {slide.title}
                                        </h1>

                                        <p className="text-slate-200 text-sm sm:text-base leading-relaxed font-normal max-w-xl">
                                            {slide.description}
                                        </p>

                                        {/* Action Buttons */}
                                        <div className="flex flex-wrap gap-4 pt-2">
                                            <button
                                                onClick={() => onNavigate('signup')}
                                                className="flex items-center gap-3 bg-[#6FCF97] hover:bg-[#52c17d] text-slate-900 px-8 py-4 rounded-2xl font-black text-sm shadow-2xl transition-all transform hover:-translate-y-0.5 cursor-pointer"
                                            >
                                                {slide.buttonText} <ArrowRight className="w-5 h-5" />
                                            </button>

                                            <button
                                                onClick={() => onNavigate('services')}
                                                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/30 px-6 py-4 rounded-2xl font-bold text-sm backdrop-blur-md transition-colors cursor-pointer"
                                            >
                                                Explore Eye Services
                                            </button>
                                        </div>

                                        {/* Slide Metrics Indicators */}
                                        <div className="pt-6 grid grid-cols-3 gap-4 border-t border-white/20 max-w-md">
                                            <div>
                                                <div className="text-xl sm:text-2xl font-black text-[#6FCF97]">82.4</div>
                                                <div className="text-[10px] text-slate-300 font-medium">Booking SUS Score</div>
                                            </div>
                                            <div>
                                                <div className="text-xl sm:text-2xl font-black text-emerald-400">80.1</div>
                                                <div className="text-[10px] text-slate-300 font-medium">Nav Usability</div>
                                            </div>
                                            <div>
                                                <div className="text-xl sm:text-2xl font-black text-emerald-300">0.6s</div>
                                                <div className="text-[10px] text-slate-300 font-medium">Avg Slot Response</div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Slide Right Graphic Card (5 cols) */}
                                    <div className="lg:col-span-5 relative">
                                        <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-5 shadow-2xl space-y-4">
                                            <div className="relative rounded-2xl overflow-hidden h-48 border border-white/20 shadow-inner group">
                                                <img
                                                    src={slide.image}
                                                    alt="Clinic Preview"
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                                />
                                                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
                                                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                                                    <span className="text-xs font-extrabold text-white bg-slate-900/80 px-2.5 py-1 rounded-lg backdrop-blur-md">
                                                        {slide.graphicTitle}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-slate-900 bg-[#6FCF97] px-2 py-0.5 rounded-full">
                                                        {slide.graphicTag}
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-2.5 text-xs text-white">
                                                <div className="p-3 bg-black/30 rounded-xl border border-white/10 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-4 h-4 text-[#6FCF97]" />
                                                        <span>Live Clinic Capacity</span>
                                                    </div>
                                                    <span className="font-bold text-[#6FCF97]">5 Slots Open</span>
                                                </div>

                                                <div className="p-3 bg-black/30 rounded-xl border border-white/10 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <Compass className="w-4 h-4 text-emerald-300" />
                                                        <span>Campus Digital Navigation</span>
                                                    </div>
                                                    <span className="text-slate-300">4 min walk</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Overlaid Navigation Controls & Progress Dots */}
                <div className="absolute bottom-6 left-0 right-0 z-30 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between pt-4 border-t border-white/20">
                        <div className="flex items-center gap-2">
                            {slides.map((_, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setCurrentSlide(idx)}
                                    className={`h-2.5 rounded-full transition-all cursor-pointer ${currentSlide === idx ? 'w-8 bg-[#6FCF97]' : 'w-2.5 bg-white/40 hover:bg-white/70'
                                        }`}
                                    title={`Go to slide ${idx + 1}`}
                                ></button>
                            ))}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                onClick={prevSlide}
                                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors backdrop-blur-md"
                                title="Previous Slide"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={nextSlide}
                                className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-colors backdrop-blur-md"
                                title="Next Slide"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>

            </section>

            {/* 2. ABOUT US SECTION */}
            <section className="py-20 bg-white border-b border-slate-200/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

                        {/* Left Column: Clinic Facility Image & Stats Overlay (5 cols) */}
                        <div className="lg:col-span-5 relative">
                            <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-emerald-100 group">
                                <img
                                    src={aboutFacility}
                                    alt="UCC Eye Clinic Facility"
                                    className="w-full h-[400px] object-cover group-hover:scale-105 transition-transform duration-700"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
                                <div className="absolute bottom-6 left-6 right-6 text-white space-y-1">
                                    <div className="inline-block text-[10px] font-bold text-slate-900 bg-[#6FCF97] px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
                                        Department of Optometry
                                    </div>
                                    <h3 className="text-xl font-bold">UCC Eye Clinic Reception & Diagnostic Facility</h3>
                                    <p className="text-xs text-slate-300">University of Cape Coast, Ghana</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Column: About Us Story & Highlights (7 cols) */}
                        <div className="lg:col-span-7 space-y-6">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold uppercase tracking-wider">
                                <Sparkles className="w-4 h-4 text-[#27AE60]" />
                                About UCC Eye Clinic
                            </div>

                            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight">
                                Delivering World-Class <span className="text-[#27AE60]">Optometry Care</span> to UCC Community
                            </h2>

                            <p className="text-slate-600 text-sm leading-relaxed font-normal">
                                UCC Eye Clinic is an academic and clinical optometric center located within the University of Cape Coast. We combine specialized eye examinations, advanced glaucoma screening, pediatric vision testing, and digital healthcare access for students, staff, and the local community.
                            </p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-semibold text-slate-800">
                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-[#27AE60] flex-shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-bold text-slate-900">Advanced Diagnostic Tech</div>
                                        <div className="text-slate-500 font-normal mt-0.5">High precision intraocular pressure & visual field testing.</div>
                                    </div>
                                </div>

                                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-start gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-[#27AE60] flex-shrink-0 mt-0.5" />
                                    <div>
                                        <div className="font-bold text-slate-900">Digital Campus Navigation</div>
                                        <div className="text-slate-500 font-normal mt-0.5">Turn-by-turn guidance covering 9 major UCC campus locations.</div>
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 flex flex-wrap items-center gap-4">
                                <button
                                    onClick={() => onNavigate('about')}
                                    className="px-6 py-3.5 bg-[#103B29] hover:bg-emerald-900 text-white rounded-2xl font-bold text-xs inline-flex items-center gap-2 transition-colors cursor-pointer"
                                >
                                    Learn More About Us <ArrowRight className="w-4 h-4 text-[#6FCF97]" />
                                </button>
                                <button
                                    onClick={() => onNavigate('signup')}
                                    className="px-6 py-3.5 bg-[#6FCF97] hover:bg-[#52c17d] text-slate-900 rounded-2xl font-bold text-xs transition-colors cursor-pointer shadow-xs"
                                >
                                    Book Appointment Now
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            </section>

            {/* 3. WHY CHOOSE US SECTION */}
            <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                <div className="text-center max-w-2xl mx-auto space-y-3">
                    <span className="px-3.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs uppercase rounded-full tracking-wider">
                        Why Choose UCC Eye Clinic
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
                        Built for Modern <span className="text-[#27AE60]">Clinical Excellence</span>
                    </h2>
                    <p className="text-slate-600 text-xs sm:text-sm">
                        Combining expert optometric diagnosis with digital wayfinding and voice accessibility.
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                    {whyChooseUsItems.map((item, idx) => {
                        const Icon = item.icon;
                        return (
                            <div key={idx} className="bg-white p-6 rounded-3xl border border-emerald-100 shadow-lg hover:border-emerald-300 transition-all flex flex-col justify-between space-y-4">
                                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#27AE60] flex items-center justify-center font-bold">
                                    <Icon className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-extrabold text-slate-900 text-base mb-1.5">{item.title}</h3>
                                    <p className="text-xs text-slate-600 leading-relaxed font-normal">{item.desc}</p>
                                </div>
                                <div className="pt-2 text-[10px] font-bold text-emerald-700 flex items-center gap-1">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Verified Feature
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* 4. MEET OUR SPECIALIST SECTION WITH DOCTOR PORTRAIT IMAGES */}
            <section className="py-20 bg-white border-y border-slate-200/80">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                        <div>
                            <span className="px-3.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs uppercase rounded-full tracking-wider">
                                Clinical Leaders
                            </span>
                            <h2 className="text-3xl font-black text-slate-900 mt-2">
                                Meet Our Specialists
                            </h2>
                        </div>
                        <button
                            onClick={() => onNavigate('about')}
                            className="text-xs font-bold text-[#27AE60] hover:underline cursor-pointer flex items-center gap-1"
                        >
                            View Full Department Profile ➔
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {specialists.map((doc) => (
                            <div key={doc.id} className="bg-slate-50 rounded-3xl overflow-hidden border border-slate-200/80 shadow-xs hover:border-emerald-300 transition-all flex flex-col justify-between group">

                                {/* Doctor Portrait Image */}
                                <div className="relative h-64 overflow-hidden border-b border-slate-200">
                                    <img
                                        src={doc.image}
                                        alt={doc.name}
                                        className="w-full h-full object-cover object-top group-hover:scale-105 transition-transform duration-700"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent"></div>
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

            {/* 5. WHAT OUR PATIENTS SAY */}
            <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
                <div className="text-center max-w-2xl mx-auto space-y-3">
                    <span className="px-3.5 py-1 bg-emerald-100 text-emerald-800 font-extrabold text-xs uppercase rounded-full tracking-wider">
                        Patient Experience
                    </span>
                    <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
                        What Our Patients Say
                    </h2>
                    <p className="text-slate-600 text-xs sm:text-sm">
                        Feedback from UCC students, faculty, and local patients.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {patientTestimonials.map((t, idx) => (
                        <div key={idx} className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-xl space-y-4 flex flex-col justify-between">
                            <div className="space-y-3">
                                <div className="flex text-amber-400 gap-1">
                                    {[...Array(t.rating)].map((_, i) => (
                                        <Star key={i} className="w-4 h-4 fill-amber-400" />
                                    ))}
                                </div>
                                <p className="text-xs text-slate-700 leading-relaxed italic">
                                    "{t.review}"
                                </p>
                            </div>
                            <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                                <div className={`w-10 h-10 rounded-full ${t.avatarBg} text-white font-bold text-xs flex items-center justify-center`}>
                                    {t.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="font-bold text-slate-900 text-xs">{t.name}</div>
                                    <div className="text-[10px] text-slate-500 font-medium">{t.role}</div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </section>

            {/* 6. CONTACT US SECTION (DIRECTLY ABOVE FOOTER AS REQUESTED) */}
            <section className="py-20 bg-slate-900 text-white border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">

                        {/* Left Info Column (5 cols) */}
                        <div className="lg:col-span-5 space-y-6">
                            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-900/60 border border-emerald-700/50 text-[#6FCF97] text-xs font-bold uppercase tracking-wider">
                                <Sparkles className="w-4 h-4 text-[#6FCF97]" />
                                Contact UCC Eye Clinic Desk
                            </div>

                            <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
                                Get In Touch <span className="text-[#6FCF97]">With Us</span>
                            </h2>

                            <p className="text-slate-300 text-sm leading-relaxed">
                                Have inquiries regarding appointment scheduling, glaucoma screenings, or visual prescriptions? Reach out to our clinical reception officers directly.
                            </p>

                            <div className="space-y-4 text-xs text-slate-300 font-medium pt-2">
                                <div className="flex items-start gap-3.5">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 text-[#6FCF97] flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-sm">Physical Address</div>
                                        <p className="text-slate-400 mt-0.5">UCC Eye Clinic Building, Department of Optometry, University of Cape Coast, Ghana</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3.5">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 text-[#6FCF97] flex items-center justify-center flex-shrink-0">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-sm">Reception Helpline</div>
                                        <p className="text-slate-400 mt-0.5">+233 (0) 24 000 0000 / +233 (0) 33 213 2440</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3.5">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 text-[#6FCF97] flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-white text-sm">Email Address</div>
                                        <p className="text-slate-400 mt-0.5">eyeclinic@ucc.edu.gh</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Contact Form Card (7 cols) */}
                        <div className="lg:col-span-7 bg-white text-slate-900 rounded-3xl p-8 shadow-2xl border border-slate-200 space-y-6">
                            <div className="border-b border-slate-100 pb-3">
                                <h3 className="text-xl font-bold text-slate-900">Send Reception a Message</h3>
                                <p className="text-xs text-slate-500 mt-0.5">Our reception officer will respond to your query promptly.</p>
                            </div>

                            {contactSubmitted ? (
                                <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                                    <CheckCircle2 className="w-12 h-12 text-[#27AE60] mx-auto" />
                                    <h4 className="font-bold text-slate-900 text-base">Message Sent Successfully!</h4>
                                    <p className="text-xs text-slate-600">
                                        Thank you for reaching out to UCC Eye Clinic. We will respond to your email address shortly.
                                    </p>
                                    <button
                                        onClick={() => setContactSubmitted(false)}
                                        className="px-4 py-2 bg-[#103B29] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                    >
                                        Send Another Message
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleContactSubmit} className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name</label>
                                            <input
                                                type="text"
                                                required
                                                placeholder="e.g. Kwesi Mensah"
                                                value={contactName}
                                                onChange={(e) => setContactName(e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#6FCF97] focus:bg-white transition-all"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                                            <input
                                                type="email"
                                                required
                                                placeholder="e.g. kwesi@example.com"
                                                value={contactEmail}
                                                onChange={(e) => setContactEmail(e.target.value)}
                                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#6FCF97] focus:bg-white transition-all"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 mb-1">Your Message or Query</label>
                                        <textarea
                                            rows={3}
                                            required
                                            placeholder="How can our eye clinic help you?"
                                            value={contactMessage}
                                            onChange={(e) => setContactMessage(e.target.value)}
                                            className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#6FCF97] focus:bg-white transition-all resize-none"
                                        ></textarea>
                                    </div>

                                    <button
                                        type="submit"
                                        className="w-full py-3.5 bg-[#6FCF97] hover:bg-[#52c17d] text-slate-900 font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs text-xs"
                                    >
                                        <Send className="w-4 h-4" /> Send Message to Reception
                                    </button>
                                </form>
                            )}
                        </div>

                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[#6FCF97] text-slate-900 flex items-center justify-center font-black">
                            <Eye className="w-5 h-5" />
                        </div>
                        <span className="text-lg font-bold text-white tracking-tight">OptiFlow UCC</span>
                    </div>
                    <div className="flex gap-6 text-xs text-slate-400 font-medium">
                        <button onClick={() => onNavigate('home')} className="hover:text-white cursor-pointer">Home</button>
                        <button onClick={() => onNavigate('services')} className="hover:text-white cursor-pointer">Services</button>
                        <button onClick={() => onNavigate('about')} className="hover:text-white cursor-pointer">About Us</button>
                        <button onClick={() => onNavigate('contact')} className="hover:text-white cursor-pointer">Contact</button>
                    </div>
                    <p className="text-xs text-slate-500">
                        © {new Date().getFullYear()} UCC Eye Clinic Optometry System. Powered by Supabase & React.
                    </p>
                </div>
            </footer>

        </div>
    );
}
