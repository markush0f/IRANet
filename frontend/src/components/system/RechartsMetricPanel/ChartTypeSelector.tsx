import React from 'react';

export type ChartType = 'line' | 'area' | 'bar' | 'composed';

interface ChartTypeOption {
    value: ChartType;
    label: string;
    Icon: React.ComponentType<{ className?: string }>;
}

interface ChartTypeSelectorProps {
    selected: ChartType;
    options: ChartTypeOption[];
    onSelect: (type: ChartType) => void;
}

const ChartTypeSelector: React.FC<ChartTypeSelectorProps> = ({ selected, options, onSelect }) => (
    <div className="flex flex-wrap gap-2">
        {options.map(option => (
            <button
                key={option.value}
                type="button"
                onClick={() => onSelect(option.value)}
                className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-wide transition ${
                    selected === option.value
                        ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300'
                        : 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                }`}
            >
                <option.Icon className="w-3 h-3" />
                {option.label}
            </button>
        ))}
    </div>
);

export default ChartTypeSelector;
