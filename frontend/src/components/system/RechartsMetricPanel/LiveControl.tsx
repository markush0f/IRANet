import React from 'react';

interface LiveControlProps {
    liveStart: string;
    setLiveStart: (value: string) => void;
    startLive: () => void;
    stopLive: () => void;
    liveLoading: boolean;
    isLiveState: boolean;
}

const LiveControl: React.FC<LiveControlProps> = ({
    liveStart,
    setLiveStart,
    startLive,
    stopLive,
    liveLoading,
    isLiveState,
}) => (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">En vivo</p>
                <p className="text-[11px] text-zinc-500">Actualizaciones cada 5 segundos</p>
            </div>
            <span className={`text-[11px] font-semibold ${isLiveState ? 'text-emerald-400' : 'text-zinc-500'}`}>
                {isLiveState ? '● Active' : '○ Stopped'}
            </span>
        </div>
        <label className="text-[11px] uppercase tracking-wide text-zinc-500">From (stream start)</label>
        <input
            type="datetime-local"
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-emerald-500 focus:outline-none"
            value={liveStart}
            onChange={e => setLiveStart(e.target.value)}
        />
        <div className="flex gap-2">
            <button
                type="button"
                onClick={startLive}
                disabled={liveLoading || isLiveState}
                className="flex-1 rounded-lg border border-transparent bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:bg-emerald-700"
            >
                {liveLoading ? 'Starting…' : 'Start live'}
            </button>
            <button
                type="button"
                onClick={stopLive}
                disabled={!isLiveState}
                className="flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm font-semibold text-zinc-200 transition hover:border-zinc-500 hover:text-white disabled:cursor-not-allowed disabled:border-zinc-800 disabled:text-zinc-500"
            >
                Stop
            </button>
        </div>
    </div>
);

export default LiveControl;
