import React, { useEffect, useMemo, useState } from 'react';
import type { DiskPartition, SystemDiskResponse } from '../../types';
import { getSystemDisk } from '../../services/api';
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

const statusStyles: Record<DiskPartition['status'], string> = {
    ok: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200',
    warning: 'border-amber-500/40 bg-amber-500/10 text-amber-200',
    critical: 'border-red-500/40 bg-red-500/10 text-red-200',
};

const statusLabels: Record<DiskPartition['status'], string> = {
    ok: 'OK',
    warning: 'Warning',
    critical: 'Critical',
};

const SystemDiskView: React.FC = () => {
    const [diskInfo, setDiskInfo] = useState<SystemDiskResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

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

    const partitions = diskInfo?.partitions ?? [];
    const summary = useMemo(() => {
        const total = partitions.length;
        const ok = partitions.filter(partition => partition.status === 'ok').length;
        const critical = partitions.filter(partition => partition.status === 'critical').length;
        const warning = partitions.filter(partition => partition.status === 'warning').length;
        return { total, ok, warning, critical };
    }, [partitions]);

    if (loading || !diskInfo) {
        return (
            <div className="max-w-7xl mx-auto px-8 py-12">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
                    <div className="text-sm uppercase tracking-wide text-zinc-500">Almacenamiento</div>
                    <h1 className="mt-2 text-3xl font-semibold text-zinc-100">Estado del disco</h1>
                    <p className="mt-3 text-sm text-zinc-400">Cargando particiones y métricas de uso…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-8 py-12 space-y-8">
            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-8 shadow-xl">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                        <div className="text-sm uppercase tracking-wide text-zinc-500">Almacenamiento</div>
                        <h1 className="mt-2 text-3xl font-semibold text-zinc-100">Estado del disco</h1>
                        <p className="mt-3 text-sm text-zinc-400 max-w-2xl">
                            Inventario de particiones y consumo de espacio reportados por <code className="font-mono text-[11px]">/system/disk</code>.
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="rounded-xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-center">
                            <div className="text-xs uppercase tracking-wide text-zinc-500">Particiones</div>
                            <div className="mt-1 text-lg font-semibold text-zinc-100">{summary.total}</div>
                        </div>
                        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-3 text-center text-emerald-200">
                            <div className="text-xs uppercase tracking-wide">OK</div>
                            <div className="mt-1 text-lg font-semibold">{summary.ok}</div>
                        </div>
                        <div className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-center text-amber-200">
                            <div className="text-xs uppercase tracking-wide">Warning</div>
                            <div className="mt-1 text-lg font-semibold">{summary.warning}</div>
                        </div>
                        <div className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-center text-red-200">
                            <div className="text-xs uppercase tracking-wide">Critical</div>
                            <div className="mt-1 text-lg font-semibold">{summary.critical}</div>
                        </div>
                    </div>
                </div>
                {error && (
                    <div className="mt-6 rounded-lg border border-red-600/60 bg-red-950/60 px-4 py-3 text-sm text-red-300">
                        {error}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {partitions.map((partition, index) => {
                    const usedPercent = Math.min(Math.max(partition.used_percent, 0), 100);
                    return (
                        <div
                            key={`${partition.mountpoint}-${index}`}
                            className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <div className="text-sm uppercase tracking-wide text-zinc-500">Mountpoint</div>
                                    <h2 className="mt-1 text-lg font-semibold text-zinc-100 break-all">
                                        {partition.mountpoint}
                                    </h2>
                                </div>
                                <span
                                    className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyles[partition.status]}`}
                                >
                                    {statusLabels[partition.status]}
                                </span>
                            </div>

                            <div className="mt-4 grid grid-cols-1 gap-3 text-sm text-zinc-300 sm:grid-cols-2">
                                <div>
                                    <div className="text-xs uppercase tracking-wide text-zinc-500">Device</div>
                                    <div className="mt-1 font-mono text-xs text-zinc-200 break-all">{partition.device}</div>
                                </div>
                                <div>
                                    <div className="text-xs uppercase tracking-wide text-zinc-500">Filesystem</div>
                                    <div className="mt-1 text-zinc-200">{partition.filesystem}</div>
                                </div>
                                <div>
                                    <div className="text-xs uppercase tracking-wide text-zinc-500">Usado</div>
                                    <div className="mt-1 text-zinc-200">{formatBytes(partition.used_bytes)}</div>
                                </div>
                                <div>
                                    <div className="text-xs uppercase tracking-wide text-zinc-500">Libre</div>
                                    <div className="mt-1 text-zinc-200">{formatBytes(partition.free_bytes)}</div>
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="flex items-center justify-between text-xs uppercase tracking-wide text-zinc-500">
                                    <span>Uso</span>
                                    <span>{usedPercent.toFixed(1)}%</span>
                                </div>
                                <div className="mt-2 h-2 rounded-full bg-zinc-800">
                                    <div
                                        className={`h-2 rounded-full ${
                                            partition.status === 'critical'
                                                ? 'bg-red-500'
                                                : partition.status === 'warning'
                                                    ? 'bg-amber-500'
                                                    : 'bg-emerald-500'
                                        }`}
                                        style={{ width: `${usedPercent}%` }}
                                    />
                                </div>
                                <div className="mt-2 text-xs text-zinc-500">
                                    Total: <span className="text-zinc-300">{formatBytes(partition.total_bytes)}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default SystemDiskView;
