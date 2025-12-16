import React from 'react';

interface InfoCardProps {
    title: string;
    description?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

const InfoCard: React.FC<InfoCardProps> = ({ title, description, children, className }) => {
    return (
        <div className={`bg-zinc-900 rounded-xl border border-zinc-800 p-6 shadow-xl ${className ?? ''}`}>
            <h3 className="text-sm font-bold text-zinc-200 mb-3 uppercase tracking-wide">{title}</h3>
            {description && <p className="text-xs text-zinc-500 mb-4">{description}</p>}
            <dl className="space-y-3 text-sm">
                {children}
            </dl>
        </div>
    );
};

export default InfoCard;
