import React from 'react';
import { Pie, PieChart, ResponsiveContainer, Cell } from 'recharts';
import type { DiskTotalResponse } from '../../types';

interface DiskSummaryProps {
    summary: {
        total: number;
        ok: number;
        warning: number;
        critical: number;
    };
    totalInfo: DiskTotalResponse | null;
    totalLoading: boolean;
    totalError: string | null;
    formatBytes: (bytes: number) => string;
}

const DiskSummary: React.FC<DiskSummaryProps> = ({
    summary,
    totalInfo,
    totalLoading,
    totalError,
    formatBytes,
}) => {
    return (
        <div className="mb-6 rounded-lg border border-zinc-800 bg-zinc-900 p-4 sm:p-6">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
                <div>
                    <div className="text-xs uppercase tracking-wider text-zinc-500">Uso total</div>
                    <div className="mt-3 h-40">
                        {totalLoading ? (
                            <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                                Cargando grafica…
                            </div>
                        ) : totalInfo ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            {
                                                name: 'Usado',
                                                value: Math.max(totalInfo.total_bytes - totalInfo.free_bytes, 0),
                                            },
                                            { name: 'Libre', value: Math.max(totalInfo.free_bytes, 0) },
                                        ]}
                                        dataKey="value"
                                        innerRadius={48}
                                        outerRadius={70}
                                        paddingAngle={2}
                                        stroke="none"
                                    >
                                        <Cell fill="#f97316" />
                                        <Cell fill="#22c55e" />
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                                Sin datos.
                            </div>
                        )}
                    </div>
                    {totalInfo && (
                        <div className="mt-4 space-y-2 text-xs text-zinc-400">
                            <div className="flex items-center justify-between">
                                <span>Usado</span>
                                <span className="text-zinc-200">{totalInfo.used_percent.toFixed(2)}%</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Total</span>
                                <span className="text-zinc-200">{formatBytes(totalInfo.total_bytes)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Libre</span>
                                <span className="text-zinc-200">{formatBytes(totalInfo.free_bytes)}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Particiones</span>
                                <span className="text-zinc-200">{totalInfo.partitions_count}</span>
                            </div>
                        </div>
                    )}
                    {totalError && (
                        <div className="mt-3 rounded-md border border-red-600/60 bg-red-950/60 px-3 py-2 text-xs text-red-300">
                            {totalError}
                        </div>
                    )}
                </div>

                <div className="lg:border-l lg:border-zinc-800 lg:pl-6">
                    <div className="text-xs uppercase tracking-wider text-zinc-500">Resumen</div>
                    <div className="mt-2 text-lg font-semibold text-zinc-100">Particiones detectadas</div>
                    <p className="mt-1 text-sm text-zinc-500">Vista agregada del almacenamiento del sistema.</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                        <div className="bg-zinc-950 border border-zinc-800 rounded-md px-4 py-2 text-center">
                            <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Total</div>
                            <div className="text-xl font-bold text-zinc-100">{summary.total}</div>
                        </div>
                        <div className="bg-emerald-950 border border-emerald-900 rounded-md px-4 py-2 text-center">
                            <div className="text-[10px] text-emerald-400 uppercase tracking-wider">OK</div>
                            <div className="text-xl font-bold text-emerald-300">{summary.ok}</div>
                        </div>
                        <div className="bg-amber-950 border border-amber-900 rounded-md px-4 py-2 text-center">
                            <div className="text-[10px] text-amber-400 uppercase tracking-wider">Warn</div>
                            <div className="text-xl font-bold text-amber-300">{summary.warning}</div>
                        </div>
                        <div className="bg-red-950 border border-red-900 rounded-md px-4 py-2 text-center">
                            <div className="text-[10px] text-red-400 uppercase tracking-wider">Crit</div>
                            <div className="text-xl font-bold text-red-300">{summary.critical}</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DiskSummary;
