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
            <div className="min-h-full bg-black px-4 sm:px-6 pt-2 pb-4 sm:pt-3 sm:pb-6 text-sm">
                <div className="w-full">
                    <div className="bg-zinc-900 rounded-lg p-4 sm:p-6 border border-zinc-800">
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
        <div className="min-h-full bg-zinc-950 px-4 sm:px-6 pt-2 pb-4 sm:pt-3 sm:pb-6 text-sm">
            <div className="w-full space-y-6">
                <DiskSummary
                    summary={summary}
                    totalInfo={totalInfo}
                    totalLoading={totalLoading}
                    totalError={totalError}
                    formatBytes={formatBytes}
                />

                <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden shadow-xl">
                    <DiskHeader
                        title="Disk Status"
                        subtitle="System storage monitoring"
                        error={error}
                    />

                    <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-zinc-950 border-y border-zinc-800 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                        <div className="col-span-3">Partition</div>
                        <div className="col-span-2">Device</div>
                        <div className="col-span-1">FS</div>
                        <div className="col-span-2">Used</div>
                        <div className="col-span-2">Available</div>
                        <div className="col-span-2">Usage</div>
                    </div>

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
