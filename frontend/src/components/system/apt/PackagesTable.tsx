import React from 'react';
import type { SystemPackage } from '../../../types';

interface PackagesTableProps {
    packages: SystemPackage[];
    selectedPackageName?: string | null;
    loading: boolean;
    error?: string | null;
    onSelect: (pkg: SystemPackage) => void;
}

const PackagesTable: React.FC<PackagesTableProps> = ({
    packages,
    selectedPackageName,
    loading,
    error,
    onSelect,
}) => (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 sm:p-5 shadow-lg">
        {loading ? (
            <div className="flex items-center justify-center gap-3 text-sm text-zinc-300 py-10">
                <div className="w-6 h-6 border-2 border-zinc-700 border-t-indigo-400 rounded-full animate-spin" />
                <span>Cargando paquetes...</span>
            </div>
        ) : error ? (
            <div className="text-sm text-amber-400">{error}</div>
        ) : packages.length === 0 ? (
            <div className="text-sm text-zinc-400">
                No hay paquetes que coincidan con el filtro.
            </div>
        ) : (
            <div className="overflow-x-auto">
                <table className="min-w-full text-xs divide-y divide-zinc-800">
                    <thead className="bg-zinc-950/70">
                        <tr>
                            <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">Name</th>
                            <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">Version</th>
                            <th className="px-4 py-3 text-left font-semibold text-zinc-500 uppercase tracking-wide">Architecture</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800">
                        {packages.map(pkg => (
                            <tr
                                key={`${pkg.name}-${pkg.version}`}
                                className={`cursor-pointer transition-colors ${
                                    selectedPackageName === pkg.name
                                        ? 'bg-indigo-500/10'
                                        : 'hover:bg-zinc-900/60'
                                }`}
                                onClick={() => onSelect(pkg)}
                            >
                                <td className="px-4 py-3 font-semibold text-zinc-100">{pkg.name}</td>
                                <td className="px-4 py-3 text-zinc-300 font-mono">{pkg.version}</td>
                                <td className="px-4 py-3 text-zinc-300">{pkg.arch}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
);

export default PackagesTable;
