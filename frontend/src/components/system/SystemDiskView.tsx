import React from 'react';
import { useSystemDiskView } from '../../hooks/useSystemDiskView';
import DiskHeader from './DiskHeader';
import DiskSummary from './DiskSummary';
import DiskPartitionRow from './DiskPartitionRow';

const SystemDiskView = () => {
    const {
        diskInfo,
        loading,
        error,
        totalInfo,
        totalLoading,
        totalError,
        expandedMountpoints,
        processesByMountpoint,
        processesLoading,
        processesError,
        partitions,
        summary,
        toggleMountpoint,
        loadProcesses,
        formatBytes,
    } = useSystemDiskView();

    if (loading || !diskInfo) {
        return (
            <div className="min-h-screen bg-black p-6">
                <div className="max-w-6xl mx-auto">
                    <div className="bg-zinc-900 rounded-lg p-6 border border-zinc-800">
                        <div className="animate-pulse space-y-3">
                            <div className="h-6 bg-zinc-800 rounded w-48"></div>
                            <div className="h-4 bg-zinc-800 rounded w-64"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black p-6">
            <div className="max-w-6xl mx-auto">
                <DiskSummary
                    summary={summary}
                    totalInfo={totalInfo}
                    totalLoading={totalLoading}
                    totalError={totalError}
                    formatBytes={formatBytes}
                />
                {/* Single Unified Container */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                    <DiskHeader
                        title="Estado del Disco"
                        subtitle="Monitoreo de almacenamiento del sistema"
                        error={error}
                    />

                    {/* Table Header */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-zinc-900 border-b border-zinc-800 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        <div className="col-span-3">Partición</div>
                        <div className="col-span-2">Device</div>
                        <div className="col-span-1">FS</div>
                        <div className="col-span-2">Usado</div>
                        <div className="col-span-2">Disponible</div>
                        <div className="col-span-2">Progreso</div>
                    </div>

                    {/* Partition Rows */}
                    <div className="divide-y divide-zinc-800">
                        {partitions.map((partition, index) => {
                            const isExpanded = expandedMountpoints.has(partition.mountpoint);
                            const processes = processesByMountpoint[partition.mountpoint] ?? null;
                            const isLoading = Boolean(processesLoading[partition.mountpoint]);
                            const processesErr = processesError[partition.mountpoint] ?? null;

                            return (
                                <DiskPartitionRow
                                    key={`${partition.mountpoint}-${index}`}
                                    partition={partition}
                                    isExpanded={isExpanded}
                                    processes={processes}
                                    isLoading={isLoading}
                                    error={processesErr}
                                    formatBytes={formatBytes}
                                    onToggle={() => {
                                        toggleMountpoint(partition.mountpoint);
                                        if (!isExpanded && !processes && !isLoading) {
                                            void loadProcesses(partition.mountpoint);
                                        }
                                    }}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemDiskView;
