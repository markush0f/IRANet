import React from 'react';
import type { SystemPackage } from '../../../types';

interface PackagesTableProps {
    packages: SystemPackage[];
    selectedPackageName?: string | null;
    loading: boolean;
    error?: string | null;
    onSelect: (pkg: SystemPackage) => void;
    className?: string;
}

const PackagesTable: React.FC<PackagesTableProps> = ({
    packages,
    selectedPackageName,
    loading,
    error,
    onSelect,
    className,
}) => (
    <div className={`panel accent-border rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col min-h-0 ${className ?? ''}`}>
        {loading ? (
            <div className="flex items-center justify-center gap-3 text-sm text-zinc-300 py-10">
                <div className="w-6 h-6 border-2 border-zinc-700 border-t-indigo-400 rounded-full animate-spin" />
                <span>Loading packages...</span>
            </div>
        ) : error ? (
            <div className="text-sm text-amber-400">{error}</div>
        ) : packages.length === 0 ? (
            <div className="text-sm text-zinc-400">
                No packages match the filter.
            </div>
        ) : (
            <div className="flex-1 min-h-0 overflow-auto scrollbar-strong">
                <table className="min-w-full text-sm divide-y divide-zinc-800">
                    <thead className="bg-zinc-950/80 backdrop-blur supports-[backdrop-filter]:bg-zinc-950/60">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wide">Name</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wide">Version</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-300 uppercase tracking-wide">Architecture</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {packages.map((pkg, idx) => (
                            <tr
                                key={`${pkg.name}-${pkg.version}`}
                                className={`cursor-pointer transition-colors ${idx % 2 === 0 ? 'bg-zinc-950/20' : 'bg-transparent'} ${
                                    selectedPackageName === pkg.name
                                        ? 'bg-indigo-500/10 border-l-2 border-indigo-400'
                                        : 'hover:bg-zinc-900/60'
                                }`}
                                onClick={() => onSelect(pkg)}
                            >
                                <td className="px-4 py-3 font-semibold text-zinc-100">{pkg.name}</td>
                                <td className="px-4 py-3 text-zinc-200 font-mono">{pkg.version}</td>
                                <td className="px-4 py-3 text-zinc-200">{pkg.arch}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
);

export default PackagesTable;
