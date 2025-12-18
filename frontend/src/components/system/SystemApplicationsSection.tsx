import React from 'react';
import type { SystemApplication } from '../../types';

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
    return (
        <section className="mt-8 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Aplicaciones</p>
                    <h3 className="text-lg font-semibold text-zinc-100">System applications</h3>
                </div>
                <button
                    type="button"
                    onClick={() => console.log('Añadir aplicación')}
                    className="inline-flex items-center gap-2 rounded-full border border-zinc-800 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-zinc-200 transition hover:border-zinc-700 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500"
                >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v12m6-6H6" />
                    </svg>
                    Añadir aplicación
                </button>
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
                                onClick={() => console.log('Ejecutar aplicación:', application.cwd)}
                                className="shrink-0 rounded-lg border border-zinc-800 bg-zinc-950/60 p-2 text-zinc-400 transition hover:border-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/10"
                                title="Ejecutar aplicación"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </button>
                        </div>
                    </article>
                ))}
            </div>
        </section>
    );
};

export default SystemApplicationsSection;