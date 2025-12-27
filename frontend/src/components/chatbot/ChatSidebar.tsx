import React from 'react';
import type { ChatRecord } from '../../services/api';

interface ChatSidebarProps {
    chats: ChatRecord[];
    activeChatId: string | null;
    loading: boolean;
    error: string | null;
    editingChatId: string | null;
    editingTitle: string;
    searchValue: string;
    onSearchChange: (value: string) => void;
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
    searchValue,
    onSearchChange,
    onNewChat,
    onSelectChat,
    onStartEdit,
    onEditingTitleChange,
    onSaveEdit,
    onCancelEdit,
    onDeleteChat,
}) => {
    return (
        <aside className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950/60 shadow-lg">
            <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
                <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    Chats
                </span>
                <button
                    type="button"
                    onClick={onNewChat}
                    className="rounded-full border border-zinc-700 px-3 py-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-300 transition hover:border-zinc-500 hover:text-zinc-100"
                >
                    New
                </button>
            </header>

            {error && (
                <div className="px-4 pt-3 text-xs text-amber-400">
                    {error}
                </div>
            )}

            <div className="px-4 pt-3">
                <input
                    value={searchValue}
                    onChange={(event) => onSearchChange(event.target.value)}
                    placeholder="Search chats..."
                    className="w-full rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
            </div>

            <div className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
                {loading && (
                    <div className="flex items-center gap-2 px-3 py-2 text-xs text-zinc-400">
                        <div className="h-3 w-3 rounded-full border-2 border-zinc-700 border-t-indigo-400 animate-spin" />
                        Loading chats...
                    </div>
                )}

                {!loading && chats.length === 0 && (
                    <p className="px-3 py-2 text-xs text-zinc-500">
                        No chats yet.
                    </p>
                )}

                {!loading && chats.map(chat => {
                    const isActive = chat.id === activeChatId;
                    const isEditing = editingChatId === chat.id;

                    return (
                        <div
                            key={chat.id}
                            className={`group rounded-xl border px-3 py-2 transition ${isActive
                                ? 'border-indigo-500/40 bg-indigo-500/10'
                                : 'border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900/40'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <button
                                    type="button"
                                    onClick={() => onSelectChat(chat.id)}
                                    className="flex-1 min-w-0 text-left"
                                >
                                    {isEditing ? (
                                        <input
                                            value={editingTitle}
                                            onChange={(event) =>
                                                onEditingTitleChange(event.target.value)
                                            }
                                            placeholder="Chat title"
                                            className="w-full rounded-md border border-zinc-800 bg-zinc-900 px-2 py-1 text-xs text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                    ) : (
                                        <span className="block truncate text-sm text-zinc-200">
                                            {getChatLabel(chat)}
                                        </span>
                                    )}
                                </button>

                                {!isEditing && (
                                    <div className="hidden group-hover:flex items-center gap-1 text-[10px]">
                                        <button
                                            type="button"
                                            onClick={() => onStartEdit(chat)}
                                            className="rounded-full border border-zinc-700 px-2 py-1 font-semibold uppercase tracking-wide text-zinc-400 hover:text-zinc-200"
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

                            {isEditing && (
                                <div className="mt-2 flex justify-end gap-1 text-[10px]">
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
                            )}
                        </div>
                    );
                })}
            </div>
        </aside>
    );
};

export default ChatSidebar;
