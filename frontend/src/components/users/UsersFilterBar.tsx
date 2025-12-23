import React from 'react';
import type { UserFilterOption } from '../../services/usersService';

const FILTER_OPTIONS: { value: UserFilterOption; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'human', label: 'Human' },
    { value: 'system', label: 'System' },
];

interface UsersFilterBarProps {
    currentFilter: UserFilterOption;
    onFilterChange: (filter: UserFilterOption) => void;
}

const UsersFilterBar: React.FC<UsersFilterBarProps> = ({ currentFilter, onFilterChange }) => (
    <div className="flex flex-wrap gap-2 items-center">
        {FILTER_OPTIONS.map(option => (
            <button
                key={option.value}
                type="button"
                onClick={() => onFilterChange(option.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-all ${
                    currentFilter === option.value
                        ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                        : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
            >
                {option.label}
            </button>
        ))}
        <span className="text-[11px] text-zinc-400 font-mono">
            Filtering <strong>{currentFilter}</strong>
        </span>
    </div>
);

export default UsersFilterBar;
