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
    valueTransform?: (value: number) => number;
    yDomain?: [number, number];
    strokeColor?: string;
    fillColor?: string;
}

const RechartsMetricPanel: React.FC<RechartsMetricPanelProps> = ({
    hostname,
    metric,
    seriesLabel,
    valueFormatter,
    valueTransform,
    yDomain,
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

    const applyTransform = (value: number) => (valueTransform ? valueTransform(value) : value);
    const valueToDisplay = (value: number) => (valueFormatter ? valueFormatter(value) : value.toFixed(2));

    const displaySamples = valueTransform
        ? samples.map(sample => ({ ...sample, value: applyTransform(sample.value) }))
        : samples;

    const latestValueLabel = displaySamples.length ? valueToDisplay(displaySamples.at(-1)?.value ?? 0) : null;

    const chartData = displaySamples.map(sample => ({
        time: new Date(sample.ts).toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        }),
        value: sample.value,
        fullTimestamp: new Date(sample.ts).toLocaleString('es-ES'),
    }));

    const summary = valueTransform
        ? displaySamples.reduce(
            (acc, sample) => {
                acc.min = Math.min(acc.min, sample.value);
                acc.max = Math.max(acc.max, sample.value);
                acc.sum += sample.value;
                return acc;
            },
            { min: Number.POSITIVE_INFINITY, max: Number.NEGATIVE_INFINITY, sum: 0 }
        )
        : null;

    const manualSummaryDisplay = summary
        ? {
            min: summary.min === Number.POSITIVE_INFINITY ? 0 : summary.min,
            max: summary.max === Number.NEGATIVE_INFINITY ? 0 : summary.max,
            avg: displaySamples.length ? summary.sum / displaySamples.length : 0,
        }
        : manualSummary;

    const chartTypes = [
        { value: 'area' as ChartType, label: 'Area', Icon: AreaChartIcon },
        { value: 'line' as ChartType, label: 'Line', Icon: LineChartIcon },
        { value: 'bar' as ChartType, label: 'Bars', Icon: BarChart3 },
        { value: 'composed' as ChartType, label: 'Composed', Icon: TrendingUp },
    ];

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-3">
                <ChartTypeSelector selected={selectedChartType} onSelect={setSelectedChartType} options={chartTypes} />
            </div>

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
                <div className="space-y-4">
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
                            yDomain={yDomain}
                        />
                    </div>

                    <SummaryStats
                        manualSummary={manualSummaryDisplay}
                        valueFormatter={valueToDisplay}
                        sampleCount={displaySamples.length}
                    />
                </div>

                <div className="space-y-4">
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
                    {error && (
                        <div className="rounded-xl border border-red-600/60 bg-red-950/60 px-4 py-2 text-sm text-red-300">
                            {error}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default RechartsMetricPanel;
