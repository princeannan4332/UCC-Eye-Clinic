import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

export default function CustomSelect({ options, value, onChange, placeholder = 'Select an option', className = '' }) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);

    const selectedOption = options.find(opt => (typeof opt === 'object' ? opt.value : opt) === value);
    const selectedLabel = selectedOption 
        ? (typeof selectedOption === 'object' ? selectedOption.label : selectedOption) 
        : placeholder;

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className={`relative w-full ${className}`} ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="w-full px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 flex items-center justify-between transition-colors cursor-pointer focus:outline-none focus:border-[#6FCF97]"
            >
                <span className="truncate">{selectedLabel}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-emerald-600' : ''}`} />
            </button>

            {isOpen && (
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white border border-slate-200/80 rounded-xl shadow-lg max-h-60 overflow-y-auto p-1.5 space-y-1">
                    {options.map((opt) => {
                        const optValue = typeof opt === 'object' ? opt.value : opt;
                        const optLabel = typeof opt === 'object' ? opt.label : opt;
                        const isSelected = optValue === value;

                        return (
                            <button
                                key={optValue}
                                type="button"
                                onClick={() => {
                                    onChange(optValue);
                                    setIsOpen(false);
                                }}
                                className={`w-full px-3 py-2 rounded-lg text-xs font-medium text-left flex items-center justify-between transition-colors cursor-pointer ${
                                    isSelected 
                                        ? 'bg-emerald-50 text-[#103B29] font-bold' 
                                        : 'text-slate-700 hover:bg-slate-50'
                                }`}
                            >
                                <span className="truncate">{optLabel}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-[#27AE60]" />}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
