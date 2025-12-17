import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAlerts } from '../services/alertsService';
import type { AlertRecord } from '../services/alertsService';

const DEFAULT_PAGE_SIZE = 20;

export const useAlerts = (initialPage = 1, initialPageSize = DEFAULT_PAGE_SIZE) => {
    const [alerts, setAlerts] = useState<AlertRecord[]>([]);
    const [page, setPage] = useState(initialPage);
    const [pageSize] = useState(initialPageSize);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const controllerRef = useRef<AbortController | null>(null);

    const loadPage = useCallback((targetPage: number, append = false) => {
        controllerRef.current?.abort();
        const controller = new AbortController();
        controllerRef.current = controller;
        setError(null);
        if (append) {
            setLoadingMore(true);
        } else {
            setLoading(true);
        }

        fetchAlerts(targetPage, pageSize, controller.signal)
            .then(({ alerts: data, total: count }) => {
                setTotal(count);
                setAlerts(prev => (append ? [...prev, ...data] : data));
                setPage(targetPage);
            })
            .catch(err => {
                if (err instanceof DOMException && err.name === 'AbortError') {
                    return;
                }
                console.error('Error fetching alerts', err);
                setError('No se pudieron cargar las alertas. Intenta nuevamente.');
            })
            .finally(() => {
                if (append) {
                    setLoadingMore(false);
                } else {
                    setLoading(false);
                }
                if (controllerRef.current === controller) {
                    controllerRef.current = null;
                }
            });
    }, [pageSize]);

    useEffect(() => {
        loadPage(initialPage, false);
        return () => controllerRef.current?.abort();
    }, [initialPage, loadPage]);

    const refresh = useCallback(() => {
        loadPage(initialPage, false);
    }, [initialPage, loadPage]);

    const hasMore = alerts.length < total;

    const loadMore = useCallback(() => {
        if (loading || loadingMore || !hasMore) return;
        const nextPage = page + 1;
        loadPage(nextPage, true);
    }, [hasMore, loadPage, loading, loadingMore, page]);

    return {
        alerts,
        loading,
        loadingMore,
        error,
        total,
        page,
        pageSize,
        hasMore,
        refresh,
        loadMore,
    };
};
