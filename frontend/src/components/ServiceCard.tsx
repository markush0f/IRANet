import React from 'react';
import type { Service, ServiceType } from '../types';

interface ServiceCardProps {
    service: Service;
    onCheck: (id: string) => void;
    onViewLogs: (id: string) => void;
    onUpdate: (id: string, field: 'url' | 'healthEndpoint' | 'name', value: string) => void;
    onDelete: (id: string) => void;
}

const ServiceCard: React.FC<ServiceCardProps> = ({ service, onCheck, onViewLogs, onUpdate, onDelete }) => {

    const getStatusColor = (status: Service['status']) => {
        switch (status) {
            case 'online': return 'bg-emerald-500 shadow-emerald-500/20';
            case 'offline': return 'bg-rose-500 shadow-rose-500/20';
            case 'loading': return 'bg-zinc-600 animate-pulse';
            case 'error': return 'bg-amber-500 shadow-amber-500/20';
            default: return 'bg-zinc-700';
        }
    };

    const getStatusText = (status: Service['status']) => {
        switch (status) {
            case 'online': return 'text-emerald-400';
            case 'offline': return 'text-rose-400';
            case 'loading': return 'text-zinc-400';
            case 'error': return 'text-amber-400';
            default: return 'text-zinc-500';
        }
    }

    const getServiceIcon = (type: ServiceType) => {
        switch (type) {
            case 'database':
                return (
                    <svg className="w-5 h-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                    </svg>
                );
            case 'nginx':
                return (
                    <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                    </svg>
                );
            case 'docker':
                return (
                    <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                );
            case 'redis':
                return (
                    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                );
            case 'linux':
                return (
                    <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                );
            default: // http
                return (
                    <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                );
        }
    };

    return (
        <div
            className="group relative bg-zinc-900 rounded-xl border border-zinc-800 p-5 transition-all duration-300 hover:shadow-2xl hover:shadow-black/50 hover:border-zinc-700 hover:-translate-y-1"
        >
            <div className="absolute top-4 right-4 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(service.id); }}
                    className="p-2 rounded-lg text-zinc-600 hover:text-rose-400 hover:bg-rose-900/20 transition-all"
                    title="Delete Service"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                    </svg>
                </button>
            </div>

            <div className="flex justify-between items-start mb-6 pt-2">
                <div className="flex-1 mr-4">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-zinc-950 rounded-lg border border-zinc-800/50 shadow-inner">
                            {getServiceIcon(service.type)}
                        </div>
                        <div className="flex-1">
                            <input
                                value={service.name}
                                onChange={(e) => onUpdate(service.id, 'name', e.target.value)}
                                className="text-base font-semibold text-zinc-100 bg-transparent border-b border-transparent focus:border-zinc-700 p-0 focus:ring-0 w-full placeholder-zinc-600 focus:text-white transition-all cursor-text rounded-none"
                                placeholder="Service Name"
                            />
                            <div className="flex items-center gap-2 mt-1">
                                <div className={`w-1.5 h-1.5 rounded-full ${getStatusColor(service.status)}`}></div>
                                <p className={`text-[10px] font-bold uppercase tracking-widest ${getStatusText(service.status)}`}>
                                    {service.status}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4 mb-6">
                <div className="group/input relative z-10 opacity-60 pointer-events-none">
                    <label className="absolute -top-2 left-2 px-1.5 bg-zinc-900 text-[10px] font-bold text-zinc-500 uppercase tracking-wider border border-zinc-800 rounded-md">
                        Detected Type
                    </label>
                    <div className="w-full text-xs font-mono text-zinc-400 bg-zinc-950/20 border border-zinc-800/50 rounded-lg px-3 py-3 capitalize">
                        {service.type} Protocol
                    </div>
                </div>

                <div className="group/input relative">
                    <label className="absolute -top-2 left-2 px-1.5 bg-zinc-900 text-[10px] font-bold text-zinc-500 uppercase tracking-wider transition-colors group-focus-within/input:text-indigo-400 border border-zinc-800 rounded-md group-focus-within/input:border-indigo-500/30">
                        Endpoint
                    </label>
                    <input
                        type="text"
                        value={service.url}
                        onChange={(e) => onUpdate(service.id, 'url', e.target.value)}
                        className="w-full text-xs font-mono text-zinc-300 bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-3 focus:bg-zinc-900 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all placeholder-zinc-700"
                        placeholder="https://api.example.com"
                    />
                </div>
                <div className="group/input relative">
                    <label className="absolute -top-2 left-2 px-1.5 bg-zinc-900 text-[10px] font-bold text-zinc-500 uppercase tracking-wider transition-colors group-focus-within/input:text-indigo-400 border border-zinc-800 rounded-md group-focus-within/input:border-indigo-500/30">
                        Health Path
                    </label>
                    <input
                        type="text"
                        value={service.healthEndpoint}
                        onChange={(e) => onUpdate(service.id, 'healthEndpoint', e.target.value)}
                        className="w-full text-xs font-mono text-zinc-300 bg-zinc-950/50 border border-zinc-800 rounded-lg px-3 py-3 focus:bg-zinc-900 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/50 outline-none transition-all placeholder-zinc-700"
                        placeholder="/health"
                    />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                    onClick={() => onCheck(service.id)}
                    disabled={service.status === 'loading'}
                    className="flex justify-center items-center gap-2 px-3 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold rounded-lg border border-zinc-700/50 hover:border-zinc-600 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed group/btn"
                >
                    <svg className={`w-3.5 h-3.5 group-hover/btn:text-white ${service.status === 'loading' ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Check
                </button>
                <button
                    onClick={() => onViewLogs(service.id)}
                    className="flex justify-center items-center gap-2 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-lg transition-all shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/30"
                >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Logs
                </button>
            </div>
        </div>
    );
};

export default ServiceCard;
