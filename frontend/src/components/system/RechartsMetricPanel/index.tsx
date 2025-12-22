import React, { useState } from 'react';
import ChartTypeSelector, { type ChartType } from './ChartTypeSelector';
import { BarChart3, LineChart as LineChartIcon, AreaChart as AreaChartIcon, TrendingUp } from 'lucide-react';
import ChartCanvas from './ChartCanvas';
import ManualControl from './ManualControl';
import LiveControl from './LiveControl';
import SummaryStats from './SummaryStats';
import { useMetricSeriesPanel } from '../../../hooks/useMetricSeriesPanel';

interface RechartsMetricPanelProps {
    hostname?: string | null;
    metric: string;
    seriesLabel: string;
    valueFormatter?: (value: number) => string;
    strokeColor?: string;
    fillColor?: string;
}

const RechartsMetricPanel: React.FC<RechartsMetricPanelProps> = ({
    hostname,
    metric,
    seriesLabel,
    valueFormatter,
    strokeColor = '#a855f7',
    fillColor = '#a855f7',
}) => {
    const [selectedChartType, setSelectedChartType] = useState<ChartType>('area');
    const {
        samples,
        error,
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

    const chartData = samples.map(sample => ({
        time: new Date(sample.ts).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        }),
        value: sample.value,
        fullTimestamp: new Date(sample.ts).toLocaleString('es-ES'),
    }));

    const chartTypes = [
        { value: 'area' as ChartType, label: 'Área', Icon: AreaChartIcon },
        { value: 'line' as ChartType, label: 'Línea', Icon: LineChartIcon },
        { value: 'bar' as ChartType, label: 'Barras', Icon: BarChart3 },
        { value: 'composed' as ChartType, label: 'Combinada', Icon: TrendingUp },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3">
                <ChartTypeSelector selected={selectedChartType} onSelect={setSelectedChartType} options={chartTypes} />
            </div>

            <div className="relative bg-zinc-950 border border-zinc-800 rounded-2xl p-4 sm:p-5">
                <div className="absolute left-4 top-4 z-10 flex items-center gap-3">
                    <span className="text-[11px] uppercase tracking-wide text-zinc-400">{seriesLabel}</span>
                </div>
                <div className="absolute left-4 bottom-3 z-10 text-[11px] uppercase tracking-wide text-zinc-400">
                    {summaryLabel}
                </div>
                <div className="absolute right-4 bottom-3 z-10 text-[11px] text-zinc-500">
                    Actualizado {lastLoadedAt ? lastLoadedAt.toLocaleTimeString() : '—'}
                </div>

                <ChartCanvas
                    chartData={chartData}
                    selectedChartType={selectedChartType}
                    metric={metric}
                    strokeColor={strokeColor}
                    fillColor={fillColor}
                    valueFormatter={valueToDisplay}
                />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <ManualControl
                    manualStart={manualStart}
                    manualEnd={manualEnd}
                    setManualStart={setManualStart}
                    setManualEnd={setManualEnd}
                    handleManualFetch={handleManualFetch}
                    loading={loading}
                    latestValueLabel={latestValueLabel}
                />
                <LiveControl
                    liveStart={liveStart}
                    setLiveStart={setLiveStart}
                    startLive={startLive}
                    stopLive={stopLive}
                    liveLoading={liveLoading}
                    isLiveState={isLiveState}
                />
            </div>

            <SummaryStats manualSummary={manualSummary} valueFormatter={valueToDisplay} sampleCount={samples.length} />

            {error && (
                <div className="rounded-xl border border-red-600/60 bg-red-950/60 px-4 py-2 text-sm text-red-300">
                    {error}
                </div>
            )}
        </div>
    );
};

export default RechartsMetricPanel;
