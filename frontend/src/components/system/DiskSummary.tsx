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
        <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[240px_1fr]">
                <div>
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                        Uso total
                    </div>

                    <div className="mt-2 h-32">
                        {totalLoading ? (
                            <div className="flex h-full items-center justify-center text-xs text-zinc-500">
                                Loading chart…
                            </div>
                        ) : totalInfo ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={[
                                            {
                                                name: 'Used',
                                                value: Math.max(totalInfo.total_bytes - totalInfo.free_bytes, 0),
                                            },
                                            {
                                                name: 'Free',
                                                value: Math.max(totalInfo.free_bytes, 0),
                                            },
                                        ]}
                                        dataKey="value"
                                        innerRadius={42}
                                        outerRadius={62}
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
                                No data.
                            </div>
                        )}
                    </div>

                    {totalInfo && (
                        <div className="mt-2 space-y-1 text-xs text-zinc-400">
                            <div className="flex justify-between">
                                <span>Used</span>
                                <span className="text-zinc-200">{totalInfo.used_percent.toFixed(2)}%</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Total</span>
                                <span className="text-zinc-200">{formatBytes(totalInfo.total_bytes)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Free</span>
                                <span className="text-zinc-200">{formatBytes(totalInfo.free_bytes)}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="lg:border-l lg:border-zinc-800 lg:pl-4">
                    <div className="text-[10px] uppercase tracking-wider text-zinc-500">
                        Partitions
                    </div>

                    <div className="mt-2 flex flex-wrap gap-2">
                        <div className="bg-zinc-950 border border-zinc-800 rounded-md px-3 py-1.5 text-center">
                            <div className="text-[9px] text-zinc-500 uppercase">Total</div>
                            <div className="text-lg font-semibold text-zinc-100">
                                {summary.total}
                            </div>
                        </div>

                        <div className="bg-emerald-950 border border-emerald-900 rounded-md px-3 py-1.5 text-center">
                            <div className="text-[9px] text-emerald-400 uppercase">OK</div>
                            <div className="text-lg font-semibold text-emerald-300">
                                {summary.ok}
                            </div>
                        </div>

                        <div className="bg-amber-950 border border-amber-900 rounded-md px-3 py-1.5 text-center">
                            <div className="text-[9px] text-amber-400 uppercase">Warn</div>
                            <div className="text-lg font-semibold text-amber-300">
                                {summary.warning}
                            </div>
                        </div>

                        <div className="bg-red-950 border border-red-900 rounded-md px-3 py-1.5 text-center">
                            <div className="text-[9px] text-red-400 uppercase">Crit</div>
                            <div className="text-lg font-semibold text-red-300">
                                {summary.critical}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

    );
};

export default DiskSummary;
