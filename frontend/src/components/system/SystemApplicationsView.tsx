import React from 'react';
import { MOCK_SYSTEM_APPLICATIONS } from '../../mockData';
import SystemApplicationsSection from './SystemApplicationsSection';

const SystemApplicationsView: React.FC = () => {
    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-2 pb-6 sm:pt-3 sm:pb-8 lg:pt-4 lg:pb-10 text-sm space-y-8">
            <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Applications</p>
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">System applications</h2>
                <p className="text-xs text-zinc-400 leading-relaxed mt-2 max-w-2xl">
                    Directory collection where the system runs critical commands. Each entry shows available binaries and lets you add new system applications to monitor.
                </p>
            </div>

            <SystemApplicationsSection applications={MOCK_SYSTEM_APPLICATIONS} />
        </div>
    );
};

export default SystemApplicationsView;
