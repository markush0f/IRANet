import React from 'react';
import type { SystemPackageHistoryEvent } from '../../../types';

interface HistoryTimelineProps {
    events: SystemPackageHistoryEvent[];
    emptyMessage?: string;
    packageFallback?: string | null;
}

const formatDateTime = (value?: string | null) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const getActionStyles = (action: string) => {
    if (action === 'install') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
    if (action === 'upgrade') return 'border-sky-500/40 bg-sky-500/10 text-sky-300';
    if (action === 'remove') return 'border-rose-500/40 bg-rose-500/10 text-rose-300';
    return 'border-zinc-700 bg-zinc-800/50 text-zinc-300';
};

const normalizeAction = (value?: string | null) => {
    if (!value) return 'unknown';
    return value.toLowerCase();
};

const HistoryTimeline: React.FC<HistoryTimelineProps> = ({ events, emptyMessage, packageFallback }) => {
    if (events.length === 0) {
        return <div className="text-sm text-zinc-500">{emptyMessage ?? 'Sin eventos registrados.'}</div>;
    }

    return (
        <div className="space-y-3">
            {events.map((event, index) => {
                const action = normalizeAction(event.action);
                const date = event.date ?? event.timestamp ?? '';
                return (
                    <div key={`${action}-${date}-${index}`} className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${getActionStyles(action)}`}>
                                {action}
                            </span>
                            <span className="text-xs font-mono text-zinc-400">{formatDateTime(date)}</span>
                        </div>
                        <div className="mt-2 text-sm text-zinc-200">
                            {(event.packages && event.packages.length > 0) ? (
                                <span className="font-mono">{event.packages.join(', ')}</span>
                            ) : (
                                <span className="font-mono">{event.package ?? packageFallback ?? '—'}</span>
                            )}
                        </div>
                        {event.command && (
                            <div className="mt-2 text-[11px] text-zinc-400 font-mono break-all">
                                {event.command}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default HistoryTimeline;
