import React from 'react';
import type { DiskPartition, DiskProcessesResponse } from '../../types';
import DiskProcessList from './DiskProcessList';

interface DiskPartitionRowProps {
    partition: DiskPartition;
    isExpanded: boolean;
    processes: DiskProcessesResponse | null;
    isLoading: boolean;
    error?: string | null;
    formatBytes: (bytes: number) => string;
    onToggle: () => void;
}

const statusColors: Record<DiskPartition['status'], string> = {
    ok: 'bg-emerald-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500',
};

const statusBadge: Record<DiskPartition['status'], string> = {
    ok: 'text-emerald-400 bg-emerald-950 border-emerald-900',
    warning: 'text-amber-400 bg-amber-950 border-amber-900',
    critical: 'text-red-400 bg-red-950 border-red-900',
};

const statusDot: Record<DiskPartition['status'], string> = {
    ok: 'bg-emerald-500',
    warning: 'bg-amber-500',
    critical: 'bg-red-500',
};

const DiskPartitionRow: React.FC<DiskPartitionRowProps> = ({
    partition,
    isExpanded,
    processes,
    isLoading,
    error,
    formatBytes,
    onToggle,
}) => {
    const usedPercent = Math.min(Math.max(partition.used_percent, 0), 100);

    return (
        <div>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-4 hover:bg-zinc-800/50 transition-colors">
                {/* Mobile & Desktop - Partition Info */}
                <div className="md:col-span-3 flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${statusDot[partition.status]} flex-shrink-0`}></div>
                    <div>
                        <div className="font-semibold text-zinc-100">{partition.mountpoint}</div>
                        <div className={`inline-block mt-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${statusBadge[partition.status]}`}>
                            {partition.status}
                        </div>
                    </div>
                </div>

                {/* Desktop - Device */}
                <div className="hidden md:flex md:col-span-2 items-center">
                    <div className="font-mono text-xs text-zinc-400">{partition.device}</div>
                </div>

                {/* Desktop - Filesystem */}
                <div className="hidden md:flex md:col-span-1 items-center">
                    <div className="text-xs text-zinc-400 uppercase font-semibold">{partition.filesystem}</div>
                </div>

                {/* Desktop - Used */}
                <div className="hidden md:flex md:col-span-2 items-center">
                    <div>
                        <div className="text-sm font-medium text-zinc-300">{formatBytes(partition.used_bytes)}</div>
                        <div className="text-[10px] text-zinc-500">de {formatBytes(partition.total_bytes)}</div>
                    </div>
                </div>

                {/* Desktop - Available */}
                <div className="hidden md:flex md:col-span-2 items-center">
                    <div className="text-sm font-medium text-zinc-300">{formatBytes(partition.free_bytes)}</div>
                </div>

                {/* Mobile & Desktop - Progress Bar */}
                <div className="md:col-span-2 flex items-center gap-3">
                    <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full ${statusColors[partition.status]} transition-all duration-500`}
                            style={{ width: `${usedPercent}%` }}
                        />
                    </div>
                    <div className="text-sm font-bold text-zinc-300 w-12 text-right">
                        {usedPercent.toFixed(0)}%
                    </div>
                </div>

                <div className="flex md:col-span-12 items-center justify-between">
                    <button
                        type="button"
                        className="text-xs font-semibold uppercase tracking-wide text-indigo-300 hover:text-indigo-200"
                        onClick={onToggle}
                    >
                        {isExpanded ? 'Ocultar procesos' : 'Ver procesos'}
                    </button>
                    <div className="hidden md:block text-[10px] text-zinc-500">
                        Click para consultar actividad de disco
                    </div>
                </div>

                {/* Mobile Only - Additional Details */}
                <div className="md:hidden mt-2 pt-2 border-t border-zinc-800 grid grid-cols-3 gap-2 text-xs">
                    <div>
                        <div className="text-zinc-500">Device</div>
                        <div className="text-zinc-300 font-mono">{partition.device}</div>
                    </div>
                    <div>
                        <div className="text-zinc-500">Usado</div>
                        <div className="text-zinc-300">{formatBytes(partition.used_bytes)}</div>
                    </div>
                    <div>
                        <div className="text-zinc-500">Libre</div>
                        <div className="text-zinc-300">{formatBytes(partition.free_bytes)}</div>
                    </div>
                </div>
            </div>

            {isExpanded && (
                <div className="bg-zinc-950 border-t border-zinc-800 px-6 py-4">
                    <DiskProcessList
                        processes={processes}
                        isLoading={isLoading}
                        error={error}
                        formatBytes={formatBytes}
                    />
                </div>
            )}
        </div>
    );
};

export default DiskPartitionRow;
