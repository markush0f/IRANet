import React, { useEffect, useMemo, useState } from 'react';
import type { SystemPackagesResponse } from '../../types';
import { getSystemPackages } from '../../services/api';

type SortBy = 'name' | 'version' | 'arch';
type SortDir = 'asc' | 'desc';

const PAGE_SIZES = [10, 20, 50, 100];

const SystemPackagesView: React.FC = () => {
    const [data, setData] = useState<SystemPackagesResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);
    const [query, setQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortBy>('version');
    const [sortDir, setSortDir] = useState<SortDir>('desc');

    useEffect(() => {
        const controller = new AbortController();

        const fetchPackages = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await getSystemPackages({
                    page,
                    pageSize,
                    query,
                    sortBy,
                    sortDir,
                    signal: controller.signal,
                });
                setData(response);
            } catch (e) {
                if (
                    e instanceof DOMException && e.name === 'AbortError' ||
                    (typeof e === 'object' && e !== null && 'name' in e && (e as any).name === 'AbortError')
                ) {
                    return;
                }
                console.error('Error fetching system packages', e);
                setError('System packages could not be loaded.');
            } finally {
                setLoading(false);
            }
        };

        fetchPackages();

        return () => controller.abort();
    }, [page, pageSize, query, sortBy, sortDir]);

    const total = data?.total ?? 0;
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const items = data?.items ?? [];

    const pageLabel = useMemo(() => {
        if (!total) return '0 results';
        const start = (page - 1) * pageSize + 1;
        const end = Math.min(page * pageSize, total);
        return `${start}-${end} of ${total}`;
    }, [page, pageSize, total]);

    const handleQueryChange = (value: string) => {
        setQuery(value);
        setPage(1);
    };

    const toggleSort = (field: SortBy) => {
        if (sortBy !== field) {
            setSortBy(field);
            setSortDir('asc');
            return;
        }
        setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    };

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-6 space-y-4">
            {/* Header */}
            <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-[10px] uppercase tracking-wide text-zinc-500">
                        System
                    </p>
                    <h2 className="text-xl font-semibold text-zinc-100">
                        System packages
                    </h2>
                    <p className="text-xs text-zinc-500 mt-1 max-w-xl">
                        Installed packages list with search, sorting, and pagination.
                    </p>
                    {error && (
                        <p className="mt-2 text-xs text-amber-400">
                            {error}
                        </p>
                    )}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 text-[11px] text-zinc-500">
                        <span>Sort</span>

                        <button
                            type="button"
                            onClick={() => toggleSort('name')}
                            className={`rounded-md border px-2.5 py-1 font-semibold uppercase tracking-wide ${sortBy === 'name'
                                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                                : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                                }`}
                        >
                            Name {sortBy === 'name' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                        </button>

                        <button
                            type="button"
                            onClick={() => toggleSort('version')}
                            className={`rounded-md border px-2.5 py-1 font-semibold uppercase tracking-wide ${sortBy === 'version'
                                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                                : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                                }`}
                        >
                            Version {sortBy === 'version' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                        </button>

                        <button
                            type="button"
                            onClick={() => toggleSort('arch')}
                            className={`rounded-md border px-2.5 py-1 font-semibold uppercase tracking-wide ${sortBy === 'arch'
                                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                                : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                                }`}
                        >
                            Arch {sortBy === 'arch' ? (sortDir === 'asc' ? '↑' : '↓') : ''}
                        </button>
                    </div>
                </div>
            </div>

            {/* Search + pagination info */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative flex-1 min-w-[220px] max-w-md">
                    <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-zinc-500">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 100-15 7.5 7.5 0 000 15z" />
                        </svg>
                    </span>
                    <input
                        value={query}
                        onChange={(event) => handleQueryChange(event.target.value)}
                        placeholder="Search packages..."
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-md pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                </div>

                <div className="flex items-center gap-3 text-[11px] text-zinc-500">
                    <span>{pageLabel}</span>
                    <div className="relative">
                        <select
                            value={pageSize}
                            onChange={(event) => {
                                setPageSize(Number(event.target.value));
                                setPage(1);
                            }}
                            className="appearance-none bg-zinc-900 border border-zinc-800 text-zinc-200 text-[11px] rounded-md pl-3 pr-7 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        >
                            {PAGE_SIZES.map((size) => (
                                <option key={size} value={size}>
                                    {size} / page
                                </option>
                            ))}
                        </select>
                        <span className="pointer-events-none absolute inset-y-0 right-2 flex items-center text-zinc-500">
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </span>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-950/60 shadow-md">
                {loading ? (
                    <div className="flex items-center justify-center gap-3 text-sm text-zinc-300 py-8">
                        <div className="w-5 h-5 border-2 border-zinc-700 border-t-indigo-400 rounded-full animate-spin" />
                        <span>Loading packages...</span>
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-sm text-zinc-400 px-4 py-6">
                        No packages match the filter.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-xs divide-y divide-zinc-800">
                            <thead className="bg-zinc-950">
                                <tr>
                                    <th className="px-4 py-2.5 text-left font-semibold text-zinc-500 uppercase tracking-wide">
                                        Name
                                    </th>
                                    <th className="px-4 py-2.5 text-left font-semibold text-zinc-500 uppercase tracking-wide">
                                        Version
                                    </th>
                                    <th className="px-4 py-2.5 text-left font-semibold text-zinc-500 uppercase tracking-wide">
                                        Arch
                                    </th>
                                    <th className="px-4 py-2.5 text-left font-semibold text-zinc-500 uppercase tracking-wide">
                                        Origin
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-800">
                                {items.map((pkg) => (
                                    <tr
                                        key={`${pkg.name}-${pkg.version}`}
                                        className="hover:bg-zinc-900/50 transition-colors"
                                    >
                                        <td className="px-4 py-2.5 font-semibold text-zinc-100">
                                            {pkg.name}
                                        </td>
                                        <td className="px-4 py-2.5 text-zinc-300 font-mono">
                                            {pkg.version}
                                        </td>
                                        <td className="px-4 py-2.5 text-zinc-300">
                                            {pkg.arch}
                                        </td>
                                        <td className="px-4 py-2.5 text-zinc-300">
                                            {pkg.origin}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Footer pagination */}
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-[11px] text-zinc-500">
                    Page {page} of {totalPages}
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setPage(1)}
                        disabled={page === 1}
                        className="rounded-md border border-zinc-800 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-300 disabled:text-zinc-600 disabled:border-zinc-900"
                    >
                        First
                    </button>
                    <button
                        type="button"
                        onClick={() => setPage(prev => Math.max(1, prev - 1))}
                        disabled={page === 1}
                        className="rounded-md border border-zinc-800 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-300 disabled:text-zinc-600 disabled:border-zinc-900"
                    >
                        Previous
                    </button>
                    <button
                        type="button"
                        onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                        disabled={page >= totalPages}
                        className="rounded-md border border-zinc-800 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-300 disabled:text-zinc-600 disabled:border-zinc-900"
                    >
                        Next
                    </button>
                    <button
                        type="button"
                        onClick={() => setPage(totalPages)}
                        disabled={page >= totalPages}
                        className="rounded-md border border-zinc-800 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-300 disabled:text-zinc-600 disabled:border-zinc-900"
                    >
                        Last
                    </button>
                </div>
            </div>
        </div>
    );

};

export default SystemPackagesView;
