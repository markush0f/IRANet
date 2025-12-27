import React, { useEffect, useMemo, useState } from 'react';
import type { SystemPackage, SystemPackageHistoryEvent } from '../../types';
import { getInstalledPackages, getPackageHistory, getPackageInstalledAt } from '../../services/api';
import PackageSearchInput from './packages/PackageSearchInput';
import PackageSortHeader from './packages/PackageSortHeader';
import PackagesTable from './packages/PackagesTable';
import PackageDetailPanel from './packages/PackageDetailPanel';
import HistoryTimeline from './packages/HistoryTimeline';
import HistoryFilters from './packages/HistoryFilters';

type SortBy = 'name' | 'version' | 'arch';
type SortDir = 'asc' | 'desc';
type HistoryActionFilter = 'all' | 'install' | 'upgrade' | 'remove';

const PAGE_SIZES = [10, 20, 50, 100];

const SystemPackagesHistoryView: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'installed' | 'history'>('installed');

    const [packages, setPackages] = useState<SystemPackage[]>([]);
    const [packagesTotal, setPackagesTotal] = useState(0);
    const [packagesLoading, setPackagesLoading] = useState(true);
    const [packagesError, setPackagesError] = useState<string | null>(null);
    const [query, setQuery] = useState('');
    const [sortBy, setSortBy] = useState<SortBy>('name');
    const [sortDir, setSortDir] = useState<SortDir>('asc');
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(50);

    const [selectedPackage, setSelectedPackage] = useState<SystemPackage | null>(null);
    const [installedAt, setInstalledAt] = useState<string | null>(null);
    const [detailHistory, setDetailHistory] = useState<SystemPackageHistoryEvent[]>([]);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);

    const [historyItems, setHistoryItems] = useState<SystemPackageHistoryEvent[]>([]);
    const [historyLoading, setHistoryLoading] = useState(true);
    const [historyError, setHistoryError] = useState<string | null>(null);
    const [historyAction, setHistoryAction] = useState<HistoryActionFilter>('all');
    const [historySortDir, setHistorySortDir] = useState<SortDir>('desc');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const isSearching = Boolean(query.trim());
    const totalPages = Math.max(1, Math.ceil(packagesTotal / pageSize));

    useEffect(() => {
        const controller = new AbortController();

        const fetchPackages = async () => {
            try {
                setPackagesLoading(true);
                setPackagesError(null);
                const response = await getInstalledPackages({
                    page,
                    pageSize,
                    query,
                    sortBy,
                    sortDir,
                    signal: controller.signal,
                });
                setPackages(response.items ?? []);
                setPackagesTotal(response.total ?? 0);
            } catch (e) {
                if (
                    e instanceof DOMException && e.name === 'AbortError' ||
                    (typeof e === 'object' && e !== null && 'name' in e && (e as any).name === 'AbortError')
                ) {
                    return;
                }
                console.error('Error fetching packages', e);
                setPackagesError('Installed packages could not be loaded.');
            } finally {
                setPackagesLoading(false);
            }
        };

        fetchPackages();

        return () => controller.abort();
    }, [page, pageSize, query, sortBy, sortDir]);

    useEffect(() => {
        if (!selectedPackage) {
            return;
        }
        const controller = new AbortController();

        const fetchDetails = async () => {
            try {
                setDetailLoading(true);
                setDetailError(null);
                const [installed, history] = await Promise.all([
                    getPackageInstalledAt(selectedPackage.name, controller.signal),
                    getPackageHistory({ packageName: selectedPackage.name, sortDir: 'desc', signal: controller.signal }),
                ]);
                setInstalledAt(installed.installed_at ?? null);
                setDetailHistory(history.items ?? []);
            } catch (e) {
                if (
                    e instanceof DOMException && e.name === 'AbortError' ||
                    (typeof e === 'object' && e !== null && 'name' in e && (e as any).name === 'AbortError')
                ) {
                    return;
                }
                console.error('Error fetching package detail', e);
                setDetailError('Package details could not be loaded.');
            } finally {
                setDetailLoading(false);
            }
        };

        fetchDetails();

        return () => controller.abort();
    }, [selectedPackage]);

    useEffect(() => {
        if (activeTab !== 'history') {
            return;
        }
        const controller = new AbortController();

        const fetchHistory = async () => {
            try {
                setHistoryLoading(true);
                setHistoryError(null);
                const response = await getPackageHistory({
                    action: historyAction,
                    dateFrom: dateFrom || undefined,
                    dateTo: dateTo || undefined,
                    sortDir: historySortDir,
                    signal: controller.signal,
                });
                setHistoryItems(response.items ?? []);
            } catch (e) {
                if (
                    e instanceof DOMException && e.name === 'AbortError' ||
                    (typeof e === 'object' && e !== null && 'name' in e && (e as any).name === 'AbortError')
                ) {
                    return;
                }
                console.error('Error fetching global history', e);
                setHistoryError('Global history could not be loaded.');
            } finally {
                setHistoryLoading(false);
            }
        };

        fetchHistory();

        return () => controller.abort();
    }, [activeTab, historyAction, historySortDir, dateFrom, dateTo]);

    const pageLabel = useMemo(() => {
        if (!packagesTotal) return '0 resultados';
        const start = (page - 1) * pageSize + 1;
        const end = Math.min(page * pageSize, packagesTotal);
        return `${start}-${end} de ${packagesTotal}`;
    }, [page, pageSize, packagesTotal]);

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
        <div className="w-full px-4 sm:px-6 lg:px-8 pt-2 pb-6 sm:pt-3 sm:pb-8 lg:pt-4 lg:pb-10 text-sm space-y-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">System</p>
                    <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">Packages</h2>
                    <p className="text-[10px] text-zinc-500 mt-2 max-w-2xl"> 
                        Review installed packages and package with a focus on traceability.
                    </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setActiveTab('installed')}
                        className={`rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide ${activeTab === 'installed'
                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                            : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                            }`}
                    >
                        Installed Packages
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('history')}
                        className={`rounded-full border px-4 py-1.5 text-[11px] font-semibold uppercase tracking-wide ${activeTab === 'history'
                            ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                            : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                            }`}
                    >
                        Global History
                    </button>
                </div>
            </div>

            {activeTab === 'installed' && (
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
                    <div className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <PackageSearchInput value={query} onChange={handleQueryChange} />
                            <PackageSortHeader sortBy={sortBy} sortDir={sortDir} onToggle={toggleSort} />
                        </div>

                        {!isSearching && (
                            <div className="flex flex-wrap items-center gap-3 text-[10px] text-zinc-500">
                                <span>{pageLabel}</span>
                                <div className="relative">
                                    <select
                                        value={pageSize}
                                        onChange={(event) => {
                                            setPageSize(Number(event.target.value));
                                            setPage(1);
                                        }}
                                        className="appearance-none bg-zinc-900 border border-zinc-800 text-zinc-200 text-xs rounded-lg pl-3 pr-8 py-1.5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
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
                                <span className="text-[10px] text-zinc-500">Pagination enabled</span>
                            </div>
                        )}
                        {isSearching && (
                            <div className="text-[10px] text-zinc-500">
                                Search active: pagination disabled.
                            </div>
                        )}

                        <PackagesTable
                            packages={packages}
                            selectedPackageName={selectedPackage?.name}
                            loading={packagesLoading}
                            error={packagesError}
                            onSelect={setSelectedPackage}
                        />

                        {!isSearching && (
                            <div className="flex flex-wrap items-center justify-between gap-3 text-[10px] text-zinc-500">
                                <span>Page {page} of {totalPages}</span>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setPage(1)}
                                        disabled={page === 1}
                                        className="rounded-full border border-zinc-800 px-3 py-1.5 font-semibold uppercase tracking-wide text-zinc-300 disabled:text-zinc-600 disabled:border-zinc-900"
                                    >
                                        First
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPage(prev => Math.max(1, prev - 1))}
                                        disabled={page === 1}
                                        className="rounded-full border border-zinc-800 px-3 py-1.5 font-semibold uppercase tracking-wide text-zinc-300 disabled:text-zinc-600 disabled:border-zinc-900"
                                    >
                                        Previous
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={page >= totalPages}
                                        className="rounded-full border border-zinc-800 px-3 py-1.5 font-semibold uppercase tracking-wide text-zinc-300 disabled:text-zinc-600 disabled:border-zinc-900"
                                    >
                                        Next
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setPage(totalPages)}
                                        disabled={page >= totalPages}
                                        className="rounded-full border border-zinc-800 px-3 py-1.5 font-semibold uppercase tracking-wide text-zinc-300 disabled:text-zinc-600 disabled:border-zinc-900"
                                    >
                                        Last
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <PackageDetailPanel
                        selectedPackage={selectedPackage}
                        installedAt={installedAt}
                        history={detailHistory}
                        loading={detailLoading}
                        error={detailError}
                    />
                </div>
            )}

            {activeTab === 'history' && (
                <div className="space-y-4">
                    <HistoryFilters
                        action={historyAction}
                        sortDir={historySortDir}
                        dateFrom={dateFrom}
                        dateTo={dateTo}
                        onActionChange={setHistoryAction}
                        onSortDirChange={setHistorySortDir}
                        onDateFromChange={setDateFrom}
                        onDateToChange={setDateTo}
                    />

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 sm:p-5 shadow-lg">
                        {historyLoading ? (
                            <div className="flex items-center justify-center gap-3 text-sm text-zinc-300 py-10">
                                <div className="w-6 h-6 border-2 border-zinc-700 border-t-indigo-400 rounded-full animate-spin" />
                                <span>Loading history...</span>
                            </div>
                        ) : historyError ? (
                            <div className="text-sm text-amber-400">{historyError}</div>
                        ) : historyItems.length === 0 ? (
                            <div className="text-[10px] text-zinc-500">
                                No events for the selected filters.
                            </div>
                        ) : (
                            <HistoryTimeline events={historyItems} emptyMessage="No events for the selected filters." />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemPackagesHistoryView;
