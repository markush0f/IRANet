import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    getApplicationLogFiles,
    getApplicationsLogsList,
    getBaseUrl,
    type RemoteApplicationRecord,
    rescanApplicationLogs,
} from '../services/api';
import type { LogEvent } from '../types';

export type LiveStatus = 'idle' | 'connecting' | 'connected' | 'closed' | 'error';

export const useApplicationsLogs = () => {
    const [applications, setApplications] = useState<RemoteApplicationRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedApp, setSelectedApp] = useState<RemoteApplicationRecord | null>(null);
    const [logFiles, setLogFiles] = useState<string[]>([]);
    const [filesLoading, setFilesLoading] = useState(false);
    const [filesError, setFilesError] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<string | null>(null);
    const [liveEnabled, setLiveEnabled] = useState(true);
    const [liveLines, setLiveLines] = useState<LogEvent[]>([]);
    const [liveStatus, setLiveStatus] = useState<LiveStatus>('idle');
    const [liveError, setLiveError] = useState<string | null>(null);
    const [liveLevelFilter, setLiveLevelFilter] = useState<'all' | NonNullable<LogEvent['level']>>('all');
    const [liveSearchQuery, setLiveSearchQuery] = useState('');
    const [rescanLoading, setRescanLoading] = useState<Record<string, boolean>>({});
    const liveContainerRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(null);

        getApplicationsLogsList(controller.signal)
            .then(data => {
                setApplications(data);
            })
            .catch(err => {
                if (err instanceof DOMException && err.name === 'AbortError') {
                    return;
                }
                console.error('Error loading applications logs list', err);
                setError('The applications logs list could not be loaded.');
            })
            .finally(() => {
                setLoading(false);
            });

        return () => controller.abort();
    }, []);

    const filteredApplications = useMemo(() => {
        return applications.filter(app => (app.log_paths ?? []).length > 0);
    }, [applications]);

    const mergedLogFiles = useMemo(() => {
        const known = new Set<string>();
        (logFiles ?? []).forEach(path => {
            if (path) known.add(path);
        });
        (selectedApp?.log_paths ?? []).forEach(path => {
            if (path) known.add(path);
        });
        return Array.from(known);
    }, [logFiles, selectedApp?.log_paths]);

    const appendLiveLine = useCallback((entry: LogEvent) => {
        if (!entry.message) return;
        setLiveLines(prev => {
            const next = [...prev, entry];
            if (next.length > 500) {
                return next.slice(-500);
            }
            return next;
        });
    }, []);

    const normalizeLiveEvent = useCallback((payload: unknown): LogEvent | null => {
        if (payload && typeof payload === 'object' && typeof (payload as any).message === 'string') {
            return {
                path: typeof (payload as any).path === 'string' ? (payload as any).path : '',
                message: (payload as any).message,
                level: (payload as any).level,
                timestamp: (payload as any).timestamp ?? (payload as any).time ?? (payload as any).ts,
                context: (payload as any).context,
                type: (payload as any).type ?? 'live',
            } as LogEvent;
        }
        if (typeof payload === 'string') {
            return { path: '', message: payload, type: 'live' };
        }
        return null;
    }, []);

    const selectApp = useCallback((app: RemoteApplicationRecord) => {
        if (!app.id) {
            setError('This application is missing an id required to fetch logs.');
            return;
        }
        setError(null);
        setSelectedApp(app);
        setLiveLines([]);
        setLiveEnabled(true);
    }, []);

    const closeDetails = useCallback(() => {
        setSelectedApp(null);
        setSelectedFile(null);
        setLogFiles([]);
        setLiveLines([]);
        setLiveEnabled(false);
    }, []);

    const selectFile = useCallback((path: string) => {
        setSelectedFile(path);
        setLiveLines([]);
    }, []);

    const toggleLive = useCallback(() => {
        setLiveEnabled(prev => !prev);
    }, []);

    const clearLive = useCallback(() => {
        setLiveLines([]);
    }, []);

    const updateLiveLevelFilter = useCallback((next: 'all' | NonNullable<LogEvent['level']>) => {
        setLiveLevelFilter(next);
    }, []);

    const updateLiveSearchQuery = useCallback((next: string) => {
        setLiveSearchQuery(next);
    }, []);

    const clearLiveSearch = useCallback(() => {
        setLiveSearchQuery('');
    }, []);

    const rescanLogs = useCallback(async (app: RemoteApplicationRecord) => {
        if (!app.id) {
            setError('This application is missing an id required to rescan logs.');
            return;
        }
        setError(null);
        setRescanLoading(prev => ({ ...prev, [app.id]: true }));
        try {
            await rescanApplicationLogs(app.id);
        } catch (err) {
            console.error('Error rescanning application logs', err);
            setError('The application logs could not be rescanned.');
        } finally {
            setRescanLoading(prev => ({ ...prev, [app.id]: false }));
        }
    }, []);

    useEffect(() => {
        setLiveLines([]);
    }, [liveLevelFilter, liveSearchQuery]);

    useEffect(() => {
        if (!selectedApp?.id) {
            setLogFiles([]);
            setFilesError(null);
            setSelectedFile(null);
            return;
        }

        const controller = new AbortController();
        setFilesLoading(true);
        setFilesError(null);

        getApplicationLogFiles(selectedApp.id, 1, 50, controller.signal)
            .then(response => {
                setLogFiles(response.items);
                const fallback = response.items[0] ?? selectedApp.log_paths?.[0] ?? null;
                setSelectedFile(current => (current && response.items.includes(current) ? current : fallback));
            })
            .catch(err => {
                if (err instanceof DOMException && err.name === 'AbortError') {
                    return;
                }
                console.error('Error loading application log files', err);
                setFilesError('The log files list could not be loaded.');
            })
            .finally(() => {
                setFilesLoading(false);
            });

        return () => controller.abort();
    }, [selectedApp?.id, selectedApp?.log_paths]);

    useEffect(() => {
        if (!selectedApp?.id || !selectedFile || !liveEnabled) {
            setLiveStatus('idle');
            return;
        }

        const baseUrl = getBaseUrl();
        const wsBase = baseUrl.startsWith('https')
            ? baseUrl.replace(/^https/, 'wss')
            : baseUrl.replace(/^http/, 'ws');
        const params = new URLSearchParams();
        params.set('file_path', selectedFile);
        if (liveLevelFilter !== 'all') {
            params.set('levels', liveLevelFilter);
        }
        if (liveSearchQuery.trim()) {
            params.set('search', liveSearchQuery.trim());
        }
        const url = `${wsBase}/logs/ws/applications/${selectedApp.id}/file?${params.toString()}`;
        const socket = new WebSocket(url);

        setLiveStatus('connecting');
        setLiveError(null);

        socket.onopen = () => {
            setLiveStatus('connected');
        };

        socket.onmessage = event => {
            const handlePayload = (payload: unknown) => {
                let parsed: unknown = payload;
                if (typeof payload === 'string') {
                    try {
                        parsed = JSON.parse(payload);
                    } catch {
                        parsed = payload;
                    }
                }
                const normalized = normalizeLiveEvent(parsed);
                if (normalized) {
                    appendLiveLine(normalized);
                }
            };

            if (typeof event.data === 'string') {
                handlePayload(event.data);
                return;
            }
            if (event.data instanceof Blob) {
                event.data
                    .text()
                    .then(text => handlePayload(text))
                    .catch(() => undefined);
            }
        };

        socket.onerror = () => {
            setLiveStatus('error');
            setLiveError('The live stream encountered an error.');
        };

        socket.onclose = () => {
            setLiveStatus('closed');
        };

        return () => {
            socket.close();
        };
    }, [appendLiveLine, liveEnabled, liveLevelFilter, liveSearchQuery, selectedApp?.id, selectedFile]);

    useEffect(() => {
        if (!liveContainerRef.current) return;
        liveContainerRef.current.scrollTop = liveContainerRef.current.scrollHeight;
    }, [liveLines]);

    return {
        applications: filteredApplications,
        loading,
        error,
        setError,
        selectedApp,
        selectApp,
        closeDetails,
        logFiles: mergedLogFiles,
        filesLoading,
        filesError,
        selectedFile,
        selectFile,
        liveEnabled,
        liveStatus,
        liveError,
        liveLines,
        toggleLive,
        clearLive,
        liveLevelFilter,
        updateLiveLevelFilter,
        liveSearchQuery,
        updateLiveSearchQuery,
        clearLiveSearch,
        rescanLoading,
        rescanLogs,
        liveContainerRef,
    };
};
