import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { getMetricSeries } from '../../services/api';
import type { MetricSample } from '../../types';

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

interface CpuMetricsPanelProps {
    hostname?: string | null;
}

const CpuMetricsPanel: React.FC<CpuMetricsPanelProps> = ({ hostname }) => {
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
                metric: 'cpu.total',
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
            console.error('Error fetching live CPU metrics', err);
            setError('No se pudieron actualizar las métricas en vivo.');
        }
    }, [hostname]);

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
                metric: 'cpu.total',
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
            console.error('Error starting live CPU metrics', err);
            setError('No se pudieron cargar las métricas en vivo.');
        } finally {
            setLiveLoading(false);
        }
    }, [fetchLiveTick, hostname, liveStart, stopLive]);

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
                metric: 'cpu.total',
                host,
                fromTs,
                toTs,
            });
            const ordered = sortSamples(data);
            setSamples(ordered);
            latestTimestampRef.current = ordered.length ? ordered.at(-1)?.ts ?? toTs : toTs;
            setLastLoadedAt(new Date());
        } catch (err) {
            console.error('Error fetching manual CPU metrics', err);
            setError('No se pudieron cargar las métricas para el intervalo seleccionado.');
        } finally {
            setLoading(false);
        }
    }, [manualStart, manualEnd, hostname, stopLive]);

    useEffect(() => {
        return () => {
            stopLive();
        };
    }, [stopLive]);

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

    return (
        <div className="space-y-6">
            <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl p-5 h-[260px]">
                {samples.length ? (
                    <svg
                        viewBox="0 0 600 220"
                        className="w-full h-full"
                        preserveAspectRatio="none"
                        role="img"
                        aria-label="Gráfica de uso de CPU"
                    >
                        <polyline
                            fill="none"
                            stroke="#a855f7"
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            points={svgPoints}
                        />
                    </svg>
                ) : (
                    <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                        No hay datos para mostrar. Puedes iniciar el seguimiento en vivo o elegir un rango.
                    </div>
                )}
                <div className="absolute left-4 top-4 text-[11px] uppercase tracking-wide text-zinc-400">
                    Serie de métricas CPU total
                </div>
                <div className="absolute right-4 top-4 text-[11px] uppercase tracking-wide text-zinc-400">
                    {summaryLabel}
                </div>
                <div className="absolute right-4 bottom-3 text-[11px] text-zinc-500">
                    Actualizado {lastLoadedAt ? lastLoadedAt.toLocaleTimeString() : '—'}
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Intervalo manual</p>
                        <span className="text-[11px] text-zinc-500">
                            {samples.length ? `Último valor ${latestValue?.toFixed(2)}%` : 'Sin datos'}
                        </span>
                    </div>
                    <div className="grid gap-3">
                        <label className="text-[11px] uppercase tracking-wide text-zinc-500">Desde</label>
                        <input
                            type="datetime-local"
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                            value={manualStart}
                            onChange={e => setManualStart(e.target.value)}
                        />
                        <label className="text-[11px] uppercase tracking-wide text-zinc-500">Hasta</label>
                        <input
                            type="datetime-local"
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                            value={manualEnd}
                            onChange={e => setManualEnd(e.target.value)}
                        />
                        <button
                            type="button"
                            onClick={handleManualFetch}
                            disabled={loading}
                            className="inline-flex w-full justify-center rounded-lg border border-transparent bg-indigo-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-indigo-700"
                        >
                            {loading ? 'Cargando rango…' : 'Ver intervalo'}
                        </button>
                    </div>
                </div>

                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">En vivo</p>
                            <p className="text-[11px] text-zinc-500">Actualizaciones cada 5 segundos</p>
                        </div>
                        <span className="text-[11px] text-zinc-500">{isLiveState ? 'Activo' : 'Detenido'}</span>
                    </div>
                    <label className="text-[11px] uppercase tracking-wide text-zinc-500">Desde (inicio del streaming)</label>
                    <input
                        type="datetime-local"
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                        value={liveStart}
                        onChange={e => setLiveStart(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={startLive}
                            disabled={liveLoading}
                            className="flex-1 rounded-lg border border-transparent bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700"
                        >
                            {liveLoading ? 'Inicializando…' : 'Iniciar en vivo'}
                        </button>
                        <button
                            type="button"
                            onClick={stopLive}
                            disabled={!isLiveState}
                            className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-500"
                        >
                            Detener
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 text-[11px] text-zinc-500">
                <span>Máx {manualSummary.max.toFixed(2)}%</span>
                <span>Mín {manualSummary.min.toFixed(2)}%</span>
                <span>Promedio {manualSummary.avg.toFixed(2)}%</span>
            </div>

            {error && (
                <div className="rounded-xl border border-red-600/60 bg-red-950/60 px-4 py-2 text-sm text-red-300">
                    {error}
                </div>
            )}
        </div>
    );
};

export default CpuMetricsPanel;
