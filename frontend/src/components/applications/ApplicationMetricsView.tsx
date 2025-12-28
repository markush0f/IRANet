import React, { useMemo } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from 'recharts';
import { useApplicationsMetrics } from '../../hooks/useApplicationsMetrics';

const formatMiB = (kb?: number | null) => {
    if (kb === null || kb === undefined) return '—';
    return `${(kb / 1024).toFixed(1)} MiB`;
};

const formatTimestamp = (value?: Date | null) => {
    if (!value) return '—';
    return value.toLocaleString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    });
};

const StatusBadge = ({ status }: { status: string }) => {
    const normalized = status.toLowerCase();
    const styles = (() => {
        if (normalized === 'running') return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300';
        if (normalized === 'stopped') return 'border-zinc-700 bg-zinc-800/40 text-zinc-300';
        if (normalized === 'error') return 'border-rose-500/40 bg-rose-500/10 text-rose-300';
        return 'border-amber-500/40 bg-amber-500/10 text-amber-300';
    })();

    return (
        <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${styles}`}>
            {status}
        </span>
    );
};

const KpiCard = ({ label, value, hint }: { label: string; value: string; hint?: string }) => (
    <div className="panel-soft accent-border rounded-2xl p-3 sm:p-4">
        <div className="text-[10px] uppercase tracking-wide text-zinc-500">{label}</div>
        <div className="mt-1 text-lg sm:text-xl font-semibold text-zinc-100">{value}</div>
        {hint && <div className="mt-1 text-[11px] text-zinc-400 leading-relaxed">{hint}</div>}
    </div>
);

const EmptyState = ({ title, body }: { title: string; body: string }) => (
    <div className="panel accent-border rounded-2xl p-6 text-center">
        <div className="text-base font-semibold text-zinc-100">{title}</div>
        <div className="mt-2 text-xs text-zinc-400 leading-relaxed">{body}</div>
    </div>
);

const ChartPlaceholder = ({ label }: { label: string }) => (
    <div className="flex h-[240px] items-center justify-center text-xs text-zinc-500">
        {label}
    </div>
);

const ApplicationMetricsView: React.FC = () => {
    const {
        applications,
        appsLoading,
        appsError,
        appsSearch,
        setAppsSearch,
        selectedApp,
        selectedAppId,
        setSelectedAppId,
        selectedAppMeta,
        activeTab,
        setActiveTab,
        refreshApplications,

        snapshotLimit,
        setSnapshotLimit,
        snapshotLoading,
        snapshotError,
        refreshSnapshot,
        selectedProcess,

        liveEnabled,
        setLiveEnabled,
        pollIntervalMs,
        setPollIntervalMs,
        liveSamples,

        discovery,
        discoveryLoading,
        discoveryError,

        logFiles,
        logFilesLoading,
        logFilesError,
        selectedLogFile,
        setSelectedLogFile,
        logHistoryLoading,
        logHistoryError,
        logHistoryLimit,
        setLogHistoryLimit,
        logSearch,
        setLogSearch,
        filteredLogHistory,
        logLevelBreakdown,
        logTimeline,
        rescanLoading,
        rescanLogs,
    } = useApplicationsMetrics();

    const memorySeries = useMemo(() => {
        return liveSamples.map(sample => ({
            time: new Date(sample.ts).toLocaleTimeString('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
            }),
            rssMiB: sample.rss_kb === null ? null : sample.rss_kb / 1024,
            virtMiB: sample.virt_kb === null ? null : sample.virt_kb / 1024,
            fullTimestamp: new Date(sample.ts).toLocaleString('es-ES'),
        }));
    }, [liveSamples]);

    const hasMemoryData = useMemo(() => memorySeries.some(point => point.rssMiB !== null || point.virtMiB !== null), [memorySeries]);

    const logVolumeSeries = useMemo(() => {
        if (!logTimeline.length) return [];
        return logTimeline.map(point => ({
            time: new Date(point.minute).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
            total: point.total,
            errors: point.errors,
            warns: point.warns,
            fullTimestamp: new Date(point.minute).toLocaleString('es-ES'),
        }));
    }, [logTimeline]);

    const hasLogsTimeline = logVolumeSeries.length > 1;

    const processHint = useMemo(() => {
        if (!selectedApp?.pid) return 'No PID reported by backend.';
        if (!selectedProcess) return `PID ${selectedApp.pid} not found in snapshot. Increase snapshot limit.`;
        return null;
    }, [selectedApp?.pid, selectedProcess]);

    const tabs = [
        { id: 'overview' as const, label: 'Overview' },
        { id: 'live' as const, label: 'Live metrics' },
        { id: 'logs' as const, label: 'Logs' },
        { id: 'diagnostics' as const, label: 'Diagnostics' },
    ];

    return (
        <div className="w-full h-full min-h-full overflow-y-auto lg:overflow-hidden px-4 sm:px-6 lg:px-8 pt-2 pb-6 sm:pt-3 sm:pb-8 lg:pt-4 lg:pb-10 text-sm flex flex-col gap-4">
            <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Applications</p>
                    <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">Application metrics</h2>
                    <p className="text-xs text-zinc-400 leading-relaxed mt-1 max-w-2xl">
                        A per-application dashboard built on the current backend signals (process snapshots, discovery, and logs).
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => refreshApplications()}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/40 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-200 hover:border-zinc-700"
                >
                    Refresh apps
                </button>
            </div>

            <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)] flex-1 min-h-0 lg:overflow-hidden">
                <aside className="panel accent-border rounded-2xl p-3 sm:p-4 flex flex-col min-h-0">
                    <div className="flex items-center justify-between gap-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Installed</div>
                        <div className="text-[11px] text-zinc-500">{applications.length}</div>
                    </div>

                    <div className="mt-3">
                        <input
                            value={appsSearch}
                            onChange={event => setAppsSearch(event.target.value)}
                            placeholder="Search applications..."
                            className="w-full rounded-xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
                        />
                    </div>

                    {appsError && (
                        <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                            {appsError}
                        </div>
                    )}

                    <div className="mt-3 flex-1 min-h-0 overflow-y-visible lg:overflow-y-auto pr-1 scrollbar-strong space-y-1">
                        {appsLoading ? (
                            <div className="text-xs text-zinc-500 px-2 py-3">Loading applications…</div>
                        ) : applications.length === 0 ? (
                            <div className="text-xs text-zinc-500 px-2 py-3">
                                No downloaded applications found.
                            </div>
                        ) : (
                            applications.map(app => {
                                const label = app.name || app.identifier || app.workdir || app.id;
                                const isActive = selectedAppId === app.id;
                                const status = (app.status || 'unknown').toLowerCase();
                                const badgeTone = status.includes('running') || status.includes('online') || status === 'ok'
                                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
                                    : status.includes('error') || status.includes('failed')
                                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/40'
                                        : 'bg-zinc-800/40 text-zinc-300 border-zinc-700';

                                return (
                                    <button
                                        key={app.id}
                                        type="button"
                                        onClick={() => setSelectedAppId(app.id)}
                                        className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                                            isActive
                                                ? 'border-indigo-500/40 bg-indigo-500/10'
                                                : 'border-zinc-800 bg-zinc-950/20 hover:bg-zinc-950/40 hover:border-zinc-700'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <div className="text-sm font-semibold text-zinc-100 truncate">{label}</div>
                                                <div className="mt-1 text-[11px] text-zinc-500 truncate">
                                                    {app.kind ? `${app.kind} · ` : ''}{app.workdir || '—'}
                                                </div>
                                            </div>
                                            <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${badgeTone}`}>
                                                {app.status || 'unknown'}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {typeof app.port === 'number' && (
                                                <span className="rounded-full border border-zinc-800 bg-zinc-950/50 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                                                    Port {app.port}
                                                </span>
                                            )}
                                            {typeof app.pid === 'number' && (
                                                <span className="rounded-full border border-zinc-800 bg-zinc-950/50 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                                                    PID {app.pid}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                );
                            })
                        )}
                    </div>
                </aside>

                <section className="flex flex-col min-h-0 gap-3 overflow-hidden">
                    {!selectedApp || !selectedAppMeta ? (
                        <EmptyState
                            title="Select an application"
                            body="Pick an application from the list to see its runtime signals, discovery information, and log insights."
                        />
                    ) : (
                        <>
                            <div className="panel accent-border rounded-2xl p-3 sm:p-4">
                                <div className="flex flex-wrap items-start justify-between gap-4">
                                    <div className="min-w-0">
                                        <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                                            {selectedApp.kind || 'Application'}
                                        </p>
                                        <h3 className="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight truncate">
                                            {selectedAppMeta.label}
                                        </h3>
                                        <p className="mt-1 text-xs text-zinc-400 leading-relaxed truncate">
                                            {selectedApp.workdir || '—'}
                                        </p>
                                    </div>
                                    <div className="flex flex-wrap items-center gap-2">
                                        <StatusBadge status={selectedAppMeta.status} />
                                        <button
                                            type="button"
                                            onClick={() => refreshSnapshot()}
                                            className="rounded-full border border-zinc-800 bg-zinc-950/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-200 hover:border-zinc-700 disabled:text-zinc-600"
                                            disabled={snapshotLoading}
                                        >
                                            {snapshotLoading ? 'Refreshing…' : 'Refresh snapshot'}
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                    <KpiCard label="PID" value={selectedApp.pid ? String(selectedApp.pid) : '—'} hint={processHint ?? undefined} />
                                    <KpiCard label="Port" value={typeof selectedApp.port === 'number' ? String(selectedApp.port) : '—'} />
                                    <KpiCard label="Memory (RES)" value={formatMiB(selectedProcess?.memory?.res_kb)} hint={selectedProcess ? `VIRT ${formatMiB(selectedProcess.memory.virt_kb)}` : undefined} />
                                    <KpiCard label="Last seen" value={formatTimestamp(selectedAppMeta.lastSeenAt)} hint={selectedAppMeta.createdAt ? `Created ${formatTimestamp(selectedAppMeta.createdAt)}` : undefined} />
                                </div>

                                {snapshotError && (
                                    <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                                        {snapshotError}
                                    </div>
                                )}
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                                {tabs.map(tab => (
                                    <button
                                        key={tab.id}
                                        type="button"
                                        onClick={() => setActiveTab(tab.id)}
                                        className={`rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide transition ${
                                            activeTab === tab.id
                                                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                                                : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                                        }`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            <div className="flex-1 min-h-0 overflow-y-visible lg:overflow-y-auto pr-1 scrollbar-strong">
                                {activeTab === 'overview' && (
                                    <div className="space-y-3">
                                        <div className="panel-soft accent-border rounded-2xl p-3 sm:p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                                                    Process snapshot
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[11px] text-zinc-500">Limit</span>
                                                    <select
                                                        value={snapshotLimit}
                                                        onChange={event => setSnapshotLimit(Number(event.target.value))}
                                                        className="rounded-lg border border-zinc-800 bg-zinc-950/60 px-2 py-1 text-xs text-zinc-200"
                                                    >
                                                        {[50, 100, 250, 500, 1000].map(size => (
                                                            <option key={size} value={size}>
                                                                {size}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {!selectedApp.pid ? (
                                                <div className="mt-2 text-xs text-zinc-400 leading-relaxed">
                                                    This application does not expose a PID yet.
                                                </div>
                                            ) : !selectedProcess ? (
                                                <div className="mt-2 text-xs text-zinc-400 leading-relaxed">
                                                    PID not found in the snapshot. Increase the snapshot limit or verify the application is running.
                                                </div>
                                            ) : (
                                                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                                    <KpiCard label="User" value={selectedProcess.user} />
                                                    <KpiCard label="State" value={selectedProcess.state.label} hint={selectedProcess.state.code} />
                                                    <KpiCard label="CPU time" value={selectedProcess.cpu.time_formatted} hint="TIME+ from top snapshot" />
                                                    <KpiCard label="Priority" value={`${selectedProcess.priority}`} hint={`nice ${selectedProcess.nice}`} />
                                                </div>
                                            )}
                                        </div>

                                        <div className="grid gap-3 lg:grid-cols-2">
                                            <div className="panel-soft accent-border rounded-2xl p-3 sm:p-4">
                                                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                                                    Discovery
                                                </div>
                                                {discoveryLoading ? (
                                                    <div className="mt-2 text-xs text-zinc-500">Loading discovery…</div>
                                                ) : discoveryError ? (
                                                    <div className="mt-2 text-xs text-rose-200">{discoveryError}</div>
                                                ) : !discovery ? (
                                                    <div className="mt-2 text-xs text-zinc-500">No discovery payload.</div>
                                                ) : (
                                                    <div className="mt-3 space-y-3">
                                                        <div className="flex flex-wrap gap-2">
                                                            {(discovery.detected_runtimes ?? []).map(runtime => (
                                                                <span
                                                                    key={runtime}
                                                                    className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-[11px] font-semibold text-indigo-200"
                                                                >
                                                                    {runtime}
                                                                </span>
                                                            ))}
                                                            {(discovery.access?.ports ?? []).map(port => (
                                                                <span
                                                                    key={`port-${port}`}
                                                                    className="rounded-full border border-zinc-800 bg-zinc-950/50 px-2.5 py-1 text-[11px] font-semibold text-zinc-200"
                                                                >
                                                                    Port {port}
                                                                </span>
                                                            ))}
                                                        </div>

                                                        <div className="space-y-1">
                                                            <div className="text-[10px] uppercase tracking-wide text-zinc-500">Detected processes</div>
                                                            {(discovery.detected_processes ?? []).length === 0 ? (
                                                                <div className="text-xs text-zinc-500">None detected.</div>
                                                            ) : (
                                                                <ul className="space-y-1">
                                                                    {(discovery.detected_processes ?? []).slice(0, 6).map(proc => (
                                                                        <li key={proc.command} className="text-xs text-zinc-300 font-mono truncate">
                                                                            {proc.command}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>

                                                        <div className="space-y-1">
                                                            <div className="text-[10px] uppercase tracking-wide text-zinc-500">Log paths</div>
                                                            {(discovery.detected_log_paths ?? []).length === 0 ? (
                                                                <div className="text-xs text-zinc-500">None detected.</div>
                                                            ) : (
                                                                <ul className="space-y-1">
                                                                    {(discovery.detected_log_paths ?? []).slice(0, 6).map(path => (
                                                                        <li key={path} className="text-xs text-zinc-300 font-mono truncate">
                                                                            {path}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <div className="panel-soft accent-border rounded-2xl p-3 sm:p-4">
                                                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                                                    Logs insight
                                                </div>
                                                {logFilesError && (
                                                    <div className="mt-2 text-xs text-rose-200">{logFilesError}</div>
                                                )}
                                                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                                    <KpiCard label="Log files" value={String(logFiles.length)} hint={selectedLogFile ? 'History loaded from selected file' : undefined} />
                                                    <KpiCard label="Levels" value={Object.keys(logLevelBreakdown).length ? Object.keys(logLevelBreakdown).join(', ') : '—'} />
                                                </div>
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {Object.entries(logLevelBreakdown)
                                                        .sort((a, b) => b[1] - a[1])
                                                        .slice(0, 6)
                                                        .map(([level, count]) => (
                                                            <span
                                                                key={level}
                                                                className="rounded-full border border-zinc-800 bg-zinc-950/50 px-2.5 py-1 text-[11px] font-semibold text-zinc-200"
                                                            >
                                                                {level} {count}
                                                            </span>
                                                        ))}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'live' && (
                                    <div className="space-y-3">
                                        <div className="panel-soft accent-border rounded-2xl p-3 sm:p-4">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                                                    Live controls
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={() => setLiveEnabled(prev => !prev)}
                                                        className={`rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide ${
                                                            liveEnabled
                                                                ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-200'
                                                                : 'border-zinc-800 bg-zinc-950/40 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                                                        }`}
                                                    >
                                                        {liveEnabled ? 'Live: on' : 'Live: off'}
                                                    </button>
                                                    <select
                                                        value={pollIntervalMs}
                                                        onChange={event => setPollIntervalMs(Number(event.target.value))}
                                                        className="rounded-full border border-zinc-800 bg-zinc-950/40 px-3 py-1.5 text-[11px] font-semibold text-zinc-200"
                                                    >
                                                        <option value={2000}>2s</option>
                                                        <option value={5000}>5s</option>
                                                        <option value={10000}>10s</option>
                                                    </select>
                                                    <select
                                                        value={snapshotLimit}
                                                        onChange={event => setSnapshotLimit(Number(event.target.value))}
                                                        className="rounded-full border border-zinc-800 bg-zinc-950/40 px-3 py-1.5 text-[11px] font-semibold text-zinc-200"
                                                    >
                                                        {[50, 100, 250, 500, 1000].map(size => (
                                                            <option key={size} value={size}>
                                                                snapshot {size}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            <div className="mt-2 text-xs text-zinc-500 leading-relaxed">
                                                Memory series is derived from the system process snapshot. If the PID is missing or not in the snapshot, the chart will be empty.
                                            </div>
                                        </div>

                                        <div className="panel accent-border rounded-2xl p-3 sm:p-4">
                                            <div className="flex items-center justify-between gap-3">
                                                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                                                    Memory usage over time
                                                </div>
                                                <div className="text-[11px] text-zinc-500">
                                                    {liveSamples.length} samples
                                                </div>
                                            </div>

                                            {!hasMemoryData ? (
                                                <ChartPlaceholder label="No memory samples yet." />
                                            ) : (
                                                <div className="h-[260px] pt-4">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <AreaChart data={memorySeries} margin={{ top: 10, right: 18, bottom: 0, left: 0 }}>
                                                            <defs>
                                                                <linearGradient id="rssGradient" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.6} />
                                                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0.05} />
                                                                </linearGradient>
                                                                <linearGradient id="virtGradient" x1="0" y1="0" x2="0" y2="1">
                                                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.5} />
                                                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0.05} />
                                                                </linearGradient>
                                                            </defs>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                                            <XAxis dataKey="time" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickLine={false} stroke="#3f3f46" />
                                                            <YAxis
                                                                tick={{ fill: '#e5e7eb', fontSize: 12, fontWeight: 600 }}
                                                                tickLine={false}
                                                                stroke="#3f3f46"
                                                                width={70}
                                                                tickFormatter={(value: number) => `${value.toFixed(0)} MiB`}
                                                            />
                                                            <Tooltip
                                                                content={({ active, payload }: any) => {
                                                                    if (!active || !payload?.length) return null;
                                                                    const entry = payload[0]?.payload;
                                                                    return (
                                                                        <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-lg">
                                                                            <div className="text-xs text-zinc-400">{entry.fullTimestamp}</div>
                                                                            <div className="mt-1 text-sm text-zinc-100">
                                                                                RES <span className="font-mono">{entry.rssMiB?.toFixed(1) ?? '—'} MiB</span>
                                                                            </div>
                                                                            <div className="text-sm text-zinc-100">
                                                                                VIRT <span className="font-mono">{entry.virtMiB?.toFixed(1) ?? '—'} MiB</span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }}
                                                            />
                                                            <Area
                                                                type="monotone"
                                                                dataKey="rssMiB"
                                                                stroke="#22c55e"
                                                                fill="url(#rssGradient)"
                                                                strokeWidth={2}
                                                                connectNulls={false}
                                                                animationDuration={250}
                                                            />
                                                            <Area
                                                                type="monotone"
                                                                dataKey="virtMiB"
                                                                stroke="#a855f7"
                                                                fill="url(#virtGradient)"
                                                                strokeWidth={2}
                                                                connectNulls={false}
                                                                animationDuration={250}
                                                            />
                                                        </AreaChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            )}
                                        </div>

                                        <div className="panel accent-border rounded-2xl p-3 sm:p-4">
                                            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                                                Logs volume (history-based)
                                            </div>
                                            {!hasLogsTimeline ? (
                                                <ChartPlaceholder label="No timestamped log history available." />
                                            ) : (
                                                <div className="h-[240px] pt-4">
                                                    <ResponsiveContainer width="100%" height="100%">
                                                        <BarChart data={logVolumeSeries} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                                            <XAxis dataKey="time" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickLine={false} stroke="#3f3f46" />
                                                            <YAxis
                                                                tick={{ fill: '#e5e7eb', fontSize: 12, fontWeight: 600 }}
                                                                tickLine={false}
                                                                stroke="#3f3f46"
                                                                width={50}
                                                            />
                                                            <Tooltip
                                                                content={({ active, payload }: any) => {
                                                                    if (!active || !payload?.length) return null;
                                                                    const entry = payload[0]?.payload;
                                                                    return (
                                                                        <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-lg">
                                                                            <div className="text-xs text-zinc-400">{entry.fullTimestamp}</div>
                                                                            <div className="mt-1 text-sm text-zinc-100">
                                                                                Total <span className="font-mono">{entry.total}</span>
                                                                            </div>
                                                                            <div className="text-sm text-zinc-100">
                                                                                Errors <span className="font-mono">{entry.errors}</span>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                }}
                                                            />
                                                            <Bar dataKey="total" fill="#38bdf8" radius={[4, 4, 0, 0]} />
                                                            <Bar dataKey="errors" fill="#fb7185" radius={[4, 4, 0, 0]} />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'logs' && (
                                    <div className="space-y-3">
                                        <div className="panel-soft accent-border rounded-2xl p-3 sm:p-4">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                                                    Log sources
                                                </div>
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <button
                                                        type="button"
                                                        onClick={rescanLogs}
                                                        disabled={rescanLoading}
                                                        className="rounded-full border border-zinc-800 bg-zinc-950/40 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-200 hover:border-zinc-700 disabled:text-zinc-600"
                                                    >
                                                        {rescanLoading ? 'Rescanning…' : 'Rescan'}
                                                    </button>
                                                    <select
                                                        value={logHistoryLimit}
                                                        onChange={event => setLogHistoryLimit(Number(event.target.value))}
                                                        className="rounded-full border border-zinc-800 bg-zinc-950/40 px-3 py-1.5 text-[11px] font-semibold text-zinc-200"
                                                    >
                                                        {[100, 250, 500, 1000].map(size => (
                                                            <option key={size} value={size}>
                                                                {size} lines
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {logFilesLoading ? (
                                                <div className="mt-2 text-xs text-zinc-500">Loading log files…</div>
                                            ) : logFilesError ? (
                                                <div className="mt-2 text-xs text-rose-200">{logFilesError}</div>
                                            ) : logFiles.length === 0 ? (
                                                <div className="mt-2 text-xs text-zinc-500">No log files reported.</div>
                                            ) : (
                                                <div className="mt-3 flex flex-wrap gap-2">
                                                    {logFiles.map(path => (
                                                        <button
                                                            key={path}
                                                            type="button"
                                                            onClick={() => setSelectedLogFile(path)}
                                                            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${
                                                                selectedLogFile === path
                                                                    ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-200'
                                                                    : 'border-zinc-800 bg-zinc-950/40 text-zinc-300 hover:border-zinc-700'
                                                            }`}
                                                        >
                                                            <span className="font-mono">{path}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="panel accent-border rounded-2xl p-3 sm:p-4">
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                                                    Log history
                                                </div>
                                                <input
                                                    value={logSearch}
                                                    onChange={event => setLogSearch(event.target.value)}
                                                    placeholder="Search logs..."
                                                    className="w-full sm:w-72 rounded-full border border-zinc-800 bg-zinc-950/40 px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500 focus:outline-none"
                                                />
                                            </div>

                                            {logHistoryError && (
                                                <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                                                    {logHistoryError}
                                                </div>
                                            )}

                                            {logHistoryLoading ? (
                                                <ChartPlaceholder label="Loading log history…" />
                                            ) : filteredLogHistory.length === 0 ? (
                                                <ChartPlaceholder label="No log entries." />
                                            ) : (
                                                <div className="mt-3 max-h-[520px] overflow-y-auto pr-1 scrollbar-strong rounded-xl border border-zinc-800 bg-zinc-950/40">
                                                    <ul className="divide-y divide-zinc-800">
                                                        {filteredLogHistory.slice(0, 300).map((entry, idx) => (
                                                            <li key={`${entry.timestamp ?? 't'}-${idx}`} className="px-3 py-2">
                                                                <div className="flex flex-wrap items-start justify-between gap-3">
                                                                    <div className="min-w-0">
                                                                        <div className="text-[11px] text-zinc-500">
                                                                            {entry.timestamp ? new Date(entry.timestamp).toLocaleString('es-ES') : '—'}
                                                                        </div>
                                                                        <div className="mt-1 text-xs text-zinc-200 leading-relaxed break-words">
                                                                            {entry.message}
                                                                        </div>
                                                                        {(entry.path || entry.context) && (
                                                                            <div className="mt-1 text-[11px] text-zinc-500 font-mono truncate">
                                                                                {[entry.path, entry.context].filter(Boolean).join(' · ')}
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                    {entry.level && (
                                                                        <span className="shrink-0 rounded-full border border-zinc-800 bg-zinc-900 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-300">
                                                                            {entry.level}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'diagnostics' && (
                                    <div className="space-y-3">
                                        <div className="panel-soft accent-border rounded-2xl p-3 sm:p-4">
                                            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                                                Backend record
                                            </div>
                                            <pre className="mt-3 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 text-[11px] text-zinc-200">
                                                {JSON.stringify(selectedApp, null, 2)}
                                            </pre>
                                        </div>

                                        <div className="panel-soft accent-border rounded-2xl p-3 sm:p-4">
                                            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                                                Discovery payload
                                            </div>
                                            <pre className="mt-3 overflow-x-auto rounded-xl border border-zinc-800 bg-zinc-950/50 p-3 text-[11px] text-zinc-200">
                                                {JSON.stringify(discovery, null, 2)}
                                            </pre>
                                            {discoveryError && (
                                                <div className="mt-2 text-xs text-rose-200">{discoveryError}</div>
                                            )}
                                        </div>

                                        <div className="panel-soft accent-border rounded-2xl p-3 sm:p-4">
                                            <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                                                Runtime hints
                                            </div>
                                            <div className="mt-2 text-xs text-zinc-400 leading-relaxed">
                                                This view currently derives process metrics from `GET /processes/snapshot` and log history from `GET /logs/applications/:id/files/history`.
                                                If you expose first-class application metrics endpoints, we can wire them here with Recharts panels.
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </section>
            </div>
        </div>
    );
};

export default ApplicationMetricsView;
