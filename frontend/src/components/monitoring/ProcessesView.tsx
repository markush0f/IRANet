import React, { useEffect, useMemo, useState } from 'react';
import type { ProcessesSnapshot } from '../../types';
import { getProcessesSnapshot } from '../../services/api';

const formatKbToMiB = (kb: number) => `${(kb / 1024).toFixed(1)} MiB`;

const getStateDisplay = (stateCode: string, stateLabel: string) => {
    const code = stateCode.toUpperCase();
    const label = stateLabel.toLowerCase();

    if (code === 'R' || label.includes('running')) {
        return { badge: 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300', text: 'Running', icon: '▶️' };
    }
    if (code === 'S' || label.includes('sleeping')) {
        return { badge: 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300', text: 'Sleeping', icon: '💤' };
    }
    if (code === 'Z') {
        return { badge: 'bg-zinc-500/10 border-zinc-500/40 text-zinc-300', text: 'Zombie', icon: '🧟' };
    }
    if (code === 'T') {
        return { badge: 'bg-amber-500/10 border-amber-500/40 text-amber-300', text: 'Stopped', icon: '⏸️' };
    }

    return { badge: 'bg-zinc-500/10 border-zinc-500/40 text-zinc-300', text: stateLabel, icon: '⚙️' };
};

const ProcessesView: React.FC = () => {
    const [snapshot, setSnapshot] = useState<ProcessesSnapshot | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [limit, setLimit] = useState(10);
    const [stateFilter, setStateFilter] = useState<'all' | 'running' | 'sleeping' | 'other'>('all');
    const [userFilter, setUserFilter] = useState('all');
    const [search, setSearch] = useState('');

    useEffect(() => {
        const controller = new AbortController();

        const loadSnapshot = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getProcessesSnapshot(limit, controller.signal);
                setSnapshot(data);
            } catch (e: any) {
                if (e?.name !== 'AbortError') {
                    setError('Failed to load processes snapshot');
                }
            } finally {
                setLoading(false);
            }
        };

        loadSnapshot();
        return () => controller.abort();
    }, [limit]);

    const processes = snapshot?.processes ?? [];

    const users = useMemo(
        () => Array.from(new Set(processes.map(p => p.user))).sort(),
        [processes]
    );

    const filteredProcesses = useMemo(() => {
        return processes.filter(p => {
            if (userFilter !== 'all' && p.user !== userFilter) return false;

            const label = p.state.label.toLowerCase();

            if (stateFilter === 'running' && !label.includes('running')) return false;
            if (stateFilter === 'sleeping' && !label.includes('sleeping')) return false;
            if (stateFilter === 'other' && (label.includes('running') || label.includes('sleeping'))) return false;

            if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;

            return true;
        });
    }, [processes, userFilter, stateFilter, search]);

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-2 pb-6 sm:pt-3 sm:pb-8 lg:pt-4 lg:pb-10 text-sm min-h-full flex flex-col">
            <header className="mb-6 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100">System Processes</h2>
                        <p className="text-base text-zinc-400">Real-time process monitoring</p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        <select
                            value={limit}
                            onChange={e => setLimit(Number(e.target.value))}
                            className="w-full sm:w-auto bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 text-sm text-zinc-200"
                        >
                            <option value={5}>Top 5</option>
                            <option value={10}>Top 10</option>
                            <option value={20}>Top 20</option>
                            <option value={50}>Top 50</option>
                            <option value={100}>Top 100</option>
                        </select>

                        <span className="px-3 py-2 rounded-full bg-zinc-800 text-sm text-zinc-300">
                            {filteredProcesses.length}
                        </span>
                    </div>
                </div>

                {error && (
                    <div className="rounded-xl border border-rose-500/40 bg-rose-500/5 px-4 py-2 text-xs text-rose-200">
                        {error}
                    </div>
                )}

                <div className="flex flex-wrap gap-2">
                    <input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search process..."
                        className="w-full sm:w-auto px-4 py-2 rounded-full text-sm bg-zinc-900 border border-zinc-800 text-zinc-300"
                    />

                    <select
                        value={userFilter}
                        onChange={e => setUserFilter(e.target.value)}
                        className="w-full sm:w-auto px-4 py-2 rounded-full text-sm bg-zinc-900 border border-zinc-800 text-zinc-300"
                    >
                        <option value="all">All users</option>
                        {users.map(u => (
                            <option key={u} value={u}>{u}</option>
                        ))}
                    </select>

                    <select
                        value={stateFilter}
                        onChange={e => setStateFilter(e.target.value as any)}
                        className="w-full sm:w-auto px-4 py-2 rounded-full text-sm bg-zinc-900 border border-zinc-800 text-zinc-300"
                    >
                        <option value="all">All states</option>
                        <option value="running">Running</option>
                        <option value="sleeping">Sleeping</option>
                        <option value="other">Other</option>
                    </select>
                </div>
            </header>

            <main className="flex-1 bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
                {loading && (
                    <div className="h-full flex items-center justify-center text-base text-zinc-400">
                        Loading processes...
                    </div>
                )}

                {!loading && filteredProcesses.length === 0 && (
                    <div className="h-full flex items-center justify-center text-base text-zinc-400">
                        No matching processes
                    </div>
                )}

                <div className="divide-y divide-zinc-800 overflow-y-auto h-full">
                    {filteredProcesses.map(p => {
                        const state = getStateDisplay(p.state.code, p.state.label);

                        return (
                            <div key={p.pid} className="p-4 hover:bg-zinc-800/40">
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs uppercase tracking-wide text-zinc-500">
                                                PID
                                            </span>
                                            <span className="text-sm font-mono text-zinc-400">
                                                {p.pid}
                                            </span>
                                            <span className="text-base font-medium text-zinc-100 truncate">
                                                {p.name}
                                            </span>
                                        </div>

                                        <div className="mt-1 text-xs text-zinc-400 leading-relaxed flex gap-4">
                                            <span>User: {p.user}</span>
                                            <span>RES: {formatKbToMiB(p.memory.res_kb)}</span>
                                            <span>VIRT: {formatKbToMiB(p.memory.virt_kb)}</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end shrink-0">
                                        <span className={`px-3 py-1 rounded border text-xs font-semibold ${state.badge}`}>
                                            {state.icon} {state.text}
                                        </span>
                                        <span className="mt-1 text-xs font-mono text-zinc-400">
                                            {p.cpu.time_formatted}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </main>
        </div>
    );
};

export default ProcessesView;
