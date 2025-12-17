import React, { useMemo, useState } from 'react';
import { useAlerts } from '../../hooks/useAlerts';

const LEVEL_STYLES: Record<string, string> = {
    critical: 'bg-rose-500/10 border border-rose-500/40 text-rose-300',
    warning: 'bg-amber-500/10 border border-amber-500/40 text-amber-300',
    error: 'bg-rose-500/10 border border-rose-500/40 text-rose-300',
    info: 'bg-indigo-500/10 border border-indigo-500/40 text-indigo-300',
    debug: 'bg-zinc-500/10 border border-zinc-500/40 text-zinc-300',
};

const formatTimestamp = (value: string) => {
    if (!value) return '—';
    const date = new Date(value);
    return isNaN(date.getTime()) ? value : date.toLocaleString();
};

const LEVEL_FILTERS = [
    { value: 'all', label: 'Todas' },
    { value: 'critical', label: 'Críticas' },
    { value: 'error', label: 'Errores' },
    { value: 'warning', label: 'Warnings' },
    { value: 'info', label: 'Info' },
    { value: 'debug', label: 'Debug' },
] as const;

const AlertsView: React.FC = () => {
    const { alerts, loading, loadingMore, error, total, refresh, hasMore, loadMore } = useAlerts();
    const [levelFilter, setLevelFilter] = useState<typeof LEVEL_FILTERS[number]['value']>('all');

    const filteredAlerts = useMemo(() => {
        if (levelFilter === 'all') return alerts;
        return alerts.filter(alert => alert.level === levelFilter);
    }, [alerts, levelFilter]);

    return (
        <div className="max-w-7xl mx-auto px-8 py-12 space-y-8">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                    <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">Alertas del sistema</h2>
                    <p className="text-zinc-400 text-sm mt-1">
                        Historico de alertas obtenidas desde <code className="font-mono text-[11px]">/alerts</code>.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={refresh}
                        type="button"
                        className="text-xs uppercase tracking-wide px-3 py-1.5 rounded-full border border-indigo-500 text-indigo-300 hover:bg-indigo-500/10 transition"
                    >
                        Refrescar
                    </button>
                    <span className="text-[11px] text-zinc-400 font-mono">{total} alert{total === 1 ? '' : 'as'}</span>
                </div>
            </div>

            {error && (
                <p className="text-xs text-amber-400">{error}</p>
            )}

            <div className="flex flex-wrap gap-2">
                {LEVEL_FILTERS.map(filter => (
                    <button
                        key={filter.value}
                        type="button"
                        onClick={() => setLevelFilter(filter.value)}
                        className={`px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wide border transition ${
                            levelFilter === filter.value
                                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                                : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                    >
                        {filter.label}
                    </button>
                ))}
            </div>

            <div className="bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full text-xs divide-y divide-zinc-800">
                        <thead className="bg-zinc-950/70">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">Nivel</th>
                                <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">Mensaje</th>
                                <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">Source</th>
                                <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">Timestamp</th>
                            </tr>
                        </thead>
                        <tbody className="bg-zinc-950/40 divide-y divide-zinc-800">
                        {loading ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-6 text-center text-sm text-zinc-400">
                                    Cargando alertas...
                                </td>
                            </tr>
                        ) : filteredAlerts.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-4 py-6 text-center text-sm text-zinc-400">
                                    No hay alertas que coincidan con el filtro seleccionado.
                                </td>
                            </tr>
                        ) : (
                            filteredAlerts.map(alert => (
                                <tr key={`${alert.id}-${alert.timestamp}`} className="hover:bg-zinc-800/40 transition-colors">
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide ${LEVEL_STYLES[alert.level] ?? LEVEL_STYLES.info}`}>
                                                {alert.level}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-zinc-200">
                                            {alert.message}
                                        </td>
                                        <td className="px-4 py-3 text-zinc-300">
                                            {alert.source ?? 'N/A'}
                                        </td>
                                        <td className="px-4 py-3 text-zinc-300 font-mono text-[11px]">
                                            {formatTimestamp(alert.timestamp)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="px-4 py-4 border-t border-zinc-800 bg-zinc-950/40 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div className="text-[11px] text-zinc-400 font-mono">
                        Mostrando {filteredAlerts.length} de {alerts.length} alertas cargadas ({total} totales)
                    </div>
                    <div className="flex items-center gap-3">
                        {hasMore ? (
                            <button
                                onClick={loadMore}
                                type="button"
                                disabled={loadingMore || loading}
                                className="text-xs uppercase tracking-wide px-3 py-1.5 rounded-full border border-zinc-700 text-zinc-200 disabled:border-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed hover:border-zinc-600 transition"
                            >
                                {loadingMore ? 'Cargando...' : 'Mostrar siguientes 20'}
                            </button>
                        ) : (
                            <span className="text-xs uppercase tracking-wide text-zinc-500">No hay más alertas</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AlertsView;
