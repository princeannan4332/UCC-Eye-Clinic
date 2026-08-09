import React from 'react';
import { Eye, LogOut, Menu, Bell } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import NotificationBell from './NotificationBell';

export default function Navbar({ onNavigate, currentPage, mobileOpen, setMobileOpen }) {
    const { profile, logout } = useAuth();

    return (
        <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 font-sans">
            <div className="w-full px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">

                
                {/* Left Section: Mobile Menu & Brand */}
                <div className="flex items-center gap-4">
                    {/* Mobile Menu Hamburger */}
                    <button
                        onClick={() => setMobileOpen && setMobileOpen(!mobileOpen)}
                        className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl bg-slate-100/80 cursor-pointer"
                        title="Toggle Navigation"
                    >
                        <Menu className="w-5 h-5" />
                    </button>

                    {/* Logo & Title */}
                    <div 
                        onClick={() => onNavigate('home')}
                        className="flex items-center gap-3 cursor-pointer group select-none"
                    >
                        <div className="w-9 h-9 rounded-xl bg-[#6FCF97] text-slate-900 flex items-center justify-center font-black group-hover:scale-105 transition-transform shadow-xs">
                            <Eye className="w-5 h-5 text-slate-900" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-lg font-black tracking-tight text-slate-900">
                                Opti<span className="text-[#27AE60]">Flow</span>
                            </span>
                            <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider text-slate-700 bg-slate-100 rounded-md border border-slate-200/60">
                                UCC Eye Clinic
                            </span>
                        </div>
                    </div>
                </div>

                {/* Navigation Links for Public Pages */}
                <nav className="hidden md:flex items-center gap-1 font-semibold text-xs text-slate-700">
                    <button
                        onClick={() => onNavigate('home')}
                        className={`px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                            currentPage === 'home' || currentPage === 'landing' ? 'bg-emerald-50 text-[#27AE60] font-bold' : 'hover:text-[#27AE60] hover:bg-slate-50'
                        }`}
                    >
                        Home
                    </button>

                    <button
                        onClick={() => onNavigate('services')}
                        className={`px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                            currentPage === 'services' ? 'bg-emerald-50 text-[#27AE60] font-bold' : 'hover:text-[#27AE60] hover:bg-slate-50'
                        }`}
                    >
                        Services
                    </button>

                    <button
                        onClick={() => onNavigate('about')}
                        className={`px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                            currentPage === 'about' ? 'bg-emerald-50 text-[#27AE60] font-bold' : 'hover:text-[#27AE60] hover:bg-slate-50'
                        }`}
                    >
                        About Us
                    </button>

                    <button
                        onClick={() => onNavigate('contact')}
                        className={`px-3 py-2 rounded-xl transition-colors cursor-pointer ${
                            currentPage === 'contact' ? 'bg-emerald-50 text-[#27AE60] font-bold' : 'hover:text-[#27AE60] hover:bg-slate-50'
                        }`}
                    >
                        Contact
                    </button>
                </nav>

                {/* Right Actions: Auth Buttons / Profile Pill */}
                <div className="flex items-center gap-3">
                    {profile ? (
                        <>
                            {/* Notification Bell */}
                            {profile.role === 'student' ? (
                                <NotificationBell />
                            ) : (
                                <div className="p-2 text-slate-500 hover:text-slate-800 rounded-xl bg-slate-100/80 cursor-pointer relative">
                                    <Bell className="w-4 h-4" />
                                    <span className="w-2 h-2 bg-[#6FCF97] rounded-full absolute top-1.5 right-1.5"></span>
                                </div>
                            )}

                            {/* User Profile Pill */}
                            <div 
                                onClick={() => onNavigate('portal')}
                                className="flex items-center gap-2.5 bg-slate-100/80 hover:bg-slate-100 border border-slate-200/80 pl-2 pr-3 py-1.5 rounded-full transition-colors cursor-pointer"
                            >
                                <div className="w-7 h-7 rounded-full bg-[#103B29] text-white flex items-center justify-center font-bold text-xs">
                                    {profile.full_name?.charAt(0) || 'U'}
                                </div>
                                <div className="hidden sm:block text-left text-xs">
                                    <div className="font-bold text-slate-900 leading-none">{profile.full_name}</div>
                                    <div className="text-[10px] text-slate-500 capitalize font-medium mt-0.5">
                                        {profile.role === 'superadmin' ? 'Super Admin' : profile.role === 'doctor_assistant' ? 'Doctor Assistant' : profile.role}
                                    </div>
                                </div>
                            </div>

                            {/* Sign Out Button */}
                            <button
                                onClick={logout}
                                className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
                                title="Sign Out"
                            >
                                <LogOut className="w-4 h-4" />
                            </button>
                        </>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => onNavigate('login')}
                                className="text-xs font-bold text-slate-700 hover:text-[#27AE60] transition-colors cursor-pointer px-3 py-2 rounded-xl"
                            >
                                Sign In
                            </button>
                            <button
                                onClick={() => onNavigate('signup')}
                                className="text-xs font-bold bg-[#6FCF97] hover:bg-[#52c17d] text-slate-900 px-4 py-2 rounded-xl transition-colors cursor-pointer shadow-xs"
                            >
                                Sign Up
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </header>
    );
}
