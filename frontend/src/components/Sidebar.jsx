import React from 'react';
import { LayoutDashboard, Calendar, MapPin, Mic, Clock, CheckSquare, Settings, HelpCircle, LogOut, X, Smartphone, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

export default function Sidebar({ currentPage, onNavigate, mobileOpen, setMobileOpen }) {
    const { profile, logout } = useAuth();
    const { showToast } = useToast();
    const role = profile?.role || 'student';

    const menuItems = [
        {
            id: 'portal',
            label: role === 'superadmin' 
                ? 'Super Admin Governance' 
                : role === 'doctor_assistant' 
                ? 'Assistant Triage' 
                : 'Dashboard',
            icon: LayoutDashboard,
            active: currentPage === 'dashboard' || currentPage === 'portal'
        },
        ...(role === 'student' ? [
            {
                id: 'student-booking',
                label: 'Book Appointment',
                icon: Calendar,
                active: currentPage === 'student-booking'
            },
            {
                id: 'student-track',
                label: 'My Appointments',
                icon: Clock,
                active: currentPage === 'student-track'
            }
        ] : role === 'doctor' ? [
            {
                id: 'doctor-dashboard',
                label: 'Assigned Consultations',
                icon: CheckSquare,
                active: currentPage === 'doctor-dashboard'
            },
            {
                id: 'doctor-assistant-tracker',
                label: 'Assistant Tracker',
                icon: UserCheck,
                active: currentPage === 'doctor-assistant-tracker'
            }
        ] : (role === 'superadmin' || role === 'doctor_assistant') ? [] : [
            {
                id: 'admin-capacity',
                label: 'Capacity Calendar',
                icon: Calendar,
                active: currentPage === 'admin-capacity'
            },
            {
                id: 'admin-bookings',
                label: 'Approve & Reschedule',
                icon: CheckSquare,
                active: currentPage === 'admin-bookings'
            }
        ]),
    ];

    const serviceItems = [
        {
            id: 'navigation-tour',
            label: 'Campus Navigation',
            icon: MapPin,
            badge: 'Map',
            active: currentPage === 'navigation-tour'
        },
        {
            id: 'voice-translation',
            label: 'Voice Translator',
            icon: Mic,
            badge: 'Voice',
            active: currentPage === 'voice-translation'
        }
    ];

    const sidebarContent = (
        <div className="flex flex-col justify-between h-full p-5 font-sans">
            <div className="space-y-6">
                
                {/* Section 1: Main Menu */}
                <div className="space-y-1">
                    <div className="flex items-center justify-between px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        <span>MENU</span>
                        {setMobileOpen && (
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="lg:hidden p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                    <nav className="space-y-1">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        onNavigate(item.id);
                                        if (setMobileOpen) setMobileOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-medium text-xs sm:text-sm transition-all cursor-pointer ${
                                        item.active
                                            ? 'bg-[#103B29] text-white font-semibold shadow-sm'
                                            : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon className={`w-4 h-4 ${item.active ? 'text-[#6FCF97]' : 'text-slate-400'}`} />
                                        <span>{item.label}</span>
                                    </div>
                                    {item.active && (
                                        <div className="w-1.5 h-4 bg-[#6FCF97] rounded-full"></div>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Section 2: Clinic Tools */}
                <div className="space-y-1 pt-2">
                    <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        CLINIC SERVICES
                    </div>
                    <nav className="space-y-1">
                        {serviceItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        onNavigate(item.id);
                                        if (setMobileOpen) setMobileOpen(false);
                                    }}
                                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl font-medium text-xs sm:text-sm transition-all cursor-pointer ${
                                        item.active
                                            ? 'bg-[#103B29] text-white font-semibold shadow-sm'
                                            : 'text-slate-600 hover:bg-slate-100/80 hover:text-slate-900'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <Icon className={`w-4 h-4 ${item.active ? 'text-[#6FCF97]' : 'text-slate-400'}`} />
                                        <span>{item.label}</span>
                                    </div>
                                    {item.badge && (
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                                            item.active ? 'bg-[#6FCF97] text-slate-900' : 'bg-slate-100 text-slate-500'
                                        }`}>
                                            {item.badge}
                                        </span>
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Section 3: General */}
                <div className="space-y-1 pt-2">
                    <div className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                        GENERAL
                    </div>
                    <nav className="space-y-1">
                        <button
                            onClick={() => { onNavigate('dashboard'); if (setMobileOpen) setMobileOpen(false); }}
                            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-medium text-xs text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 cursor-pointer"
                        >
                            <Settings className="w-4 h-4 text-slate-400" />
                            <span>Settings</span>
                        </button>
                        <button
                            onClick={() => { onNavigate('landing'); if (setMobileOpen) setMobileOpen(false); }}
                            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-medium text-xs text-slate-600 hover:bg-slate-100/80 hover:text-slate-900 cursor-pointer"
                        >
                            <HelpCircle className="w-4 h-4 text-slate-400" />
                            <span>Help & Support</span>
                        </button>
                        {profile && (
                            <button
                                onClick={logout}
                                className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-2xl font-medium text-xs text-red-600 hover:bg-red-50 cursor-pointer"
                            >
                                <LogOut className="w-4 h-4 text-red-500" />
                                <span>Logout</span>
                            </button>
                        )}
                    </nav>
                </div>

            </div>
        </div>
    );


    return (
        <>
            {/* Desktop Sidebar */}
            <aside className="hidden lg:block w-72 lg:w-80 bg-white border-r border-slate-200/80 shrink-0 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto shadow-xs">
                {sidebarContent}
            </aside>

            {/* Mobile Overlay Sidebar Drawer */}
            {mobileOpen && (
                <div className="fixed inset-0 z-50 lg:hidden flex">
                    {/* Backdrop */}
                    <div 
                        onClick={() => setMobileOpen(false)}
                        className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
                    ></div>

                    {/* Drawer Content */}
                    <aside className="relative z-10 w-80 bg-white h-full shadow-2xl overflow-y-auto">
                        {sidebarContent}
                    </aside>
                </div>
            )}
        </>
    );
}



