import React from 'react';

interface InfoRowProps {
    label: string;
    value: React.ReactNode;
    muted?: boolean;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, muted }) => {
    return (
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-4">
            <dt className={`text-xs ${muted ? 'text-zinc-500' : 'text-zinc-400'} uppercase tracking-wide`}>
                {label}
            </dt>
            <dd className="text-sm font-mono text-zinc-100 text-right break-all">{value}</dd>
        </div>
    );
};

export default InfoRow;
