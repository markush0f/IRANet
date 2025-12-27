CREATE TABLE IF NOT EXISTS ai_chats (
    id UUID PRIMARY KEY,
    server_id TEXT,
    title TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS ai_chat_messages (
    id UUID PRIMARY KEY,
    chat_id UUID REFERENCES ai_chats(id),
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT now()
);
