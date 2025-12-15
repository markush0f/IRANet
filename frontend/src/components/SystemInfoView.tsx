import React, { useEffect, useState } from 'react';
import { MOCK_SYSTEM_INFO } from '../mockData';
import type { SystemInfo } from '../types';
import { getSystemInfo } from '../services/api';

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
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">System Information</h2>
                    <div className="h-1 w-20 bg-indigo-600 rounded-full mt-4" />
                    <p className="text-zinc-400 mt-2 text-sm">
                        Cargando información del sistema desde el backend...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-8 py-12">
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">System Information</h2>
                <div className="h-1 w-20 bg-indigo-600 rounded-full mt-4"></div>
                <p className="text-zinc-400 mt-2 text-sm">
                    Snapshot de la máquina donde se está ejecutando el agente.
                </p>
                {error && (
                    <p className="mt-3 text-xs text-amber-400">
                        {error}
                    </p>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 shadow-xl">
                    <h3 className="text-sm font-bold text-zinc-200 mb-4">Identidad</h3>
                    <dl className="space-y-3 text-sm">
                        <div className="flex justify-between gap-4">
                            <dt className="text-zinc-500">Hostname</dt>
                            <dd className="text-zinc-100 font-mono">{info.hostname}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-zinc-500">FQDN</dt>
                            <dd className="text-zinc-100 font-mono truncate">{info.fqdn}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-zinc-500">MAC</dt>
                            <dd className="text-zinc-100 font-mono">
                                {info.network?.mac_address ?? 'N/A'}
                            </dd>
                        </div>
                    </dl>
                </div>

                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 shadow-xl">
                    <h3 className="text-sm font-bold text-zinc-200 mb-4">Sistema operativo</h3>
                    <dl className="space-y-3 text-sm">
                        <div className="flex justify-between gap-4">
                            <dt className="text-zinc-500">OS</dt>
                            <dd className="text-zinc-100 font-mono">{info.os}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-zinc-500">Versión</dt>
                            <dd className="text-zinc-100 font-mono truncate">{info.os_version}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-zinc-500">Kernel</dt>
                            <dd className="text-zinc-100 font-mono truncate">{info.kernel}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-zinc-500">Distribución</dt>
                            <dd className="text-zinc-100 font-mono">
                                {info.distribution.name} {info.distribution.version} ({info.distribution.codename})
                            </dd>
                        </div>
                    </dl>
                </div>

                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 shadow-xl">
                    <h3 className="text-sm font-bold text-zinc-200 mb-4">CPU y memoria</h3>
                    <dl className="space-y-3 text-sm">
                        <div className="flex justify-between gap-4">
                            <dt className="text-zinc-500">Arquitectura</dt>
                            <dd className="text-zinc-100 font-mono">{info.architecture}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-zinc-500">Procesador</dt>
                            <dd className="text-zinc-100 font-mono truncate">{info.processor}</dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-zinc-500">Cores físicos</dt>
                            <dd className="text-zinc-100 font-mono">
                                {info.cpu?.cores_physical ?? 'N/A'}
                            </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-zinc-500">Cores lógicos</dt>
                            <dd className="text-zinc-100 font-mono">
                                {info.cpu?.cores_logical ?? 'N/A'}
                            </dd>
                        </div>
                        <div className="flex justify-between gap-4">
                            <dt className="text-zinc-500">Memoria total</dt>
                            <dd className="text-zinc-100 font-mono">
                                {info.memory ? formatBytesToGiB(info.memory.total_bytes) : 'N/A'}
                            </dd>
                        </div>
                    </dl>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 shadow-xl">
                    <h3 className="text-sm font-bold text-zinc-200 mb-4">Tiempo de arranque</h3>
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
                </div>

                <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-6 shadow-xl">
                    <h3 className="text-sm font-bold text-zinc-200 mb-4">Runtime</h3>
                    <dl className="space-y-3 text-sm">
                        <div className="flex justify-between gap-4">
                            <dt className="text-zinc-500">Python</dt>
                            <dd className="text-zinc-100 font-mono">{info.python_version}</dd>
                        </div>
                    </dl>
                    <p className="mt-4 text-xs text-zinc-500">
                        Datos obtenidos desde <code className="font-mono text-[11px]">/system/info</code>. Si el backend no responde se mostrarán datos mock de respaldo.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default SystemInfoView;
