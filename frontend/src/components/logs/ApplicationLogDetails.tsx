import React, { useState } from 'react';
import type { RemoteApplicationRecord } from '../../services/api';
import type { LiveStatus } from '../../hooks/useApplicationsLogs';
import type { LogEvent } from '../../types';
import LiveLogPanel from './LiveLogPanel';

interface ApplicationLogDetailsProps {
    app: RemoteApplicationRecord;
    logFiles: string[];
    filesLoading: boolean;
    filesError: string | null;
    selectedFile: string | null;
    onSelectFile: (path: string) => void;
    onClose: () => void;
    live: {
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
    };
}

const ApplicationLogDetails: React.FC<ApplicationLogDetailsProps> = ({
    app,
    logFiles,
    filesLoading,
    filesError,
    selectedFile,
    onSelectFile,
    onClose,
    live,
}) => {
    const [expandedPanel, setExpandedPanel] = useState<'live' | null>('live');

    return (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 sm:p-6 space-y-5 shadow-lg">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Log details</p>
                    <h3 className="text-xl sm:text-2xl font-semibold text-zinc-100">
                        {app.name || app.identifier}
                    </h3>
                    <p className="text-sm text-zinc-400 mt-1">
                        Choose a file to review history and stream live logs.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="inline-flex items-center rounded-full border border-zinc-700 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-200 transition hover:border-zinc-500 hover:text-zinc-100"
                >
                    Close
                </button>
            </div>

            <div className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                    <h4 className="text-sm font-semibold text-zinc-200">Log files</h4>
                    {filesLoading && <span className="text-xs text-zinc-500">Loading files...</span>}
                </div>
                {filesError && <p className="text-sm text-rose-300">{filesError}</p>}
                {logFiles.length === 0 && !filesLoading ? (
                    <p className="text-sm text-zinc-500">No log files available for this application.</p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {logFiles.map((path, index) => {
                            const isActive = path === selectedFile;
                            const baseName = path.split('/').filter(Boolean).pop() ?? `log-file-${index + 1}`;
                            const duplicates = logFiles.filter(item => item.split('/').filter(Boolean).pop() === baseName).length;
                            const label = duplicates > 1 ? `${baseName} (${index + 1})` : baseName;
                            return (
                                <button
                                    key={path}
                                    type="button"
                                    onClick={() => onSelectFile(path)}
                                    className={`rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide transition ${
                                        isActive
                                            ? 'border-sky-400/70 text-sky-200 bg-sky-500/10'
                                            : 'border-zinc-700 text-zinc-300 hover:border-zinc-500 hover:text-zinc-100'
                                    }`}
                                >
                                    {label}
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <div className={expandedPanel === 'live' ? 'lg:col-span-2' : ''}>
                    <LiveLogPanel
                        enabled={live.enabled}
                        status={live.status}
                        error={live.error}
                        lines={live.lines}
                        onToggle={live.onToggle}
                        onClear={live.onClear}
                        levelFilter={live.levelFilter}
                        onLevelFilterChange={live.onLevelFilterChange}
                        searchQuery={live.searchQuery}
                        onSearchQueryChange={live.onSearchQueryChange}
                        onClearSearch={live.onClearSearch}
                        containerRef={live.containerRef}
                        isExpanded={expandedPanel === 'live'}
                        onToggleExpand={() =>
                            setExpandedPanel(prev => (prev === 'live' ? null : 'live'))
                        }
                    />
                </div>
            </div>
        </div>
    );
};

export default ApplicationLogDetails;
