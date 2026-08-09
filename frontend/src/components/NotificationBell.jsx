import React, { useState, useEffect } from 'react';
import { Bell, CheckCircle, AlertTriangle, XCircle, Info } from 'lucide-react';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';

export default function NotificationBell() {
    const { profile } = useAuth();
    const [notifications, setNotifications] = useState([]);
    const [isOpen, setIsOpen] = useState(false);

    const fetchNotifications = async () => {
        if (!profile?.id) return;
        try {
            const data = await api.getNotifications(profile.id);
            if (data.notifications) {
                setNotifications(data.notifications);
            }
        } catch (err) {
            console.error('Error loading notifications:', err);
        }
    };

    useEffect(() => {
        fetchNotifications();
        // Poll every 5 seconds for real-time update feel on dashboard
        const interval = setInterval(fetchNotifications, 5000);
        return () => clearInterval(interval);
    }, [profile]);

    const unreadCount = notifications.filter(n => !n.is_read).length;

    const handleMarkRead = async (id) => {
        try {
            await api.markNotificationRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        } catch (e) {
            console.error(e);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500 flex-shrink-0" />;
            case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />;
            case 'danger': return <XCircle className="w-5 h-5 text-red-500 flex-shrink-0" />;
            default: return <Info className="w-5 h-5 text-blue-500 flex-shrink-0" />;
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2 text-slate-600 hover:text-slate-900 rounded-full hover:bg-emerald-50 transition"
                title="Notifications"
            >
                <Bell className="w-6 h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-emerald-600 rounded-full animate-pulse">
                        {unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-emerald-100 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                    <div className="flex items-center justify-between px-4 pb-3 border-b border-slate-100">
                        <h4 className="font-bold text-slate-800 flex items-center gap-2">
                            <Bell className="w-4 h-4 text-emerald-600" /> Notifications
                        </h4>
                        <span className="text-xs bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-semibold">
                            {unreadCount} new
                        </span>
                    </div>

                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-50">
                        {notifications.length === 0 ? (
                            <div className="p-6 text-center text-slate-400 text-sm">
                                No notifications yet
                            </div>
                        ) : (
                            notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => handleMarkRead(n.id)}
                                    className={`p-4 flex gap-3 transition cursor-pointer hover:bg-emerald-50/50 ${!n.is_read ? 'bg-emerald-50/30' : 'opacity-80'}`}
                                >
                                    {getTypeIcon(n.type)}
                                    <div className="flex-1 text-xs">
                                        <div className="font-semibold text-slate-800 mb-0.5">{n.title}</div>
                                        <p className="text-slate-600 leading-relaxed mb-1">{n.message}</p>
                                        <div className="text-[10px] text-slate-400">
                                            {new Date(n.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                    {!n.is_read && (
                                        <div className="w-2 h-2 rounded-full bg-emerald-500 self-center"></div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
