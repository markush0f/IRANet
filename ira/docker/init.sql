CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ======================
-- APPLICATIONS (FIRST)
-- ======================
CREATE TABLE
    IF NOT EXISTS applications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        kind TEXT NOT NULL,
        identifier TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        workdir TEXT NOT NULL,
        file_path TEXT,
        port INTEGER,
        pid INTEGER,
        status TEXT NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        last_seen_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now ()
    );

CREATE INDEX IF NOT EXISTS idx_applications_last_seen ON applications (last_seen_at);

CREATE INDEX IF NOT EXISTS idx_applications_status ON applications (status);

-- ======================
-- APPLICATION LOG PATHS
-- ======================
CREATE TABLE
    IF NOT EXISTS application_log_paths (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        application_id UUID NOT NULL,
        base_path TEXT NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        discovered BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now (),
        CONSTRAINT fk_application_log_paths_application FOREIGN KEY (application_id) REFERENCES applications (id) ON DELETE CASCADE,
        CONSTRAINT uq_application_log_paths_application_base_path UNIQUE (application_id, base_path)
    );

CREATE INDEX IF NOT EXISTS idx_application_log_paths_application_id ON application_log_paths (application_id);

CREATE INDEX IF NOT EXISTS idx_application_log_paths_enabled ON application_log_paths (enabled);

-- ======================
-- METRICS
-- ======================
CREATE TABLE
    IF NOT EXISTS metrics_points (
        id BIGSERIAL PRIMARY KEY,
        ts TIMESTAMPTZ NOT NULL,
        metric TEXT NOT NULL,
        value DOUBLE PRECISION NOT NULL,
        host TEXT NOT NULL
    );

CREATE INDEX IF NOT EXISTS idx_metrics_points_metric_ts ON metrics_points (metric, ts);

CREATE INDEX IF NOT EXISTS idx_metrics_points_ts ON metrics_points (ts);

-- ======================
-- SYSTEM ALERTS
-- ======================
CREATE TABLE
    IF NOT EXISTS system_alerts (
        id UUID PRIMARY KEY,
        host TEXT NOT NULL,
        metric TEXT NOT NULL,
        level TEXT NOT NULL,
        value DOUBLE PRECISION NOT NULL,
        threshold DOUBLE PRECISION NOT NULL,
        status TEXT NOT NULL,
        message TEXT NOT NULL,
        first_seen_at TIMESTAMPTZ NOT NULL,
        last_seen_at TIMESTAMPTZ NOT NULL,
        resolved_at TIMESTAMPTZ
    );

CREATE TABLE
    extensions (
        id TEXT PRIMARY KEY,
        enabled BOOLEAN NOT NULL DEFAULT false,
        created_at TIMESTAMP NOT NULL DEFAULT now ()
    );

INSERT INTO
    extensions (id, enabled)
VALUES
    ('ai_chat', False)