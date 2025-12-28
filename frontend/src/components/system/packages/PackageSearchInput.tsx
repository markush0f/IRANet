import React from 'react';

interface PackageSearchInputProps {
    value: string;
    placeholder?: string;
    onChange: (value: string) => void;
}

const PackageSearchInput: React.FC<PackageSearchInputProps> = ({ value, placeholder, onChange }) => (
    <div className="relative flex-1 min-w-[220px] max-w-md">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-400">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
            </svg>
        </span>
        <input
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder ?? 'Search packages...'}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-9 pr-3 py-2.5 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
        />
    </div>
);

export default PackageSearchInput;
