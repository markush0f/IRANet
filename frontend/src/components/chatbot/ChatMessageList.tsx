import React from 'react';

type ChatMessage = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
};

interface ChatMessageListProps {
    messages: ChatMessage[];
    sending: boolean;
    emptyHint?: string;
}

const formatTimestamp = (value: string) => {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? value : parsed.toLocaleTimeString();
};

const ChatMessageList: React.FC<ChatMessageListProps> = ({
    messages,
    sending,
    emptyHint = 'Start the conversation by asking a question.',
}) => {
    return (
        <div className="flex-1 space-y-4 overflow-y-auto pr-2 pt-4">
            {messages.length === 0 && (
                <p className="text-sm text-zinc-500">{emptyHint}</p>
            )}
            {messages.map(message => (
                <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                    <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed border ${message.role === 'user'
                            ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-100'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-200'
                            }`}
                    >
                        <p className="whitespace-pre-wrap">{message.content}</p>
                        <p className="mt-2 text-[10px] uppercase tracking-wide text-zinc-500">
                            {message.role} - {formatTimestamp(message.timestamp)}
                        </p>
                    </div>
                </div>
            ))}
            {sending && (
                <div className="flex justify-start">
                    <div className="rounded-2xl px-4 py-3 text-sm border border-zinc-800 bg-zinc-900 text-zinc-400">
                        Thinking...
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatMessageList;
