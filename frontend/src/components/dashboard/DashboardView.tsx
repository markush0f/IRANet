import React from 'react';
import ServiceGrid from './ServiceGrid';
import ServiceCard from './ServiceCard';
import type { Service } from '../../types';

interface DashboardViewProps {
    services: Service[];
    onAddService: () => void;
    onRefreshAll: () => void;
    onCheck: (id: string) => void;
    onViewLogs: (id: string) => void;
    onUpdateService: (id: string, field: 'url' | 'healthEndpoint' | 'name', value: string) => void;
    onDeleteService: (id: string) => void;
}

const DashboardView: React.FC<DashboardViewProps> = ({
    services,
    onAddService,
    onRefreshAll,
    onCheck,
    onViewLogs,
    onUpdateService,
    onDeleteService
}) => {
    return (
        <main className="max-w-7xl mx-auto px-8 py-12">
            <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6 px-1">
                <div>
                    <h2 className="text-3xl font-semibold">System Status</h2>
                    <div className="h-1 w-20 bg-indigo-600 rounded-full mt-4 mb-4" />
                    <p className="text-zinc-400 mt-2 text-sm max-w-lg leading-relaxed">
                        Real-time monitoring protocol activated. <br />
                        Manage service endpoints and inspect aggregated logs below.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={onAddService}
                        className="px-5 py-2.5 bg-zinc-100 hover:bg-white text-zinc-900 rounded-lg text-sm font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        New Service
                    </button>
                    <button
                        onClick={onRefreshAll}
                        className="px-5 py-2.5 bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-600 rounded-lg text-sm font-bold transition-all flex items-center gap-2"
                    >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Refresh Grid
                    </button>
                </div>
            </div>

            <ServiceGrid>
                {services.map(service => (
                    <ServiceCard
                        key={service.id}
                        service={service}
                        onCheck={onCheck}
                        onViewLogs={onViewLogs}
                        onUpdate={onUpdateService}
                        onDelete={onDeleteService}
                    />
                ))}
            </ServiceGrid>
        </main>
    );
};

export default DashboardView;
