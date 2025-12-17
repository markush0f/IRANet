CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE
    IF NOT EXISTS metrics_points (
        id BIGSERIAL PRIMARY KEY,
        ts TIMESTAMPTZ NOT NULL,
        metric TEXT NOT NULL,
        value DOUBLE PRECISION NOT NULL,
        host TEXT NOT NULL
    );

CREATE TABLE
    system_alerts (
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
    log_apps (
        id TEXT PRIMARY KEY,
        label TEXT NOT NULL,
        log_path TEXT NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT true
    );

CREATE TABLE
    IF NOT EXISTS applications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        kind TEXT NOT NULL,
        identifier TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        file_path TEXT,
        workdir TEXT NOT NULL,
        port INTEGER,
        pid INTEGER,
        status TEXT NOT NULL,
        discovered BOOLEAN NOT NULL DEFAULT true,
        enabled BOOLEAN NOT NULL DEFAULT false,
        last_seen_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now ()
    );

CREATE INDEX IF NOT EXISTS idx_metrics_points_metric_ts ON metrics_points (metric, ts);

CREATE INDEX IF NOT EXISTS idx_metrics_points_ts ON metrics_points (ts);

CREATE INDEX IF NOT EXISTS idx_applications_last_seen ON applications (last_seen_at);

CREATE INDEX IF NOT EXISTS idx_applications_status ON applications (status);