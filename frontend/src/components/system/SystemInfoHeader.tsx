import React from 'react';

interface SystemInfoHeaderProps {
    loading?: boolean;
    error?: string | null;
}

const SystemInfoHeader: React.FC<SystemInfoHeaderProps> = ({ loading, error }) => (
    <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">System Information</h2>
        <div className="h-1 w-20 bg-indigo-600 rounded-full mt-4" />
        <p className="text-zinc-400 mt-2 text-sm">
            {loading
                ? 'Loading system information from the backend...'
                : 'Snapshot of the machine where the agent is running.'}
        </p>
        {error && (
            <p className="mt-3 text-xs text-amber-400">
                {error}
            </p>
        )}
    </div>
);

export default SystemInfoHeader;
