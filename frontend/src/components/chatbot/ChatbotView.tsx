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
    } = useChatbot();

    return (
        <div className="w-full h-full min-h-full px-4 sm:px-6 lg:px-8 pt-2 pb-6 sm:pt-3 sm:pb-8 lg:pt-4 lg:pb-10 text-sm">
            <div className="grid gap-6 lg:grid-cols-[280px_1fr] h-full">
                <ChatSidebar
                    chats={chats}
                    activeChatId={activeChatId}
                    loading={loadingChats}
                    error={chatError}
                    editingChatId={editingChatId}
                    editingTitle={editingTitle}
                    searchValue={chatSearch}
                    onSearchChange={setChatSearch}
                    onNewChat={handleNewChat}
                    onSelectChat={handleSelectChat}
                    onStartEdit={handleStartEdit}
                    onEditingTitleChange={setEditingTitle}
                    onSaveEdit={handleSaveEdit}
                    onCancelEdit={handleCancelEdit}
                    onDeleteChat={handleDeleteChat}
                />

                <section className="panel accent-border flex flex-col rounded-2xl shadow-lg min-h-[600px] h-full">
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
