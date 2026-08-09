import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({
    isOpen,
    title = 'Confirm Action',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'danger', // 'danger' | 'warning' | 'info'
    onConfirm,
    onCancel
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[99999] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 space-y-5 border border-slate-200 shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
                            type === 'danger' ? 'bg-red-50 text-red-600 border border-red-200' :
                            type === 'warning' ? 'bg-amber-50 text-amber-600 border border-amber-200' :
                            'bg-emerald-50 text-emerald-600 border border-emerald-200'
                        }`}>
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="font-extrabold text-slate-900 text-base leading-tight">
                                {title}
                            </h3>
                            <p className="text-xs text-slate-500 font-medium mt-0.5">
                                Please confirm your action below
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onCancel}
                        className="p-1 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 font-semibold leading-relaxed">
                    {message}
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-colors cursor-pointer"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={onConfirm}
                        className={`px-4 py-2.5 font-bold text-xs rounded-xl text-white transition-colors cursor-pointer shadow-xs ${
                            type === 'danger' ? 'bg-red-600 hover:bg-red-700' :
                            type === 'warning' ? 'bg-amber-600 hover:bg-amber-700' :
                            'bg-[#103B29] hover:bg-emerald-900'
                        }`}
                    >
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
}
