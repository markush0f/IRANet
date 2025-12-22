import React from 'react';

type SortBy = 'name' | 'version' | 'arch';
type SortDir = 'asc' | 'desc';

interface PackageSortHeaderProps {
    sortBy: SortBy;
    sortDir: SortDir;
    onToggle: (field: SortBy) => void;
}

const PackageSortHeader: React.FC<PackageSortHeaderProps> = ({ sortBy, sortDir, onToggle }) => (
    <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
        <button
            type="button"
            onClick={() => onToggle('name')}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide ${
                sortBy === 'name'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                    : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
        >
            Nombre {sortBy === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
        </button>
        <button
            type="button"
            onClick={() => onToggle('version')}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide ${
                sortBy === 'version'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                    : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
        >
            Versión {sortBy === 'version' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
        </button>
        <button
            type="button"
            onClick={() => onToggle('arch')}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide ${
                sortBy === 'arch'
                    ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                    : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
            }`}
        >
            Arch {sortBy === 'arch' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
        </button>
    </div>
);

export default PackageSortHeader;
