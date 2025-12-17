import React from 'react';
import {
    LineChart,
    Line,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { useMetricSeriesPanel } from '../../hooks/useMetricSeriesPanel';

interface RechartsMetricPanelProps {
    hostname?: string | null;
    metric: string;
    seriesLabel: string;
    valueFormatter?: (value: number) => string;
    chartType?: 'line' | 'area';
    strokeColor?: string;
    fillColor?: string;
}

const RechartsMetricPanel: React.FC<RechartsMetricPanelProps> = ({
    hostname,
    metric,
    seriesLabel,
    valueFormatter,
    chartType = 'area',
    strokeColor = '#a855f7',
    fillColor = '#a855f7',
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
        latestValue,
        summaryLabel,
        stopLive,
        startLive,
        handleManualFetch,
    } = useMetricSeriesPanel({ hostname, metric });

    const valueToDisplay = (value: number) => (valueFormatter ? valueFormatter(value) : value.toFixed(2));
    const latestValueLabel = latestValue !== null ? valueToDisplay(latestValue) : null;

    // Transformar samples para Recharts
    const chartData = samples.map((sample, index) => ({
        time: new Date(sample.timestamp).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        }),
        value: sample.value,
        fullTimestamp: new Date(sample.timestamp).toLocaleString('es-ES'),
    }));

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-lg">
                    <p className="text-xs text-zinc-400 mb-1">{payload[0].payload.fullTimestamp}</p>
                    <p className="text-sm font-semibold text-purple-400">
                        {valueToDisplay(payload[0].value)}
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Gráfica principal con Recharts */}
            <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl p-5">
                <div className="absolute left-4 top-4 z-10 text-[11px] uppercase tracking-wide text-zinc-400">
                    {seriesLabel}
                </div>
                <div className="absolute right-4 top-4 z-10 text-[11px] uppercase tracking-wide text-zinc-400">
                    {summaryLabel}
                </div>
                <div className="absolute right-4 bottom-3 z-10 text-[11px] text-zinc-500">
                    Actualizado {lastLoadedAt ? lastLoadedAt.toLocaleTimeString() : '—'}
                </div>

                {chartData.length > 0 ? (
                    <div className="h-[300px] pt-8 pb-4">
                        <ResponsiveContainer width="100%" height="100%">
                            {chartType === 'area' ? (
                                <AreaChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <defs>
                                        <linearGradient id={`gradient-${metric}`} x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor={fillColor} stopOpacity={0.8} />
                                            <stop offset="95%" stopColor={fillColor} stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                    <XAxis
                                        dataKey="time"
                                        stroke="#71717a"
                                        style={{ fontSize: '11px' }}
                                        tickLine={false}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis
                                        stroke="#71717a"
                                        style={{ fontSize: '11px' }}
                                        tickLine={false}
                                        tickFormatter={(value) => valueToDisplay(value)}
                                        width={60}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke={strokeColor}
                                        strokeWidth={3}
                                        fill={`url(#gradient-${metric})`}
                                        animationDuration={300}
                                    />
                                </AreaChart>
                            ) : (
                                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                    <XAxis
                                        dataKey="time"
                                        stroke="#71717a"
                                        style={{ fontSize: '11px' }}
                                        tickLine={false}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis
                                        stroke="#71717a"
                                        style={{ fontSize: '11px' }}
                                        tickLine={false}
                                        tickFormatter={(value) => valueToDisplay(value)}
                                        width={60}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Line
                                        type="monotone"
                                        dataKey="value"
                                        stroke={strokeColor}
                                        strokeWidth={3}
                                        dot={{ fill: strokeColor, r: 2 }}
                                        activeDot={{ r: 5 }}
                                        animationDuration={300}
                                    />
                                </LineChart>
                            )}
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="flex h-[300px] items-center justify-center text-xs text-zinc-500">
                        No hay datos para mostrar. Puedes iniciar el seguimiento en vivo o elegir un rango.
                    </div>
                )}


            </div>

            {/* Controles de fecha manual y modo en vivo */}
            <div className="grid gap-4 md:grid-cols-2">
                {/* Intervalo manual */}
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
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
                            value={manualStart}
                            onChange={e => setManualStart(e.target.value)}
                        />
                        <label className="text-[11px] uppercase tracking-wide text-zinc-500">Hasta</label>
                        <input
                            type="datetime-local"
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
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

                {/* Modo en vivo */}
                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-5 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">En vivo</p>
                            <p className="text-[11px] text-zinc-500">Actualizaciones cada 5 segundos</p>
                        </div>
                        <span className={`text-[11px] font-semibold ${isLiveState ? 'text-emerald-400' : 'text-zinc-500'}`}>
                            {isLiveState ? '● Activo' : '○ Detenido'}
                        </span>
                    </div>
                    <label className="text-[11px] uppercase tracking-wide text-zinc-500">Desde (inicio del streaming)</label>
                    <input
                        type="datetime-local"
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
                        value={liveStart}
                        onChange={e => setLiveStart(e.target.value)}
                    />
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={startLive}
                            disabled={liveLoading || isLiveState}
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

            {/* Estadísticas de resumen */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-zinc-950 border border-zinc-800 px-5 py-3">
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wide text-zinc-500">Máximo</span>
                    <span className="text-sm font-semibold text-zinc-200">{valueToDisplay(manualSummary.max)}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wide text-zinc-500">Mínimo</span>
                    <span className="text-sm font-semibold text-zinc-200">{valueToDisplay(manualSummary.min)}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wide text-zinc-500">Promedio</span>
                    <span className="text-sm font-semibold text-zinc-200">{valueToDisplay(manualSummary.avg)}</span>
                </div>
                <div className="flex flex-col">
                    <span className="text-[10px] uppercase tracking-wide text-zinc-500">Total de muestras</span>
                    <span className="text-sm font-semibold text-zinc-200">{samples.length}</span>
                </div>
            </div>

            {/* Mensajes de error */}
            {error && (
                <div className="rounded-xl border border-red-600/60 bg-red-950/60 px-4 py-2 text-sm text-red-300">
                    {error}
                </div>
            )}
        </div>
    );
};

export default RechartsMetricPanel;