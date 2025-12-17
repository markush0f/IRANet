import React, { useEffect, useState } from 'react';
import { MOCK_SYSTEM_INFO } from '../../mockData';
import type { SystemInfo } from '../../types';
import { getSystemInfo } from '../../services/api';
import InfoCard from './InfoCard';
import InfoRow from './InfoRow';
import SystemInfoHeader from './SystemInfoHeader';
import MetricSeriesPanel from './MetricSeriesPanel';

const formatBytesToGiB = (bytes: number) => {
    return `${(bytes / (1024 ** 3)).toFixed(1)} GiB`;
};

const formatBootTime = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleString();
};

const SystemInfoView: React.FC = () => {
    const [info, setInfo] = useState<SystemInfo | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const fetchSystemInfo = async () => {
            try {
                setError(null);
                const data = await getSystemInfo(controller.signal);
                setInfo(data);
            } catch (e) {
                // Ignorar aborts provocados por React StrictMode / desmontaje
                if (
                    e instanceof DOMException && e.name === 'AbortError' ||
                    (typeof e === 'object' && e !== null && 'name' in e && (e as any).name === 'AbortError')
                ) {
                    return;
                }

                console.error('Error fetching system info', e);
                setError('No se pudo cargar la información del sistema. Mostrando datos mock de respaldo.');
                setInfo(MOCK_SYSTEM_INFO);
            } finally {
                setLoading(false);
            }
        };

        fetchSystemInfo();

        return () => controller.abort();
    }, []);

    if (loading || !info) {
        return (
            <div className="max-w-7xl mx-auto px-8 py-12">
                <SystemInfoHeader loading />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-8 py-12">
            <SystemInfoHeader error={error} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <InfoCard title="Identidad">
                    <InfoRow label="Hostname" value={info.hostname} />
                    <InfoRow label="FQDN" value={info.fqdn} />
                    <InfoRow label="MAC" value={info.network?.mac_address ?? 'N/A'} />
                </InfoCard>

                <InfoCard title="Sistema operativo">
                    <InfoRow label="OS" value={info.os} />
                    <InfoRow label="Versión" value={info.os_version} />
                    <InfoRow label="Kernel" value={info.kernel} />
                    <InfoRow
                        label="Distribución"
                        value={`${info.distribution.name} ${info.distribution.version} (${info.distribution.codename})`}
                    />
                </InfoCard>

                <InfoCard title="CPU y memoria">
                    <InfoRow label="Arquitectura" value={info.architecture} />
                    <InfoRow label="Procesador" value={info.processor} />
                    <InfoRow label="Cores físicos" value={info.cpu?.cores_physical ?? 'N/A'} />
                    <InfoRow label="Cores lógicos" value={info.cpu?.cores_logical ?? 'N/A'} />
                    <InfoRow
                        label="Memoria total"
                        value={info.memory ? formatBytesToGiB(info.memory.total_bytes) : 'N/A'}
                    />
                </InfoCard>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <InfoCard title="Tiempo de arranque">
                    <p className="text-sm text-zinc-400 mb-4">
                        Marca de tiempo Unix del arranque del sistema y fecha legible.
                    </p>
                    <div className="flex items-baseline justify-between">
                        <div>
                            <div className="text-xs uppercase tracking-wide text-zinc-500 font-semibold mb-1">Boot time (epoch)</div>
                            <div className="text-lg font-mono text-zinc-100">{info.boot_time}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs uppercase tracking-wide text-zinc-500 font-semibold mb-1">Fecha y hora</div>
                            <div className="text-sm font-mono text-zinc-100">{formatBootTime(info.boot_time)}</div>
                        </div>
                    </div>
                </InfoCard>

                <InfoCard
                    title="Runtime"
                    description={
                        <>
                            Datos obtenidos desde <code className="font-mono text-[11px]">/system/info</code>. Si el backend no responde se mostrarán datos mock de respaldo.
                        </>
                    }
                >
                    <InfoRow label="Python" value={info.python_version} />
                </InfoCard>
            </div>
            <div className="mt-10 rounded-2xl border border-zinc-800 bg-zinc-900 p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wide">Métricas de CPU</h3>
                    <span className="text-xs text-zinc-500">Actualización cada 5 segundos</span>
                </div>
                <MetricSeriesPanel
                    hostname={info.hostname}
                    metric="cpu.total"
                    seriesLabel="Serie de métricas CPU total"
                    valueFormatter={value => `${value.toFixed(2)}%`}
                />
            </div>
        </div>
    );
};

export default SystemInfoView;
