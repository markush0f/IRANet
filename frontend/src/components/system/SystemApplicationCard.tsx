import React from 'react';
import type { SystemApplication } from '../../types';
import SystemApplicationIcon from './SystemApplicationIcon';

interface SystemApplicationCardProps {
    application: SystemApplication;
    onOpen: (application: SystemApplication) => void;
}

const SystemApplicationCard: React.FC<SystemApplicationCardProps> = ({ application, onOpen }) => {
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

                <button
                    type="button"
                    onClick={() => onOpen(application)}
                    className="shrink-0 rounded-full border border-zinc-800 bg-zinc-950/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-200 transition hover:border-emerald-500/50 hover:text-emerald-400 hover:bg-emerald-500/10"
                    title="Open detection modal"
                >
                    Add application
                </button>
            </div>
        </article>
    );
};

export default SystemApplicationCard;
