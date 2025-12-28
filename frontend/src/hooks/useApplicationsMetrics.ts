import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    getApplicationDiscoveryDetails,
    getApplicationLogFileHistory,
    getApplicationLogFiles,
    getApplicationsList,
    getProcessesSnapshot,
    rescanApplicationLogs,
    type RemoteApplicationRecord,
} from '../services/api';
import type { ApplicationDiscoveryDetails, LogEvent, ProcessInfo, ProcessesSnapshot } from '../types';

const DEFAULT_SNAPSHOT_LIMIT = 250;
const DEFAULT_POLL_INTERVAL_MS = 5000;
const MAX_LIVE_SAMPLES = 240;

type AppTab = 'overview' | 'live' | 'logs' | 'diagnostics';

export type ProcessLiveSample = {
    ts: number;
    rss_kb: number | null;
    virt_kb: number | null;
};

const normalizeAppLabel = (app: RemoteApplicationRecord) =>
    app.name?.trim() || app.identifier?.trim() || app.workdir?.trim() || app.id;

const safeDate = (value?: string | null) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const parseLogTimestampMs = (value?: string | null) => {
    if (!value) return null;
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed.getTime();
};

const normalizeStatus = (value?: string | null) => {
    const raw = (value ?? '').trim().toLowerCase();
    if (!raw) return 'unknown';
    if (raw.includes('running') || raw.includes('online') || raw === 'ok') return 'running';
    if (raw.includes('stopped') || raw.includes('offline') || raw.includes('dead')) return 'stopped';
    if (raw.includes('error') || raw.includes('failed')) return 'error';
    return raw;
};

const sortApplications = (items: RemoteApplicationRecord[]) => {
    const order = (app: RemoteApplicationRecord) => {
        const status = normalizeStatus(app.status);
        if (status === 'running') return 0;
        if (status === 'unknown') return 1;
        if (status === 'stopped') return 2;
        if (status === 'error') return 3;
        return 4;
    };

    return [...items].sort((a, b) => {
        const byStatus = order(a) - order(b);
        if (byStatus !== 0) return byStatus;
        return normalizeAppLabel(a).localeCompare(normalizeAppLabel(b));
    });
};

export const useApplicationsMetrics = () => {
    const [applications, setApplications] = useState<RemoteApplicationRecord[]>([]);
    const [appsLoading, setAppsLoading] = useState(true);
    const [appsError, setAppsError] = useState<string | null>(null);
    const [appsSearch, setAppsSearch] = useState('');
    const [selectedAppId, setSelectedAppId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<AppTab>('overview');

    const [snapshotLimit, setSnapshotLimit] = useState(DEFAULT_SNAPSHOT_LIMIT);
    const [snapshot, setSnapshot] = useState<ProcessesSnapshot | null>(null);
    const [snapshotLoading, setSnapshotLoading] = useState(false);
    const [snapshotError, setSnapshotError] = useState<string | null>(null);

    const [liveEnabled, setLiveEnabled] = useState(true);
    const [pollIntervalMs, setPollIntervalMs] = useState(DEFAULT_POLL_INTERVAL_MS);
    const [liveSamples, setLiveSamples] = useState<ProcessLiveSample[]>([]);
    const intervalRef = useRef<number | null>(null);

    const [discovery, setDiscovery] = useState<ApplicationDiscoveryDetails | null>(null);
    const [discoveryLoading, setDiscoveryLoading] = useState(false);
    const [discoveryError, setDiscoveryError] = useState<string | null>(null);

    const [logFiles, setLogFiles] = useState<string[]>([]);
    const [logFilesLoading, setLogFilesLoading] = useState(false);
    const [logFilesError, setLogFilesError] = useState<string | null>(null);
    const [selectedLogFile, setSelectedLogFile] = useState<string | null>(null);
    const [logHistory, setLogHistory] = useState<LogEvent[]>([]);
    const [logHistoryLoading, setLogHistoryLoading] = useState(false);
    const [logHistoryError, setLogHistoryError] = useState<string | null>(null);
    const [logHistoryLimit, setLogHistoryLimit] = useState(250);
    const [logSearch, setLogSearch] = useState('');
    const [rescanLoading, setRescanLoading] = useState(false);

    const filteredApplications = useMemo(() => {
        const query = appsSearch.trim().toLowerCase();
        const ordered = sortApplications(applications);
        if (!query) return ordered;
        return ordered.filter(app => {
            const haystack = [
                app.name,
                app.identifier,
                app.workdir,
                app.kind,
                app.status,
                app.id,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            return haystack.includes(query);
        });
    }, [applications, appsSearch]);

    const selectedApp = useMemo(() => {
        if (!selectedAppId) return null;
        return applications.find(app => app.id === selectedAppId) ?? null;
    }, [applications, selectedAppId]);

    const selectedProcess = useMemo<ProcessInfo | null>(() => {
        const pid = selectedApp?.pid;
        if (!pid || !snapshot?.processes?.length) return null;
        return snapshot.processes.find(proc => proc.pid === pid) ?? null;
    }, [selectedApp?.pid, snapshot?.processes]);

    const refreshApplications = useCallback(async (signal?: AbortSignal) => {
        setAppsLoading(true);
        setAppsError(null);
        try {
            const apps = await getApplicationsList(signal);
            setApplications(apps);
            setSelectedAppId(current => current ?? apps[0]?.id ?? null);
        } catch (err) {
            const aborted =
                err instanceof DOMException && err.name === 'AbortError' ||
                (typeof err === 'object' && err !== null && 'name' in err && (err as any).name === 'AbortError');
            if (aborted) return;
            console.error('Error loading applications list for metrics', err);
            setAppsError('Applications list could not be loaded.');
        } finally {
            setAppsLoading(false);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        refreshApplications(controller.signal);
        return () => controller.abort();
    }, [refreshApplications]);

    const refreshSnapshot = useCallback(
        async (signal?: AbortSignal) => {
            setSnapshotLoading(true);
            setSnapshotError(null);
            try {
                const data = await getProcessesSnapshot(snapshotLimit, signal);
                setSnapshot(data);
            } catch (err) {
                const aborted =
                    err instanceof DOMException && err.name === 'AbortError' ||
                    (typeof err === 'object' && err !== null && 'name' in err && (err as any).name === 'AbortError');
                if (aborted) return;
                console.error('Error loading processes snapshot for application metrics', err);
                setSnapshotError('Processes snapshot could not be loaded.');
            } finally {
                setSnapshotLoading(false);
            }
        },
        [snapshotLimit]
    );

    const stopLive = useCallback(() => {
        if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
    }, []);

    const appendLiveSample = useCallback((sample: ProcessLiveSample) => {
        setLiveSamples(prev => {
            const next = [...prev, sample];
            if (next.length > MAX_LIVE_SAMPLES) {
                return next.slice(-MAX_LIVE_SAMPLES);
            }
            return next;
        });
    }, []);

    const pollTick = useCallback(async () => {
        if (!selectedApp?.id) return;
        const controller = new AbortController();
        try {
            const data = await getProcessesSnapshot(snapshotLimit, controller.signal);
            setSnapshot(data);

            const pid = selectedApp.pid;
            const process = pid ? data.processes.find(proc => proc.pid === pid) : null;
            appendLiveSample({
                ts: Date.now(),
                rss_kb: process?.memory?.res_kb ?? null,
                virt_kb: process?.memory?.virt_kb ?? null,
            });
        } catch (err) {
            console.error('Error polling application process snapshot', err);
        } finally {
            controller.abort();
        }
    }, [appendLiveSample, selectedApp?.id, selectedApp?.pid, snapshotLimit]);

    useEffect(() => {
        stopLive();
        if (!liveEnabled) return;
        intervalRef.current = window.setInterval(() => {
            pollTick();
        }, pollIntervalMs);
        return () => stopLive();
    }, [liveEnabled, pollIntervalMs, pollTick, stopLive]);

    useEffect(() => {
        setLiveSamples([]);
        if (selectedApp?.id) {
            pollTick();
        }
    }, [pollTick, selectedApp?.id]);

    useEffect(() => stopLive, [stopLive]);

    useEffect(() => {
        if (!selectedApp?.workdir) {
            setDiscovery(null);
            setDiscoveryError(null);
            return;
        }

        const controller = new AbortController();
        setDiscoveryLoading(true);
        setDiscoveryError(null);

        getApplicationDiscoveryDetails(selectedApp.workdir, 15, controller.signal)
            .then(data => {
                setDiscovery(data);
            })
            .catch(err => {
                const aborted =
                    err instanceof DOMException && err.name === 'AbortError' ||
                    (typeof err === 'object' && err !== null && 'name' in err && (err as any).name === 'AbortError');
                if (aborted) return;
                console.error('Error loading application discovery details', err);
                setDiscoveryError('Discovery details could not be loaded.');
            })
            .finally(() => setDiscoveryLoading(false));

        return () => controller.abort();
    }, [selectedApp?.workdir]);

    useEffect(() => {
        if (!selectedApp?.id) {
            setLogFiles([]);
            setLogFilesError(null);
            setSelectedLogFile(null);
            return;
        }

        const controller = new AbortController();
        setLogFilesLoading(true);
        setLogFilesError(null);

        getApplicationLogFiles(selectedApp.id, 1, 100, controller.signal)
            .then(response => {
                setLogFiles(response.items);
                setSelectedLogFile(current => current ?? response.items[0] ?? null);
            })
            .catch(err => {
                const aborted =
                    err instanceof DOMException && err.name === 'AbortError' ||
                    (typeof err === 'object' && err !== null && 'name' in err && (err as any).name === 'AbortError');
                if (aborted) return;
                console.error('Error loading log files for application metrics view', err);
                setLogFilesError('Log files could not be loaded.');
            })
            .finally(() => setLogFilesLoading(false));

        return () => controller.abort();
    }, [selectedApp?.id]);

    useEffect(() => {
        if (!selectedApp?.id || !selectedLogFile) {
            setLogHistory([]);
            setLogHistoryError(null);
            return;
        }

        const controller = new AbortController();
        setLogHistoryLoading(true);
        setLogHistoryError(null);

        getApplicationLogFileHistory(selectedApp.id, selectedLogFile, logHistoryLimit, controller.signal)
            .then(events => setLogHistory(events))
            .catch(err => {
                const aborted =
                    err instanceof DOMException && err.name === 'AbortError' ||
                    (typeof err === 'object' && err !== null && 'name' in err && (err as any).name === 'AbortError');
                if (aborted) return;
                console.error('Error loading log history for application metrics view', err);
                setLogHistoryError('Log history could not be loaded.');
            })
            .finally(() => setLogHistoryLoading(false));

        return () => controller.abort();
    }, [logHistoryLimit, selectedApp?.id, selectedLogFile]);

    const rescanLogs = useCallback(async () => {
        if (!selectedApp?.id) return;
        setRescanLoading(true);
        setLogFilesError(null);
        try {
            await rescanApplicationLogs(selectedApp.id);
            await getApplicationLogFiles(selectedApp.id, 1, 100)
                .then(response => {
                    setLogFiles(response.items);
                    setSelectedLogFile(current => current ?? response.items[0] ?? null);
                })
                .catch(() => undefined);
        } catch (err) {
            console.error('Error rescanning application logs', err);
            setLogFilesError('Logs could not be rescanned.');
        } finally {
            setRescanLoading(false);
        }
    }, [selectedApp?.id]);

    const filteredLogHistory = useMemo(() => {
        const query = logSearch.trim().toLowerCase();
        if (!query) return logHistory;
        return logHistory.filter(entry => {
            const haystack = `${entry.level ?? ''} ${entry.path ?? ''} ${entry.message ?? ''} ${entry.context ?? ''}`.toLowerCase();
            return haystack.includes(query);
        });
    }, [logHistory, logSearch]);

    const logLevelBreakdown = useMemo(() => {
        const initial: Record<string, number> = {};
        for (const entry of logHistory) {
            const level = entry.level ?? 'info';
            initial[level] = (initial[level] ?? 0) + 1;
        }
        return initial;
    }, [logHistory]);

    const logTimeline = useMemo(() => {
        const points = logHistory
            .map(entry => ({
                ts: parseLogTimestampMs(entry.timestamp) ?? 0,
                level: entry.level ?? 'info',
            }))
            .filter(point => point.ts > 0)
            .sort((a, b) => a.ts - b.ts);

        if (!points.length) return [];

        const buckets = new Map<number, { total: number; errors: number; warns: number }>();
        for (const point of points) {
            const minute = Math.floor(point.ts / 60000) * 60000;
            const current = buckets.get(minute) ?? { total: 0, errors: 0, warns: 0 };
            current.total += 1;
            if (point.level === 'error' || point.level === 'fatal') current.errors += 1;
            if (point.level === 'warn') current.warns += 1;
            buckets.set(minute, current);
        }

        return Array.from(buckets.entries())
            .sort(([a], [b]) => a - b)
            .map(([minute, stats]) => ({
                minute,
                ...stats,
            }));
    }, [logHistory]);

    const selectedAppMeta = useMemo(() => {
        if (!selectedApp) return null;
        const createdAt = safeDate(selectedApp.created_at);
        const lastSeenAt = safeDate(selectedApp.last_seen_at);
        return {
            label: normalizeAppLabel(selectedApp),
            status: normalizeStatus(selectedApp.status),
            createdAt,
            lastSeenAt,
        };
    }, [selectedApp]);

    return {
        applications: filteredApplications,
        rawApplications: applications,
        appsLoading,
        appsError,
        appsSearch,
        setAppsSearch,
        selectedApp,
        selectedAppId,
        setSelectedAppId,
        selectedAppMeta,
        activeTab,
        setActiveTab,
        refreshApplications,

        snapshot,
        snapshotLimit,
        setSnapshotLimit,
        snapshotLoading,
        snapshotError,
        refreshSnapshot,
        selectedProcess,

        liveEnabled,
        setLiveEnabled,
        pollIntervalMs,
        setPollIntervalMs,
        liveSamples,

        discovery,
        discoveryLoading,
        discoveryError,

        logFiles,
        logFilesLoading,
        logFilesError,
        selectedLogFile,
        setSelectedLogFile,
        logHistory,
        logHistoryLoading,
        logHistoryError,
        logHistoryLimit,
        setLogHistoryLimit,
        logSearch,
        setLogSearch,
        filteredLogHistory,
        logLevelBreakdown,
        logTimeline,
        rescanLoading,
        rescanLogs,
    };
};

