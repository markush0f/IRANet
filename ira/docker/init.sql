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

CREATE TABLE application_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    application_id UUID NOT NULL
        REFERENCES applications(id)
        ON DELETE CASCADE,

    path TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    discovered BOOLEAN NOT NULL DEFAULT true,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    UNIQUE (application_id, path)
);
CREATE TABLE
    IF NOT EXISTS applications (
        id UUID PRIMARY KEY DEFAULT uuid_generate_v4 (),
        kind TEXT NOT NULL, -- process (for now)
        identifier TEXT NOT NULL UNIQUE, -- stable logical identifier
        name TEXT NOT NULL,
        workdir TEXT NOT NULL, -- project root (cwd)
        file_path TEXT, -- optional main file
        port INTEGER, -- optional port
        pid INTEGER, -- last seen pid (informative)
        status TEXT NOT NULL, -- running | stopped
        enabled BOOLEAN NOT NULL DEFAULT false,
        last_seen_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT now ()
    );

CREATE INDEX IF NOT EXISTS idx_metrics_points_metric_ts ON metrics_points (metric, ts);

CREATE INDEX IF NOT EXISTS idx_metrics_points_ts ON metrics_points (ts);

CREATE INDEX IF NOT EXISTS idx_applications_last_seen ON applications (last_seen_at);

CREATE INDEX IF NOT EXISTS idx_applications_status ON applications (status);