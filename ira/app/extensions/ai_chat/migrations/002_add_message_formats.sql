ALTER TABLE ai_chat_messages
    ADD COLUMN IF NOT EXISTS content_json TEXT,
    ADD COLUMN IF NOT EXISTS content_markdown TEXT;
