import React, { useMemo } from 'react';
import {
    Area,
    AreaChart,
    Bar,
    BarChart,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
    type TooltipProps,
    XAxis,
    YAxis,
} from 'recharts';
import { useApplicationsMetrics } from '../../hooks/useApplicationsMetrics';

const formatMiB = (kb?: number | null) => {
    if (kb === null || kb === undefined) return '—';
    return `${(kb / 1024).toFixed(1)} MiB`;
};

const formatMB = (mb?: number | null, fractionDigits = 1) => {
    if (mb === null || mb === undefined) return '—';
    return `${mb.toFixed(fractionDigits)} MB`;
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

const formatNumber = (value: number | null | undefined, fractionDigits = 1) => {
    if (value === null || value === undefined || Number.isNaN(value)) return '—';
    return value.toFixed(fractionDigits);
};

const formatIso = (value?: string | null) => {
    if (!value) return '—';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '—';
    return parsed.toLocaleString('es-ES');
};

const lastDefinedNumber = (points: Array<[string, number | string | null]> | undefined) => {
    if (!points?.length) return null;
    for (let i = points.length - 1; i >= 0; i -= 1) {
        const value = points[i]?.[1];
        if (typeof value === 'number' && Number.isFinite(value)) {
            return value;
        }
    }
    return null;
};

const lastDefinedString = (points: Array<[string, number | string | null]> | undefined) => {
    if (!points?.length) return null;
    for (let i = points.length - 1; i >= 0; i -= 1) {
        const value = points[i]?.[1];
        if (typeof value === 'string' && value.trim()) {
            return value.trim();
        }
    }
    return null;
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

const normalizeStatus = (value?: string | null, isRunning?: boolean | null) => {
    const raw = (value ?? '').trim().toLowerCase();
    if (!raw) {
        if (isRunning === true) return 'running';
        if (isRunning === false) return 'stopped';
        return 'unknown';
    }
    if (raw.includes('running') || raw.includes('online') || raw === 'ok') return 'running';
    if (raw.includes('stopped') || raw.includes('offline') || raw.includes('dead')) return 'stopped';
    if (raw.includes('error') || raw.includes('failed')) return 'error';
    return raw;
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

type BackendMetricKey =
    | 'cpu_percent'
    | 'memory_mb'
    | 'memory_percent'
    | 'uptime_seconds'
    | 'threads'
    | 'restart_count';

type BackendChartPoint = {
    tsMs: number;
    time: string;
    fullTimestamp: string;
} & Record<BackendMetricKey, number | null>;

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

        appRuntime,
        appRuntimeLoading,
        appRuntimeError,
        refreshAppRuntime,
        appRuntimeById,
        appRuntimeLoadingById,

        appMetricsSeries,
        appMetricsSeriesLoading,
        appMetricsSeriesError,
        refreshAppMetricsSeries,

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

    const backendChartData = useMemo(() => {
        const series = appMetricsSeries?.series;
        if (!series) return [];
        const bucket = new Map<number, BackendChartPoint>();

        const pushPoints = (key: BackendMetricKey) => {
            const points = series[key] ?? [];
            for (const [ts, raw] of points) {
                const parsed = new Date(ts);
                const tsMs = parsed.getTime();
                if (Number.isNaN(tsMs)) continue;
                const entry: BackendChartPoint = bucket.get(tsMs) ?? {
                    tsMs,
                    time: parsed.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
                    fullTimestamp: parsed.toLocaleString('es-ES'),
                    cpu_percent: null,
                    memory_mb: null,
                    memory_percent: null,
                    uptime_seconds: null,
                    threads: null,
                    restart_count: null,
                };
                entry[key] = typeof raw === 'number' && Number.isFinite(raw) ? raw : null;
                bucket.set(tsMs, entry);
            }
        };

        pushPoints('cpu_percent');
        pushPoints('memory_mb');
        pushPoints('memory_percent');
        pushPoints('uptime_seconds');
        pushPoints('threads');
        pushPoints('restart_count');

        return Array.from(bucket.values()).sort((a, b) => a.tsMs - b.tsMs);
    }, [appMetricsSeries]);

    const backendHasCpu = useMemo(() => backendChartData.some(point => point.cpu_percent !== null), [backendChartData]);
    const backendHasMemory = useMemo(() => backendChartData.some(point => point.memory_mb !== null), [backendChartData]);

    const latestBackendStatus = useMemo(() => lastDefinedString(appMetricsSeries?.series?.status), [appMetricsSeries]);
    const latestCpuPercent = useMemo(() => lastDefinedNumber(appMetricsSeries?.series?.cpu_percent), [appMetricsSeries]);
    const latestMemoryMb = useMemo(() => lastDefinedNumber(appMetricsSeries?.series?.memory_mb), [appMetricsSeries]);
    const latestMemoryPercent = useMemo(() => lastDefinedNumber(appMetricsSeries?.series?.memory_percent), [appMetricsSeries]);
    const latestThreads = useMemo(() => lastDefinedNumber(appMetricsSeries?.series?.threads), [appMetricsSeries]);
    const latestUptimeSeconds = useMemo(() => lastDefinedNumber(appMetricsSeries?.series?.uptime_seconds), [appMetricsSeries]);
    const latestRestartCount = useMemo(() => lastDefinedNumber(appMetricsSeries?.series?.restart_count), [appMetricsSeries]);

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
        const pid = appRuntime?.pid ?? selectedApp?.pid;
        if (!pid) return 'No PID reported by backend.';
        if (!selectedProcess) return `PID ${pid} not found in snapshot. Increase snapshot limit.`;
        return null;
    }, [appRuntime?.pid, selectedApp?.pid, selectedProcess]);

    const headerPid = appRuntime?.pid ?? selectedApp?.pid ?? null;
    const headerPort = appRuntime?.port ?? (typeof selectedApp?.port === 'number' ? selectedApp.port : null);
    const headerMemoryLabel = appRuntime?.memory_res_mb !== null && appRuntime?.memory_res_mb !== undefined
        ? formatMB(appRuntime.memory_res_mb, 1)
        : formatMiB(selectedProcess?.memory?.res_kb);

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
                        <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Applications</div>
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
                                No applications found.
                            </div>
                        ) : (
                            applications.map(app => {
                                const label = app.name || app.identifier || app.workdir || app.id;
                                const isActive = selectedAppId === app.id;
                                const runtime = appRuntimeById[app.id];
                                const displayStatus = (runtime?.status ?? app.status ?? (runtime?.is_running ? 'running' : 'unknown')) || 'unknown';
                                const normalized = normalizeStatus(displayStatus, runtime?.is_running);
                                const isLoadingRuntime = Boolean(appRuntimeLoadingById[app.id]);

                                const badgeTone = normalized === 'running'
                                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/40'
                                    : normalized === 'error'
                                        ? 'bg-rose-500/10 text-rose-300 border-rose-500/40'
                                        : 'bg-zinc-800/40 text-zinc-300 border-zinc-700';

                                const chipPort = runtime?.port ?? (typeof app.port === 'number' ? app.port : null);
                                const chipPid = runtime?.pid ?? (typeof app.pid === 'number' ? app.pid : null);

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
                                                {isLoadingRuntime && normalized === 'unknown' ? 'loading' : displayStatus}
                                            </span>
                                        </div>
                                        <div className="mt-2 flex flex-wrap gap-2">
                                            {typeof chipPort === 'number' && (
                                                <span className="rounded-full border border-zinc-800 bg-zinc-950/50 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                                                    Port {chipPort}
                                                </span>
                                            )}
                                            {typeof chipPid === 'number' && (
                                                <span className="rounded-full border border-zinc-800 bg-zinc-950/50 px-2 py-0.5 text-[10px] font-semibold text-zinc-300">
                                                    PID {chipPid}
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
                                        <button
                                            type="button"
                                            onClick={() => refreshAppRuntime()}
                                            className="rounded-full border border-zinc-800 bg-zinc-950/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-200 hover:border-zinc-700 disabled:text-zinc-600"
                                            disabled={appRuntimeLoading}
                                            title={appRuntimeError ?? undefined}
                                        >
                                            {appRuntimeLoading ? 'Refreshing…' : 'Refresh runtime'}
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                    <KpiCard label="PID" value={headerPid ? String(headerPid) : '—'} hint={processHint ?? undefined} />
                                    <KpiCard label="Port" value={headerPort ? String(headerPort) : '—'} />
                                    <KpiCard
                                        label="Memory (RES)"
                                        value={headerMemoryLabel}
                                        hint={
                                            appRuntime?.memory_res_mb !== null && appRuntime?.memory_res_mb !== undefined
                                                ? 'From /applications/:id/runtime'
                                                : selectedProcess
                                                    ? `VIRT ${formatMiB(selectedProcess.memory.virt_kb)}`
                                                    : undefined
                                        }
                                    />
                                    <KpiCard label="Last seen" value={formatTimestamp(selectedAppMeta.lastSeenAt)} hint={selectedAppMeta.createdAt ? `Created ${formatTimestamp(selectedAppMeta.createdAt)}` : undefined} />
                                </div>

                                {appRuntimeError && (
                                    <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                                        {appRuntimeError}
                                    </div>
                                )}

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
                                            <div className="flex flex-wrap items-center justify-between gap-3">
                                                <div>
                                                    <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                                                        Backend metrics series
                                                    </div>
                                                    <div className="mt-1 text-xs text-zinc-500">
                                                        {appMetricsSeries?.range
                                                            ? `${formatIso(appMetricsSeries.range.from)} → ${formatIso(appMetricsSeries.range.to)} · step ${appMetricsSeries.range.step_seconds}s`
                                                            : 'Loads from /applications/:id/metrics/series'}
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => refreshAppMetricsSeries()}
                                                    className="rounded-full border border-zinc-800 bg-zinc-950/40 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-zinc-200 hover:border-zinc-700 disabled:text-zinc-600"
                                                    disabled={appMetricsSeriesLoading}
                                                >
                                                    {appMetricsSeriesLoading ? 'Loading…' : 'Refresh'}
                                                </button>
                                            </div>

                                            {appMetricsSeriesError && (
                                                <div className="mt-3 rounded-xl border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-200">
                                                    {appMetricsSeriesError}
                                                </div>
                                            )}

                                            {!appMetricsSeries ? (
                                                <div className="mt-3 text-xs text-zinc-500">No metrics loaded yet.</div>
                                            ) : (
                                                <>
                                                    <div className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                                                        <KpiCard label="Status" value={latestBackendStatus ?? '—'} hint="Series: status" />
                                                        <KpiCard label="CPU" value={latestCpuPercent === null ? '—' : `${formatNumber(latestCpuPercent, 1)}%`} />
                                                        <KpiCard label="Memory" value={latestMemoryMb === null ? '—' : `${formatNumber(latestMemoryMb, 0)} MB`} />
                                                        <KpiCard label="Memory %" value={latestMemoryPercent === null ? '—' : `${formatNumber(latestMemoryPercent, 1)}%`} />
                                                        <KpiCard label="Threads" value={latestThreads === null ? '—' : String(Math.round(latestThreads))} />
                                                        <KpiCard label="Uptime" value={latestUptimeSeconds === null ? '—' : `${formatNumber(latestUptimeSeconds, 0)}s`} />
                                                        <KpiCard label="Restarts" value={latestRestartCount === null ? '—' : String(Math.round(latestRestartCount))} />
                                                        <KpiCard label="Samples" value={String(backendChartData.length)} hint="Combined numeric series" />
                                                    </div>

                                                    <div className="mt-3 grid gap-3 lg:grid-cols-2">
                                                        <div className="panel accent-border rounded-2xl p-3 sm:p-4">
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                                                                    CPU %
                                                                </div>
                                                                <div className="text-[11px] text-zinc-500">
                                                                    {backendHasCpu ? 'series: cpu_percent' : 'no data'}
                                                                </div>
                                                            </div>
                                                            {!backendHasCpu ? (
                                                                <ChartPlaceholder label="No CPU samples." />
                                                            ) : (
                                                                <div className="h-[220px] pt-4">
                                                                    <ResponsiveContainer width="100%" height="100%">
                                                                        <AreaChart data={backendChartData} margin={{ top: 10, right: 18, bottom: 0, left: 0 }}>
                                                                            <defs>
                                                                                <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                                                                                    <stop offset="5%" stopColor="#60a5fa" stopOpacity={0.6} />
                                                                                    <stop offset="95%" stopColor="#60a5fa" stopOpacity={0.05} />
                                                                                </linearGradient>
                                                                            </defs>
                                                                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                                                            <XAxis dataKey="time" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickLine={false} stroke="#3f3f46" />
                                                                            <YAxis
                                                                                tick={{ fill: '#e5e7eb', fontSize: 12, fontWeight: 600 }}
                                                                                tickLine={false}
                                                                                stroke="#3f3f46"
                                                                                width={60}
                                                                                domain={[0, 100]}
                                                                                tickFormatter={(value: number) => `${value.toFixed(0)}%`}
                                                                            />
                                                                            <Tooltip
                                                                                content={({ active, payload }: TooltipProps<number, string>) => {
                                                                                    if (!active || !payload?.length) return null;
                                                                                    const entry = payload[0]?.payload as BackendChartPoint | undefined;
                                                                                    return (
                                                                                        <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-lg">
                                                                                            <div className="text-xs text-zinc-400">{entry?.fullTimestamp ?? '—'}</div>
                                                                                            <div className="mt-1 text-sm text-zinc-100">
                                                                                                CPU <span className="font-mono">{entry?.cpu_percent?.toFixed(1) ?? '—'}%</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                }}
                                                                            />
                                                                            <Area
                                                                                type="monotone"
                                                                                dataKey="cpu_percent"
                                                                                stroke="#60a5fa"
                                                                                fill="url(#cpuGradient)"
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
                                                            <div className="flex items-center justify-between gap-3">
                                                                <div className="text-xs font-semibold uppercase tracking-wide text-zinc-400">
                                                                    Memory (MB)
                                                                </div>
                                                                <div className="text-[11px] text-zinc-500">
                                                                    {backendHasMemory ? 'series: memory_mb' : 'no data'}
                                                                </div>
                                                            </div>
                                                            {!backendHasMemory ? (
                                                                <ChartPlaceholder label="No memory samples." />
                                                            ) : (
                                                                <div className="h-[220px] pt-4">
                                                                    <ResponsiveContainer width="100%" height="100%">
                                                                        <AreaChart data={backendChartData} margin={{ top: 10, right: 18, bottom: 0, left: 0 }}>
                                                                            <defs>
                                                                                <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                                                                                    <stop offset="5%" stopColor="#fb7185" stopOpacity={0.55} />
                                                                                    <stop offset="95%" stopColor="#fb7185" stopOpacity={0.05} />
                                                                                </linearGradient>
                                                                            </defs>
                                                                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                                                                            <XAxis dataKey="time" tick={{ fill: '#a1a1aa', fontSize: 12 }} tickLine={false} stroke="#3f3f46" />
                                                                            <YAxis
                                                                                tick={{ fill: '#e5e7eb', fontSize: 12, fontWeight: 600 }}
                                                                                tickLine={false}
                                                                                stroke="#3f3f46"
                                                                                width={70}
                                                                                tickFormatter={(value: number) => `${value.toFixed(0)} MB`}
                                                                            />
                                                                            <Tooltip
                                                                                content={({ active, payload }: TooltipProps<number, string>) => {
                                                                                    if (!active || !payload?.length) return null;
                                                                                    const entry = payload[0]?.payload as BackendChartPoint | undefined;
                                                                                    return (
                                                                                        <div className="rounded-lg border border-zinc-700 bg-zinc-900 p-3 shadow-lg">
                                                                                            <div className="text-xs text-zinc-400">{entry?.fullTimestamp ?? '—'}</div>
                                                                                            <div className="mt-1 text-sm text-zinc-100">
                                                                                                Memory <span className="font-mono">{entry?.memory_mb?.toFixed(0) ?? '—'} MB</span>
                                                                                            </div>
                                                                                        </div>
                                                                                    );
                                                                                }}
                                                                            />
                                                                            <Area
                                                                                type="monotone"
                                                                                dataKey="memory_mb"
                                                                                stroke="#fb7185"
                                                                                fill="url(#memGradient)"
                                                                                strokeWidth={2}
                                                                                connectNulls={false}
                                                                                animationDuration={250}
                                                                            />
                                                                        </AreaChart>
                                                                    </ResponsiveContainer>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>

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
                                                        {[50, 100].map(size => (
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
                                                        {[50, 100].map(size => (
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
