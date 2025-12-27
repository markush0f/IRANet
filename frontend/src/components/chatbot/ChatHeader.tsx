import React from 'react';

interface ChatHeaderProps {
    title: string;
    status: 'saved' | 'draft';
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ title, status }) => {
    return (
        <div className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
                <p className="text-xs uppercase tracking-wide text-zinc-500">Active chat</p>
                <h3 className="text-lg font-semibold text-zinc-100">{title}</h3>
            </div>
            <span className="text-[11px] text-zinc-500">
                {status === 'saved' ? 'Saved' : 'Draft'}
            </span>
        </div>
    );
};

export default ChatHeader;
