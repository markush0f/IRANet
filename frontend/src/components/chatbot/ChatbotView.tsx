import React from 'react';
import { useChatbot } from '../../hooks/useChatbot';
import ChatSidebar from './ChatSidebar';
import ChatHeader from './ChatHeader';
import ChatMessageList from './ChatMessageList';
import ChatComposer from './ChatComposer';

const ChatbotView: React.FC = () => {
    const {
        chats,
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
        setInput,
        setEditingTitle,
        handleNewChat,
        handleSelectChat,
        handleStartEdit,
        handleSaveEdit,
        handleCancelEdit,
        handleDeleteChat,
        handleSend,
    } = useChatbot();

    return (
        <div className="w-full px-4 sm:px-6 lg:px-8 py-8">
            <header className="mb-6">
                <h2 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
                    Chatbot
                </h2>
                <p className="mt-2 text-sm text-zinc-400 max-w-2xl">
                    AI assistant for IRANet operations. Extension id: ai_chat.
                </p>
            </header>

            <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
                <ChatSidebar
                    chats={chats}
                    activeChatId={activeChatId}
                    loading={loadingChats}
                    error={chatError}
                    editingChatId={editingChatId}
                    editingTitle={editingTitle}
                    onNewChat={handleNewChat}
                    onSelectChat={handleSelectChat}
                    onStartEdit={handleStartEdit}
                    onEditingTitleChange={setEditingTitle}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={handleCancelEdit}
                    onDeleteChat={handleDeleteChat}
                />

                <section className="flex flex-col rounded-2xl border border-zinc-800 bg-zinc-950/60 shadow-lg min-h-[600px] max-h-[calc(100vh-220px)]">
                    <div className="shrink-0 border-b border-zinc-800 px-5 py-4">
                        <ChatHeader
                            title={activeChatLabel}
                            status={activeChatId ? 'saved' : 'draft'}
                        />
                    </div>

                    <div className="flex-1 overflow-y-auto px-5 py-4">
                        <ChatMessageList
                            messages={activeMessages}
                            sending={sending || loadingMessages}
                        />
                    </div>

                    <div className="shrink-0 border-t border-zinc-800 px-5 py-4">
                        <ChatComposer
                            value={input}
                            onChange={setInput}
                            onSend={handleSend}
                            disabled={sending}
                        />
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ChatbotView;
