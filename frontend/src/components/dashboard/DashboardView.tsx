import React, { useEffect, useMemo, useState } from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout/legacy';
import type { Layout, Layouts } from 'react-grid-layout';
import type { Service } from '../../types';
import { getSystemInfo } from '../../services/api';
import { useMetricSeriesPanel } from '../../hooks/useMetricSeriesPanel';
import ChartCanvas from '../system/RechartsMetricPanel/ChartCanvas';
import type { ChartType } from '../system/RechartsMetricPanel/ChartTypeSelector';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

interface DashboardViewProps {
    services: Service[];
    onAddService: () => void;
    onRefreshAll: () => void;
    onCheck: (id: string) => void;
    onViewLogs: (id: string) => void;
    onUpdateService: (id: string, field: 'url' | 'healthEndpoint' | 'name', value: string) => void;
    onDeleteService: (id: string) => void;
}

interface MetricPreviewConfig {
    id: string;
    title: string;
    unit: string;
    strokeColor: string;
    fillColor: string;
}

const METRIC_PANELS: MetricPreviewConfig[] = [
    {
        id: 'cpu.total',
        title: 'CPU total',
        unit: '%',
        strokeColor: '#a855f7',
        fillColor: '#a855f7',
    },
    {
        id: 'memory.used_percent',
        title: 'Memory used',
        unit: '%',
        strokeColor: '#34d399',
        fillColor: '#10b981',
    },
    {
        id: 'memory.available_percent',
        title: 'Memory available',
        unit: '%',
        strokeColor: '#22c55e',
        fillColor: '#16a34a',
    },
    {
        id: 'net.latency.avg_ms',
        title: 'Average latency',
        unit: ' ms',
        strokeColor: '#38bdf8',
        fillColor: '#0ea5e9',
    },
    {
        id: 'net.latency.max_ms',
        title: 'Max latency',
        unit: ' ms',
        strokeColor: '#f97316',
        fillColor: '#ea580c',
    },
    {
        id: 'net.latency.min_ms',
        title: 'Min latency',
        unit: ' ms',
        strokeColor: '#6366f1',
        fillColor: '#4f46e5',
    },
    {
        id: 'net.jitter.ms',
        title: 'Jitter',
        unit: ' ms',
        strokeColor: '#e879f9',
        fillColor: '#c026d3',
    },
];

const ResponsiveGridLayout = WidthProvider(Responsive);

const createLayoutForCols = (cols: number): Layout[] => {
    const baseW = Math.min(4, cols);
    const baseH = 5;
    const itemsPerRow = Math.max(1, Math.floor(cols / baseW));

    return METRIC_PANELS.map((panel, index) => {
        const row = Math.floor(index / itemsPerRow);
        const col = index % itemsPerRow;
        return {
            i: panel.id,
            x: col * baseW,
            y: row * baseH,
            w: baseW,
            h: baseH,
            minW: Math.min(2, cols),
            minH: 4,
        };
    });
};

const createDefaultLayouts = (): Layouts => ({
    lg: createLayoutForCols(12),
    md: createLayoutForCols(10),
    sm: createLayoutForCols(6),
    xs: createLayoutForCols(4),
    xxs: createLayoutForCols(2),
});

interface MetricPreviewCardProps extends MetricPreviewConfig {
    hostname?: string | null;
}

const MetricPreviewCard: React.FC<MetricPreviewCardProps> = ({
    hostname,
    id,
    title,
    unit,
    strokeColor,
    fillColor,
}) => {
    const {
        samples,
        lastLoadedAt,
        manualSummary,
        latestValue,
        summaryLabel,
    } = useMetricSeriesPanel({ hostname, metric: id });

    const chartData = useMemo(() => {
        return samples.map(sample => ({
            time: new Date(sample.ts).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }),
            value: sample.value,
            fullTimestamp: new Date(sample.ts).toLocaleString('es-ES'),
        }));
    }, [samples]);

    const formatValue = (value: number) => `${value.toFixed(2)}${unit}`;
    const latestLabel = latestValue !== null ? formatValue(latestValue) : '—';

    const chartType: ChartType = 'area';
    const yDomain: [number, number] | undefined =
        id.endsWith('_percent') || id === 'cpu.total' ? [0, 100] : undefined;

    return (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-4 shadow-xl space-y-3 h-full">
            <div className="flex items-center justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Metric</p>
                    <h3 className="text-base font-semibold text-zinc-100">{title}</h3>
                </div>
                <div className="text-right">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">{summaryLabel}</p>
                    <p className="text-lg font-semibold text-zinc-100">{latestLabel}</p>
                </div>
            </div>

            <div className="rounded-2xl border border-zinc-800 bg-zinc-900 px-2">
                <ChartCanvas
                    chartData={chartData}
                    selectedChartType={chartType}
                    metric={id}
                    strokeColor={strokeColor}
                    fillColor={fillColor}
                    valueFormatter={(value) => formatValue(value)}
                    yDomain={yDomain}
                />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-500">
                <span>Max {formatValue(manualSummary.max)}</span>
                <span>Min {formatValue(manualSummary.min)}</span>
                <span>Avg {formatValue(manualSummary.avg)}</span>
                <span>Updated {lastLoadedAt ? lastLoadedAt.toLocaleTimeString() : '—'}</span>
            </div>
        </div>
    );
};

const DashboardView: React.FC<DashboardViewProps> = () => {
    const [hostname, setHostname] = useState<string | null>(null);
    const [loadingHost, setLoadingHost] = useState(true);
    const [hostError, setHostError] = useState<string | null>(null);
    const [overrideHost, setOverrideHost] = useState('');
    const [layouts, setLayouts] = useState<Layouts>(() => createDefaultLayouts());

    useEffect(() => {
        const controller = new AbortController();

        const fetchSystemInfo = async () => {
            try {
                setHostError(null);
                setLoadingHost(true);
                const data = await getSystemInfo(controller.signal);
                setHostname(data.hostname);
            } catch (err) {
                const aborted =
                    err instanceof DOMException && err.name === 'AbortError' ||
                    (typeof err === 'object' && err !== null && 'name' in err && (err as any).name === 'AbortError');

                if (aborted) {
                    return;
                }

                console.error('Error loading system info for dashboard', err);
                setHostError('System hostname could not be loaded.');
            } finally {
                setLoadingHost(false);
            }
        };

        fetchSystemInfo();

        return () => controller.abort();
    }, []);

    const hostToUse = overrideHost.trim() || hostname;

    return (
        <main className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
            <section className="space-y-4">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h2 className="text-2xl font-semibold text-zinc-100">Charts panel</h2>
                        <p className="text-sm text-zinc-400">Drag and resize cards; the grid auto-adjusts.</p>
                    </div>
                    <div className="flex flex-wrap items-end gap-4">
                        <div className="flex flex-col gap-1">
                            <p className="text-xs uppercase tracking-wide text-zinc-500">Host override</p>
                            <input
                                id="dashboard-host-input"
                                type="text"
                                placeholder="DESKTOP-B5V272O"
                                className="w-full sm:w-56 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
                                value={overrideHost}
                                onChange={event => setOverrideHost(event.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <p className="text-sm text-zinc-400">
                    {loadingHost && 'Loading host information…'}
                    {!loadingHost && hostname && `Detected host: ${hostname}`}
                    {!loadingHost && !hostname && 'No default hostname detected.'}
                </p>

                {hostError && (
                    <div className="rounded-xl border border-red-600/60 bg-red-950/60 px-4 py-2 text-sm text-red-300">
                        {hostError}
                    </div>
                )}

                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 p-3">
                    <ResponsiveGridLayout
                        className="layout"
                        layouts={layouts}
                        onLayoutChange={(_, allLayouts) => setLayouts(allLayouts)}
                        rowHeight={90}
                        margin={[16, 16]}
                        containerPadding={[0, 0]}
                        compactType="vertical"
                        preventCollision={false}
                        isResizable
                        isDraggable
                    >
                        {METRIC_PANELS.map(panel => (
                            <div key={panel.id}>
                                <MetricPreviewCard
                                    hostname={hostToUse || undefined}
                                    {...panel}
                                />
                            </div>
                        ))}
                    </ResponsiveGridLayout>
                </div>
            </section>
        </main>
    );
};

export default DashboardView;
