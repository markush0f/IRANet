import React, { useEffect, useState } from 'react';
import type { ProcessesSnapshot, ProcessInfo } from '../types';
import { getProcessesSnapshot } from '../services/api';

const formatKbToMiB = (kb: number) => `${(kb / 1024).toFixed(1)} MiB`;

const ProcessesView: React.FC = () => {
    const [snapshot, setSnapshot] = useState<ProcessesSnapshot | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [limit, setLimit] = useState<number>(10);

    useEffect(() => {
        const controller = new AbortController();

        const fetchSnapshot = async () => {
            try {
                setError(null);
                setLoading(true);
                const data = await getProcessesSnapshot(limit, controller.signal);
                setSnapshot(data);
            } catch (e) {
                if (
                    e instanceof DOMException && e.name === 'AbortError' ||
                    (typeof e === 'object' && e !== null && 'name' in e && (e as any).name === 'AbortError')
                ) {
                    return;
                }
                console.error('Error fetching processes snapshot', e);
                setError('No se pudo cargar el snapshot de procesos.');
            } finally {
                setLoading(false);
            }
        };

        fetchSnapshot();

        return () => controller.abort();
    }, [limit]);

    const header = snapshot?.header;
    const processes: ProcessInfo[] = snapshot?.processes ?? [];

    return (
        <div className="max-w-7xl mx-auto px-8 py-12">
            <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">Processes Snapshot</h2>
                    <div className="h-1 w-24 bg-indigo-600 rounded-full mt-4" />
                    <p className="text-zinc-400 mt-2 text-sm">
                        Vista compacta de procesos similar a <span className="font-semibold text-zinc-200">top</span>, obtenida desde el backend.
                    </p>
                    {error && (
                        <p className="mt-3 text-xs text-amber-400">
                            {error}
                        </p>
                    )}
                </div>
                <div className="flex flex-col items-start md:items-end gap-3">
                    <div className="flex items-center gap-2">
                        <span className="text-xs text-zinc-500">Límite de procesos:</span>
                        <select
                            value={limit}
                            onChange={(e) => setLimit(Number(e.target.value) || 10)}
                            className="bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                            <option value={5}>5</option>
                            <option value={10}>10</option>
                            <option value={20}>20</option>
                            <option value={50}>50</option>
                        </select>
                    </div>
                    {snapshot && (
                        <div className="text-xs text-zinc-500 font-mono">
                            ts: {snapshot.timestamp} · uptime: <span className="text-zinc-200">{header?.uptime}</span>
                        </div>
                    )}
                </div>
            </div>

            {header && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
                        <h3 className="text-xs font-bold text-zinc-300 mb-3 uppercase tracking-wide">Load / Tasks</h3>
                        <div className="flex justify-between text-xs text-zinc-400 mb-2">
                            <span>Load (1/5/15m)</span>
                            <span className="font-mono text-zinc-200">
                                {header.load_average.load_1m.toFixed(2)} / {header.load_average.load_5m.toFixed(2)} / {header.load_average.load_15m.toFixed(2)}
                            </span>
                        </div>
                        <div className="flex justify-between text-xs text-zinc-400">
                            <span>Tasks</span>
                            <span className="font-mono text-zinc-200">
                                total {header.tasks.total}, run {header.tasks.running}, sleep {header.tasks.sleeping}
                            </span>
                        </div>
                    </div>

                    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
                        <h3 className="text-xs font-bold text-zinc-300 mb-3 uppercase tracking-wide">CPU</h3>
                        <div className="flex justify-between text-xs text-zinc-400">
                            <span>us / sy / id</span>
                            <span className="font-mono text-zinc-200">
                                {header.cpu.us.toFixed(1)}% / {header.cpu.sy.toFixed(1)}% / {header.cpu.id.toFixed(1)}%
                            </span>
                        </div>
                    </div>

                    <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-4">
                        <h3 className="text-xs font-bold text-zinc-300 mb-3 uppercase tracking-wide">Memory / Swap</h3>
                        <div className="flex justify-between text-xs text-zinc-400 mb-1">
                            <span>Mem used / total</span>
                            <span className="font-mono text-zinc-200">
                                {formatKbToMiB(header.memory.used_kb)} / {formatKbToMiB(header.memory.total_kb)}
                            </span>
                        </div>
                        <div className="flex justify-between text-xs text-zinc-400 mb-1">
                            <span>Available</span>
                            <span className="font-mono text-zinc-200">
                                {header.memory.available_percent.toFixed(1)}%
                            </span>
                        </div>
                        <div className="flex justify-between text-xs text-zinc-400">
                            <span>Swap</span>
                            <span className="font-mono text-zinc-200">
                                {formatKbToMiB(header.swap.used_kb)} / {formatKbToMiB(header.swap.total_kb)} ({header.swap.state})
                            </span>
                        </div>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="flex items-center justify-center gap-3 text-sm text-zinc-300 py-10">
                    <div className="w-6 h-6 border-2 border-zinc-700 border-t-indigo-400 rounded-full animate-spin" />
                    <span>Cargando procesos...</span>
                </div>
            ) : processes.length === 0 ? (
                <div className="text-sm text-zinc-400">
                    No se han recibido procesos del backend.
                </div>
            ) : (
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-xs">
                            <thead className="bg-zinc-950/70 border-b border-zinc-800">
                                <tr>
                                    <th className="px-4 py-3 text-left font-bold text-zinc-500 uppercase tracking-wide">PID</th>
                                    <th className="px-4 py-3 text-left font-bold text-zinc-500 uppercase tracking-wide">User</th>
                                    <th className="px-4 py-3 text-left font-bold text-zinc-500 uppercase tracking-wide">Name</th>
                                    <th className="px-4 py-3 text-left font-bold text-zinc-500 uppercase tracking-wide">State</th>
                                    <th className="px-4 py-3 text-right font-bold text-zinc-500 uppercase tracking-wide">CPU</th>
                                    <th className="px-4 py-3 text-right font-bold text-zinc-500 uppercase tracking-wide">RES</th>
                                    <th className="px-4 py-3 text-right font-bold text-zinc-500 uppercase tracking-wide">VIRT</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {processes.map((p) => (
                                    <tr key={p.pid} className="hover:bg-zinc-800/40 transition-colors">
                                        <td className="px-4 py-2 font-mono text-zinc-200">{p.pid}</td>
                                        <td className="px-4 py-2 text-zinc-300">{p.user}</td>
                                        <td className="px-4 py-2 text-zinc-200 truncate max-w-[200px]">{p.name}</td>
                                        <td className="px-4 py-2">
                                            <span className="px-2 py-0.5 text-[10px] rounded-full border border-zinc-700 text-zinc-300 font-semibold uppercase tracking-wide">
                                                {p.state.code} · {p.state.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-right font-mono text-zinc-300">
                                            {p.cpu.time_formatted}
                                        </td>
                                        <td className="px-4 py-2 text-right font-mono text-zinc-300">
                                            {formatKbToMiB(p.memory.res_kb)}
                                        </td>
                                        <td className="px-4 py-2 text-right font-mono text-zinc-300">
                                            {formatKbToMiB(p.memory.virt_kb)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-4 py-3 border-t border-zinc-800 text-[11px] text-zinc-500 flex justify-between">
                        <span>
                            Mostrando <span className="text-zinc-200 font-semibold">{processes.length}</span> procesos
                        </span>
                        <span className="font-mono">
                            limit={snapshot?.limit ?? limit}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProcessesView;

