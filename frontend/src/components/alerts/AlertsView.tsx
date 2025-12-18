import React, { useMemo, useState } from 'react';
import { useAlerts } from '../../hooks/useAlerts';
import type { AlertRecord } from '../../services/alertsService';

const LEVEL_STYLES: Record<string, { bg: string; border: string }> = {
    critical: { bg: 'bg-rose-500/10 border-rose-500/40 text-rose-300', border: 'border-l-rose-500' },
    warning: { bg: 'bg-amber-500/10 border-amber-500/40 text-amber-300', border: 'border-l-amber-500' },
    error: { bg: 'bg-rose-500/10 border-rose-500/40 text-rose-300', border: 'border-l-red-500' },
    info: { bg: 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300', border: 'border-l-indigo-500' },
    debug: { bg: 'bg-zinc-500/10 border-zinc-500/40 text-zinc-300', border: 'border-l-zinc-500' },
};

const formatTimestamp = (value: string) => {
    if (!value) return '—';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;

    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `Hace ${minutes}m`;
    if (hours < 24) return `Hace ${hours}h`;
    if (days < 7) return `Hace ${days}d`;

    return date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
};

const LEVEL_FILTERS = [
    { value: 'all', label: 'Todas', count: 0 },
    { value: 'critical', label: 'Críticas', count: 0 },
    { value: 'error', label: 'Errores', count: 0 },
    { value: 'warning', label: 'Warnings', count: 0 },
    { value: 'info', label: 'Info', count: 0 },
    { value: 'debug', label: 'Debug', count: 0 },
] as const;

const AlertsView: React.FC = () => {
    const { alerts, loading, loadingMore, error, total, refresh, hasMore, loadMore } = useAlerts();
    const [levelFilter, setLevelFilter] = useState<typeof LEVEL_FILTERS[number]['value']>('all');

    const filteredAlerts = useMemo(() => {
        if (levelFilter === 'all') return alerts;
        return alerts.filter(alert => alert.level === levelFilter);
    }, [alerts, levelFilter]);

    const levelCounts = useMemo(() => {
        const counts: Record<string, number> = { all: alerts.length };
        alerts.forEach(alert => {
            counts[alert.level] = (counts[alert.level] || 0) + 1;
        });
        return counts;
    }, [alerts]);

    const formatMoment = (alert: AlertRecord) => formatTimestamp(alert.first_seen_at ?? alert.timestamp ?? alert.last_seen_at ?? '');

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 h-screen flex flex-col">
            {/* Header */}
            <div className="flex flex-col gap-4 mb-6">
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h2 className="text-2xl md:text-3xl font-bold text-zinc-100 tracking-tight">Alertas del sistema</h2>
                        <p className="text-zinc-400 text-xs md:text-sm mt-1">
                            Monitoreo en tiempo real de eventos del sistema
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <button
                            onClick={refresh}
                            type="button"
                            className="inline-flex items-center gap-2 text-xs uppercase tracking-wide px-4 py-2 rounded-full border border-indigo-500 text-indigo-300 hover:bg-indigo-500/10 transition"
                        >
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Refrescar
                        </button>
                        <div className="px-3 py-2 rounded-full bg-zinc-800/50 border border-zinc-700">
                            <span className="text-xs font-mono text-zinc-300">{total}</span>
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-amber-500/10 border border-amber-500/40 rounded-xl p-3">
                        <p className="text-xs text-amber-300">{error}</p>
                    </div>
                )}

                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                    {LEVEL_FILTERS.map(filter => {
                        const count = levelCounts[filter.value] || 0;
                        return (
                            <button
                                key={filter.value}
                                type="button"
                                onClick={() => setLevelFilter(filter.value)}
                                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-semibold uppercase tracking-wide border transition ${levelFilter === filter.value
                                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                                        : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                                    }`}
                            >
                                {filter.label}
                                {count > 0 && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-zinc-800 text-[10px] font-bold">
                                        {count}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Alerts Container with Fixed Height */}
            <div className="flex-1 bg-zinc-900 rounded-2xl border border-zinc-800 shadow-xl overflow-hidden flex flex-col min-h-0">
                {/* Alerts List with Scroll */}
                <div className="flex-1 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-full p-12">
                            <div className="text-center">
                                <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
                                <p className="text-sm text-zinc-400">Cargando alertas...</p>
                            </div>
                        </div>
                    ) : filteredAlerts.length === 0 ? (
                        <div className="flex items-center justify-center h-full p-12">
                            <div className="text-center">
                                <div className="text-4xl mb-3">📭</div>
                                <p className="text-sm text-zinc-400">No hay alertas que coincidan con el filtro</p>
                            </div>
                        </div>
                    ) : (
                        <div className="divide-y divide-zinc-800">
                            {filteredAlerts.map(alert => {
                                const levelStyle = LEVEL_STYLES[alert.level] ?? LEVEL_STYLES.info;
                                return (
                                    <div
                                        key={alert.id}
                                        className={`p-4 hover:bg-zinc-800/40 transition-colors cursor-pointer border-l-8 ${levelStyle.border}`}
                                    >
                                        <div className="flex items-start justify-between gap-4 mb-2">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${levelStyle.bg}`}>
                                                {alert.level}
                                            </span>
                                            <span className="text-[11px] text-zinc-500 font-mono whitespace-nowrap">
                                                {formatMoment(alert)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-zinc-200 mb-2 break-words">
                                            {alert.message}
                                        </p>
                                        <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                                            <span className="font-mono">{alert.host ?? alert.source ?? 'N/A'}</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-3 border-t border-zinc-800 bg-zinc-950/70 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-[11px] text-zinc-400 font-mono">
                        {filteredAlerts.length} de {total} alertas
                    </div>
                    {hasMore && (
                        <button
                            onClick={loadMore}
                            type="button"
                            disabled={loadingMore || loading}
                            className="inline-flex items-center justify-center gap-2 text-xs uppercase tracking-wide px-4 py-2 rounded-full border border-zinc-700 text-zinc-200 disabled:border-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed hover:border-zinc-600 hover:bg-zinc-800/50 transition"
                        >
                            {loadingMore ? (
                                <>
                                    <div className="w-3 h-3 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin"></div>
                                    Cargando...
                                </>
                            ) : (
                                <>
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                    Cargar más
                                </>
                            )}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AlertsView;