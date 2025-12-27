import React, { useEffect, useState } from 'react';
import type { DockerContainer } from '../../types';
import { getDockerContainers } from '../../services/api';

const formatCreated = (created: string) => {
    const date = new Date(created);
    if (Number.isNaN(date.getTime())) return created;
    return date.toLocaleString();
};

const DockerView: React.FC = () => {
    const [containers, setContainers] = useState<DockerContainer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'running' | 'exited'>('running');
    const [searchQuery, setSearchQuery] = useState('');

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
                setError('Docker containers could not be loaded.');
            } finally {
                // Small delay so the spinner is visible even with fast responses.
                setTimeout(() => setLoading(false), 250);
            }
        };

        fetchContainers();

        return () => controller.abort();
    }, []);

    const runningContainers = containers.filter(
        (c) => c.state === 'running' || c.status === 'running'
    );

    const filteredByStatus = containers.filter((c) => {
        if (statusFilter === 'running') {
            return c.state === 'running' || c.status === 'running';
        }
        if (statusFilter === 'exited') {
            return c.state === 'exited' || c.status === 'exited';
        }
        return true;
    });

    const filteredContainers = filteredByStatus.filter((c) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            c.name.toLowerCase().includes(q) ||
            c.id.toLowerCase().includes(q) ||
            c.status.toLowerCase().includes(q) ||
            c.image.join(', ').toLowerCase().includes(q)
        );
    });

    const handleToggleContainer = (id: string) => {
        setContainers(prev =>
            prev.map(c => {
                if (c.id !== id) return c;
                const isRunning = c.state === 'running' || c.status === 'running';
                const nextState = isRunning ? 'exited' : 'running';
                return { ...c, state: nextState, status: nextState };
            })
        );
    };

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-2 pb-6 sm:pt-3 sm:pb-8 lg:pt-4 lg:pb-10 text-sm">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">Docker Containers</h2>
                    <div className="h-1 w-24 bg-indigo-600 rounded-full mt-4" />
                    <p className="text-zinc-400 mt-2 text-sm">
                        Listado de contenedores Docker obtenidos desde el backend. Filtra por estado, busca por nombre, imagen o id y simula acciones de parada/arranque.
                    </p>
                    {error && (
                        <p className="mt-3 text-xs text-amber-400">
                            {error}
                        </p>
                    )}
                </div>
                {!loading && (
                    <div className="flex flex-col items-start lg:items-end gap-2">
                        <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-500">Filter:</span>
                            <div className="inline-flex rounded-full bg-zinc-900 p-1 border border-zinc-800">
                                <button
                                    onClick={() => setStatusFilter('running')}
                                    className={`px-3 py-1 text-[11px] rounded-full ${
                                        statusFilter === 'running'
                                            ? 'bg-emerald-500/10 text-emerald-400'
                                            : 'text-zinc-400 hover:text-zinc-200'
                                    }`}
                                >
                                    Running
                                </button>
                                <button
                                    onClick={() => setStatusFilter('exited')}
                                    className={`px-3 py-1 text-[11px] rounded-full ${
                                        statusFilter === 'exited'
                                            ? 'bg-rose-500/10 text-rose-400'
                                            : 'text-zinc-400 hover:text-zinc-200'
                                    }`}
                                >
                                    Exited
                                </button>
                                <button
                                    onClick={() => setStatusFilter('all')}
                                    className={`px-3 py-1 text-[11px] rounded-full ${
                                        statusFilter === 'all'
                                            ? 'bg-zinc-800 text-zinc-100'
                                            : 'text-zinc-400 hover:text-zinc-200'
                                    }`}
                                >
                                    All
                                </button>
                            </div>
                        </div>
                        <div className="text-[10px] text-zinc-500 font-mono text-right">
                            Total: <span className="text-zinc-200 font-semibold">{containers.length}</span> ·
                            Running: <span className="text-emerald-400 font-semibold ml-1">{runningContainers.length}</span>
                        </div>
                    </div>
                )}
            </div>

            {!loading && (
                <div className="mb-6 flex flex-wrap items-center gap-3">
                    <div className="relative flex-1 min-w-[220px] max-w-sm">
                        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-500">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                            </svg>
                        </span>
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by name, image, or id..."
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center gap-3 text-sm text-zinc-300 py-10">
                    <div className="w-6 h-6 border-2 border-zinc-700 border-t-indigo-400 rounded-full animate-spin" />
                    <span>Loading Docker containers...</span>
                </div>
            ) : filteredContainers.length === 0 ? (
                <div className="text-[10px] text-zinc-500">
                    No containers match the current filter.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredContainers.map((container) => {
                        const isRunning = container.state === 'running' || container.status === 'running';
                        return (
                        <div
                            key={container.id}
                            className={`bg-zinc-900 rounded-xl border p-4 sm:p-5 shadow-xl flex flex-col gap-4 ${
                                isRunning ? 'border-zinc-800' : 'border-rose-500/60'
                            }`}
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-base font-bold text-zinc-100 truncate">
                                        {container.name.toUpperCase()}
                                    </h3>
                                    <p className="text-[10px] text-zinc-500 font-mono truncate mt-1">
                                        {container.id}
                                    </p>
                                </div>
                                <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full uppercase tracking-wide border ${
                                    isRunning
                                        ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                                        : 'bg-rose-500/10 border-rose-500/60 text-rose-300'
                                }`}>
                                    {container.state}
                                </span>
                            </div>

                            <div className="space-y-2 text-sm text-zinc-300">
                                <div className="flex justify-between gap-2">
                                    <span className="text-zinc-400">Image</span>
                                    <span className="font-mono text-[12px] truncate text-zinc-100">
                                        {container.image.join(', ')}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <span className="text-zinc-400">Status</span>
                                    <span className="font-mono text-[12px] text-zinc-100">
                                        {container.status}
                                    </span>
                                </div>
                                <div className="flex justify-between gap-2">
                                    <span className="text-zinc-400">Created</span>
                                    <span className="font-mono text-[12px] text-zinc-100">
                                        {formatCreated(container.created)}
                                    </span>
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button
                                    onClick={() => handleToggleContainer(container.id)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${
                                        isRunning
                                            ? 'border-rose-500/60 text-rose-400 hover:bg-rose-500/10'
                                            : 'border-emerald-500/60 text-emerald-400 hover:bg-emerald-500/10'
                                    }`}
                                >
                                    {isRunning ? 'Stop' : 'Start'}
                                </button>
                            </div>
                        </div>
                    )})}
                </div>
            )}
        </div>
    );
};

export default DockerView;
