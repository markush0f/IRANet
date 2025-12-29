import React from 'react';
import type { SystemApplication } from '../../types';
import SystemApplicationIcon from './SystemApplicationIcon';
import type { RemoteApplicationRecord } from '../../services/api';

interface SystemApplicationCardProps {
    application: SystemApplication;
    onOpen: (application: SystemApplication) => void;
    registeredApp?: RemoteApplicationRecord | null;
    registeredLoading?: boolean;
    registeredDeletingId?: string | null;
    onDeleteRegistered?: (applicationId: string) => void;
    onEditRegistered?: (application: RemoteApplicationRecord) => void;
}

const SystemApplicationCard: React.FC<SystemApplicationCardProps> = ({
    application,
    onOpen,
    registeredApp,
    registeredLoading,
    registeredDeletingId,
    onDeleteRegistered,
    onEditRegistered,
}) => {
    const isRegistered = Boolean(registeredApp?.id);
    const isDeleting = Boolean(registeredApp?.id && registeredDeletingId === registeredApp.id);
    return (
        <article className="flex flex-col gap-3 rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-950/60 to-zinc-950/20 p-4 backdrop-blur-xl hover:border-zinc-700 transition-colors">
            <div className="flex gap-3">
                <SystemApplicationIcon commands={application.commands} />
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-zinc-500">Directory</p>
                    <p className="text-sm font-mono text-zinc-100 break-all" title={application.cwd}>
                        {application.cwd}
                    </p>
                </div>
            </div>

            <div className="flex items-end justify-between gap-3">
                <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-zinc-500">Commands</p>
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

                <div className="shrink-0 flex items-center gap-2">
                    {isRegistered ? (
                        <>
                            <span className="rounded-full border border-emerald-500/40 bg-emerald-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-200">
                                Downloaded
                            </span>
                            {onEditRegistered && (
                                <button
                                    type="button"
                                    onClick={() => onEditRegistered(registeredApp!)}
                                    className="rounded-full border border-indigo-500/40 bg-indigo-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-200 transition hover:border-indigo-500/70"
                                    title="Edit application"
                                    disabled={isDeleting}
                                >
                                    Edit
                                </button>
                            )}
                            {onDeleteRegistered && (
                                <button
                                    type="button"
                                    onClick={() => onDeleteRegistered(registeredApp!.id)}
                                    disabled={isDeleting}
                                    className="rounded-full border border-rose-500/40 bg-rose-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-rose-200 transition hover:border-rose-500/70 disabled:opacity-50"
                                    title="Delete application"
                                >
                                    {isDeleting ? 'Deleting…' : 'Delete'}
                                </button>
                            )}
                        </>
                    ) : (
                        <button
                            type="button"
                            onClick={() => onOpen(application)}
                            className="rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-200 transition hover:border-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-50"
                            title="Open detection modal"
                            disabled={registeredLoading}
                        >
                            Add application
                        </button>
                    )}
                </div>
            </div>
        </article>
    );
};

export default SystemApplicationCard;
