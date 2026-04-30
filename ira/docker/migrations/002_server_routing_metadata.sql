-- Control-plane routing metadata for multiserver mode.
--
-- Adds enough server metadata for the control-plane to route live requests
-- to the correct remote agent.

ALTER TABLE servers
    ADD COLUMN IF NOT EXISTS agent_base_url TEXT;

ALTER TABLE servers
    ADD COLUMN IF NOT EXISTS environment TEXT;

ALTER TABLE servers
    ADD COLUMN IF NOT EXISTS capabilities JSONB;
