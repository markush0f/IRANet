import React, { useEffect, useState } from 'react';
import { Badge, Card, Flex, Text, Title } from '@tremor/react';
import MetricSeriesPanel from '../system/MetricSeriesPanel';
import { getSystemInfo } from '../../services/api';
import RechartsMetricPanel from '../system/RechartsMetricPanel';

const CpuMetricsView: React.FC = () => {
    const [hostname, setHostname] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [overrideHost, setOverrideHost] = useState('');

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

                console.error('Error loading system info for CPU view', err);
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
                        <Title className="text-2xl sm:text-3xl text-zinc-100">Real-time CPU usage</Title>
                        <Text className="text-sm text-zinc-400 max-w-3xl">
                            The chart updates every 5 seconds and can be analyzed over a manual range or in streaming mode.
                            If the hostname is not detected automatically, you can provide one to query the correct API.
                        </Text>
                    </div>
                    <Badge color="indigo" size="xs">
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
                            id="host-input"
                            type="text"
                            placeholder="DESKTOP-B5V272O"
                            className="w-full sm:w-56 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
                            value={overrideHost}
                            onChange={event => setOverrideHost(event.target.value)}
                        />
                    </div>
                </Flex>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6 shadow-xl">
                    {error && (
                        <div className="mb-4 rounded-lg border border-red-600/60 bg-red-950/60 px-4 py-3 text-sm text-red-300">
                            {error}
                        </div>
                    )}
                    <RechartsMetricPanel
                        hostname={hostToUse || undefined}
                        metric="cpu.total"
                        seriesLabel="CPU total metrics series"
                        valueFormatter={value => `${value.toFixed(2)}%`}
                    />
                </div>
            </Card>
        </div>
    );
};

export default CpuMetricsView;
