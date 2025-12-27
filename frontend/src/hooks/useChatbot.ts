import { useEffect, useMemo, useRef, useState } from 'react';
import { askChat, createChat, deleteChat, getChat, listChats, updateChatTitle } from '../services/api';
import type { ChatMessageRecord, ChatRecord } from '../services/api';

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

export const useChatbot = () => {
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
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [chatSearch, setChatSearch] = useState('');
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
        return match ? match.title?.trim() || match.id : 'Chat';
    }, [activeChatId, chats]);

    const filteredChats = useMemo(() => {
        const query = chatSearch.trim().toLowerCase();
        if (!query) return chats;
        return chats.filter(chat => {
            const title = chat.title?.toLowerCase() ?? '';
            return title.includes(query) || chat.id.toLowerCase().includes(query);
        });
    }, [chats, chatSearch]);

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

        if (!messagesByChat[chatId]) {
            const controller = new AbortController();
            setLoadingMessages(true);
            getChat(chatId, 1, controller.signal)
                .then(chat => {
                    const incoming = (chat.messages ?? []).map((msg: ChatMessageRecord) => ({
                        id: String(msg.id),
                        role: msg.role === 'assistant' ? 'assistant' : 'user',
                        content: msg.content,
                        timestamp: msg.created_at ?? new Date().toISOString(),
                    }));
                    setMessagesByChat(prev => ({
                        ...prev,
                        [chatId]: incoming,
                    }));
                })
                .catch(err => {
                    if (err instanceof DOMException && err.name === 'AbortError') {
                        return;
                    }
                    console.error('Error loading chat messages', err);
                    setChatError('The chat history could not be loaded.');
                })
                .finally(() => {
                    setLoadingMessages(false);
                });
        }
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

    const handleCancelEdit = () => {
        setEditingChatId(null);
        setEditingTitle('');
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

    return {
        chats: filteredChats,
        loadingChats,
        chatError,
        activeChatId,
        activeChatLabel,
        activeMessages,
        input,
        sending,
        loadingMessages,
        editingChatId,
        editingTitle,
        chatSearch,
        setInput,
        setEditingTitle,
        setChatSearch,
        handleNewChat,
        handleSelectChat,
        handleStartEdit,
        handleSaveEdit,
        handleCancelEdit,
        handleDeleteChat,
        handleSend,
    };
};
