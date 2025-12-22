import React, { useEffect, useMemo, useState } from 'react';
import type { DiskPartition, DiskProcessesResponse, SystemDiskResponse } from '../../types';
import { getDiskProcesses, getSystemDisk } from '../../services/api';
import { MOCK_SYSTEM_DISK } from '../../mockData';

const formatBytes = (bytes: number) => {
    if (!Number.isFinite(bytes)) {
        return 'N/A';
    }
    if (bytes === 0) {
        return '0 B';
    }
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    const exponent = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
    const value = bytes / Math.pow(1024, exponent);
    return `${value.toFixed(value >= 10 ? 1 : 2)} ${units[exponent]}`;
};

const SystemDiskView = () => {
    const [diskInfo, setDiskInfo] = useState<SystemDiskResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedMountpoints, setExpandedMountpoints] = useState<Set<string>>(new Set());
    const [processesByMountpoint, setProcessesByMountpoint] = useState<Record<string, DiskProcessesResponse | null>>({});
    const [processesLoading, setProcessesLoading] = useState<Record<string, boolean>>({});
    const [processesError, setProcessesError] = useState<Record<string, string | null>>({});

    useEffect(() => {
        const controller = new AbortController();

        const fetchDiskInfo = async () => {
            try {
                setError(null);
                const data = await getSystemDisk(controller.signal);
                setDiskInfo(data);
            } catch (err) {
                const aborted =
                    err instanceof DOMException && err.name === 'AbortError' ||
                    (typeof err === 'object' && err !== null && 'name' in err && (err as any).name === 'AbortError');

                if (aborted) {
                    return;
                }

                console.error('Error fetching disk info', err);
                setError('No se pudo cargar el estado del almacenamiento. Mostrando datos mock de respaldo.');
                setDiskInfo(MOCK_SYSTEM_DISK);
            } finally {
                setLoading(false);
            }
        };

        fetchDiskInfo();

        return () => controller.abort();
    }, []);

    const toggleMountpoint = (mountpoint: string) => {
        setExpandedMountpoints(prev => {
            const next = new Set(prev);
            if (next.has(mountpoint)) {
                next.delete(mountpoint);
            } else {
                next.add(mountpoint);
            }
            return next;
        });
    };

    const loadProcesses = async (mountpoint: string) => {
        if (processesByMountpoint[mountpoint] || processesLoading[mountpoint]) {
            return;
        }

        const controller = new AbortController();

        try {
            setProcessesError(prev => ({ ...prev, [mountpoint]: null }));
            setProcessesLoading(prev => ({ ...prev, [mountpoint]: true }));
            const data = await getDiskProcesses(mountpoint, 10, controller.signal);
            setProcessesByMountpoint(prev => ({ ...prev, [mountpoint]: data }));
        } catch (err) {
            const aborted =
                err instanceof DOMException && err.name === 'AbortError' ||
                (typeof err === 'object' && err !== null && 'name' in err && (err as any).name === 'AbortError');

            if (aborted) {
                return;
            }

            console.error('Error fetching disk processes', err);
            setProcessesError(prev => ({ ...prev, [mountpoint]: 'No se pudieron cargar los procesos de esta particion.' }));
            setProcessesByMountpoint(prev => ({ ...prev, [mountpoint]: null }));
        } finally {
            setProcessesLoading(prev => ({ ...prev, [mountpoint]: false }));
        }
    };

    const partitions = diskInfo?.partitions ?? [];
    const summary = useMemo(() => {
        const total = partitions.length;
        const ok = partitions.filter(p => p.status === 'ok').length;
        const critical = partitions.filter(p => p.status === 'critical').length;
        const warning = partitions.filter(p => p.status === 'warning').length;
        return { total, ok, warning, critical };
    }, [partitions]);

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
                {/* Single Unified Container */}
                <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
                    {/* Header Section */}
                    <div className="px-6 py-5 border-b border-zinc-800 bg-zinc-950">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-2xl font-bold text-zinc-100">Estado del Disco</h1>
                                <p className="text-sm text-zinc-500 mt-1">Monitoreo de almacenamiento del sistema</p>
                            </div>
                            <div className="flex gap-2">
                                <div className="bg-zinc-900 border border-zinc-800 rounded-md px-4 py-2 text-center">
                                    <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Total</div>
                                    <div className="text-xl font-bold text-zinc-100">{summary.total}</div>
                                </div>
                                <div className="bg-emerald-950 border border-emerald-900 rounded-md px-4 py-2 text-center">
                                    <div className="text-[10px] text-emerald-400 uppercase tracking-wider">OK</div>
                                    <div className="text-xl font-bold text-emerald-300">{summary.ok}</div>
                                </div>
                                <div className="bg-amber-950 border border-amber-900 rounded-md px-4 py-2 text-center">
                                    <div className="text-[10px] text-amber-400 uppercase tracking-wider">Warn</div>
                                    <div className="text-xl font-bold text-amber-300">{summary.warning}</div>
                                </div>
                                <div className="bg-red-950 border border-red-900 rounded-md px-4 py-2 text-center">
                                    <div className="text-[10px] text-red-400 uppercase tracking-wider">Crit</div>
                                    <div className="text-xl font-bold text-red-300">{summary.critical}</div>
                                </div>
                            </div>
                        </div>
                        {error && (
                            <div className="mt-4 rounded-md border border-red-600/60 bg-red-950/60 px-4 py-3 text-sm text-red-300">
                                {error}
                            </div>
                        )}
                    </div>

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
                            const usedPercent = Math.min(Math.max(partition.used_percent, 0), 100);
                            const statusColors: Record<DiskPartition['status'], string> = {
                                ok: 'bg-emerald-500',
                                warning: 'bg-amber-500',
                                critical: 'bg-red-500'
                            };
                            const statusBadge: Record<DiskPartition['status'], string> = {
                                ok: 'text-emerald-400 bg-emerald-950 border-emerald-900',
                                warning: 'text-amber-400 bg-amber-950 border-amber-900',
                                critical: 'text-red-400 bg-red-950 border-red-900'
                            };
                            const statusDot: Record<DiskPartition['status'], string> = {
                                ok: 'bg-emerald-500',
                                warning: 'bg-amber-500',
                                critical: 'bg-red-500'
                            };

                            const isExpanded = expandedMountpoints.has(partition.mountpoint);
                            const processes = processesByMountpoint[partition.mountpoint];
                            const isLoading = processesLoading[partition.mountpoint];
                            const processesErr = processesError[partition.mountpoint];

                            return (
                                <div key={`${partition.mountpoint}-${index}`}>
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
                                                onClick={() => {
                                                    toggleMountpoint(partition.mountpoint);
                                                    if (!isExpanded && !processes && !isLoading) {
                                                        void loadProcesses(partition.mountpoint);
                                                    }
                                                }}
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
                                            {isLoading && (
                                                <div className="text-sm text-zinc-400">Cargando procesos…</div>
                                            )}

                                            {!isLoading && processesErr && (
                                                <div className="rounded-md border border-red-600/60 bg-red-950/60 px-4 py-3 text-sm text-red-300">
                                                    {processesErr}
                                                </div>
                                            )}

                                            {!isLoading && !processesErr && !processes && (
                                                <div className="text-sm text-zinc-500">
                                                    No hay datos disponibles para esta particion.
                                                </div>
                                            )}

                                            {!isLoading && processes && (
                                                <div className="space-y-3">
                                                    {processes.processes.map(process => (
                                                        <div key={process.pid} className="rounded-lg border border-zinc-800 bg-zinc-900 px-4 py-3">
                                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="text-sm font-semibold text-zinc-100">{process.name}</div>
                                                                    <span className="rounded-full border border-zinc-700 bg-zinc-950 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                                                                        PID {process.pid}
                                                                    </span>
                                                                    <span className="text-xs text-zinc-500">User: {process.user}</span>
                                                                </div>
                                                                <div className="flex items-center gap-4 text-xs text-zinc-400">
                                                                    <span>Lectura: <span className="text-zinc-200">{formatBytes(process.read_bytes)}</span></span>
                                                                    <span>Escritura: <span className="text-zinc-200">{formatBytes(process.write_bytes)}</span></span>
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
                                                    {processes.processes.length === 0 && (
                                                        <div className="text-sm text-zinc-500">
                                                            No hay procesos con actividad registrada para este mountpoint.
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SystemDiskView;
