import React from 'react';
import { useMetricSeriesPanel } from '../../hooks/useMetricSeriesPanel';

interface MetricSeriesPanelProps {
    hostname?: string | null;
    metric: string;
    seriesLabel: string;
    valueFormatter?: (value: number) => string;
}

const MetricSeriesPanel: React.FC<MetricSeriesPanelProps> = ({
    hostname,
    metric,
    seriesLabel,
    valueFormatter,
}) => {
    const {
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
        isLiveState,
        manualSummary,
        svgPoints,
        latestValue,
        summaryLabel,
        stopLive,
        startLive,
        handleManualFetch,
    } = useMetricSeriesPanel({ hostname, metric });

    const valueToDisplay = (value: number) => (valueFormatter ? valueFormatter(value) : value.toFixed(2));
    const latestValueLabel = latestValue !== null ? valueToDisplay(latestValue) : null;

    return (
        <div className="space-y-6">
            <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl p-5 h-[260px]">
                {samples.length ? (
                    <svg
                        viewBox="0 0 600 220"
                        className="w-full h-full"
                        preserveAspectRatio="none"
                        role="img"
                        aria-label={`${seriesLabel} chart`}
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
                    {seriesLabel}
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
                            {latestValueLabel ? `Último valor ${latestValueLabel}` : 'Sin datos'}
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
                <span>Máx {valueToDisplay(manualSummary.max)}</span>
                <span>Mín {valueToDisplay(manualSummary.min)}</span>
                <span>Promedio {valueToDisplay(manualSummary.avg)}</span>
            </div>

            {error && (
                <div className="rounded-xl border border-red-600/60 bg-red-950/60 px-4 py-2 text-sm text-red-300">
                    {error}
                </div>
            )}
        </div>
    );
};

export default MetricSeriesPanel;
