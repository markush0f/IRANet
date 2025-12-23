import React from 'react';

interface ManualControlProps {
    manualStart: string;
    manualEnd: string;
    setManualStart: (value: string) => void;
    setManualEnd: (value: string) => void;
    handleManualFetch: () => void;
    loading: boolean;
    latestValueLabel: string | null;
}

const ManualControl: React.FC<ManualControlProps> = ({
    manualStart,
    manualEnd,
    setManualStart,
    setManualEnd,
    handleManualFetch,
    loading,
    latestValueLabel,
}) => (
    <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wide text-zinc-400">Manual range</p>
            <span className="text-[11px] text-zinc-500">
                {latestValueLabel ? `Latest value ${latestValueLabel}` : 'No data'}
            </span>
        </div>
        <div className="grid gap-3">
            <label className="text-[11px] uppercase tracking-wide text-zinc-500">From</label>
            <input
                type="datetime-local"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
                value={manualStart}
                onChange={e => setManualStart(e.target.value)}
            />
            <label className="text-[11px] uppercase tracking-wide text-zinc-500">To</label>
            <input
                type="datetime-local"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 focus:border-indigo-500 focus:outline-none"
                value={manualEnd}
                onChange={e => setManualEnd(e.target.value)}
            />
            <button
                type="button"
                onClick={handleManualFetch}
                disabled={loading}
                className="inline-flex w-full justify-center rounded-lg border border-transparent bg-indigo-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-indigo-700"
            >
                {loading ? 'Loading range…' : 'View range'}
            </button>
        </div>
    </div>
);

export default ManualControl;
