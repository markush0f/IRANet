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
    if (messages.length === 0 && !sending) {
        return (
            <div className="flex h-full items-center justify-center px-6 text-center">
                <p className="max-w-md text-sm text-zinc-500">
                    {emptyHint}
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {messages.map(message => {
                const isUser = message.role === 'user';

                return (
                    <div
                        key={message.id}
                        className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[72%] rounded-2xl border px-4 py-3 text-sm leading-relaxed ${isUser
                                    ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-100'
                                    : 'bg-zinc-900 border-zinc-800 text-zinc-200'
                                }`}
                        >
                            <p className="whitespace-pre-wrap">
                                {message.content}
                            </p>

                            <div className="mt-3 flex items-center justify-between text-[10px] text-zinc-500">
                                <span>
                                    {formatTimestamp(message.timestamp)}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => navigator.clipboard.writeText(message.content)}
                                    className="rounded-md border border-zinc-700 px-2 py-1 uppercase tracking-wide text-zinc-400 hover:text-zinc-200"
                                >
                                    Copy
                                </button>
                            </div>
                        </div>
                    </div>
                );
            })}

            {sending && (
                <div className="flex justify-start">
                    <div className="max-w-[60%] rounded-2xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm text-zinc-400 italic">
                        Thinking…
                    </div>
                </div>
            )}
        </div>
    );
};

export default ChatMessageList;
