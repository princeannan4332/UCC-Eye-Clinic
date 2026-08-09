import React, { useState } from 'react';
import { Mail, Phone, MapPin, Clock, Send, CheckCircle2, Eye, Sparkles } from 'lucide-react';

export default function ContactPage({ onNavigate }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (name && email && message) {
            setSubmitted(true);
            setName('');
            setEmail('');
            setMessage('');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 font-sans">

            {/* Header Banner */}
            <section className="bg-gradient-to-b from-[#103B29] to-slate-900 text-white py-16 px-4 sm:px-6 lg:px-8 border-b border-emerald-950">
                <div className="max-w-7xl mx-auto text-center space-y-4">
                    <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-900/60 border border-emerald-700/50 text-[#6FCF97] text-xs font-bold uppercase tracking-wider">
                        <Sparkles className="w-4 h-4 text-[#6FCF97]" />
                        Get In Touch With UCC Eye Clinic
                    </div>
                    <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
                        Contact & <span className="text-[#6FCF97]">Location Guide</span>
                    </h1>
                    <p className="text-slate-300 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
                        Have questions about appointment booking, vision screening, or campus navigation? We are here to help.
                    </p>
                </div>
            </section>

            {/* Main Content Grid */}
            <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                    {/* Left: Contact Info & Hours Cards (5 cols) */}
                    <div className="lg:col-span-5 space-y-6">

                        <div className="bg-white rounded-3xl p-8 border border-slate-200/80 shadow-md space-y-6">
                            <h3 className="text-xl font-bold text-slate-900 border-b border-slate-100 pb-3">
                                Clinic Contact Details
                            </h3>

                            <div className="space-y-4 text-xs font-medium text-slate-700">
                                <div className="flex items-start gap-3.5">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#27AE60] flex items-center justify-center flex-shrink-0">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm">Physical Address</div>
                                        <p className="text-slate-500 mt-0.5">UCC Eye Clinic Building, Department of Optometry, University of Cape Coast, Ghana</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3.5">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#27AE60] flex items-center justify-center flex-shrink-0">
                                        <Phone className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm">Reception & Helpline</div>
                                        <p className="text-slate-500 mt-0.5">+233 (0) 24 000 0000 / +233 (0) 33 213 2440</p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3.5">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#27AE60] flex items-center justify-center flex-shrink-0">
                                        <Mail className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <div className="font-bold text-slate-900 text-sm">Email Address</div>
                                        <p className="text-slate-500 mt-0.5">eyeclinic@ucc.edu.gh</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Opening Hours */}
                        <div className="bg-[#103B29] text-white rounded-3xl p-8 shadow-xl space-y-4 border border-emerald-800">
                            <div className="flex items-center gap-3 border-b border-emerald-800 pb-3">
                                <Clock className="w-6 h-6 text-[#6FCF97]" />
                                <h4 className="font-bold text-base">Working Operating Hours</h4>
                            </div>
                            <div className="space-y-2.5 text-xs text-slate-300">
                                <div className="flex justify-between border-b border-emerald-800/60 pb-2">
                                    <span>Monday - Friday</span>
                                    <span className="font-bold text-white">8:00 AM - 5:00 PM</span>
                                </div>
                                <div className="flex justify-between border-b border-emerald-800/60 pb-2">
                                    <span>Saturday</span>
                                    <span className="font-bold text-white">9:00 AM - 2:00 PM (Emergency)</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Sunday & Public Holidays</span>
                                    <span className="font-bold text-[#6FCF97]">Closed</span>
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* Right: Contact Form & Map Guidance (7 cols) */}
                    <div className="lg:col-span-7 bg-white rounded-3xl p-8 border border-slate-200/80 shadow-md space-y-6">
                        <div className="border-b border-slate-100 pb-4">
                            <h3 className="text-xl font-bold text-slate-900">Send Us an Inquiry</h3>
                            <p className="text-xs text-slate-500 mt-1">
                                Fill out the form below to get in touch with our reception team.
                            </p>
                        </div>

                        {submitted ? (
                            <div className="p-8 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-3">
                                <CheckCircle2 className="w-12 h-12 text-[#27AE60] mx-auto" />
                                <h4 className="font-bold text-slate-900 text-base">Message Sent Successfully!</h4>
                                <p className="text-xs text-slate-600">
                                    Thank you for contacting UCC Eye Clinic. Our desk officer will respond to your email shortly.
                                </p>
                                <button
                                    onClick={() => setSubmitted(false)}
                                    className="px-4 py-2 bg-[#103B29] text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                                >
                                    Send Another Message
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="e.g. Kwesi Mensah"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#6FCF97] focus:bg-white transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Email Address</label>
                                    <input
                                        type="email"
                                        required
                                        placeholder="e.g. kwesi@example.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#6FCF97] focus:bg-white transition-all"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Message or Query</label>
                                    <textarea
                                        rows={4}
                                        required
                                        placeholder="How can our eye clinic help you?"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#6FCF97] focus:bg-white transition-all resize-none"
                                    ></textarea>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3.5 bg-[#6FCF97] hover:bg-[#52c17d] text-slate-900 font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2 shadow-xs text-xs"
                                >
                                    <Send className="w-4 h-4" /> Send Message
                                </button>
                            </form>
                        )}
                    </div>

                </div>
            </section>

        </div>
    );
}
