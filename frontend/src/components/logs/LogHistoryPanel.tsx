import React from 'react';
import type { LogEvent } from '../../types';
import LogLine from './LogLine';

interface LogHistoryPanelProps {
    lines: LogEvent[];
    loading: boolean;
    error: string | null;
    limit: number;
    onLimitChange: (next: number) => void;
    onReload: () => void;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
}

const LogHistoryPanel: React.FC<LogHistoryPanelProps> = ({
    lines,
    loading,
    error,
    limit,
    onLimitChange,
    onReload,
    isExpanded = false,
    onToggleExpand,
}) => {
    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">History</p>
                    <h4 className="text-sm font-semibold text-zinc-200">Previous entries</h4>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <label className="text-xs text-zinc-500" htmlFor="history-limit">
                        Limit
                    </label>
                    <input
                        id="history-limit"
                        type="number"
                        min={1}
                        max={1000}
                        value={limit}
                        onChange={event => {
                            const nextValue = Number(event.target.value);
                            onLimitChange(nextValue);
                        }}
                        className="w-20 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100"
                    />
                    <button
                        type="button"
                        onClick={onReload}
                        className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-200 transition hover:border-zinc-500 hover:text-zinc-100"
                    >
                        Reload
                    </button>
                    {onToggleExpand && (
                        <button
                            type="button"
                            onClick={onToggleExpand}
                            className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-200 transition hover:border-zinc-500 hover:text-zinc-100"
                        >
                            {isExpanded ? 'Collapse' : 'Expand'}
                        </button>
                    )}
                </div>
            </div>
            {error && <p className="text-sm text-rose-300">{error}</p>}
            {loading ? (
                <div className="rounded-lg border border-dashed border-zinc-800 px-3 py-6 text-center text-sm text-zinc-500">
                    Loading history...
                </div>
            ) : lines.length === 0 ? (
                <div className="rounded-lg border border-dashed border-zinc-800 px-3 py-6 text-center text-sm text-zinc-500">
                    No history entries found.
                </div>
            ) : (
                <div className="max-h-80 overflow-auto rounded-lg border border-zinc-900 bg-zinc-950 px-3 py-2 space-y-2">
                    {lines.map((line, index) => (
                        <LogLine key={`${line}-${index}`} line={line} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default LogHistoryPanel;
