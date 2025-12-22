import { useEffect, useMemo, useState } from 'react';
import type { DiskProcessesResponse, DiskTotalResponse, SystemDiskResponse } from '../types';
import { getDiskProcesses, getSystemDisk, getSystemDiskTotal } from '../services/api';
import { MOCK_SYSTEM_DISK } from '../mockData';

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

export const useSystemDiskView = () => {
    const [diskInfo, setDiskInfo] = useState<SystemDiskResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalInfo, setTotalInfo] = useState<DiskTotalResponse | null>(null);
    const [totalLoading, setTotalLoading] = useState(true);
    const [totalError, setTotalError] = useState<string | null>(null);
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

    useEffect(() => {
        const controller = new AbortController();

        const fetchDiskTotal = async () => {
            try {
                setTotalError(null);
                const data = await getSystemDiskTotal(controller.signal);
                setTotalInfo(data);
            } catch (err) {
                const aborted =
                    err instanceof DOMException && err.name === 'AbortError' ||
                    (typeof err === 'object' && err !== null && 'name' in err && (err as any).name === 'AbortError');

                if (aborted) {
                    return;
                }

                console.error('Error fetching disk total', err);
                setTotalError('No se pudo cargar el total del disco.');
                setTotalInfo(null);
            } finally {
                setTotalLoading(false);
            }
        };

        fetchDiskTotal();

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

    return {
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
    };
};
