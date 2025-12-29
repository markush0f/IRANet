import React from 'react';

interface DiskHeaderProps {
    title: string;
    subtitle: string;
    error?: string | null;
}

const DiskHeader: React.FC<DiskHeaderProps> = ({ title, subtitle, error }) => {
    return (
        <div className="px-4 sm:px-6 py-2 border-b border-zinc-800 bg-zinc-950">
            <div>
                <h1 className="text-lg font-semibold text-zinc-100">
                    {title}
                </h1>
                <p className="text-xs text-zinc-500 mt-0.5">
                    {subtitle}
                </p>
            </div>

            {error && (
                <div className="mt-3 rounded-md border border-red-600/60 bg-red-950/60 px-3 py-2 text-xs text-red-300">
                    {error}
                </div>
            )}
        </div>
    );
};


export default DiskHeader;
