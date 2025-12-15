import React, { useEffect, useState } from 'react';
import type { DockerContainer } from '../types';
import { getDockerContainers } from '../services/api';

const formatCreated = (created: string) => {
    const date = new Date(created);
    if (Number.isNaN(date.getTime())) return created;
    return date.toLocaleString();
};

const DockerView: React.FC = () => {
    const [containers, setContainers] = useState<DockerContainer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();

        const fetchContainers = async () => {
            try {
                setError(null);
                const data = await getDockerContainers(controller.signal);
                setContainers(data);
            } catch (e) {
                if (
                    e instanceof DOMException && e.name === 'AbortError' ||
                    (typeof e === 'object' && e !== null && 'name' in e && (e as any).name === 'AbortError')
                ) {
                    return;
                }
                console.error('Error fetching docker containers', e);
                setError('No se pudieron cargar los contenedores Docker.');
            } finally {
                // pequeño retraso para que el spinner sea visible aunque la respuesta sea muy rápida
                setTimeout(() => setLoading(false), 250);
            }
        };

        fetchContainers();

        return () => controller.abort();
    }, []);

    const runningContainers = containers.filter(
        (c) => c.state === 'running' || c.status === 'running'
    );

    return (
        <div className="max-w-7xl mx-auto px-8 py-12">
            <div className="mb-8 flex items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">Docker Containers</h2>
                    <div className="h-1 w-24 bg-indigo-600 rounded-full mt-4" />
                    <p className="text-zinc-400 mt-2 text-sm">
                        Listado de contenedores Docker obtenidos desde el backend. Solo se muestran los que están en estado <span className="font-semibold text-emerald-400">running</span>.
                    </p>
                    {error && (
                        <p className="mt-3 text-xs text-amber-400">
                            {error}
                        </p>
                    )}
                </div>
                {!loading && (
                    <div className="text-xs text-zinc-500 font-mono text-right">
                        Total: <span className="text-zinc-200 font-semibold">{containers.length}</span> ·
                        Running: <span className="text-emerald-400 font-semibold ml-1">{runningContainers.length}</span>
                    </div>
                )}
            </div>

            {loading ? (
                <div className="flex items-center justify-center gap-3 text-sm text-zinc-300 py-10">
                    <div className="w-6 h-6 border-2 border-zinc-700 border-t-indigo-400 rounded-full animate-spin" />
                    <span>Cargando contenedores Docker...</span>
                </div>
            ) : runningContainers.length === 0 ? (
                <div className="text-sm text-zinc-400">
                    No hay contenedores en ejecución actualmente.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {runningContainers.map((container) => (
                        <div
                            key={container.id}
                            className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 shadow-xl flex flex-col gap-4"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-sm font-bold text-zinc-100 truncate">
                                        {container.name}
                                    </h3>
                                    <p className="text-xs text-zinc-500 font-mono truncate mt-1">
                                        {container.id}
                                    </p>
                                </div>
                                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 uppercase tracking-wide">
                                    {container.state}
                                </span>
                            </div>

                            <div className="space-y-2 text-xs text-zinc-400">
                                <div className="flex justify-between gap-2">
                                    <span className="text-zinc-500">Image</span>
                                    <span className="font-mono text-[11px] truncate text-zinc-200">
                                        {container.image.join(', ')}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <span className="text-zinc-500">Status</span>
                                    <span className="font-mono text-[11px] text-zinc-200">
                                        {container.status}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <span className="text-zinc-500">Created</span>
                                    <span className="font-mono text-[11px] text-zinc-200">
                                        {formatCreated(container.created)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DockerView;
