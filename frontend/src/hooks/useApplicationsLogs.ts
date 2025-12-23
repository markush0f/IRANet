import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    getApplicationLogFileHistory,
    getApplicationLogFiles,
    getApplicationsLogsList,
    getBaseUrl,
    type RemoteApplicationRecord,
} from '../services/api';

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
    const [historyLimit, setHistoryLimit] = useState(200);
    const [historyLines, setHistoryLines] = useState<string[]>([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [liveEnabled, setLiveEnabled] = useState(true);
    const [liveLines, setLiveLines] = useState<string[]>([]);
    const [liveStatus, setLiveStatus] = useState<LiveStatus>('idle');
    const [liveError, setLiveError] = useState<string | null>(null);
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

    const appendLiveLine = useCallback((line: string) => {
        if (!line) return;
        setLiveLines(prev => {
            const next = [...prev, line];
            if (next.length > 500) {
                return next.slice(-500);
            }
            return next;
        });
    }, []);

    const selectApp = useCallback((app: RemoteApplicationRecord) => {
        if (!app.id) {
            setError('This application is missing an id required to fetch logs.');
            return;
        }
        setError(null);
        setSelectedApp(app);
        setLiveLines([]);
        setHistoryLines([]);
        setLiveEnabled(true);
    }, []);

    const closeDetails = useCallback(() => {
        setSelectedApp(null);
        setSelectedFile(null);
        setLogFiles([]);
        setHistoryLines([]);
        setLiveLines([]);
        setLiveEnabled(false);
    }, []);

    const selectFile = useCallback((path: string) => {
        setSelectedFile(path);
        setHistoryLines([]);
        setLiveLines([]);
    }, []);

    const updateHistoryLimit = useCallback((next: number) => {
        setHistoryLimit(Number.isNaN(next) ? 200 : next);
    }, []);

    const reloadHistory = useCallback(() => {
        if (!selectedApp?.id || !selectedFile) return;
        setHistoryLines([]);
        setHistoryError(null);
        setHistoryLoading(true);
        getApplicationLogFileHistory(selectedApp.id, selectedFile, historyLimit)
            .then(lines => {
                setHistoryLines(lines);
            })
            .catch(err => {
                console.error('Error reloading application log history', err);
                setHistoryError('The log history could not be loaded.');
            })
            .finally(() => {
                setHistoryLoading(false);
            });
    }, [historyLimit, selectedApp?.id, selectedFile]);

    const toggleLive = useCallback(() => {
        setLiveEnabled(prev => !prev);
    }, []);

    const clearLive = useCallback(() => {
        setLiveLines([]);
    }, []);

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
        if (!selectedApp?.id || !selectedFile) {
            setHistoryLines([]);
            setHistoryError(null);
            return;
        }

        const controller = new AbortController();
        setHistoryLoading(true);
        setHistoryError(null);

        getApplicationLogFileHistory(selectedApp.id, selectedFile, historyLimit, controller.signal)
            .then(lines => {
                setHistoryLines(lines);
            })
            .catch(err => {
                if (err instanceof DOMException && err.name === 'AbortError') {
                    return;
                }
                console.error('Error loading application log history', err);
                setHistoryError('The log history could not be loaded.');
            })
            .finally(() => {
                setHistoryLoading(false);
            });

        return () => controller.abort();
    }, [selectedApp?.id, selectedFile, historyLimit]);

    useEffect(() => {
        if (!selectedApp?.id || !selectedFile || !liveEnabled) {
            setLiveStatus('idle');
            return;
        }

        const baseUrl = getBaseUrl();
        const wsBase = baseUrl.startsWith('https')
            ? baseUrl.replace(/^https/, 'wss')
            : baseUrl.replace(/^http/, 'ws');
        const url = `${wsBase}/logs/ws/applications/${selectedApp.id}/file?file_path=${encodeURIComponent(
            selectedFile
        )}`;
        const socket = new WebSocket(url);

        setLiveStatus('connecting');
        setLiveError(null);

        socket.onopen = () => {
            setLiveStatus('connected');
        };

        socket.onmessage = event => {
            if (typeof event.data === 'string') {
                appendLiveLine(event.data);
                return;
            }
            if (event.data instanceof Blob) {
                event.data
                    .text()
                    .then(text => appendLiveLine(text))
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
    }, [appendLiveLine, liveEnabled, selectedApp?.id, selectedFile]);

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
        historyLimit,
        updateHistoryLimit,
        historyLines,
        historyLoading,
        historyError,
        reloadHistory,
        liveEnabled,
        liveStatus,
        liveError,
        liveLines,
        toggleLive,
        clearLive,
        liveContainerRef,
    };
};
