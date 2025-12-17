import React, { useEffect, useState } from 'react';
import { Badge, Card, Flex, Text, Title } from '@tremor/react';
import CpuMetricsPanel from '../system/CpuMetricsPanel';
import { getSystemInfo } from '../../services/api';

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
                        <Title className="text-3xl text-zinc-100">Uso de CPU en tiempo real</Title>
                        <Text className="text-sm text-zinc-400 max-w-3xl">
                            La gráfica se actualiza cada 5 segundos y puede analizarse desde un rango manual o en modo streaming.
                            Si el hostname no se detecta automáticamente, puedes forzar uno para consultar la API correcta.
                        </Text>
                    </div>
                    <Badge color="indigo" size="xs">
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
                            id="host-input"
                            type="text"
                            placeholder="DESKTOP-B5V272O"
                            className="w-48 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
                            value={overrideHost}
                            onChange={event => setOverrideHost(event.target.value)}
                        />
                    </div>
                </Flex>

                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
                    {error && (
                        <div className="mb-4 rounded-lg border border-red-600/60 bg-red-950/60 px-4 py-3 text-sm text-red-300">
                            {error}
                        </div>
                    )}
                    <CpuMetricsPanel hostname={hostToUse ?? ''} />
                </div>
            </Card>
        </div>
    );
};

export default CpuMetricsView;
