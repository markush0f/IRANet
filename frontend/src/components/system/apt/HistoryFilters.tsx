import React from 'react';

type SortDir = 'asc' | 'desc';
type HistoryActionFilter = 'all' | 'install' | 'upgrade' | 'remove';

interface HistoryFiltersProps {
    action: HistoryActionFilter;
    sortDir: SortDir;
    dateFrom: string;
    dateTo: string;
    onActionChange: (value: HistoryActionFilter) => void;
    onSortDirChange: (value: SortDir) => void;
    onDateFromChange: (value: string) => void;
    onDateToChange: (value: string) => void;
}

const HistoryFilters: React.FC<HistoryFiltersProps> = ({
    action,
    sortDir,
    dateFrom,
    dateTo,
    onActionChange,
    onSortDirChange,
    onDateFromChange,
    onDateToChange,
}) => (
    <div className="space-y-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="flex flex-wrap gap-2">
                {(['all', 'install', 'upgrade', 'remove'] as HistoryActionFilter[]).map(filter => (
                    <button
                        key={filter}
                        type="button"
                        onClick={() => onActionChange(filter)}
                        className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide ${
                            action === filter
                                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                                : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        }`}
                    >
                        {filter}
                    </button>
                ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
                <label className="text-[11px] text-zinc-500 uppercase tracking-wide">Orden</label>
                <div className="inline-flex rounded-full bg-zinc-900 border border-zinc-800 p-1">
                    <button
                        type="button"
                        onClick={() => onSortDirChange('desc')}
                        className={`px-3 py-1 text-[11px] rounded-full ${
                            sortDir === 'desc'
                                ? 'bg-zinc-800 text-zinc-100'
                                : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        Desc
                    </button>
                    <button
                        type="button"
                        onClick={() => onSortDirChange('asc')}
                        className={`px-3 py-1 text-[11px] rounded-full ${
                            sortDir === 'asc'
                                ? 'bg-zinc-800 text-zinc-100'
                                : 'text-zinc-400 hover:text-zinc-200'
                        }`}
                    >
                        Asc
                    </button>
                </div>
            </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <div className="flex flex-col gap-2">
                <label className="text-[11px] uppercase tracking-wide text-zinc-500">Desde</label>
                <input
                    type="datetime-local"
                    value={dateFrom}
                    onChange={(event) => onDateFromChange(event.target.value)}
                    className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                />
            </div>
            <div className="flex flex-col gap-2">
                <label className="text-[11px] uppercase tracking-wide text-zinc-500">Hasta</label>
                <input
                    type="datetime-local"
                    value={dateTo}
                    onChange={(event) => onDateToChange(event.target.value)}
                    className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-sm text-zinc-100"
                />
            </div>
        </div>
    </div>
);

export default HistoryFilters;
