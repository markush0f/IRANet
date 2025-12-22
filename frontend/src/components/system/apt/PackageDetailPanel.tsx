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
    <aside className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 sm:p-5 shadow-lg">
        <h3 className="text-sm font-semibold text-zinc-100">Package Detail</h3>
        {!selectedPackage ? (
            <p className="mt-3 text-sm text-zinc-500">
                Selecciona un paquete para ver el detalle.
            </p>
        ) : (
            <div className="mt-4 space-y-4">
                <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Nombre</p>
                    <p className="text-sm text-zinc-100 font-semibold">{selectedPackage.name}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Versión</p>
                    <p className="text-sm text-zinc-100 font-mono">{selectedPackage.version}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Arquitectura</p>
                    <p className="text-sm text-zinc-100">{selectedPackage.arch}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Instalado</p>
                    <p className="text-sm text-zinc-100 font-mono">
                        {loading ? 'Cargando…' : formatDateTime(installedAt)}
                    </p>
                </div>

                {error && (
                    <p className="text-xs text-amber-400">{error}</p>
                )}

                <div>
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Historial del paquete</p>
                    <div className="mt-3 max-h-[320px] overflow-y-auto pr-1">
                        {loading ? (
                            <div className="text-sm text-zinc-500">Cargando historial…</div>
                        ) : (
                            <HistoryTimeline
                                events={history}
                                packageFallback={selectedPackage.name}
                                emptyMessage="Sin eventos registrados."
                            />
                        )}
                    </div>
                </div>
            </div>
        )}
    </aside>
);

export default PackageDetailPanel;
