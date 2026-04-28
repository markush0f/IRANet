import React from 'react';
import { Badge, Card, Flex, Text, Title } from '@tremor/react';
import { useServer } from '../../contexts/ServerContext';
import RechartsMetricPanel from '../system/RechartsMetricPanel';

const MemoryMetricsView: React.FC = () => {
    const { selectedServer } = useServer();
    const memoryMetrics = [
        { id: 'memory.available_percent', label: 'Available memory', metric: 'memory.available_percent' },
        {
            id: 'memory.used_percent',
            label: 'Used memory',
            metric: 'memory.available_percent',
            transform: (value: number) => Math.max(0, 100 - value),
        },
    ];
    const [activeMemoryMetric, setActiveMemoryMetric] = React.useState(memoryMetrics[0]);

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-2 pb-6 sm:pt-3 sm:pb-8 lg:pt-4 lg:pb-10 text-sm">
            <Card className="space-y-6 p-4 sm:p-6">
                <Flex alignItems="start" justifyContent="between" className="gap-6 flex-wrap">
                    <div className="space-y-1">
                        <Text className="text-xs uppercase tracking-wide text-zinc-500">Metrics series</Text>
                        <Title className="text-2xl sm:text-3xl text-zinc-100">Real-time available memory</Title>
                        <Text className="text-xs text-zinc-400 leading-relaxed max-w-3xl">
                            Check the server's available memory percentage every 5 seconds or over a custom range.
                        </Text>
                    </div>
                    <Badge color="emerald" size="xs">
                        Updates every 5 seconds
                    </Badge>
                </Flex>

                <Flex justifyContent="between" className="gap-4 flex-wrap">
                    <Text className="text-xs text-zinc-400 leading-relaxed">
                        {selectedServer ? `Server: ${selectedServer.name}` : 'No server selected.'}
                    </Text>
                </Flex>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6 shadow-xl space-y-4">
                    <div className="flex gap-2">
                        {memoryMetrics.map(metric => (
                            <button
                                key={metric.id}
                                type="button"
                                onClick={() => setActiveMemoryMetric(metric)}
                                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-semibold transition
                                    ${activeMemoryMetric.id === metric.id
                                        ? 'border-emerald-500 bg-emerald-500 text-white'
                                        : 'border-zinc-800 bg-zinc-900 text-zinc-300 hover:border-zinc-700 hover:text-white'
                                    }`}
                            >
                                {metric.label}
                            </button>
                        ))}
                    </div>
                    <RechartsMetricPanel
                        serverId={selectedServer?.id ?? null}
                        metric={activeMemoryMetric.metric}
                        seriesLabel={`Metrics series for ${activeMemoryMetric.label.toLowerCase()}`}
                        valueFormatter={value => `${value.toFixed(2)}%`}
                        valueTransform={activeMemoryMetric.transform}
                        yDomain={[0, 100]}
                    />
                </div>
            </Card>
        </div>
    );
};

export default MemoryMetricsView;