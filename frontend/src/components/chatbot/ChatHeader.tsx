import React from 'react';

interface ChatHeaderProps {
    title: string;
    status: 'saved' | 'draft';
}

const ChatHeader: React.FC<ChatHeaderProps> = ({ title, status }) => {
    return (
        <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">

                <h3 className="mt-0.5 truncate text-lg font-semibold text-zinc-100">
                    {title || 'New chat'}
                </h3>
            </div>

        </div>
    );
};

export default ChatHeader;
