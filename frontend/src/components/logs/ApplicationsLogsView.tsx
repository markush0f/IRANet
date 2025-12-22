import React, { useEffect, useMemo, useState } from 'react';
import { getApplicationsLogsList, type RemoteApplicationRecord } from '../../services/api';

const formatDate = (value?: string | null) => {
    if (!value) return '—';
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
};

const ApplicationsLogsView: React.FC = () => {
    const [applications, setApplications] = useState<RemoteApplicationRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);
        setError(null);

        getApplicationsLogsList(controller.signal)
            .then(data => {
                setApplications(data);
            })
            .catch(err => {
                if (err instanceof DOMException && err.name === 'AbortError') {
                    return;
                }
                console.error('Error loading applications logs list', err);
                setError('No se pudo cargar la lista de aplicaciones con logs.');
            })
            .finally(() => {
                setLoading(false);
            });

        return () => controller.abort();
    }, []);

    const filtered = useMemo(() => {
        return applications.filter(app => (app.log_paths ?? []).length > 0);
    }, [applications]);

    return (
        <div className="max-w-7xl mx-auto px-8 py-12 space-y-6">
            <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Logs</p>
                <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">Aplicaciones con logs</h2>
                <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
                    Listado de aplicaciones que tienen rutas de logs configuradas.
                </p>
            </div>

            {error && (
                <div className="rounded-2xl border border-rose-500/40 bg-rose-500/5 px-4 py-3 text-sm text-rose-200">
                    {error}
                </div>
            )}

            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 shadow-lg">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-xs divide-y divide-zinc-800">
                        <thead className="bg-zinc-950/70">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">Nombre</th>
                                <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">Workdir</th>
                                <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">Creado</th>
                                <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">Log paths</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-800">
                            {loading ? (
                                <tr>
                                    <td className="px-4 py-6 text-center text-zinc-500" colSpan={4}>
                                        Cargando aplicaciones...
                                    </td>
                                </tr>
                            ) : filtered.length === 0 ? (
                                <tr>
                                    <td className="px-4 py-6 text-center text-zinc-500" colSpan={4}>
                                        No hay aplicaciones con logs configurados.
                                    </td>
                                </tr>
                            ) : (
                                filtered.map(app => (
                                    <tr key={app.id ?? app.identifier} className="hover:bg-zinc-900/60 transition-colors">
                                        <td className="px-4 py-3 font-semibold text-zinc-100">
                                            {app.name || app.identifier}
                                        </td>
                                        <td className="px-4 py-3 text-zinc-300 font-mono">
                                            {app.workdir ?? '—'}
                                        </td>
                                        <td className="px-4 py-3 text-zinc-400 font-mono">
                                            {formatDate(app.created_at)}
                                        </td>
                                        <td className="px-4 py-3 text-zinc-300">
                                            {(app.log_paths ?? []).map((path, index) => (
                                                <div key={`${app.identifier}-log-${index}`} className="text-[11px] leading-relaxed">
                                                    <span className="font-mono text-zinc-200">{path}</span>
                                                </div>
                                            ))}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ApplicationsLogsView;
