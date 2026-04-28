-- Multi-server persistence migration
--
-- This migration adds server_id support to IRA for multi-server deployments.
-- It is idempotent: running it multiple times is safe.
--
-- Usage:
--   psql "$(echo $IRA_DATABASE_DSN | sed 's/+asyncpg//')" -f docker/migrations/001_multi_server.sql
--
-- Environment variables (optional):
--   IRA_SERVER_ID  - the server_id to assign to existing rows (default: 'legacy')

-- ======================
-- SERVERS TABLE
-- ======================
CREATE TABLE IF NOT EXISTS servers (
    id TEXT PRIMARY KEY,
    hostname TEXT NOT NULL,
    display_name TEXT,
    status TEXT NOT NULL DEFAULT 'online',
    last_seen_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_servers_last_seen ON servers (last_seen_at);

-- ======================
-- APPLICATIONS
-- ======================
ALTER TABLE applications
    ADD COLUMN IF NOT EXISTS server_id TEXT;

UPDATE applications
SET server_id = COALESCE(current_setting('app.server_id', true), 'legacy')
WHERE server_id IS NULL;

ALTER TABLE applications
    ALTER COLUMN server_id SET NOT NULL;

-- Drop old unique constraint if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'applications_identifier_key'
    ) THEN
        ALTER TABLE applications DROP CONSTRAINT applications_identifier_key;
    END IF;
EXCEPTION WHEN undefined_table THEN
    NULL;
END $$;

-- Create new composite unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_applications_server_identifier
    ON applications (server_id, identifier);

-- ======================
-- METRICS POINTS
-- ======================
ALTER TABLE metrics_points
    ADD COLUMN IF NOT EXISTS server_id TEXT;

UPDATE metrics_points
SET server_id = COALESCE(current_setting('app.server_id', true), 'legacy')
WHERE server_id IS NULL;

ALTER TABLE metrics_points
    ALTER COLUMN server_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_metrics_points_server_metric_ts
    ON metrics_points (server_id, metric, ts);

CREATE INDEX IF NOT EXISTS idx_metrics_points_server_ts
    ON metrics_points (server_id, ts);

-- ======================
-- SYSTEM ALERTS
-- ======================
ALTER TABLE system_alerts
    ADD COLUMN IF NOT EXISTS server_id TEXT;

UPDATE system_alerts
SET server_id = COALESCE(current_setting('app.server_id', true), 'legacy')
WHERE server_id IS NULL;

ALTER TABLE system_alerts
    ALTER COLUMN server_id SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_system_alerts_server_last_seen
    ON system_alerts (server_id, last_seen_at);
