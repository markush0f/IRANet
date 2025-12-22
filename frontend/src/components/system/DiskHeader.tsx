import React from 'react';

interface DiskHeaderProps {
    title: string;
    subtitle: string;
    error?: string | null;
}

const DiskHeader: React.FC<DiskHeaderProps> = ({ title, subtitle, error }) => {
    return (
        <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-zinc-800 bg-zinc-950">
            <div>
                <h1 className="text-2xl font-bold text-zinc-100">{title}</h1>
                <p className="text-sm text-zinc-500 mt-1">{subtitle}</p>
            </div>
            {error && (
                <div className="mt-4 rounded-md border border-red-600/60 bg-red-950/60 px-4 py-3 text-sm text-red-300">
                    {error}
                </div>
            )}
        </div>
    );
};

export default DiskHeader;
