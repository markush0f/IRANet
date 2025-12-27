import React, { useMemo, useState } from 'react';

type ChatMessage = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
};

const formatTimestamp = (value: string) => {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? value : parsed.toLocaleTimeString();
};

const ChatbotView: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        {
            id: 'msg-1',
            role: 'assistant',
            content: 'Hello! I can help you explore system data and answer questions.',
            timestamp: new Date().toISOString(),
        },
    ]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);

    const sortedMessages = useMemo(() => messages.slice(), [messages]);

    const handleSend = () => {
        const trimmed = input.trim();
        if (!trimmed) return;

        const userMessage: ChatMessage = {
            id: `msg-${Date.now()}-user`,
            role: 'user',
            content: trimmed,
            timestamp: new Date().toISOString(),
        };

        setMessages(prev => [...prev, userMessage]);
        setInput('');
        setSending(true);

        const assistantMessage: ChatMessage = {
            id: `msg-${Date.now()}-assistant`,
            role: 'assistant',
            content: 'Chatbot is running in local demo mode. Connect the API to enable responses.',
            timestamp: new Date().toISOString(),
        };

        setTimeout(() => {
            setMessages(prev => [...prev, assistantMessage]);
            setSending(false);
        }, 500);
    };

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">Chatbot</h2>
                    <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
                        AI assistant for IRANet operations. Extension id: ai_chat.
                    </p>
                </div>
                <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
                    <p className="text-[11px] uppercase tracking-wide text-zinc-500">Status</p>
                    <p className="text-sm font-semibold text-emerald-300">Enabled</p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-5 shadow-lg flex flex-col min-h-[480px]">
                    <div className="flex-1 space-y-4 overflow-y-auto pr-2">
                        {sortedMessages.map(message => (
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
                                    <p>{message.content}</p>
                                    <p className="mt-2 text-[10px] uppercase tracking-wide text-zinc-500">
                                        {message.role} - {formatTimestamp(message.timestamp)}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-4 border-t border-zinc-800 pt-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                value={input}
                                onChange={(event) => setInput(event.target.value)}
                                placeholder="Ask about services, disks, or alerts..."
                                className="flex-1 rounded-xl border border-zinc-800 bg-zinc-900/80 px-4 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                            />
                            <button
                                type="button"
                                onClick={handleSend}
                                disabled={sending}
                                className="rounded-xl bg-indigo-500 px-5 py-2 text-xs font-semibold uppercase tracking-wide text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-indigo-800"
                            >
                                {sending ? 'Sending...' : 'Send'}
                            </button>
                        </div>
                        <p className="mt-2 text-[11px] text-zinc-500">
                            Demo mode: responses are mocked until the API is connected.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 shadow-lg">
                        <p className="text-xs uppercase tracking-wide text-zinc-500">Suggested prompts</p>
                        <div className="mt-3 flex flex-wrap gap-2 text-xs">
                            {[
                                'Show latest alerts',
                                'List top CPU processes',
                                'Summarize disk usage',
                                'Check service status',
                            ].map(prompt => (
                                <span
                                    key={prompt}
                                    className="rounded-full border border-zinc-800 px-3 py-1 text-zinc-400"
                                >
                                    {prompt}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-5 shadow-lg">
                        <p className="text-xs uppercase tracking-wide text-zinc-500">Capabilities</p>
                        <ul className="mt-3 space-y-2 text-sm text-zinc-400">
                            <li>Assist with diagnostics and operational checklists.</li>
                            <li>Explain alerts and highlight next actions.</li>
                            <li>Guide workflows for maintenance tasks.</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ChatbotView;
