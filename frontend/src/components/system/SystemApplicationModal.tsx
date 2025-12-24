import React from 'react';
import type { ApplicationDiscoveryDetails } from '../../types';
import SystemApplicationIcon from './SystemApplicationIcon';

interface SystemApplicationModalProps {
    isOpen: boolean;
    onClose: () => void;
    iconCommands: string[];
    modalDisplayName: string;
    modalDisplayCwd: string;
    discoveryDetails: ApplicationDiscoveryDetails | null;
    discoveryError: string | null;
    saveError: string | null;
    loadingDetails: boolean;
    savingApplication: boolean;
    applicationName: string;
    onApplicationNameChange: (value: string) => void;
    discoveryCwd: string;
    onDiscoveryCwdChange: (value: string) => void;
    runtimeTokens: string[];
    detectedBasePaths: string[];
    logBasePaths: string[];
    onAddLogBasePath: () => void;
    onLogBasePathChange: (index: number, value: string) => void;
    onRemoveLogBasePath: (index: number) => void;
    accessPorts: number[];
    accessUrls: string[];
    accessAvailable?: boolean;
    technicalDetailsOpen: boolean;
    onToggleTechnicalDetails: () => void;
    onRetryFetch: () => void;
    onSaveApplication: () => void;
}

const SystemApplicationModal: React.FC<SystemApplicationModalProps> = ({
    isOpen,
    onClose,
    iconCommands,
    modalDisplayName,
    modalDisplayCwd,
    discoveryDetails,
    discoveryError,
    saveError,
    loadingDetails,
    savingApplication,
    applicationName,
    onApplicationNameChange,
    discoveryCwd,
    onDiscoveryCwdChange,
    runtimeTokens,
    detectedBasePaths,
    logBasePaths,
    onAddLogBasePath,
    onLogBasePathChange,
    onRemoveLogBasePath,
    accessPorts,
    accessUrls,
    accessAvailable,
    technicalDetailsOpen,
    onToggleTechnicalDetails,
    onRetryFetch,
    onSaveApplication,
}) => {
    if (!isOpen) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-6 sm:py-8">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
            <div
                className="relative z-10 w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-3xl border border-zinc-800 bg-zinc-950/80 p-4 sm:p-6 shadow-2xl"
                role="dialog"
                aria-modal="true"
                onClick={event => event.stopPropagation()}
            >
                <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <SystemApplicationIcon commands={iconCommands} />
                        <div>
                            <p className="text-sm font-semibold text-zinc-100">{modalDisplayName}</p>
                            <p className="text-xs font-mono text-zinc-500">{modalDisplayCwd}</p>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-100"
                        >
                            Ignore
                        </button>
                    </div>
                </div>

                {discoveryDetails?.description && (
                    <p className="mt-3 text-sm text-zinc-400">{discoveryDetails.description}</p>
                )}

                {saveError && (
                    <div className="mt-3 rounded-2xl border border-rose-500/40 bg-rose-500/5 px-4 py-3 text-sm text-rose-200">
                        {saveError}
                    </div>
                )}

                <div className="mt-4 space-y-3">
                    <div>
                        <label className="text-[10px] uppercase tracking-wide text-zinc-500">Name</label>
                        <input
                            type="text"
                            value={applicationName}
                            onChange={event => onApplicationNameChange(event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
                            placeholder="IRABackend"
                        />
                    </div>
                    <div>
                        <label className="text-[10px] uppercase tracking-wide text-zinc-500">CWD</label>
                        <input
                            type="text"
                            value={discoveryCwd}
                            onChange={event => onDiscoveryCwdChange(event.target.value)}
                            className="mt-2 w-full rounded-2xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm font-mono text-zinc-100 focus:border-emerald-500 focus:outline-none"
                            placeholder="/home/markus/projects/IRANet/ira"
                        />
                    </div>
                </div>

                <div className="mt-6">
                    <p className="text-[10px] uppercase tracking-wide text-zinc-500">Detected runtimes</p>
                    <div className="mt-2 flex flex-wrap gap-2">
                        {loadingDetails ? (
                            <span className="rounded-full border border-dashed border-zinc-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                                Loading...
                            </span>
                        ) : runtimeTokens.length ? (
                            runtimeTokens.map(runtime => (
                                <span
                                    key={runtime}
                                    className="rounded-full border border-zinc-800 bg-zinc-900/40 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-200"
                                >
                                    [ {runtime} ]
                                </span>
                            ))
                        ) : (
                            <span className="text-[11px] text-zinc-500">No runtimes detected</span>
                        )}
                    </div>
                </div>

                <div className="mt-6 space-y-3">
                    {detectedBasePaths.length > 0 && (
                        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/40 px-4 py-3 text-xs text-zinc-400">
                            Suggested base paths detected. You can edit or add more below.
                        </div>
                    )}
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] uppercase tracking-wide text-zinc-500">Log base paths</p>
                        <button
                            type="button"
                            onClick={onAddLogBasePath}
                            className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 transition hover:border-zinc-600 hover:text-white"
                        >
                            + Add path
                        </button>
                    </div>

                    {logBasePaths.length > 0 ? (
                        <div className="space-y-2">
                            {logBasePaths.map((path, index) => (
                                <div key={`${path}-${index}`} className="flex items-center gap-3">
                                    <span className="text-sm text-zinc-500">•</span>
                                    <input
                                        type="text"
                                        value={path}
                                        onChange={event => onLogBasePathChange(index, event.target.value)}
                                        className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm font-mono text-zinc-100 focus:border-emerald-500 focus:outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => onRemoveLogBasePath(index)}
                                        className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 transition hover:border-zinc-600 hover:text-white"
                                    >
                                        ✕
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-zinc-500">No base paths yet; add at least one.</p>
                    )}
                </div>

                <div className="mt-6">
                    <div className="flex items-center justify-between gap-3">
                        <p className="text-[10px] uppercase tracking-wide text-zinc-500">Detected access</p>
                        {accessAvailable != null && (
                            <span
                                className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                                    accessAvailable
                                        ? 'text-emerald-300 border border-emerald-500/60'
                                        : 'text-rose-300 border border-rose-500/60'
                                }`}
                            >
                                {accessAvailable ? 'available' : 'unavailable'}
                            </span>
                        )}
                    </div>
                    <div className="mt-2 space-y-1 text-sm font-mono text-zinc-200">
                        {accessPorts.length > 0 && <p className="text-zinc-200">Ports: {accessPorts.join(', ')}</p>}
                        {accessUrls.length > 0 && <p className="text-zinc-200">URLs: {accessUrls.join(', ')}</p>}
                        {!accessPorts.length && !accessUrls.length && (
                            <p className="text-zinc-500">No ports detected</p>
                        )}
                    </div>
                </div>

                {discoveryError && (
                    <div className="mt-4 rounded-2xl border border-rose-500/40 bg-rose-500/5 px-4 py-3 text-sm text-rose-200">
                        <p>{discoveryError}</p>
                        <button
                            type="button"
                            onClick={onRetryFetch}
                            className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-rose-200 underline-offset-2 hover:text-white"
                        >
                            Retry
                        </button>
                    </div>
                )}

                <div className="mt-6">
                    <button
                        type="button"
                        onClick={onToggleTechnicalDetails}
                        className="flex items-center gap-2 text-sm font-semibold text-zinc-200"
                    >
                        <span>{technicalDetailsOpen ? '▲' : '▼'}</span>
                        <span>Show technical details</span>
                    </button>

                    {technicalDetailsOpen && (
                        <div className="mt-3 space-y-2 rounded-2xl border border-zinc-800 bg-zinc-950/70 p-3 text-sm font-mono text-zinc-200">
                            {discoveryDetails?.detected_processes?.length ? (
                                discoveryDetails.detected_processes.map((process, index) => (
                                    <p key={`${process.command ?? 'command'}-${index}`} className="text-zinc-200">
                                        {process.command ?? 'Unknown command'}
                                        {process.elapsed_seconds ? ` (${process.elapsed_seconds}s)` : ''}
                                    </p>
                                ))
                            ) : (
                                <p className="text-zinc-500">No technical details available</p>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-6 flex justify-stretch sm:justify-end">
                    <button
                        type="button"
                        onClick={onSaveApplication}
                        disabled={loadingDetails || savingApplication}
                        className="w-full sm:w-auto rounded-full border border-emerald-500/60 bg-emerald-500/10 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-emerald-300 transition hover:border-emerald-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        {savingApplication ? 'Saving...' : 'Confirm'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default SystemApplicationModal;
