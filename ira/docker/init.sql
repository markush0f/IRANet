CREATE TABLE IF NOT EXISTS metrics_points (
    id BIGSERIAL PRIMARY KEY,
    ts TIMESTAMPTZ NOT NULL,
    metric TEXT NOT NULL,
    value DOUBLE PRECISION NOT NULL,
    host TEXT NOT NULL
);

CREATE TABLE system_alerts (    
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

CREATE TABLE log_apps (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    log_path TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true
);


-- MODIFY TABLE FOR USER SETTINGS
-- CREATE TABLE IF NOT EXISTS settings (
--     id BIGSERIAL PRIMARY KEY,
    
-- )

CREATE INDEX IF NOT EXISTS idx_metrics_points_metric_ts
    ON metrics_points (metric, ts);

CREATE INDEX IF NOT EXISTS idx_metrics_points_ts
    ON metrics_points (ts);
