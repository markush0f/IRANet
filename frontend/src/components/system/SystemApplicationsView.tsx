import React, { useCallback, useEffect, useState } from 'react';
import type { SystemApplication } from '../../types';
import { getApplicationDiscoveryBasicGrouped } from '../../services/api';
import SystemApplicationsSection from './SystemApplicationsSection';

const MIN_ETIMES_SECONDS = 15;

const SystemApplicationsView: React.FC = () => {
    const [applications, setApplications] = useState<SystemApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchApplications = useCallback(async (signal?: AbortSignal) => {
        try {
            setLoading(true);
            setError(null);
            const discovered = await getApplicationDiscoveryBasicGrouped(MIN_ETIMES_SECONDS, signal);
            setApplications(discovered);
        } catch (e) {
            const aborted =
                e instanceof DOMException && e.name === 'AbortError' ||
                (typeof e === 'object' && e !== null && 'name' in e && (e as any).name === 'AbortError');
            if (aborted) return;
            console.error('Error fetching system applications discovery list', e);
            setError('System applications could not be loaded.');
        } finally {
            setTimeout(() => setLoading(false), 250);
        }
    }, []);

    useEffect(() => {
        const controller = new AbortController();
        void fetchApplications(controller.signal);
        return () => controller.abort();
    }, [fetchApplications]);

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-2 pb-6 sm:pt-3 sm:pb-8 lg:pt-4 lg:pb-10 text-sm space-y-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Applications</p>
                    <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">System applications</h2>
                    <p className="text-xs text-zinc-400 leading-relaxed mt-2 max-w-2xl">
                        Discovered working directories grouped by command (min uptime: {MIN_ETIMES_SECONDS}s). Add entries to persist monitoring configuration.
                    </p>
                    {error && (
                        <p className="mt-3 text-xs text-amber-400">
                            {error}
                        </p>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {!loading && (
                        <div className="text-xs text-zinc-400 leading-relaxed font-mono text-right">
                            Found <span className="text-zinc-200 font-semibold">{applications.length}</span>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => {
                            const controller = new AbortController();
                            void fetchApplications(controller.signal);
                        }}
                        disabled={loading}
                        className="rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-200 transition hover:border-indigo-500/50 hover:text-indigo-300 disabled:opacity-50"
                    >
                        {loading ? 'Loading…' : 'Refresh'}
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-sm text-zinc-400">
                    Loading system applications…
                </div>
            ) : applications.length === 0 ? (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-900 p-6 text-sm text-zinc-400">
                    No applications discovered yet.
                </div>
            ) : (
                <SystemApplicationsSection applications={applications} />
            )}
        </div>
    );
};

export default SystemApplicationsView;
