import React from 'react';
import type { UsersSummary } from '../../types';

type SummaryCardKey = 'total' | 'human' | 'system' | 'active';

const summaryCards = [
    { key: 'total', label: 'Usuarios', color: 'text-indigo-300' },
    { key: 'human', label: 'Humanos', color: 'text-emerald-300' },
    { key: 'system', label: 'Sistema', color: 'text-amber-300' },
    { key: 'active', label: 'Activos', color: 'text-rose-300' },
] as const;

interface UsersSummaryGridProps {
    summary: UsersSummary;
}

const UsersSummaryGrid: React.FC<UsersSummaryGridProps> = ({ summary }) => (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {summaryCards.map(card => (
            <div key={card.key} className="bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3">
                <p className={`text-xs uppercase tracking-wide ${card.color}`}>{card.label}</p>
                <p className="text-2xl font-semibold text-zinc-100">
                    {summary[card.key as SummaryCardKey] ?? 0}
                </p>
            </div>
        ))}
    </div>
);

export default UsersSummaryGrid;
