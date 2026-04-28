import React from 'react';
import { Badge, Card, Flex, Text, Title } from '@tremor/react';
import { useServer } from '../../contexts/ServerContext';
import RechartsMetricPanel from '../system/RechartsMetricPanel';

const CpuMetricsView: React.FC = () => {
    const { selectedServer } = useServer();

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-2 pb-6 sm:pt-3 sm:pb-8 lg:pt-4 lg:pb-10 text-sm">
            <Card className="space-y-6 p-4 sm:p-6">
                <Flex alignItems="start" justifyContent="between" className="gap-6 flex-wrap">
                    <div className="space-y-1">
                        <Text className="text-xs uppercase tracking-wide text-zinc-500">Metrics series</Text>
                        <Title className="text-2xl sm:text-3xl text-zinc-100">Real-time CPU usage</Title>
                        <Text className="text-xs text-zinc-400 leading-relaxed max-w-3xl">
                            The chart updates every 5 seconds and can be analyzed over a manual range or in streaming mode.
                            Select a server from the sidebar to view its metrics.
                        </Text>
                    </div>
                    <Badge color="indigo" size="xs">
                        Updates every 5 seconds
                    </Badge>
                </Flex>

                <Flex justifyContent="between" className="gap-4 flex-wrap">
                    <Text className="text-xs text-zinc-400 leading-relaxed">
                        {selectedServer ? `Server: ${selectedServer.name}` : 'No server selected.'}
                    </Text>
                </Flex>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-4 sm:p-6 shadow-xl">
                    <RechartsMetricPanel
                        serverId={selectedServer?.id ?? null}
                        metric="cpu.total"
                        seriesLabel="CPU total metrics series"
                        valueFormatter={value => `${value.toFixed(2)}%`}
                        yDomain={[0, 100]}
                    />
                </div>
            </Card>
        </div>
    );
};

export default CpuMetricsView;