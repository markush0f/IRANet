import React from 'react';
import type { LiveStatus } from '../../hooks/useApplicationsLogs';
import type { LogEvent } from '../../types';
import LogLine from './LogLine';

interface LiveLogPanelProps {
    enabled: boolean;
    status: LiveStatus;
    error: string | null;
    lines: LogEvent[];
    onToggle: () => void;
    onClear: () => void;
    levelFilter: 'all' | NonNullable<LogEvent['level']>;
    onLevelFilterChange: (next: 'all' | NonNullable<LogEvent['level']>) => void;
    searchQuery: string;
    onSearchQueryChange: (next: string) => void;
    onClearSearch: () => void;
    containerRef: React.RefObject<HTMLDivElement>;
    isExpanded?: boolean;
    onToggleExpand?: () => void;
}

const LiveLogPanel: React.FC<LiveLogPanelProps> = ({
    enabled,
    status,
    error,
    lines,
    onToggle,
    onClear,
    levelFilter,
    onLevelFilterChange,
    searchQuery,
    onSearchQueryChange,
    onClearSearch,
    containerRef,
    isExpanded = false,
    onToggleExpand,
}) => {
    return (
        <div className="rounded-xl border border-zinc-800 bg-zinc-950/80 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Live</p>
                    <h4 className="text-sm font-semibold text-zinc-200">Streaming output</h4>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <span
                        className={`rounded-full px-2 py-1 text-[10px] font-semibold uppercase tracking-wide ${status === 'connected'
                            ? 'bg-emerald-500/10 text-emerald-200'
                            : status === 'connecting'
                                ? 'bg-sky-500/10 text-sky-200'
                                : status === 'error'
                                    ? 'bg-rose-500/10 text-rose-200'
                                    : 'bg-zinc-700/40 text-zinc-300'
                            }`}
                    >
                        {status}
                    </span>
                    <button
                        type="button"
                        onClick={onToggle}
                        className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-200 transition hover:border-zinc-500 hover:text-zinc-100"
                    >
                        {enabled ? 'Stop' : 'Start'}
                    </button>
                    <button
                        type="button"
                        onClick={onClear}
                        className="rounded-full border border-zinc-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-200 transition hover:border-zinc-500 hover:text-zinc-100"
                    >
                        Clear
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
            <div className="flex flex-wrap items-center gap-2">
                <label className="text-xs text-zinc-500" htmlFor="live-level-filter">
                    Level
                </label>
                <select
                    id="live-level-filter"
                    value={levelFilter}
                    onChange={event => onLevelFilterChange(event.target.value as typeof levelFilter)}
                    className="rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100"
                >
                    <option value="all">All</option>
                    <option value="trace">Trace</option>
                    <option value="debug">Debug</option>
                    <option value="info">Info</option>
                    <option value="warn">Warn</option>
                    <option value="error">Error</option>
                    <option value="fatal">Fatal</option>
                </select>
                <label className="text-xs text-zinc-500" htmlFor="live-search">
                    Search
                </label>
                <input
                    id="live-search"
                    type="search"
                    value={searchQuery}
                    onChange={event => onSearchQueryChange(event.target.value)}
                    placeholder="Filter logs"
                    className="min-w-[180px] flex-1 rounded-lg border border-zinc-700 bg-zinc-900 px-2 py-1 text-xs text-zinc-100"
                />
                {searchQuery && (
                    <button
                        type="button"
                        onClick={onClearSearch}
                        className="rounded-full border border-zinc-700 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-200 transition hover:border-zinc-500 hover:text-zinc-100"
                    >
                        Clear
                    </button>
                )}
                <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                    {lines.length}
                </span>
            </div>
            {error && <p className="text-sm text-rose-300">{error}</p>}
            {!enabled ? (
                <div className="rounded-lg border border-dashed border-zinc-800 px-3 py-6 text-center text-sm text-zinc-500">
                    Live streaming is paused.
                </div>
            ) : (
                <div
                    ref={containerRef}
                    className="max-h-80 overflow-auto rounded-lg border border-zinc-900 bg-zinc-950 px-3 py-2 space-y-2"
                >
                    {lines.length === 0 ? (
                        <div className="text-xs text-zinc-500">Waiting for live log entries...</div>
                    ) : (
                        lines.map((line, index) => <LogLine key={`${line}-${index}`} line={line} />)
                    )}
                </div>
            )}
        </div>
    );
};

export default LiveLogPanel;
