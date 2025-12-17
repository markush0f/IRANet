import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getMetricSeries } from '../services/api';
import type { MetricSample } from '../types';

const DEFAULT_LOOKBACK_MS = 5 * 60 * 1000;
const POLL_INTERVAL_MS = 5000;

const createLocalDatetimeValue = (date: Date) => {
    const pad = (value: number) => value.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};

const toIsoString = (value: string) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) {
        return '';
    }

    return parsed.toISOString();
};

const sortSamples = (items: MetricSample[]) => {
    return [...items].sort((a, b) => a.ts.localeCompare(b.ts));
};

interface UseMetricSeriesPanelArgs {
    hostname?: string | null;
    metric: string;
}

export const useMetricSeriesPanel = ({ hostname, metric }: UseMetricSeriesPanelArgs) => {
    const [samples, setSamples] = useState<MetricSample[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [mode, setMode] = useState<'manual' | 'live'>('manual');
    const [loading, setLoading] = useState(false);
    const [liveLoading, setLiveLoading] = useState(false);
    const [lastLoadedAt, setLastLoadedAt] = useState<Date | null>(null);

    const [manualStart, setManualStart] = useState(() => createLocalDatetimeValue(new Date(Date.now() - DEFAULT_LOOKBACK_MS)));
    const [manualEnd, setManualEnd] = useState(() => createLocalDatetimeValue(new Date()));
    const [liveStart, setLiveStart] = useState(manualStart);

    const latestTimestampRef = useRef<string | null>(null);
    const intervalRef = useRef<number | null>(null);
    const initialLiveRunRef = useRef(false);
    const [isLiveState, setIsLiveState] = useState(false);

    const stopLive = useCallback(() => {
        if (intervalRef.current) {
            window.clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setIsLiveState(false);
    }, []);

    const fetchLiveTick = useCallback(async () => {
        const host = hostname?.trim();
        if (!host) {
            return;
        }

        const fromTs = latestTimestampRef.current ?? undefined;
        const toTs = new Date().toISOString();
        try {
            const data = await getMetricSeries({
                metric,
                host,
                fromTs,
                toTs,
            });
            if (!data.length) {
                latestTimestampRef.current = fromTs ?? toTs;
                return;
            }

            const ordered = sortSamples(data);
            const newestTs = ordered.at(-1)?.ts ?? toTs;
            const referenceTs = latestTimestampRef.current;
            const filtered = referenceTs
                ? ordered.filter(sample => sample.ts > referenceTs)
                : ordered;

            if (filtered.length === 0) {
                latestTimestampRef.current = newestTs;
                return;
            }

            setSamples(prev => {
                const seen = new Set(prev.map(sample => sample.ts));
                const unique = filtered.filter(sample => !seen.has(sample.ts));
                if (!unique.length) {
                    return prev;
                }
                return sortSamples([...prev, ...unique]);
            });

            latestTimestampRef.current = newestTs;
            setLastLoadedAt(new Date());
        } catch (err) {
            console.error(`Error updating ${metric} live metrics`, err);
            setError('No se pudieron actualizar las métricas en vivo.');
        }
    }, [hostname, metric]);

    const startLive = useCallback(async () => {
        const host = hostname?.trim();
        if (!host) {
            setError('Necesitas un hostname válido para iniciar las métricas en vivo.');
            return;
        }

        stopLive();
        setMode('live');
        setError(null);
        setLiveLoading(true);
        const fromTs = toIsoString(liveStart);
        const toTs = new Date().toISOString();

        try {
            const data = await getMetricSeries({
                metric,
                host,
                fromTs: fromTs || undefined,
                toTs,
            });
            const ordered = sortSamples(data);
            setSamples(ordered);
            latestTimestampRef.current = ordered.length ? ordered.at(-1)?.ts ?? toTs : toTs;
            setLastLoadedAt(new Date());
            setIsLiveState(true);

            intervalRef.current = window.setInterval(() => {
                fetchLiveTick();
            }, POLL_INTERVAL_MS);
        } catch (err) {
            console.error(`Error starting live ${metric} metrics`, err);
            setError('No se pudieron cargar las métricas en vivo.');
        } finally {
            setLiveLoading(false);
        }
    }, [fetchLiveTick, hostname, liveStart, stopLive, metric]);

    const handleManualFetch = useCallback(async () => {
        const host = hostname?.trim();
        if (!host) {
            setError('Necesitas un hostname válido para cargar métricas manuales.');
            return;
        }

        stopLive();
        setMode('manual');
        setError(null);
        setLoading(true);

        const fromTs = toIsoString(manualStart);
        const toTs = toIsoString(manualEnd);

        if (!fromTs || !toTs) {
            setError('Verifica que las fechas estén bien formadas.');
            setLoading(false);
            return;
        }

        if (fromTs >= toTs) {
            setError('La fecha final debe ser posterior a la inicial.');
            setLoading(false);
            return;
        }

        try {
            const data = await getMetricSeries({
                metric,
                host,
                fromTs,
                toTs,
            });
            const ordered = sortSamples(data);
            setSamples(ordered);
            latestTimestampRef.current = ordered.length ? ordered.at(-1)?.ts ?? toTs : toTs;
            setLastLoadedAt(new Date());
        } catch (err) {
            console.error(`Error loading manual ${metric} metrics`, err);
            setError('No se pudieron cargar las métricas para el intervalo seleccionado.');
        } finally {
            setLoading(false);
        }
    }, [manualStart, manualEnd, hostname, stopLive, metric]);

    useEffect(() => stopLive, [stopLive]);

    useEffect(() => {
        stopLive();
        latestTimestampRef.current = null;
        setSamples([]);
        setError(null);
        initialLiveRunRef.current = false;
    }, [metric, stopLive]);

    useEffect(() => {
        if (!hostname?.trim() || initialLiveRunRef.current) {
            return;
        }
        initialLiveRunRef.current = true;
        startLive();
    }, [hostname, startLive]);

    const manualSummary = useMemo(() => {
        const values = samples.map(sample => sample.value);
        if (!values.length) {
            return { min: 0, max: 0, avg: 0 };
        }
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = values.reduce((sum, value) => sum + value, 0) / values.length;
        return { min, max, avg };
    }, [samples]);

    const svgPoints = useMemo(() => {
        if (!samples.length) {
            return '';
        }

        const width = 600;
        const height = 220;
        const padding = 20;
        const { max, min } = manualSummary;
        const range = max === min ? Math.max(1, max) : max - min;

        const steps = samples.length > 1 ? samples.length - 1 : 1;
        return samples
            .map((sample, index) => {
                const x = padding + (index / steps) * (width - padding * 2);
                const normalizedValue = (sample.value - min) / range;
                const y = height - padding - normalizedValue * (height - padding * 2);
                return `${x},${y}`;
            })
            .join(' ');
    }, [manualSummary, samples]);

    const latestValue = samples.at(-1)?.value ?? null;
    const summaryLabel = mode === 'live' ? 'En vivo' : 'Manual';

    return {
        samples,
        error,
        mode,
        loading,
        liveLoading,
        lastLoadedAt,
        manualStart,
        setManualStart,
        manualEnd,
        setManualEnd,
        liveStart,
        setLiveStart,
        latestTimestampRef,
        stopLive,
        startLive,
        handleManualFetch,
        manualSummary,
        svgPoints,
        latestValue,
        summaryLabel,
        isLiveState,
    };
};
