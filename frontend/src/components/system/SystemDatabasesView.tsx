import React, { useEffect, useMemo, useState } from 'react';
import type { DatabaseClassification } from '../../types';
import { getDatabaseClassification } from '../../services/api';

const statusStyles: Record<string, string> = {
    running: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300',
    exited: 'bg-rose-500/10 border-rose-500/40 text-rose-300',
    stopped: 'bg-rose-500/10 border-rose-500/40 text-rose-300',
    unknown: 'bg-zinc-800 border-zinc-700 text-zinc-300',
};

const SystemDatabasesView: React.FC = () => {
    const [items, setItems] = useState<DatabaseClassification[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [engineFilter, setEngineFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        const controller = new AbortController();
        setLoading(true);

        const fetchDatabases = async () => {
            try {
                setError(null);
                const data = await getDatabaseClassification(controller.signal);
                setItems(data);
            } catch (e) {
                if (
                    e instanceof DOMException && e.name === 'AbortError' ||
                    (typeof e === 'object' && e !== null && 'name' in e && (e as any).name === 'AbortError')
                ) {
                    return;
                }
                console.error('Error fetching database classification', e);
                setError('Databases could not be loaded.');
            } finally {
                // Keep the loading state visible even if the response is very fast.
                setTimeout(() => setLoading(false), 350);
            }
        };

        fetchDatabases();

        return () => controller.abort();
    }, []);

    const engineOptions = useMemo(
        () => Array.from(new Set(items.map(item => item.engine))).sort(),
        [items]
    );

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            if (engineFilter !== 'all' && item.engine !== engineFilter) {
                return false;
            }
            if (statusFilter !== 'all' && item.service.status !== statusFilter) {
                return false;
            }
            if (!searchQuery.trim()) return true;
            const q = searchQuery.trim().toLowerCase();
            return [
                item.engine,
                item.service.name,
                item.service.source,
                item.service.status,
                item.service.process ?? '',
                item.service.image ?? '',
            ]
                .join(' ')
                .toLowerCase()
                .includes(q);
        });
    }, [engineFilter, statusFilter, searchQuery, items]);

    const runningCount = items.filter(item => item.service.status === 'running').length;

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
            <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Services</p>
                    <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">Databases</h2>
                    <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
                        Classified engines and detected services with status and execution source.
                    </p>
                    {error && (
                        <p className="mt-3 text-xs text-amber-400">{error}</p>
                    )}
                </div>
                {!loading && (
                    <div className="text-xs text-zinc-500 font-mono">
                        Total: <span className="text-zinc-200 font-semibold">{items.length}</span> ·
                        Running: <span className="text-emerald-400 font-semibold ml-1">{runningCount}</span>
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
                            onChange={(event) => setSearchQuery(event.target.value)}
                            placeholder="Search engine, service, or image..."
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <span>Engine</span>
                        <div className="relative">
                            <select
                                value={engineFilter}
                                onChange={(event) => setEngineFilter(event.target.value)}
                                className="appearance-none bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="all">All</option>
                                {engineOptions.map((engine) => (
                                    <option key={engine} value={engine}>
                                        {engine}
                                    </option>
                                ))}
                            </select>
                            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-zinc-500">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </span>
                        </div>
                        <span>Status</span>
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={(event) => setStatusFilter(event.target.value)}
                                className="appearance-none bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            >
                                <option value="all">All</option>
                                <option value="running">Running</option>
                                <option value="exited">Exited</option>
                                <option value="stopped">Stopped</option>
                            </select>
                            <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-zinc-500">
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="space-y-4">
                    <div className="flex items-center gap-3 text-sm text-zinc-300">
                        <div className="w-6 h-6 border-2 border-zinc-700 border-t-indigo-400 rounded-full animate-spin" />
                        <span>Loading databases...</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div
                                key={`db-skeleton-${index}`}
                                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xl space-y-4 animate-pulse"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="space-y-2">
                                        <div className="h-4 w-32 bg-zinc-800 rounded" />
                                        <div className="h-3 w-20 bg-zinc-800 rounded" />
                                    </div>
                                    <div className="h-5 w-16 bg-zinc-800 rounded-full" />
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    <div className="h-3 w-20 bg-zinc-800 rounded" />
                                    <div className="h-3 w-24 bg-zinc-800 rounded" />
                                    <div className="h-3 w-20 bg-zinc-800 rounded" />
                                    <div className="h-3 w-28 bg-zinc-800 rounded" />
                                    <div className="h-3 w-20 bg-zinc-800 rounded" />
                                    <div className="h-3 w-24 bg-zinc-800 rounded" />
                                    <div className="h-3 w-20 bg-zinc-800 rounded" />
                                    <div className="h-3 w-16 bg-zinc-800 rounded" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : filteredItems.length === 0 ? (
                <div className="text-sm text-zinc-400">No databases to display.</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredItems.map((item, index) => {
                        const statusKey = item.service.status || 'unknown';
                        const badge = statusStyles[statusKey] ?? statusStyles.unknown;
                        return (
                            <div
                                key={`${item.service.name}-${item.engine}-${index}`}
                                className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 sm:p-5 shadow-xl space-y-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div>
                                        <h3 className="text-sm font-semibold text-zinc-100">{item.service.name}</h3>
                                        <p className="text-xs text-zinc-400 mt-1">{item.engine}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 text-[11px] font-semibold rounded-full uppercase tracking-wide border ${badge}`}>
                                        {item.service.status}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                    <div className="text-zinc-500">Source</div>
                                    <div className="text-zinc-200">{item.service.source}</div>
                                    <div className="text-zinc-500">Process</div>
                                    <div className="text-zinc-200 break-all">{item.service.process ?? '—'}</div>
                                    <div className="text-zinc-500">Image</div>
                                    <div className="text-zinc-200 break-all">{item.service.image ?? '—'}</div>
                                    <div className="text-zinc-500">Port</div>
                                    <div className="text-zinc-200">{item.service.port ?? '—'}</div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default SystemDatabasesView;
