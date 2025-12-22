import React, { useEffect, useState } from 'react';
import type { SystemdServiceSimple } from '../../types';
import { getSystemdServicesSimple } from '../../services/api';

const formatBytes = (value?: number | null) => {
    if (value === null || value === undefined) return '—';
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let num = value;
    let unitIndex = 0;
    while (num >= 1024 && unitIndex < units.length - 1) {
        num /= 1024;
        unitIndex += 1;
    }
    const precision = unitIndex === 0 ? 0 : num < 10 ? 1 : 0;
    return `${num.toFixed(precision)} ${units[unitIndex]}`;
};

const formatNullable = (value?: string | number | null) => {
    if (value === null || value === undefined || value === '') return '—';
    return String(value);
};

const SystemServicesView: React.FC = () => {
    const [services, setServices] = useState<SystemdServiceSimple[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [limit, setLimit] = useState(4);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const controller = new AbortController();

        const fetchServices = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getSystemdServicesSimple(limit, controller.signal);
                setServices(data);
            } catch (e) {
                if (
                    e instanceof DOMException && e.name === 'AbortError' ||
                    (typeof e === 'object' && e !== null && 'name' in e && (e as any).name === 'AbortError')
                ) {
                    return;
                }
                console.error('Error fetching systemd services', e);
                setError('No se pudieron cargar los servicios del sistema.');
            } finally {
                setTimeout(() => setLoading(false), 250);
            }
        };

        fetchServices();

        return () => controller.abort();
    }, [limit]);

    const activeCount = services.filter((service) => service.active_state === 'active').length;
    const filteredServices = services.filter((service) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.trim().toLowerCase();
        return [
            service.id,
            service.description ?? '',
            service.exec_start ?? '',
            service.user ?? '',
            service.group ?? '',
        ]
            .join(' ')
            .toLowerCase()
            .includes(q);
    });

    return (
        <div className="max-w-6xl mx-auto px-8 py-12">
            <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">Servicios del sistema</h2>
                    <div className="h-1 w-28 bg-indigo-600 rounded-full mt-4" />
                    <p className="text-zinc-400 mt-2 text-sm">
                        Estado de servicios systemd con vista compacta y detalles clave.
                    </p>
                    {error && (
                        <p className="mt-3 text-xs text-amber-400">
                            {error}
                        </p>
                    )}
                </div>
                <div className="flex flex-wrap items-center justify-end gap-3">
                    <div className="flex items-center gap-2 text-xs text-zinc-500">
                        <span>Límite</span>
                        <div className="relative">
                            <select
                                value={limit}
                                onChange={(event) => setLimit(Number(event.target.value))}
                                className="appearance-none bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                {[4, 8, 12, 16, 20, 30, 50].map((value) => (
                                    <option key={value} value={value}>
                                        {value}
                                    </option>
                                ))}
                            </select>
                            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-zinc-500">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </span>
                        </div>
                    </div>
                    {!loading && (
                        <div className="text-xs text-zinc-500 font-mono text-right">
                            Total: <span className="text-zinc-200 font-semibold">{services.length}</span> ·
                            Activos: <span className="text-emerald-400 font-semibold ml-1">{activeCount}</span>
                        </div>
                    )}
                </div>
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
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Buscar por servicio, usuario o comando..."
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center gap-3 text-sm text-zinc-300 py-10">
                    <div className="w-6 h-6 border-2 border-zinc-700 border-t-indigo-400 rounded-full animate-spin" />
                    <span>Cargando servicios del sistema...</span>
                </div>
            ) : services.length === 0 ? (
                <div className="text-sm text-zinc-400">
                    No hay servicios disponibles para mostrar.
                </div>
            ) : filteredServices.length === 0 ? (
                <div className="text-sm text-zinc-400">
                    No hay servicios que coincidan con la búsqueda.
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredServices.map((service) => {
                        const isActive = service.active_state === 'active';
                        return (
                            <div
                                key={service.id}
                                className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 shadow-xl space-y-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-zinc-100">
                                            {service.id}
                                        </h3>
                                        <p className="text-xs text-zinc-400 mt-1">
                                            {formatNullable(service.description)}
                                        </p>
                                    </div>
                                    <span
                                        className={`px-2 py-0.5 text-[11px] font-semibold rounded-full uppercase tracking-wide border ${
                                            isActive
                                                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                                                : 'bg-zinc-800 border-zinc-700 text-zinc-300'
                                        }`}
                                    >
                                        {service.active_state}
                                    </span>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-xs">
                                    <div className="text-zinc-500">Subestado</div>
                                    <div className="text-zinc-200">{formatNullable(service.sub_state)}</div>
                                    <div className="text-zinc-500">PID principal</div>
                                    <div className="text-zinc-200">{formatNullable(service.main_pid)}</div>
                                    <div className="text-zinc-500">Usuario</div>
                                    <div className="text-zinc-200">{formatNullable(service.user)}</div>
                                    <div className="text-zinc-500">Grupo</div>
                                    <div className="text-zinc-200">{formatNullable(service.group)}</div>
                                    <div className="text-zinc-500">Memoria</div>
                                    <div className="text-zinc-200">{formatBytes(service.memory_current)}</div>
                                    <div className="text-zinc-500">Tareas</div>
                                    <div className="text-zinc-200">{formatNullable(service.tasks_current)}</div>
                                </div>

                                <div>
                                    <p className="text-[11px] text-zinc-500 uppercase tracking-wide">Exec start</p>
                                    <p className="text-[11px] text-zinc-300 font-mono break-all mt-1">
                                        {formatNullable(service.exec_start)}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SystemServicesView;
