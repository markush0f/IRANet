import React, { useEffect, useMemo, useRef, useState } from 'react';
import { askChat, createChat, deleteChat, listChats, updateChatTitle } from '../../services/api';
import type { ChatRecord } from '../../services/api';

type ChatMessage = {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
};

const defaultGreeting: ChatMessage = {
    id: 'msg-welcome',
    role: 'assistant',
    content: 'Hello! I can help you explore system data and answer questions.',
    timestamp: new Date().toISOString(),
};

const formatTimestamp = (value: string) => {
    const parsed = new Date(value);
    return isNaN(parsed.getTime()) ? value : parsed.toLocaleTimeString();
};

const getChatLabel = (chat: ChatRecord) => chat.title?.trim() || chat.id;

const ChatbotView: React.FC = () => {
    const [chats, setChats] = useState<ChatRecord[]>([]);
    const [loadingChats, setLoadingChats] = useState(true);
    const [chatError, setChatError] = useState<string | null>(null);
    const [activeChatId, setActiveChatId] = useState<string | null>(null);
    const [messagesByChat, setMessagesByChat] = useState<Record<string, ChatMessage[]>>({});
    const [draftMessages, setDraftMessages] = useState<ChatMessage[]>([defaultGreeting]);
    const [input, setInput] = useState('');
    const [sending, setSending] = useState(false);
    const [editingChatId, setEditingChatId] = useState<string | null>(null);
    const [editingTitle, setEditingTitle] = useState('');
    const abortRef = useRef<AbortController | null>(null);

    useEffect(() => {
        const controller = new AbortController();
        const fetchChats = async () => {
            try {
                setLoadingChats(true);
                setChatError(null);
                const data = await listChats(controller.signal);
                setChats(data);
            } catch (err) {
                if (err instanceof DOMException && err.name === 'AbortError') {
                    return;
                }
                console.error('Error loading chats', err);
                setChatError('The chat list could not be loaded.');
            } finally {
                setLoadingChats(false);
            }
        };

        fetchChats();
        return () => controller.abort();
    }, []);

    const activeMessages = useMemo(() => {
        if (!activeChatId) return draftMessages;
        return messagesByChat[activeChatId] ?? [];
    }, [activeChatId, draftMessages, messagesByChat]);

    const activeChatLabel = useMemo(() => {
        if (!activeChatId) return 'New chat';
        const match = chats.find(chat => chat.id === activeChatId);
        return match ? getChatLabel(match) : 'Chat';
    }, [activeChatId, chats]);

    const appendMessageToChat = (chatId: string, message: ChatMessage) => {
        setMessagesByChat(prev => {
            const existing = prev[chatId] ?? [];
            return { ...prev, [chatId]: [...existing, message] };
        });
    };

    const handleNewChat = () => {
        setActiveChatId(null);
        setEditingChatId(null);
        setEditingTitle('');
        setDraftMessages([defaultGreeting]);
    };

    const handleSelectChat = (chatId: string) => {
        setActiveChatId(chatId);
        setEditingChatId(null);
        setEditingTitle('');
    };

    const handleStartEdit = (chat: ChatRecord) => {
        setEditingChatId(chat.id);
        setEditingTitle(chat.title ?? '');
    };

    const handleSaveEdit = async (chatId: string) => {
        try {
            const updated = await updateChatTitle(chatId, editingTitle.trim() || null);
            setChats(prev => prev.map(chat => (chat.id === chatId ? updated : chat)));
            setEditingChatId(null);
            setEditingTitle('');
        } catch (err) {
            console.error('Error updating chat title', err);
            setChatError('The chat title could not be updated.');
        }
    };

    const handleDeleteChat = async (chatId: string) => {
        try {
            await deleteChat(chatId);
            setChats(prev => prev.filter(chat => chat.id !== chatId));
            setMessagesByChat(prev => {
                const next = { ...prev };
                delete next[chatId];
                return next;
            });
            if (activeChatId === chatId) {
                handleNewChat();
            }
        } catch (err) {
            console.error('Error deleting chat', err);
            setChatError('The chat could not be deleted.');
        }
    };

    const handleSend = async () => {
        const trimmed = input.trim();
        if (!trimmed || sending) return;

        const userMessage: ChatMessage = {
            id: `msg-${Date.now()}-user`,
            role: 'user',
            content: trimmed,
            timestamp: new Date().toISOString(),
        };

        setInput('');
        setSending(true);

        let targetChatId = activeChatId;
        let draftSnapshot: ChatMessage[] | null = null;

        if (!targetChatId) {
            draftSnapshot = [...draftMessages, userMessage];
            setDraftMessages(draftSnapshot);
        } else {
            appendMessageToChat(targetChatId, userMessage);
        }

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;

        try {
            if (!targetChatId) {
                const chat = await createChat({ title: trimmed }, controller.signal);
                targetChatId = chat.id;
                setChats(prev => [chat, ...prev]);
                setActiveChatId(chat.id);
                setMessagesByChat(prev => ({
                    ...prev,
                    [chat.id]: draftSnapshot ?? [defaultGreeting, userMessage],
                }));
                setDraftMessages([defaultGreeting]);
            }

            if (!targetChatId) {
                throw new Error('chat_not_created');
            }

            const answer = await askChat(targetChatId, trimmed, controller.signal);
            const assistantMessage: ChatMessage = {
                id: `msg-${Date.now()}-assistant`,
                role: 'assistant',
                content: answer,
                timestamp: new Date().toISOString(),
            };
            appendMessageToChat(targetChatId, assistantMessage);
        } catch (err) {
            if (err instanceof DOMException && err.name === 'AbortError') {
                return;
            }
            console.error('Error asking chatbot', err);
            const assistantMessage: ChatMessage = {
                id: `msg-${Date.now()}-assistant`,
                role: 'assistant',
                content: 'No pude obtener respuesta del chatbot.',
                timestamp: new Date().toISOString(),
            };
            if (targetChatId) {
                appendMessageToChat(targetChatId, assistantMessage);
            } else {
                setDraftMessages(prev => [...prev, assistantMessage]);
            }
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
            <div className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">Chatbot</h2>
                <p className="text-sm text-zinc-400 mt-2 max-w-2xl">
                    AI assistant for IRANet operations. Extension id: ai_chat.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                <aside className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 shadow-lg flex flex-col">
                    <div className="flex items-center justify-between gap-2">
                        <p className="text-xs uppercase tracking-wide text-zinc-500">Chats</p>
                        <button
                            type="button"
                            onClick={handleNewChat}
                            className="rounded-full border border-zinc-700 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
                        >
                            New
                        </button>
                    </div>

                    {chatError && (
                        <p className="mt-3 text-xs text-amber-400">{chatError}</p>
                    )}

                    <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
                        {loadingChats && (
                            <div className="flex items-center gap-2 text-xs text-zinc-400">
                                <div className="h-3 w-3 border-2 border-zinc-700 border-t-indigo-400 rounded-full animate-spin" />
                                Loading chats...
                            </div>
                        )}
                        {!loadingChats && chats.length === 0 && (
                            <p className="text-xs text-zinc-500">No chats yet.</p>
                        )}
                        {!loadingChats && chats.map(chat => {
                            const isActive = chat.id === activeChatId;
                            return (
                                <div
                                    key={chat.id}
                                    className={`rounded-xl border px-3 py-2 flex items-center gap-2 ${isActive
                                        ? 'border-indigo-500/40 bg-indigo-500/10'
                                        : 'border-zinc-800 bg-zinc-950/40'
                                        }`}
                                >
                                    <button
                                        type="button"
                                        onClick={() => handleSelectChat(chat.id)}
                                        className="flex-1 text-left text-sm text-zinc-200"
                                    >
                                        {editingChatId === chat.id ? (
                                            <input
                                                value={editingTitle}
                                                onChange={(event) => setEditingTitle(event.target.value)}
                                                placeholder="Chat title"
                                                className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                            />
                                        ) : (
                                            <span className="truncate block">{getChatLabel(chat)}</span>
                                        )}
                                    </button>
                                    {editingChatId === chat.id ? (
                                        <div className="flex items-center gap-1 text-[10px]">
                                            <button
                                                type="button"
                                                onClick={() => handleSaveEdit(chat.id)}
                                                className="rounded-full border border-emerald-500/50 px-2 py-1 font-semibold uppercase tracking-wide text-emerald-300"
                                            >
                                                Save
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingChatId(null);
                                                    setEditingTitle('');
                                                }}
                                                className="rounded-full border border-zinc-700 px-2 py-1 font-semibold uppercase tracking-wide text-zinc-400"
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1 text-[10px]">
                                            <button
                                                type="button"
                                                onClick={() => handleStartEdit(chat)}
                                                className="rounded-full border border-zinc-700 px-2 py-1 font-semibold uppercase tracking-wide text-zinc-400"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleDeleteChat(chat.id)}
                                                className="rounded-full border border-rose-500/50 px-2 py-1 font-semibold uppercase tracking-wide text-rose-300"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </aside>

                <section className="rounded-2xl border border-zinc-800 bg-zinc-950/50 p-5 shadow-lg flex flex-col min-h-[520px]">
                    <div className="flex items-center justify-between gap-3 border-b border-zinc-800 pb-4">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-zinc-500">Active chat</p>
                            <h3 className="text-lg font-semibold text-zinc-100">{activeChatLabel}</h3>
                        </div>
                        <span className="text-[11px] text-zinc-500">
                            {activeChatId ? 'Saved' : 'Draft'}
                        </span>
                    </div>

                    <div className="flex-1 space-y-4 overflow-y-auto pr-2 pt-4">
                        {activeMessages.length === 0 && (
                            <p className="text-sm text-zinc-500">Start the conversation by asking a question.</p>
                        )}
                        {activeMessages.map(message => (
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

                    <div className="mt-4 border-t border-zinc-800 pt-4">
                        <div className="flex flex-col sm:flex-row gap-3">
                            <input
                                value={input}
                                onChange={(event) => setInput(event.target.value)}
                                placeholder="Ask about users, services, disks, or alerts..."
                                onKeyDown={(event) => {
                                    if (event.key === 'Enter') {
                                        event.preventDefault();
                                        void handleSend();
                                    }
                                }}
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
                            The first message creates the chat if it does not exist.
                        </p>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ChatbotView;
