import React, { useEffect, useState } from 'react';
import { Badge, Card, Flex, Text, Title } from '@tremor/react';
import { getSystemInfo } from '../../services/api';
import RechartsMetricPanel from '../system/RechartsMetricPanel';

const NetworkMetricsView: React.FC = () => {
    const [hostname, setHostname] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [overrideHost, setOverrideHost] = useState('');
    const networkMetrics = [
        { id: 'net.latency.avg_ms', label: 'Average latency' },
        { id: 'net.latency.max_ms', label: 'Max latency' },
        { id: 'net.latency.min_ms', label: 'Min latency' },
        { id: 'net.jitter.ms', label: 'Jitter' },
    ];
    const [activeNetworkMetric, setActiveNetworkMetric] = useState(networkMetrics[0]);

    useEffect(() => {
        const controller = new AbortController();

        const fetchSystemInfo = async () => {
            try {
                setError(null);
                setLoading(true);
                const data = await getSystemInfo(controller.signal);
                setHostname(data.hostname);
            } catch (err) {
                const aborted =
                    err instanceof DOMException && err.name === 'AbortError' ||
                    (typeof err === 'object' && err !== null && 'name' in err && (err as any).name === 'AbortError');

                if (aborted) {
                    return;
                }

                console.error('Error loading system info for Network view', err);
                setError('System hostname could not be loaded.');
            } finally {
                setLoading(false);
            }
        };

        fetchSystemInfo();

        return () => controller.abort();
    }, []);

    const hostToUse = overrideHost.trim() || hostname;

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
            <Card className="space-y-6 p-4 sm:p-6">
                <Flex alignItems="start" justifyContent="between" className="gap-6 flex-wrap">
                    <div className="space-y-1">
                        <Text className="text-xs uppercase tracking-wide text-zinc-500">Metrics series</Text>
                        <Title className="text-2xl sm:text-3xl text-zinc-100">Real-time network latency</Title>
                        <Text className="text-sm text-zinc-400 max-w-3xl">
                            Monitor latency and jitter in milliseconds with updates every 5 seconds.
                            You can switch metrics and set a hostname to query the correct instance.
                        </Text>
                    </div>
                    <Badge color="sky" size="xs">
                        Updates every 5 seconds
                    </Badge>
                </Flex>

                <Flex justifyContent="between" className="gap-4 flex-wrap">
                    <Text className="text-sm text-zinc-400">
                        {loading && 'Loading host information…'}
                        {!loading && hostname && `Detected host: ${hostname}`}
                        {!loading && !hostname && 'No default hostname detected.'}
                    </Text>
                    <div className="flex flex-col gap-1">
                        <Text className="text-xs uppercase tracking-wide text-zinc-500">Host override</Text>
                        <input
                            id="network-host-input"
                            type="text"
                            placeholder="DESKTOP-B5V272O"
                            className="w-full sm:w-56 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-sky-500 focus:outline-none"
                            value={overrideHost}
                            onChange={event => setOverrideHost(event.target.value)}
                        />
                    </div>
                </Flex>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6 shadow-xl space-y-4">
                    <div className="flex gap-2 flex-wrap">
                        {networkMetrics.map(metric => (
                            <button
                                key={metric.id}
                                type="button"
                                onClick={() => setActiveNetworkMetric(metric)}
                                className={`flex-1 min-w-[160px] rounded-lg border px-3 py-2 text-sm font-semibold transition
                                    ${activeNetworkMetric.id === metric.id
                                        ? 'border-sky-500 bg-sky-500 text-white'
                                        : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:text-white'
                                    }`}
                            >
                                {metric.label}
                            </button>
                        ))}
                    </div>
                    {error && (
                        <div className="mb-4 rounded-lg border border-red-600/60 bg-red-950/60 px-4 py-3 text-sm text-red-300">
                            {error}
                        </div>
                    )}
                    <RechartsMetricPanel
                        hostname={hostToUse || undefined}
                        metric={activeNetworkMetric.id}
                        seriesLabel={`Metrics series for ${activeNetworkMetric.label.toLowerCase()}`}
                        valueFormatter={value => `${value.toFixed(2)} ms`}
                        strokeColor="#38bdf8"
                        fillColor="#0ea5e9"
                    />
                </div>
            </Card>
        </div>
    );
};

export default NetworkMetricsView;
