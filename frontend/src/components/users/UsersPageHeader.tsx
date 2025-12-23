import React from 'react';

interface UsersPageHeaderProps {
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    error?: string | null;
}

const UsersPageHeader: React.FC<UsersPageHeaderProps> = ({ searchTerm, onSearchTermChange, error }) => (
    <div className="flex flex-col gap-4">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
            <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">User Directory</h2>
                <div className="h-1 w-20 bg-indigo-600 rounded-full mt-4" />
                <p className="text-zinc-400 mt-2 text-sm">
                    Manage known system users and review the updated summary from the backend.
                </p>
                {error && (
                    <p className="mt-2 text-xs text-amber-400">{error}</p>
                )}
            </div>
            <div className="w-full md:w-64">
                <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg className="h-4 w-4 text-zinc-500 group-focus-within:text-indigo-400 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        placeholder="Search user..."
                        value={searchTerm}
                        onChange={(event) => onSearchTermChange(event.target.value)}
                        className="block w-full pl-10 pr-3 py-2.5 border border-zinc-800 rounded-lg leading-5 bg-zinc-900 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm"
                    />
                </div>
            </div>
        </div>
    </div>
);

export default UsersPageHeader;
