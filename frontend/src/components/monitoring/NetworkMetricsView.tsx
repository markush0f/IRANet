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
        { id: 'net.latency.avg_ms', label: 'Latencia promedio' },
        { id: 'net.latency.max_ms', label: 'Latencia máxima' },
        { id: 'net.latency.min_ms', label: 'Latencia mínima' },
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
                setError('No se pudo cargar el hostname del sistema.');
            } finally {
                setLoading(false);
            }
        };

        fetchSystemInfo();

        return () => controller.abort();
    }, []);

    const hostToUse = overrideHost.trim() || hostname;

    return (
        <div className="max-w-7xl mx-auto px-8 py-12">
            <Card className="space-y-6 p-6">
                <Flex alignItems="start" justifyContent="between" className="gap-6">
                    <div className="space-y-1">
                        <Text className="text-xs uppercase tracking-wide text-zinc-500">Serie de métricas</Text>
                        <Title className="text-3xl text-zinc-100">Latencia de red en tiempo real</Title>
                        <Text className="text-sm text-zinc-400 max-w-3xl">
                            Monitorea latencia y jitter en milisegundos con actualizaciones cada 5 segundos.
                            Puedes alternar entre métricas y definir un hostname para consultar la instancia correcta.
                        </Text>
                    </div>
                    <Badge color="sky" size="xs">
                        Actualización cada 5 segundos
                    </Badge>
                </Flex>

                <Flex justifyContent="between" className="gap-4 flex-wrap">
                    <Text className="text-sm text-zinc-400">
                        {loading && 'Cargando información del host…'}
                        {!loading && hostname && `Host detectado: ${hostname}`}
                        {!loading && !hostname && 'No se detectó ningún hostname por defecto.'}
                    </Text>
                    <div className="flex flex-col gap-1">
                        <Text className="text-xs uppercase tracking-wide text-zinc-500">Host override</Text>
                        <input
                            id="network-host-input"
                            type="text"
                            placeholder="DESKTOP-B5V272O"
                            className="w-48 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-sky-500 focus:outline-none"
                            value={overrideHost}
                            onChange={event => setOverrideHost(event.target.value)}
                        />
                    </div>
                </Flex>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl space-y-4">
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
                        seriesLabel={`Serie de métricas de ${activeNetworkMetric.label.toLowerCase()}`}
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
