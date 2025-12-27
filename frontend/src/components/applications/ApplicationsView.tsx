import React, { useEffect, useMemo, useState } from 'react';
import { Database, Server, Satellite, Shield, Activity } from 'lucide-react';
import { createApplication, getApplicationsList, type RemoteApplicationRecord } from '../../services/api';
import { toast } from 'react-hot-toast';

type Application = {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    iconKey: string;
    logPaths?: string[];
};

type ApplicationLog = {
    id: string;
    applicationId: string;
    logPath: string;
    enabled: boolean;
    createdAt: string;
};

const initialApplications: Application[] = [
    {
        id: 'app-1',
        name: 'Control panel',
        description: 'Main system operator interface',
        createdAt: new Date('2024-07-01T08:30:00Z').toISOString(),
        iconKey: 'activity',
    },
    {
        id: 'app-2',
        name: 'Metrics processor',
        description: 'Service that normalizes metric series',
        createdAt: new Date('2024-07-12T16:40:00Z').toISOString(),
        iconKey: 'server',
    },
];

const initialLogs: ApplicationLog[] = [
    {
        id: 'log-1',
        applicationId: 'app-1',
        logPath: '/var/log/panel/control.log',
        enabled: true,
        createdAt: new Date('2024-07-01T09:01:00Z').toISOString(),
    },
    {
        id: 'log-2',
        applicationId: 'app-2',
        logPath: '/var/log/metrics/processor.log',
        enabled: true,
        createdAt: new Date('2024-07-12T17:05:00Z').toISOString(),
    },
];

type Mode = 'list' | 'create';

const ICON_OPTIONS = [
    { key: 'activity', label: 'Activity', Icon: Activity },
    { key: 'server', label: 'Server', Icon: Server },
    { key: 'database', label: 'Database', Icon: Database },
    { key: 'satellite', label: 'Satellite', Icon: Satellite },
    { key: 'shield', label: 'Shield', Icon: Shield },
];

const iconFromKey = (key: string) => ICON_OPTIONS.find(opt => opt.key === key)?.Icon ?? Activity;

const ApplicationsView: React.FC = () => {
    const [mode, setMode] = useState<Mode>('list');
    const [applications, setApplications] = useState<Application[]>(initialApplications);
    const [logs, setLogs] = useState<ApplicationLog[]>(initialLogs);
    const [form, setForm] = useState({
        name: '',
        description: '',
        cwd: '',
        logPaths: '/var/log/app.log',
        enabled: true,
        iconKey: 'activity',
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [loadingList, setLoadingList] = useState(false);
    const [listError, setListError] = useState<string | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        setLoadingList(true);
        setListError(null);

        getApplicationsList(controller.signal)
            .then(records => {
                if (!records.length) {
                    setApplications([]);
                    return;
                }

                setApplications(records.map((record: RemoteApplicationRecord) => {
                    const recordId = record.id ?? record.identifier ?? crypto.randomUUID?.() ?? `app-${Date.now()}`;
                    return {
                        id: recordId,
                        name: record.name || record.identifier || record.workdir || 'Application',
                        description: record.workdir,
                        createdAt: record.created_at ?? record.last_seen_at ?? new Date().toISOString(),
                        iconKey: 'server',
                        logPaths: record.log_paths ?? [],
                    };
                }));
            })
            .catch(err => {
                if (err instanceof DOMException && err.name === 'AbortError') {
                    return;
                }
                console.error('Error loading applications list', err);
                setListError('The applications list could not be loaded.');
            })
            .finally(() => {
                setLoadingList(false);
            });

        return () => controller.abort();
    }, []);

    const logsByApp = useMemo(() => {
        return logs.reduce<Record<string, ApplicationLog[]>>((acc, log) => {
            acc[log.applicationId] = acc[log.applicationId] ?? [];
            acc[log.applicationId].push(log);
            return acc;
        }, {});
    }, [logs]);

    const handleChange = (field: keyof typeof form, value: string | boolean) => {
        setForm(prev => ({ ...prev, [field]: value }));
    };

    const handleCreate = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!form.name.trim() || !form.cwd.trim()) {
            setError('Name and CWD are required.');
            return;
        }

        const logPaths = form.logPaths
            .split('\n')
            .map(path => path.trim())
            .filter(Boolean);

        if (!logPaths.length) {
            setError('You must include at least one log path.');
            return;
        }

        setSaving(true);
        setError(null);

        const id = crypto.randomUUID?.() ?? `app-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const newApplication: Application = {
            id,
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            createdAt: new Date().toISOString(),
            iconKey: form.iconKey,
            logPaths,
        };

        const newLog: ApplicationLog = {
            id: crypto.randomUUID?.() ?? `log-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            applicationId: id,
            logPath: logPaths[0] ?? '/var/log/app.log',
            enabled: form.enabled,
            createdAt: new Date().toISOString(),
        };

        try {
            await createApplication({
                cwd: form.cwd.trim(),
                name: form.name.trim(),
                log_base_paths: logPaths,
            });

            setApplications(prev => [newApplication, ...prev]);
            setLogs(prev => [newLog, ...prev]);
            toast.custom(
                () => (
                    <div className="rounded-2xl border border-emerald-500/30 bg-zinc-950 px-5 py-4 text-base text-emerald-200 shadow-xl">
                        Application created successfully
                    </div>
                ),
                { duration: 4000 }
            );
            setForm({
                name: '',
                description: '',
                cwd: '',
                logPaths: '/var/log/app.log',
                enabled: true,
                iconKey: form.iconKey,
            });
            setMode('list');
        } catch (err) {
            console.error('Error creating application', err);
            setError('The application could not be created. Please check the backend.');
        } finally {
            setSaving(false);
        }
    };

    const formattedDate = (value: string) => {
        const parsed = new Date(value);
        return isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
    };

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-2 pb-6 sm:pt-3 sm:pb-8 lg:pt-4 lg:pb-10 text-sm space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">Applications</h2>
                    <p className="text-[10px] text-zinc-500 mt-1">Simple applications + logs model based on backend tables.</p>
                </div>
                {mode === 'list' && (
                    <button
                        type="button"
                        onClick={() => setMode('create')}
                        className="inline-flex items-center gap-2 rounded-full border border-indigo-500 px-4 py-2 text-sm font-semibold text-indigo-300 hover:bg-indigo-500/10 transition"
                    >
                        Create application
                    </button>
                )}
                {mode === 'create' && (
                    <button
                        type="button"
                        onClick={() => setMode('list')}
                        className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-zinc-900 transition"
                    >
                        Back to list
                    </button>
                )}
            </div>

            {mode === 'list' ? (
                <div className="space-y-6">
                    {listError && (
                        <div className="rounded-2xl border border-rose-500/40 bg-rose-500/5 px-4 py-3 text-sm text-rose-200">
                            {listError}
                        </div>
                    )}
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 sm:p-5 shadow-lg">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-xs divide-y divide-zinc-800">
                                <thead className="bg-zinc-950/70">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">Name</th>
                                        <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">Description</th>
                                        <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">Created</th>
                                        <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">Logs</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {loadingList ? (
                                        <tr>
                                            <td className="px-4 py-6 text-center text-zinc-500" colSpan={4}>
                                                Loading applications...
                                            </td>
                                        </tr>
                                    ) : applications.length === 0 ? (
                                        <tr>
                                            <td className="px-4 py-6 text-center text-zinc-500" colSpan={4}>
                                                No applications registered.
                                            </td>
                                        </tr>
                                    ) : applications.map(app => {
                                        const IconComponent = iconFromKey(app.iconKey);
                                        return (
                                            <tr key={app.id} className="hover:bg-zinc-900/60 transition-colors">
                                                <td className="px-4 py-3 font-semibold text-zinc-100">
                                                    <div className="flex items-center gap-3">
                                                        <IconComponent className="h-4 w-4 text-indigo-400" />
                                                    <span>{app.name}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 text-zinc-300">{app.description ?? '—'}</td>
                                            <td className="px-4 py-3 text-zinc-400 font-mono">{formattedDate(app.createdAt)}</td>
                                            <td className="px-4 py-3 text-zinc-300">
                                                {(app.logPaths && app.logPaths.length > 0) ? (
                                                    app.logPaths.map((path, index) => (
                                                        <div key={`${app.id}-path-${index}`} className="text-[11px] leading-relaxed">
                                                            <span className="font-mono text-zinc-200">{path}</span>
                                                        </div>
                                                    ))
                                                ) : (logsByApp[app.id]?.length ? (
                                                    (logsByApp[app.id] ?? []).map(log => (
                                                        <div key={log.id} className="text-[11px] leading-relaxed">
                                                            <span className="font-mono text-zinc-200">{log.logPath}</span>
                                                            <span className="ml-2 rounded-full bg-zinc-800/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                                                                {log.enabled ? 'Active' : 'Disabled'}
                                                            </span>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <span className="text-[10px] text-zinc-500">No logs</span>
                                                ))}
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 sm:p-6 shadow-lg space-y-5">
                    <h3 className="text-xl font-semibold text-zinc-100">New application</h3>
                    {error && (
                        <div className="rounded-xl border border-red-600/60 bg-red-950/60 px-4 py-2 text-sm text-red-300">
                            {error}
                        </div>
                    )}
                    <form className="space-y-4" onSubmit={handleCreate}>
                        <div className="grid gap-2">
                            <label className="text-[11px] uppercase tracking-wide text-zinc-500">Name</label>
                            <input
                                type="text"
                                required
                                value={form.name}
                                onChange={event => handleChange('name', event.target.value)}
                                className="w-full rounded-lg border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-[11px] uppercase tracking-wide text-zinc-500">CWD</label>
                            <input
                                type="text"
                                required
                                value={form.cwd}
                                onChange={event => handleChange('cwd', event.target.value)}
                                className="w-full rounded-lg border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
                                placeholder="/home/markus/projects/IRANet/ira"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-[11px] uppercase tracking-wide text-zinc-500">Description</label>
                            <textarea
                                value={form.description}
                                onChange={event => handleChange('description', event.target.value)}
                                className="w-full rounded-lg border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
                                rows={3}
                            />
                        </div>
                        <div>
                            <label className="text-[11px] uppercase tracking-wide text-zinc-500">Icon</label>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {ICON_OPTIONS.map(option => (
                                    <button
                                        key={option.key}
                                        type="button"
                                        onClick={() => handleChange('iconKey', option.key)}
                                        className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition ${
                                            form.iconKey === option.key
                                                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                                                : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                                        }`}
                                    >
                                        <option.Icon className="h-4 w-4" />
                                        {option.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <label className="text-[11px] uppercase tracking-wide text-zinc-500">Log paths (one per line)</label>
                            <textarea
                                value={form.logPaths}
                                onChange={event => handleChange('logPaths', event.target.value)}
                                className="w-full rounded-lg border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
                                rows={3}
                                placeholder="/home/markus/projects/IRANet/ira/logs"
                            />
                        </div>
                        <div className="flex items-center gap-3">
                            <input
                                id="log-enabled"
                                type="checkbox"
                                checked={form.enabled}
                                onChange={event => handleChange('enabled', event.target.checked)}
                                className="h-4 w-4 rounded border-zinc-700 bg-zinc-900 text-indigo-500 focus:ring-indigo-500"
                            />
                            <label htmlFor="log-enabled" className="text-xs text-zinc-400">
                                Enable log on create
                            </label>
                        </div>
                        <div className="flex justify-stretch sm:justify-end">
                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full sm:w-auto rounded-full border border-transparent bg-indigo-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-indigo-800"
                            >
                                {saving ? 'Saving...' : 'Save application'}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ApplicationsView;
