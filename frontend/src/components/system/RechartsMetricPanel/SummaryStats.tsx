import React from 'react';

interface SummaryStatsProps {
    manualSummary: { min: number; max: number; avg: number };
    valueFormatter: (value: number) => string;
    sampleCount: number;
}

const SummaryStats: React.FC<SummaryStatsProps> = ({ manualSummary, valueFormatter, sampleCount }) => (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-zinc-950 border border-zinc-800 px-4 sm:px-5 py-3">
        <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wide text-zinc-500">Maximum</span>
            <span className="text-sm font-semibold text-zinc-200">{valueFormatter(manualSummary.max)}</span>
        </div>
        <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wide text-zinc-500">Minimum</span>
            <span className="text-sm font-semibold text-zinc-200">{valueFormatter(manualSummary.min)}</span>
        </div>
        <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wide text-zinc-500">Average</span>
            <span className="text-sm font-semibold text-zinc-200">{valueFormatter(manualSummary.avg)}</span>
        </div>
        <div className="flex flex-col">
            <span className="text-[10px] uppercase tracking-wide text-zinc-500">Total samples</span>
            <span className="text-sm font-semibold text-zinc-200">{sampleCount}</span>
        </div>
    </div>
);

export default SummaryStats;
