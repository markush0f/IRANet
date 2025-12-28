import React from 'react';
import type { SystemPackage, SystemPackageHistoryEvent } from '../../../types';
import HistoryTimeline from './HistoryTimeline';

interface PackageDetailPanelProps {
    selectedPackage: SystemPackage | null;
    installedAt?: string | null;
    history: SystemPackageHistoryEvent[];
    loading: boolean;
    error?: string | null;
}

const formatDateTime = (value?: string | null) => {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
};

const PackageDetailPanel: React.FC<PackageDetailPanelProps> = ({
    selectedPackage,
    installedAt,
    history,
    loading,
    error,
}) => (
    <aside className="panel-soft accent-border rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col min-h-0">
        <h3 className="text-base font-semibold text-zinc-100">Package Detail</h3>
        {!selectedPackage ? (
            <p className="mt-3 text-sm text-zinc-400 leading-relaxed">
                Selecciona un paquete para ver el detalle.
            </p>
        ) : (
            <div className="mt-4 flex-1 min-h-0 overflow-hidden">
                <div className="space-y-4 h-full overflow-y-auto pr-1 scrollbar-strong">
                    <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-zinc-400">Name</p>
                        <p className="text-base text-zinc-100 font-semibold">{selectedPackage.name}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-zinc-400">Version</p>
                        <p className="text-base text-zinc-100 font-mono">{selectedPackage.version}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-zinc-400">Architecture</p>
                        <p className="text-base text-zinc-100">{selectedPackage.arch}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs uppercase tracking-wide text-zinc-400">Installed</p>
                        <p className="text-base text-zinc-100 font-mono">
                            {loading ? 'Loading…' : formatDateTime(installedAt)}
                        </p>
                    </div>

                    {error && (
                        <p className="text-xs text-amber-400">{error}</p>
                    )}

                    <div>
                        <p className="text-xs uppercase tracking-wide text-zinc-400">History</p>
                        <div className="mt-3">
                            {loading ? (
                                <div className="text-sm text-zinc-400">Loading history…</div>
                            ) : (
                                <HistoryTimeline
                                    events={history}
                                    packageFallback={selectedPackage.name}
                                    emptyMessage="No events recorded."
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>
        )}
    </aside>
);

export default PackageDetailPanel;
