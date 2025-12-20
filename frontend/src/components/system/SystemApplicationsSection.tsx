import React, { useEffect, useState } from 'react';
import type { ApplicationDiscoveryDetails, SystemApplication } from '../../types';
import { getApplicationDiscoveryDetails } from '../../services/api';

const KNOWN_LOGOS = [
    { matcher: 'python', label: '🐍', gradient: 'from-sky-500 to-emerald-500' },
    { matcher: 'node', label: '📗', gradient: 'from-lime-500 to-emerald-600' },
    { matcher: 'npm', label: '📦', gradient: 'from-red-500 to-pink-600' },
    { matcher: 'uvicorn', label: '🦄', gradient: 'from-indigo-500 to-purple-600' },
    { matcher: 'fastapi', label: '⚡', gradient: 'from-teal-500 to-cyan-600' },
    { matcher: 'django', label: '🎸', gradient: 'from-green-600 to-emerald-700' },
    { matcher: 'flask', label: '🧪', gradient: 'from-gray-600 to-gray-800' },
    { matcher: 'react', label: '⚛️', gradient: 'from-blue-400 to-cyan-500' },
    { matcher: 'next', label: '▲', gradient: 'from-slate-800 to-zinc-900' },
    { matcher: 'vue', label: '💚', gradient: 'from-emerald-500 to-green-600' },
    { matcher: 'angular', label: '🅰️', gradient: 'from-red-600 to-pink-700' },
    { matcher: 'express', label: '🚂', gradient: 'from-gray-700 to-slate-800' },
    { matcher: 'nest', label: '🐱', gradient: 'from-red-500 to-rose-600' },
    { matcher: 'rust', label: '🦀', gradient: 'from-orange-600 to-red-700' },
    { matcher: 'go', label: '🐹', gradient: 'from-cyan-500 to-blue-600' },
    { matcher: 'java', label: '☕', gradient: 'from-orange-500 to-red-600' },
];

const getApplicationIcon = (commands: string[]) => {
    const normalized = commands.map(command => command.toLowerCase());
    const match = KNOWN_LOGOS.find(entry => normalized.some(command => command.includes(entry.matcher)));
    const label = match?.label ?? (commands[0]?.slice(0, 2).toUpperCase() ?? '??');
    const gradient = match?.gradient ?? 'from-zinc-700 to-zinc-900';

    return (
        <div className={`w-11 h-11 rounded-2xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-lg`}>
            <span className="text-xl">{label}</span>
        </div>
    );
};

interface SystemApplicationsSectionProps {
    applications: SystemApplication[];
}

const SystemApplicationsSection: React.FC<SystemApplicationsSectionProps> = ({ applications }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedApplication, setSelectedApplication] = useState<SystemApplication | null>(null);
    const [discoveryCwd, setDiscoveryCwd] = useState('');
    const [discoveryDetails, setDiscoveryDetails] = useState<ApplicationDiscoveryDetails | null>(null);
    const [discoveryError, setDiscoveryError] = useState<string | null>(null);
    const [logPaths, setLogPaths] = useState<string[]>([]);
    const [loadingDetails, setLoadingDetails] = useState(false);
    const [technicalDetailsOpen, setTechnicalDetailsOpen] = useState(false);
    const [fetchKey, setFetchKey] = useState(0);

    const prepareDiscoveryRequest = () => {
        setLoadingDetails(true);
        setDiscoveryError(null);
        setDiscoveryDetails(null);
        setLogPaths([]);
        setFetchKey(key => key + 1);
    };

    const openModal = (application: SystemApplication) => {
        setSelectedApplication(application);
        setDiscoveryCwd(application.cwd);
        setTechnicalDetailsOpen(false);
        setIsModalOpen(true);
        prepareDiscoveryRequest();
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setDiscoveryCwd('');
        setSelectedApplication(null);
        setDiscoveryDetails(null);
        setLogPaths([]);
        setDiscoveryError(null);
        setLoadingDetails(false);
        setTechnicalDetailsOpen(false);
    };

    const handleSaveApplication = () => {
        console.log('Guardar aplicación', { cwd: discoveryCwd, discoveryDetails, logPaths });
        closeModal();
    };

    const handleConfirm = () => {
        console.log('Confirmar detección', { cwd: discoveryCwd, discoveryDetails, logPaths });
    };

    const handleRetryFetch = () => {
        if (!discoveryCwd) {
            return;
        }

        prepareDiscoveryRequest();
    };

    const handleLogPathChange = (index: number, value: string) => {
        setLogPaths(prev => {
            const next = [...prev];
            next[index] = value;
            return next;
        });
    };

    const handleAddLogPath = () => {
        setLogPaths(prev => [...prev, '']);
    };

    const handleRemoveLogPath = (index: number) => {
        setLogPaths(prev => prev.filter((_, idx) => idx !== index));
    };

    useEffect(() => {
        if (!isModalOpen || !discoveryCwd) {
            return;
        }

        const controller = new AbortController();

        getApplicationDiscoveryDetails(discoveryCwd, 15, controller.signal)
            .then(data => {
                setDiscoveryDetails(data);
                setLogPaths(
                    data.detected_log_paths ??
                    data.paths?.log_paths ??
                    []
                );
            })
            .catch(error => {
                if (error.name !== 'AbortError') {
                    const message =
                        error instanceof Error
                            ? error.message
                            : typeof error === 'string'
                                ? error
                                : 'No se pudo obtener la información de la aplicación';
                    setDiscoveryError(message);
                }
            })
            .finally(() => {
                setLoadingDetails(false);
            });

        return () => {
            controller.abort();
        };
    }, [isModalOpen, discoveryCwd, fetchKey]);

    const runtimeTokens =
        discoveryDetails?.detected_runtimes?.filter(Boolean) ??
        discoveryDetails?.commands ??
        selectedApplication?.commands ??
        [];

    const iconCommands =
        discoveryDetails?.commands ??
        discoveryDetails?.detected_runtimes ??
        selectedApplication?.commands ??
        [];

    const accessPorts = discoveryDetails?.access?.ports ?? [];
    const accessUrls = discoveryDetails?.access?.urls ?? [];
    const accessAvailable = discoveryDetails?.access?.available;

    const modalDisplayName =
        discoveryDetails?.name ?? selectedApplication?.cwd ?? 'Aplicación detectada';
    const modalDisplayCwd = discoveryDetails?.cwd ?? discoveryCwd;

    return (
        <>
            <section className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <p className="text-xs uppercase tracking-wide text-zinc-500">Aplicaciones</p>
                        <h3 className="text-lg font-semibold text-zinc-100">System applications</h3>
                    </div>
                </div>

                <div className="mt-6 grid gap-4 sm:grid-cols-1 md:grid-cols-2 xl:grid-cols-3">
                    {applications.map(application => (
                        <article
                            key={application.cwd}
                            className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-950/60 to-zinc-950/20 p-4 backdrop-blur-xl hover:border-zinc-700 transition-colors"
                        >
                            <div className="flex gap-3">
                                {getApplicationIcon(application.commands)}
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] uppercase tracking-wide text-zinc-500">Directorio</p>
                                    <p
                                        className="text-sm font-mono text-zinc-100 break-all"
                                        title={application.cwd}
                                    >
                                        {application.cwd}
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-end justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    <p className="text-[10px] uppercase tracking-wide text-zinc-500">Comandos</p>
                                    <div className="mt-2 flex flex-wrap gap-2">
                                        {application.commands.map(command => (
                                            <span
                                                key={`${application.cwd}-${command}`}
                                                className="rounded-full border border-zinc-800 bg-zinc-950/60 px-2 py-1 text-[11px] font-medium text-zinc-300"
                                            >
                                                {command}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                <button
                                    type="button"
                                    onClick={() => openModal(application)}
                                    className="shrink-0 rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-200 transition hover:border-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/10"
                                    title="Abrir modal de detección"
                                >
                                    Añadir aplicación
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </section>

            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center px-4 py-8">
                    <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={closeModal} />
                    <div
                        className="relative z-10 w-full max-w-3xl overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 shadow-2xl"
                        role="dialog"
                        aria-modal="true"
                        onClick={event => event.stopPropagation()}
                    >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                                {getApplicationIcon(iconCommands)}
                                <div>
                                    <p className="text-sm font-semibold text-zinc-100">
                                        {modalDisplayName}
                                    </p>
                                    <p className="text-xs font-mono text-zinc-500">
                                        {modalDisplayCwd}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={handleSaveApplication}
                                    className="rounded-full border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-300 transition hover:border-emerald-400 hover:text-white"
                                >
                                    Save application
                                </button>
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="rounded-full border border-zinc-800 bg-zinc-900/60 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-400 transition hover:border-zinc-600 hover:text-zinc-100"
                                >
                                    Ignore
                                </button>
                            </div>
                        </div>

                        {discoveryDetails?.description && (
                            <p className="mt-3 text-sm text-zinc-400">{discoveryDetails.description}</p>
                        )}

                        <div className="mt-6">
                            <p className="text-[10px] uppercase tracking-wide text-zinc-500">Detected runtimes</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                                {loadingDetails ? (
                                    <span className="rounded-full border border-dashed border-zinc-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
                                        Cargando...
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
                                    <span className="text-[11px] text-zinc-500">Sin runtimes detectados</span>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 space-y-3">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-[10px] uppercase tracking-wide text-zinc-500">Detected log paths</p>
                                <button
                                    type="button"
                                    onClick={handleAddLogPath}
                                    className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-400 transition hover:border-zinc-600 hover:text-white"
                                >
                                    + Add path
                                </button>
                            </div>

                            {logPaths.length > 0 ? (
                                <div className="space-y-2">
                                    {logPaths.map((path, index) => (
                                        <div key={`${path}-${index}`} className="flex items-center gap-3">
                                            <span className="text-sm text-zinc-500">•</span>
                                            <input
                                                type="text"
                                                value={path}
                                                onChange={event => handleLogPathChange(index, event.target.value)}
                                                className="flex-1 rounded-2xl border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-sm font-mono text-zinc-100 focus:border-emerald-500 focus:outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveLogPath(index)}
                                                className="rounded-full border border-zinc-800 bg-zinc-900/60 px-2 py-1 text-xs font-semibold uppercase tracking-wide text-zinc-500 transition hover:border-zinc-600 hover:text-white"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-zinc-500">No se detectaron rutas; puedes agregarlas manualmente.</p>
                            )}
                        </div>

                        <div className="mt-6">
                            <div className="flex items-center justify-between gap-3">
                                <p className="text-[10px] uppercase tracking-wide text-zinc-500">Detected access</p>
                                {accessAvailable != null && (
                                    <span
                                        className={`rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide ${
                                            accessAvailable ? 'text-emerald-300 border border-emerald-500/60' : 'text-rose-300 border border-rose-500/60'
                                        }`}
                                    >
                                        {accessAvailable ? 'available' : 'unavailable'}
                                    </span>
                                )}
                            </div>
                            <div className="mt-2 space-y-1 text-sm font-mono text-zinc-200">
                                {accessPorts.length > 0 && (
                                    <p className="text-zinc-200">
                                        Puertos: {accessPorts.join(', ')}
                                    </p>
                                )}
                                {accessUrls.length > 0 && (
                                    <p className="text-zinc-200">
                                        URLs: {accessUrls.join(', ')}
                                    </p>
                                )}
                                {!accessPorts.length && !accessUrls.length && (
                                    <p className="text-zinc-500">Sin puertos detectados</p>
                                )}
                            </div>
                        </div>

                        {discoveryError && (
                            <div className="mt-4 rounded-2xl border border-rose-500/40 bg-rose-500/5 px-4 py-3 text-sm text-rose-200">
                                <p>{discoveryError}</p>
                                <button
                                    type="button"
                                    onClick={handleRetryFetch}
                                    className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-rose-200 underline-offset-2 hover:text-white"
                                >
                                    Reintentar
                                </button>
                            </div>
                        )}

                        <div className="mt-6">
                            <button
                                type="button"
                                onClick={() => setTechnicalDetailsOpen(open => !open)}
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
                                                {process.command ?? 'Comando desconocido'}
                                                {process.elapsed_seconds ? ` (${process.elapsed_seconds}s)` : ''}
                                            </p>
                                        ))
                                    ) : (
                                        <p className="text-zinc-500">No hay detalles técnicos disponibles</p>
                                    )}
                                </div>
                            )}
                        </div>

                        <div className="mt-6 flex justify-end">
                            <button
                                type="button"
                                onClick={handleConfirm}
                                disabled={loadingDetails}
                                className="rounded-full border border-emerald-500/60 bg-emerald-500/10 px-5 py-2 text-sm font-semibold uppercase tracking-wide text-emerald-300 transition hover:border-emerald-400 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                            >
                                Confirmar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default SystemApplicationsSection;
