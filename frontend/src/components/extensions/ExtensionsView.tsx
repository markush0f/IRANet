import React, { useEffect, useMemo, useState } from 'react';
import { disableExtension, enableExtension, getExtensions } from '../../services/api';
import type { ExtensionRecord } from '../../types';

interface ExtensionsViewProps {
    onExtensionsUpdated?: (signal?: AbortSignal) => Promise<void> | void;
}

const ExtensionsView: React.FC<ExtensionsViewProps> = ({ onExtensionsUpdated }) => {
    const [extensions, setExtensions] = useState<ExtensionRecord[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [actionId, setActionId] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [showEnabledOnly, setShowEnabledOnly] = useState(false);

    useEffect(() => {
        const controller = new AbortController();

        const fetchExtensions = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await getExtensions(controller.signal);
                setExtensions(data);
            } catch (err) {
                if (err instanceof DOMException && err.name === 'AbortError') {
                    return;
                }
                console.error('Error loading extensions', err);
                setError('The extensions list could not be loaded.');
            } finally {
                setLoading(false);
            }
        };

        fetchExtensions();

        return () => controller.abort();
    }, []);

    const filteredExtensions = useMemo(() => {
        const normalizedQuery = query.trim().toLowerCase();
        return extensions.filter((extension) => {
            if (showEnabledOnly && !extension.enabled) return false;
            if (!normalizedQuery) return true;
            return (
                extension.id.toLowerCase().includes(normalizedQuery)
            );
        });
    }, [extensions, query, showEnabledOnly]);

    const enabledCount = extensions.filter(item => item.enabled).length;
    const formatDate = (value: string | null | undefined) => {
        if (!value) return '—';
        const parsed = new Date(value);
        return isNaN(parsed.getTime()) ? value : parsed.toLocaleString();
    };

    const handleDisable = async (extensionId: string) => {
        try {
            setActionId(extensionId);
            setError(null);
            const updated = await disableExtension(extensionId);
            setExtensions(prev => prev.map(item => (item.id === extensionId ? updated : item)));
            if (onExtensionsUpdated) {
                await onExtensionsUpdated();
            }
        } catch (err) {
            console.error('Error disabling extension', err);
            setError('The extension could not be disabled.');
        } finally {
            setActionId(null);
        }
    };

    const handleEnable = async (extensionId: string) => {
        try {
            setActionId(extensionId);
            setError(null);
            const updated = await enableExtension(extensionId);
            setExtensions(prev => prev.map(item => (item.id === extensionId ? updated : item)));
            if (onExtensionsUpdated) {
                await onExtensionsUpdated();
            }
        } catch (err) {
            console.error('Error enabling extension', err);
            setError('The extension could not be enabled.');
        } finally {
            setActionId(null);
        }
    };

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-2 pb-6 sm:pt-3 sm:pb-8 lg:pt-4 lg:pb-10 text-sm space-y-8">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">Extensions</h2>
                    <p className="text-xs text-zinc-400 leading-relaxed mt-2 max-w-2xl">
                        Manage available extensions. Download packages and enable them when ready.
                    </p>
                    {error && (
                        <p className="mt-2 text-xs text-amber-400">{error}</p>
                    )}
                </div>
                <div className="flex flex-wrap gap-3">
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-wide text-zinc-500">Available</p>
                        <p className="text-lg font-semibold text-zinc-100">{extensions.length}</p>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-wide text-zinc-500">Enabled</p>
                        <p className="text-lg font-semibold text-emerald-300">{enabledCount}</p>
                    </div>
                    <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
                        <p className="text-[11px] uppercase tracking-wide text-zinc-500">Disabled</p>
                        <p className="text-lg font-semibold text-indigo-300">
                            {Math.max(extensions.length - enabledCount, 0)}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                <div className="relative flex-1">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                        </svg>
                    </span>
                    <input
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                        placeholder="Search extensions by id..."
                        className="w-full rounded-xl border border-zinc-800 bg-zinc-900/80 pl-9 pr-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>
                <button
                    type="button"
                    onClick={() => setShowEnabledOnly(prev => !prev)}
                    className={`rounded-full px-3 py-2 text-xs font-semibold uppercase tracking-wide border transition ${showEnabledOnly
                        ? 'border-emerald-500/50 text-emerald-300 bg-emerald-500/10'
                        : 'border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-600'
                        }`}
                >
                    {showEnabledOnly ? 'Enabled only' : 'All statuses'}
                </button>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredExtensions.map(item => (
                    <div key={item.id} className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-5 shadow-lg">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <h3 className="text-base font-semibold text-zinc-100">{item.id}</h3>
                                <p className="text-xs text-zinc-400 leading-relaxed mt-1">Extension package ready to download.</p>
                            </div>
                            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${item.enabled
                                ? 'border-emerald-500/40 text-emerald-300 bg-emerald-500/10'
                                : 'border-zinc-700 text-zinc-400 bg-zinc-900/60'
                                }`}
                            >
                                {item.enabled ? 'Enabled' : 'Disabled'}
                            </span>
                        </div>
                        <div className="mt-4 flex flex-wrap gap-2 text-xs text-zinc-400 leading-relaxed">
                            <span className="rounded-full border border-zinc-800 px-2 py-1">
                                Created {formatDate(item.created_at)}
                            </span>
                        </div>
                        <div className="mt-4 flex items-center justify-between">
                            <span className="text-xs text-zinc-400 leading-relaxed">ID: {item.id}</span>
                            {item.enabled ? (
                                <button
                                    type="button"
                                    onClick={() => handleDisable(item.id)}
                                    disabled={actionId === item.id}
                                    className="rounded-full border border-rose-500/50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-rose-300 transition hover:border-rose-400 hover:text-rose-200 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {actionId === item.id ? 'Deleting...' : 'Delete'}
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => handleEnable(item.id)}
                                    disabled={actionId === item.id}
                                    className="rounded-full border border-emerald-500/50 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-emerald-300 transition hover:border-emerald-400 hover:text-emerald-200 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {actionId === item.id ? 'Downloading...' : 'Download'}
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {!loading && filteredExtensions.length === 0 && (
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-6 text-xs text-zinc-400 leading-relaxed">
                    No extensions match your search right now.
                </div>
            )}

            {loading && (
                <div className="flex items-center justify-center gap-3 text-sm text-zinc-300 py-10">
                    <div className="w-6 h-6 border-2 border-zinc-700 border-t-indigo-400 rounded-full animate-spin" />
                    <span>Loading extensions...</span>
                </div>
            )}
        </div>
    );
};

export default ExtensionsView;
