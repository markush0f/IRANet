import React, { useMemo, useState } from 'react';
import { Database, Server, Satellite, Shield, Activity } from 'lucide-react';

type Application = {
    id: string;
    name: string;
    description?: string;
    createdAt: string;
    iconKey: string;
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
        name: 'Panel de control',
        description: 'Interfaz principal del operador del sistema',
        createdAt: new Date('2024-07-01T08:30:00Z').toISOString(),
        iconKey: 'activity',
    },
    {
        id: 'app-2',
        name: 'Procesador de métricas',
        description: 'Servicio que normaliza las series de métricas',
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
        logPath: '/var/log/app.log',
        enabled: true,
        iconKey: 'activity',
    });

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

    const handleCreate = (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (!form.name.trim()) return;

        const id = crypto.randomUUID?.() ?? `app-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        const newApplication: Application = {
            id,
            name: form.name.trim(),
            description: form.description.trim() || undefined,
            createdAt: new Date().toISOString(),
            iconKey: form.iconKey,
        };

        const newLog: ApplicationLog = {
            id: crypto.randomUUID?.() ?? `log-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            applicationId: id,
            logPath: form.logPath.trim() || '/var/log/app.log',
            enabled: form.enabled,
            createdAt: new Date().toISOString(),
        };

        setApplications(prev => [newApplication, ...prev]);
        setLogs(prev => [newLog, ...prev]);
        setForm({
            name: '',
            description: '',
            logPath: '/var/log/app.log',
            enabled: true,
            iconKey: form.iconKey,
        });
        setMode('list');
    };

    const formattedDate = (value: string) => {
        const parsed = new Date(value);
        return isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
    };

    return (
        <div className="max-w-7xl mx-auto px-8 py-12 space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold text-zinc-100 tracking-tight">Applications</h2>
                    <p className="text-sm text-zinc-400 mt-1">Modelo sencillo de aplicaciones + bitácoras basado en las tablas del backend.</p>
                </div>
                {mode === 'list' && (
                    <button
                        type="button"
                        onClick={() => setMode('create')}
                        className="inline-flex items-center gap-2 rounded-full border border-indigo-500 px-4 py-2 text-sm font-semibold text-indigo-300 hover:bg-indigo-500/10 transition"
                    >
                        Crear aplicación
                    </button>
                )}
                {mode === 'create' && (
                    <button
                        type="button"
                        onClick={() => setMode('list')}
                        className="inline-flex items-center gap-2 rounded-full border border-zinc-700 px-4 py-2 text-sm font-semibold text-zinc-300 hover:bg-zinc-900 transition"
                    >
                        Volver al listado
                    </button>
                )}
            </div>

            {mode === 'list' ? (
                <div className="space-y-6">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 shadow-lg">
                        <div className="overflow-x-auto">
                            <table className="min-w-full text-xs divide-y divide-zinc-800">
                                <thead className="bg-zinc-950/70">
                                    <tr>
                                        <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">Nombre</th>
                                        <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">Descripción</th>
                                        <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">Creado</th>
                                        <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">Logs</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-800">
                                    {applications.map(app => {
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
                                                {(logsByApp[app.id] ?? []).map(log => (
                                                    <div key={log.id} className="text-[11px] leading-relaxed">
                                                        <span className="font-mono text-zinc-200">{log.logPath}</span>
                                                        <span className="ml-2 rounded-full bg-zinc-800/60 px-2 py-0.5 text-[10px] uppercase tracking-wide text-zinc-400">
                                                            {log.enabled ? 'Activo' : 'Desactivado'}
                                                        </span>
                                                    </div>
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
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 shadow-lg space-y-5">
                    <h3 className="text-xl font-semibold text-zinc-100">Nueva aplicación</h3>
                    <form className="space-y-4" onSubmit={handleCreate}>
                        <div className="grid gap-2">
                            <label className="text-[11px] uppercase tracking-wide text-zinc-500">Nombre</label>
                            <input
                                type="text"
                                required
                                value={form.name}
                                onChange={event => handleChange('name', event.target.value)}
                                className="w-full rounded-lg border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
                            />
                        </div>
                        <div className="grid gap-2">
                            <label className="text-[11px] uppercase tracking-wide text-zinc-500">Descripción</label>
                            <textarea
                                value={form.description}
                                onChange={event => handleChange('description', event.target.value)}
                                className="w-full rounded-lg border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
                                rows={3}
                            />
                        </div>
                        <div>
                            <label className="text-[11px] uppercase tracking-wide text-zinc-500">Icono</label>
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
                            <label className="text-[11px] uppercase tracking-wide text-zinc-500">Ruta del log</label>
                            <input
                                type="text"
                                value={form.logPath}
                                onChange={event => handleChange('logPath', event.target.value)}
                                className="w-full rounded-lg border border-zinc-800 bg-black/40 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
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
                                Habilitar log al crear
                            </label>
                        </div>
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                className="rounded-full border border-transparent bg-indigo-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400"
                            >
                                Guardar aplicación
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
};

export default ApplicationsView;
