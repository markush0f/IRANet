import React from 'react';

const AppHeader: React.FC = () => {
    const envName = (import.meta.env.VITE_ENV_NAME as string | undefined) ?? import.meta.env.MODE ?? 'unknown';

    const prettyEnvName = envName === 'production'
        ? 'Production'
        : envName.charAt(0).toUpperCase() + envName.slice(1);

    return (
        <header className="bg-zinc-950/80 backdrop-blur-md border-b border-zinc-900 shrink-0 z-20">
            <div className="px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-end">
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex flex-col items-end mr-4">
                        <span className="text-xs text-zinc-400">Environment</span>
                        <span className="text-xs font-bold text-zinc-200">
                            {prettyEnvName} (US-East)
                        </span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-zinc-900 rounded-full border border-zinc-800">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.5)] animate-pulse" />
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                            Operational
                        </span>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default AppHeader;
