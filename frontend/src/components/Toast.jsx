import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X, AlertTriangle } from 'lucide-react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const removeToast = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);

    const showToast = useCallback((message, type = 'info', duration = 4000) => {
        const id = Date.now() + Math.random();
        setToasts((prev) => [...prev, { id, message, type }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            {/* Toast Container Floating Top Right */}
            <div className="fixed top-5 right-5 z-[9999] flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={`pointer-events-auto flex items-start justify-between gap-3 p-4 rounded-2xl border shadow-xl transition-all duration-300 animate-in slide-in-from-top-3 ${
                            toast.type === 'error'
                                ? 'bg-red-50/95 border-red-200 text-red-900 ring-1 ring-red-300/50'
                                : toast.type === 'success'
                                ? 'bg-emerald-50/95 border-emerald-200 text-emerald-900 ring-1 ring-emerald-300/50'
                                : toast.type === 'warning'
                                ? 'bg-amber-50/95 border-amber-200 text-amber-900 ring-1 ring-amber-300/50'
                                : 'bg-slate-900/95 border-slate-700 text-white shadow-slate-900/20'
                        }`}
                    >
                        <div className="flex items-start gap-3">
                            {toast.type === 'error' && <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />}
                            {toast.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />}
                            {toast.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />}
                            {toast.type === 'info' && <Info className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />}
                            <div className="text-xs font-semibold leading-relaxed">
                                {toast.message}
                            </div>
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="p-1 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer flex-shrink-0"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        return {
            showToast: (msg, type) => console.warn(`[Toast:${type || 'info'}]`, msg)
        };
    }
    return context;
}
