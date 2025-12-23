import React from 'react';
import type { DiskProcessesResponse } from '../../types';

interface DiskProcessListProps {
    processes: DiskProcessesResponse | null;
    isLoading: boolean;
    error?: string | null;
    formatBytes: (bytes: number) => string;
}

const DiskProcessList: React.FC<DiskProcessListProps> = ({
    processes,
    isLoading,
    error,
    formatBytes,
}) => {
    if (isLoading) {
        return <div className="text-sm text-zinc-400">Loading processes…</div>;
    }

    if (error) {
        return (
            <div className="rounded-md border border-red-600/60 bg-red-950/60 px-4 py-3 text-sm text-red-300">
                {error}
            </div>
        );
    }

    if (!processes) {
        return <div className="text-sm text-zinc-500">No data available for this partition.</div>;
    }

    if (processes.processes.length === 0) {
        return (
            <div className="text-sm text-zinc-500">
                No processes with recorded activity for this mountpoint.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {processes.processes.map(process => (
                <div key={process.pid} className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 sm:px-4 py-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="text-sm font-semibold text-zinc-100">{process.name}</div>
                            <span className="rounded-full border border-zinc-700 bg-zinc-950 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                                PID {process.pid}
                            </span>
                            <span className="text-xs text-zinc-500">User: {process.user}</span>
                        </div>
                        <div className="flex items-center gap-4 text-xs text-zinc-400">
                            <span>Read: <span className="text-zinc-200">{formatBytes(process.read_bytes)}</span></span>
                            <span>Write: <span className="text-zinc-200">{formatBytes(process.write_bytes)}</span></span>
                        </div>
                    </div>
                    {process.paths.length > 0 && (
                        <div className="mt-3 grid gap-2 text-xs text-zinc-400">
                            {process.paths.map(path => (
                                <div key={`${process.pid}-${path}`} className="font-mono text-[11px] text-zinc-300 break-all">
                                    {path}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

export default DiskProcessList;
