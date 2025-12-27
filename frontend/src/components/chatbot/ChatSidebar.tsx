import React from 'react';
import type { ChatRecord } from '../../services/api';

interface ChatSidebarProps {
    chats: ChatRecord[];
    activeChatId: string | null;
    loading: boolean;
    error: string | null;
    editingChatId: string | null;
    editingTitle: string;
    onNewChat: () => void;
    onSelectChat: (chatId: string) => void;
    onStartEdit: (chat: ChatRecord) => void;
    onEditingTitleChange: (value: string) => void;
    onSaveEdit: (chatId: string) => void;
    onCancelEdit: () => void;
    onDeleteChat: (chatId: string) => void;
}

const getChatLabel = (chat: ChatRecord) => chat.title?.trim() || chat.id;

const ChatSidebar: React.FC<ChatSidebarProps> = ({
    chats,
    activeChatId,
    loading,
    error,
    editingChatId,
    editingTitle,
    onNewChat,
    onSelectChat,
    onStartEdit,
    onEditingTitleChange,
    onSaveEdit,
    onCancelEdit,
    onDeleteChat,
}) => {
    return (
        <aside className="rounded-2xl border border-zinc-800 bg-zinc-950/60 p-4 shadow-lg flex flex-col">
            <div className="flex items-center justify-between gap-2">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Chats</p>
                <button
                    type="button"
                    onClick={onNewChat}
                    className="rounded-full border border-zinc-700 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
                >
                    New
                </button>
            </div>

            {error && (
                <p className="mt-3 text-xs text-amber-400">{error}</p>
            )}

            <div className="mt-4 flex-1 space-y-2 overflow-y-auto">
                {loading && (
                    <div className="flex items-center gap-2 text-xs text-zinc-400">
                        <div className="h-3 w-3 border-2 border-zinc-700 border-t-indigo-400 rounded-full animate-spin" />
                        Loading chats...
                    </div>
                )}
                {!loading && chats.length === 0 && (
                    <p className="text-xs text-zinc-500">No chats yet.</p>
                )}
                {!loading && chats.map(chat => {
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
                                onClick={() => onSelectChat(chat.id)}
                                className="flex-1 text-left text-sm text-zinc-200"
                            >
                                {editingChatId === chat.id ? (
                                    <input
                                        value={editingTitle}
                                        onChange={(event) => onEditingTitleChange(event.target.value)}
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
                                        onClick={() => onSaveEdit(chat.id)}
                                        className="rounded-full border border-emerald-500/50 px-2 py-1 font-semibold uppercase tracking-wide text-emerald-300"
                                    >
                                        Save
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onCancelEdit}
                                        className="rounded-full border border-zinc-700 px-2 py-1 font-semibold uppercase tracking-wide text-zinc-400"
                                    >
                                        Cancel
                                    </button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-1 text-[10px]">
                                    <button
                                        type="button"
                                        onClick={() => onStartEdit(chat)}
                                        className="rounded-full border border-zinc-700 px-2 py-1 font-semibold uppercase tracking-wide text-zinc-400"
                                    >
                                        Edit
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => onDeleteChat(chat.id)}
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
    );
};

export default ChatSidebar;
