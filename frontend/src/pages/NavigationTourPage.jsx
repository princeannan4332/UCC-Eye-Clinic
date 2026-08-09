import React, { useState } from 'react';
import { Compass, ShieldAlert, MapPin, Building2 } from 'lucide-react';

const LOCATIONS = [
    {
        id: 'main',
        name: 'Main Campus',
        description: 'Full 360-degree virtual spatial navigation to UCC Health Services & Eye Clinic Complex.',
        url: 'https://kuula.co/share/collection/7TMFG?logo=1&info=1&fs=1&vr=0&sd=1&thumbs=1',
        facility: 'UCC Health Services Complex, Eye Clinic Unit',
        coordinates: '5.1054° N, 1.2821° W',
        height: '560',
        heightClass: 'h-[560px]'
    },
    {
        id: 'old',
        name: 'Old Site',
        description: '360-degree virtual spatial navigation for UCC Old Site Campus.',
        url: 'https://kuula.co/share/collection/7TgVY?logo=1&info=1&fs=1&vr=0&sd=1&thumbs=1',
        facility: 'UCC Old Site Campus Complex',
        coordinates: '5.1012° N, 1.2875° W',
        height: '500',
        heightClass: 'h-[500px]'
    }
];

export default function NavigationTourPage() {
    const [activeLocationId, setActiveLocationId] = useState('main');

    const currentLocation = LOCATIONS.find(loc => loc.id === activeLocationId) || LOCATIONS[0];

    return (
        <div className="space-y-6 font-sans">
            
            {/* Notice Banner */}
            <div className="p-3.5 bg-amber-50/70 border border-amber-200/80 rounded-2xl flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0 font-bold">
                        <ShieldAlert className="w-4 h-4" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-extrabold text-amber-900 text-xs">Digital Campus Navigation Tour</span>
                            <span className="px-2 py-0.5 rounded-md bg-amber-200/60 text-amber-900 text-[10px] font-extrabold uppercase tracking-wider">
                                360° Interactive View
                            </span>
                        </div>
                        <p className="text-[11px] text-amber-800 mt-0.5 font-medium">
                            {currentLocation.description}
                        </p>
                    </div>
                </div>
            </div>

            {/* Header Banner */}
            <div className="bg-[#103B29] rounded-3xl p-6 text-white border border-[#103B29] flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-xs">
                <div>
                    <span className="text-[10px] font-extrabold uppercase tracking-wider bg-white/10 text-[#6FCF97] border border-white/20 px-2.5 py-1 rounded-md">
                        UCC Campus Wayfinding
                    </span>
                    <h1 className="text-xl sm:text-3xl font-black mt-2 text-white tracking-tight">
                        360° Virtual Campus Navigation Tour 🗺️
                    </h1>
                    <p className="text-emerald-100/80 text-xs sm:text-sm mt-1 font-normal">
                        Explore UCC campus pathways and navigate with immersive 360-degree panoramic controls.
                    </p>
                </div>
            </div>

            {/* Full-Width Kuula 360 Virtual Tour Card */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200/80 space-y-6 flex flex-col justify-between shadow-xs">
                <div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 pb-4 gap-4">
                        <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                            <Compass className="w-5 h-5 text-[#27AE60]" /> Interactive 360° Campus Virtual Tour
                        </h3>

                        {/* Location Selector Tabs */}
                        <div className="flex items-center gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200/70">
                            {LOCATIONS.map((loc) => {
                                const isActive = loc.id === activeLocationId;
                                return (
                                    <button
                                        key={loc.id}
                                        type="button"
                                        onClick={() => setActiveLocationId(loc.id)}
                                        className={`flex items-center gap-1.5 px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                                            isActive
                                                ? 'bg-[#103B29] text-white shadow-sm'
                                                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                                        }`}
                                    >
                                        <MapPin className={`w-3.5 h-3.5 ${isActive ? 'text-[#6FCF97]' : 'text-slate-400'}`} />
                                        {loc.name}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Kuula 360 Virtual Tour iFrame Embed */}
                    <div className="mt-4 relative bg-slate-900 rounded-3xl overflow-hidden border border-slate-200/80 shadow-md">
                        <iframe
                            key={currentLocation.id}
                            src={currentLocation.url}
                            width="100%"
                            height={currentLocation.height}
                            frameBorder="0"
                            allow="xr-spatial-tracking; gyroscope; accelerometer"
                            allowFullScreen
                            title={`UCC Campus 360 Virtual Navigation Tour - ${currentLocation.name}`}
                            className={`w-full ${currentLocation.heightClass} rounded-3xl`}
                        ></iframe>
                    </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl text-xs text-slate-600 flex flex-col sm:flex-row sm:items-center justify-between border border-slate-100 gap-2">
                    <span>Target Facility: <strong className="text-slate-900 font-extrabold">{currentLocation.facility}</strong></span>
                    <span className="font-extrabold text-emerald-800">GPS Coordinates: {currentLocation.coordinates}</span>
                </div>
            </div>

        </div>
    );
}

